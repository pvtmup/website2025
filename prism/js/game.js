/* PRISM — WebGL «три в ряд» на PixiJS v8 («Kinetic Refraction»).
   Защищённая реализация: если WebGL/PIXI недоступны — create() реджектится,
   и оболочка показывает мягкий фолбэк (без белого экрана).
   Слои: фон-шейдер (опц.) → boardLayer (фишки+bloom) → vfxLayer (частицы/вспышки). */
window.PRISM_GAME = (function(){
  const ROWS=8, COLS=7, MOVES=20, SRC=128;
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  // ——— ease ———
  const E={
    outCubic:t=>1-Math.pow(1-t,3),
    inQuad:t=>t*t,
    outBack:t=>{const c=1.7;return 1+ (c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);},
    outBounce:t=>{const n=7.5625,d=2.75;
      if(t<1/d)return n*t*t; if(t<2/d){t-=1.5/d;return n*t*t+.75;}
      if(t<2.5/d){t-=2.25/d;return n*t*t+.9375;} t-=2.625/d;return n*t*t+.984375;}
  };

  async function create(opts){
    const PIXI=window.PIXI;
    if(!PIXI||!PIXI.Application) throw new Error("no-pixi");
    const host=opts.host, cb=opts.callbacks||{}, AUD=window.PRISM_AUDIO;

    const app=new PIXI.Application();
    await app.init({
      resizeTo:host, antialias:true, backgroundAlpha:0,
      resolution:Math.min(window.devicePixelRatio||1,2.5),
      autoDensity:true, powerPreference:"high-performance"
    });
    host.appendChild(app.canvas);

    const TEX=window.PRISM_TEX.buildPixi(PIXI,SRC);
    const TYPES=TEX.count, HUE=TEX.hue;
    let shaderU=null, bgSprite=null;

    // ——— слои ———
    const bgPane=new PIXI.Container();          // фон-шейдер (необязательный)
    const boardLayer=new PIXI.Container();
    const vfxLayer=new PIXI.Container();
    app.stage.addChild(bgPane,boardLayer,vfxLayer);
    tryShader(PIXI,app,bgPane);

    app.stage.eventMode="static";
    app.stage.on("pointerdown",onDown);

    // ——— геометрия ———
    let cell=1,ox=0,oy=0,tileScale=1;
    function layout(){
      const W=app.screen.width,H=app.screen.height;
      const top=H*0.165,bottom=H*0.965, bh=bottom-top;
      cell=Math.min((W*0.96)/COLS, bh/ROWS);
      const bw=cell*COLS, totalH=cell*ROWS;
      ox=(W-bw)/2; oy=top+(bh-totalH)/2;
      tileScale=(cell*0.92)/SRC;
      // фон-пане на весь экран
      if(bgSprite){bgSprite.width=W;bgSprite.height=H;}
      reflow();
    }
    const cx=c=>ox+c*cell+cell/2, cy=r=>oy+r*cell+cell/2;

    // ——— состояние ———
    let cells=[], tiles=[], score=0, moves=MOVES, cascade=0;
    let busy=false, sel=null, playing=false;
    const tweens=[], parts=[];

    // ——— твины ———
    function tween(target,to,dur,ease,onDone){
      tweens.push({target,to,dur:dur||0.25,t:0,ease:ease||E.outCubic,from:null,onDone});
    }
    function stepTweens(dt){
      for(let i=tweens.length-1;i>=0;i--){const w=tweens[i];
        try{
          if(!w.from){w.from={};for(const k in w.to)w.from[k]=w.target[k];}
          w.t+=dt; var k=w.dur>0?Math.min(1,w.t/w.dur):1; const e=w.ease(k);
          for(const key in w.to)w.target[key]=w.from[key]+(w.to[key]-w.from[key])*e;
        }catch(err){ tweens.splice(i,1); continue; } // объект уничтожен — снимаем твин
        if(k>=1){tweens.splice(i,1); if(w.onDone)try{w.onDone();}catch(e){}}
      }
    }

    // ——— частицы (пул) ———
    const POOL=120;
    for(let i=0;i<POOL;i++){const s=new PIXI.Sprite(i%3? TEX.shard:TEX.glow);
      s.anchor.set(.5);s.blendMode="add";s.visible=false;vfxLayer.addChild(s);
      parts.push({s,vx:0,vy:0,life:0,max:1,rot:0,base:1});}
    let pp=0;
    function burst(x,y,tint,n,power){
      for(let i=0;i<n;i++){const p=parts[pp=(pp+1)%POOL];
        const a=Math.random()*6.283, sp=(0.5+Math.random())* (power||1)*cell*3.2;
        p.vx=Math.cos(a)*sp; p.vy=Math.sin(a)*sp - cell*1.5;
        p.life=p.max=0.45+Math.random()*0.4; p.rot=(Math.random()-.5)*12;
        p.base=(0.18+Math.random()*0.22); p.s.tint=tint;
        p.s.x=x+(Math.random()-.5)*cell*0.4; p.s.y=y+(Math.random()-.5)*cell*0.4;
        p.s.scale.set(p.base*cell/24); p.s.alpha=1; p.s.rotation=Math.random()*6.283; p.s.visible=true;}
    }
    function stepParts(dt){
      for(const p of parts){ if(p.life<=0)continue;
        p.life-=dt; if(p.life<=0){p.s.visible=false;continue;}
        p.vy+=cell*7*dt; p.s.x+=p.vx*dt; p.s.y+=p.vy*dt; p.s.rotation+=p.rot*dt;
        const k=p.life/p.max; p.s.alpha=k; p.s.scale.set(p.base*cell/24*(0.4+k*0.8)); }
    }
    // короткая вспышка кольцом в месте матча
    function flash(x,y,tint){
      const f=new PIXI.Sprite(TEX.glow); f.anchor.set(.5); f.blendMode="add";
      f.tint=tint; f.x=x; f.y=y; f.alpha=0.9; f.scale.set(cell*0.4/64);
      vfxLayer.addChild(f);
      tween(f,{alpha:0},0.4,E.outCubic,()=>f.destroy());
      tween(f.scale,{x:cell*2/64,y:cell*2/64},0.4,E.outCubic);
    }

    // ——— фишки ———
    function makeTile(type){
      const c=new PIXI.Container();
      const glow=new PIXI.Sprite(TEX.glow); glow.anchor.set(.5); glow.blendMode="add";
      glow.tint=parseInt((HUE[type].glow||"#ffffff").slice(1),16); glow.alpha=0.4;
      glow.scale.set(cell*1.5/128);
      const sp=new PIXI.Sprite(TEX.tiles[type]); sp.anchor.set(.5); sp.scale.set(tileScale);
      c.addChild(glow,sp); c._sp=sp; c._glow=glow; c._type=type; c.scale.set(1);
      boardLayer.addChild(c); return c;
    }
    function reflow(){ // пересчёт позиций/масштабов под новый layout
      for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const t=tiles[r]&&tiles[r][c];
        if(!t)continue; t.x=cx(c); t.y=cy(r);
        t._sp.scale.set(tileScale); t._glow.scale.set(cell*1.5/128);}
    }

    // ——— матч-движок (логическая модель cells[r][c]=type|null) ———
    function findMatches(){
      const m=new Set();
      for(let r=0;r<ROWS;r++){let run=1; for(let c=1;c<=COLS;c++){
        const a=c<COLS?cells[r][c]:null, b=cells[r][c-1];
        if(c<COLS&&a!=null&&a===b)run++; else{ if(run>=3)for(let k=1;k<=run;k++)m.add((r)+","+(c-k)); run=1;}}}
      for(let c=0;c<COLS;c++){let run=1; for(let r=1;r<=ROWS;r++){
        const a=r<ROWS?cells[r][c]:null, b=cells[r-1][c];
        if(r<ROWS&&a!=null&&a===b)run++; else{ if(run>=3)for(let k=1;k<=run;k++)m.add((r-k)+","+c); run=1;}}}
      return m;
    }
    function wouldMatch(r1,c1,r2,c2){
      const t=cells[r1][c1]; cells[r1][c1]=cells[r2][c2]; cells[r2][c2]=t;
      const ok=findMatches().size>0;
      const u=cells[r1][c1]; cells[r1][c1]=cells[r2][c2]; cells[r2][c2]=u;
      return ok;
    }
    function anyMove(){
      for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
        if(c<COLS-1&&wouldMatch(r,c,r,c+1))return true;
        if(r<ROWS-1&&wouldMatch(r,c,r+1,c))return true;}
      return false;
    }
    function pick(r,c){ // тип без немедленного матча при заполнении
      for(let tries=0;tries<20;tries++){const t=(Math.random()*TYPES)|0;
        const l1=c>=1?cells[r][c-1]:-1, l2=c>=2?cells[r][c-2]:-2;
        const u1=r>=1?cells[r-1][c]:-1, u2=r>=2?cells[r-2][c]:-2;
        if(!(t===l1&&t===l2)&&!(t===u1&&t===u2))return t;}
      return (Math.random()*TYPES)|0;
    }
    function fillBoard(){
      for(let r=0;r<ROWS;r++){cells[r]=[];tiles[r]=[];
        for(let c=0;c<COLS;c++){cells[r][c]=pick(r,c);}}
      if(!anyMove())return fillBoard(); // редкий мёртвый расклад — пересобрать
      for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
        const t=makeTile(cells[r][c]); t.x=cx(c); t.y=cy(r);
        t.scale.set(0); tween(t.scale,{x:1,y:1},0.4,E.outBack);}
    }

    // ——— ввод ———
    function cellAt(gx,gy){const c=Math.floor((gx-ox)/cell), r=Math.floor((gy-oy)/cell);
      if(r<0||r>=ROWS||c<0||c>=COLS)return null; return {r,c};}
    function highlight(t,on){ if(!t)return;
      tween(t.scale,{x:on?1.1:1,y:on?1.1:1},on?0.2:0.18,E.outBack);
      tween(t._glow,{alpha:on?0.85:0.4},0.2,E.outCubic);}
    function onDown(e){
      if(!playing||busy)return;
      const at=cellAt(e.global.x,e.global.y); if(!at)return;
      if(!sel){ sel=at; highlight(tiles[at.r][at.c],true); return; }
      const adj=Math.abs(sel.r-at.r)+Math.abs(sel.c-at.c)===1;
      highlight(tiles[sel.r][sel.c],false);
      if(at.r===sel.r&&at.c===sel.c){sel=null;return;}
      if(adj){const a=sel; sel=null; doSwap(a,at);}
      else{ sel=at; highlight(tiles[at.r][at.c],true);} // перевыбор
    }

    function swapData(a,b){
      const tc=cells[a.r][a.c]; cells[a.r][a.c]=cells[b.r][b.c]; cells[b.r][b.c]=tc;
      const tt=tiles[a.r][a.c]; tiles[a.r][a.c]=tiles[b.r][b.c]; tiles[b.r][b.c]=tt;
    }
    async function doSwap(a,b){
      busy=true;
      const ta=tiles[a.r][a.c], tb=tiles[b.r][b.c];
      AUD&&AUD.fx.swap();
      tween(ta,{x:cx(b.c),y:cy(b.r)},0.18,E.outCubic);
      tween(tb,{x:cx(a.c),y:cy(a.r)},0.18,E.outCubic);
      swapData(a,b); await wait(190);
      if(findMatches().size===0){ // откат
        AUD&&AUD.fx.bad();
        tween(ta,{x:cx(a.c),y:cy(a.r)},0.18,E.outCubic);
        tween(tb,{x:cx(b.c),y:cy(b.r)},0.18,E.outCubic);
        swapData(a,b); await wait(190); busy=false; return;
      }
      moves--; cb.moves&&cb.moves(moves);
      cascade=0; await resolve();
      busy=false;
      if(moves<=0||!anyMove())end();
    }

    async function resolve(){
      while(true){
        const m=findMatches(); if(m.size===0)break;
        cascade++;
        let big=false; if(m.size>=4)big=true;
        // удаляем
        m.forEach(key=>{const [r,c]=key.split(",").map(Number);
          const t=tiles[r][c]; if(!t)return;
          const tint=parseInt((HUE[cells[r][c]].glow||"#ffffff").slice(1),16);
          flash(cx(c),cy(r),tint); burst(cx(c),cy(r),tint, big?14:9, big?1.5:1);
          tween(t.scale,{x:0,y:0},0.2,E.inQuad,()=>t.destroy());
          tween(t._glow,{alpha:1.2},0.12,E.outCubic);
          cells[r][c]=null; tiles[r][c]=null;
        });
        score+=m.size*30*cascade + (big?100:0);
        cb.score&&cb.score(score,cascade);
        AUD&&AUD.fx.clear(cascade); if(big)AUD&&AUD.fx.boom();
        if(window.Telegram&&Telegram.WebApp&&Telegram.WebApp.HapticFeedback){
          try{Telegram.WebApp.HapticFeedback.impactOccurred(big?"medium":"light");}catch(e){}}
        await wait(200);
        gravity(); await wait(360);
      }
    }

    function gravity(){
      for(let c=0;c<COLS;c++){
        let write=ROWS-1;
        for(let r=ROWS-1;r>=0;r--){ if(cells[r][c]!=null){
          if(r!==write){ cells[write][c]=cells[r][c]; tiles[write][c]=tiles[r][c];
            cells[r][c]=null; tiles[r][c]=null;
            const t=tiles[write][c]; landDrop(t,write); }
          write--; }}
        const newN=write+1;
        for(let r=write;r>=0;r--){ const ty=pick(r,c); cells[r][c]=ty;
          const t=makeTile(ty); t.x=cx(c); t.y=cy(r)-(newN+1)*cell; tiles[r][c]=t;
          landDrop(t,r); }
      }
    }
    function landDrop(t,r){
      tween(t,{y:cy(r)},0.34,E.outBounce,()=>{ // приземление: squash & stretch
        t.scale.set(1.15,0.8); tween(t.scale,{x:1,y:1},0.16,E.outBack);
      });
    }

    // ——— цикл ———
    let acc=0;
    app.ticker.add(t=>{ let dt=t.deltaMS/1000; if(dt>0.05)dt=0.05;
      stepTweens(dt); stepParts(dt); if(shaderU)try{shaderU.uniforms.uTime+=dt;}catch(e){}
    });

    // ——— API ———
    function clearBoard(){ boardLayer.removeChildren().forEach(c=>c.destroy());
      tweens.length=0; parts.forEach(p=>{p.life=0;p.s.visible=false;}); cells=[];tiles=[]; }
    function start(){ clearBoard(); score=0; moves=MOVES; cascade=0; sel=null; busy=false; playing=true;
      cb.score&&cb.score(0,0); cb.moves&&cb.moves(moves); layout(); fillBoard(); }
    function end(){ playing=false; AUD&&AUD.fx.over(); cb.onOver&&cb.onOver(score); }

    window.addEventListener("resize",layout);
    layout();
    function tryShader(PIXI,app,pane){ try{
      const vertex=`in vec2 aPosition; out vec2 vUV;
        uniform vec4 uInputSize; uniform vec4 uOutputFrame; uniform vec4 uOutputTexture;
        vec4 fp(){ vec2 p=aPosition*uOutputFrame.zw+uOutputFrame.xy;
          p.x=p.x*(2.0/uOutputTexture.x)-1.0; p.y=p.y*(2.0*uOutputTexture.z/uOutputTexture.y)-uOutputTexture.z;
          return vec4(p,0.0,1.0);}
        vec2 fuv(){ return aPosition*(uOutputFrame.zw*uInputSize.zw); }
        void main(){ gl_Position=fp(); vUV=fuv(); }`;
      const fragment=`in vec2 vUV; out vec4 finalColor; uniform sampler2D uTexture; uniform float uTime;
        void main(){ vec2 u=vUV; float t=uTime*0.25;
          float a=sin((u.x+t)*6.0)*0.5+0.5; float b=cos((u.y-t*0.7)*5.0)*0.5+0.5;
          vec3 c1=vec3(0.10,0.90,1.0), c2=vec3(1.0,0.24,0.65), c3=vec3(0.60,0.42,1.0);
          vec3 col=mix(c1,c2,a); col=mix(col,c3,b*0.6);
          float v=smoothstep(1.1,0.2,length(u-0.5)); // мягкая виньетка
          finalColor=vec4(col*0.16*v,0.16*v); }`;
      const filter=new PIXI.Filter({glProgram:PIXI.GlProgram.from({vertex,fragment}),
        resources:{uniforms:{uTime:{value:0,type:"f32"}}}});
      bgSprite=new PIXI.Sprite(PIXI.Texture.WHITE);
      bgSprite.width=app.screen.width; bgSprite.height=app.screen.height; bgSprite.alpha=1;
      bgSprite.filters=[filter]; pane.addChild(bgSprite);
      shaderU=filter.resources.uniforms;
    }catch(e){ shaderU=null; /* фон даёт CSS-градиент — экран не пустой */ } }

    return { start, app,
      get score(){return score;}, get moves(){return moves;},
      _test:{ cells:()=>cells, find:()=>findMatches(), move:()=>anyMove(),
              swap:(a,b)=>{swapData(a,b);return findMatches().size;}, gravity, resolve },
      destroy(){ try{app.destroy(true,{children:true});}catch(e){} } };
  }

  // иконка для HTML-оболочки (использует тот же рендер фишек)
  function icon(idx,px){ return window.PRISM_TEX.icon(idx,px); }
  return { create, icon, count:()=> (window.PRISM_TEX?window.PRISM_TEX.count:5) };
})();
