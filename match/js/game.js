/* МЭТЧ — движок «три в ряд» (canvas). Свапы, матчи 3/4/5, каскады, спец-клиры. */
(function(){
  const ROWS=8, COLS=7, COLORS=6, MOVES=20;
  const PAL=["#ff2e63","#c6ff00","#00f0ff","#b14bff","#ff7a00","#ff00e6"];
  const SWAP=130, CLEAR=170, FALL=230;
  const A=window.MATCH_AUDIO;
  const DARK="#1a1226";

  /* ── свои векторные cursed-фигурки (canvas), idx 0..5 ── */
  function circ(g,a,b,r){ g.beginPath(); g.arc(a,b,r,0,6.2832); g.fill(); }
  function tri(g,ax,ay,bx,by,cx,cy){ g.beginPath(); g.moveTo(ax,ay); g.lineTo(bx,by); g.lineTo(cx,cy); g.closePath(); g.fill(); }
  function eyes(g,a,b,sp,r){ g.fillStyle="#fff"; circ(g,a-sp,b,r); circ(g,a+sp,b,r); g.fillStyle=DARK; circ(g,a-sp,b,r*0.5); circ(g,a+sp,b,r*0.5); }
  function drawCreature(g,x,y,s,idx){
    const cx=x+s/2, cy=y+s*0.54, r=s*0.3, body=PAL[idx];
    if(idx===0){            // демон
      g.fillStyle=body; tri(g,cx-r*0.6,cy-r*0.4,cx-r*1.15,cy-r*1.35,cx-r*0.1,cy-r*0.7); tri(g,cx+r*0.6,cy-r*0.4,cx+r*1.15,cy-r*1.35,cx+r*0.1,cy-r*0.7);
      circ(g,cx,cy,r); eyes(g,cx,cy-r*0.05,r*0.42,r*0.24);
      g.fillStyle=DARK; g.fillRect(cx-r*0.45,cy+r*0.4,r*0.9,r*0.14);
      g.fillStyle="#fff"; tri(g,cx-r*0.3,cy+r*0.4,cx-r*0.16,cy+r*0.66,cx-r*0.44,cy+r*0.54); tri(g,cx+r*0.3,cy+r*0.4,cx+r*0.16,cy+r*0.66,cx+r*0.44,cy+r*0.54);
    } else if(idx===1){     // череп
      g.fillStyle=body; circ(g,cx,cy-r*0.12,r); g.fillRect(cx-r*0.55,cy+r*0.35,r*1.1,r*0.5);
      g.fillStyle=DARK; circ(g,cx-r*0.4,cy-r*0.12,r*0.27); circ(g,cx+r*0.4,cy-r*0.12,r*0.27); tri(g,cx,cy+r*0.1,cx-r*0.13,cy+r*0.33,cx+r*0.13,cy+r*0.33);
      g.fillRect(cx-r*0.28,cy+r*0.45,r*0.06,r*0.4); g.fillRect(cx-r*0.03,cy+r*0.45,r*0.06,r*0.4); g.fillRect(cx+r*0.22,cy+r*0.45,r*0.06,r*0.4);
    } else if(idx===2){     // слайм
      g.fillStyle=body; g.beginPath(); g.arc(cx,cy,r,Math.PI,0);
      g.lineTo(cx+r,cy+r*0.55); g.quadraticCurveTo(cx+r*0.6,cy+r*1.15,cx+r*0.33,cy+r*0.65); g.quadraticCurveTo(cx,cy+r*1.25,cx-r*0.33,cy+r*0.65); g.quadraticCurveTo(cx-r*0.6,cy+r*1.15,cx-r,cy+r*0.55); g.closePath(); g.fill();
      eyes(g,cx,cy,r*0.36,r*0.22);
    } else if(idx===3){     // призрак
      g.fillStyle=body; g.beginPath(); g.arc(cx,cy,r,Math.PI,0); g.lineTo(cx+r,cy+r*0.7);
      const n=4; for(let i=0;i<n;i++){ const xx=cx+r-(2*r)*((i+1)/n); g.quadraticCurveTo(xx+r/n,cy+r*(i%2?0.4:1.0),xx,cy+r*0.7); }
      g.closePath(); g.fill(); eyes(g,cx,cy-r*0.08,r*0.36,r*0.22); g.fillStyle=DARK; circ(g,cx,cy+r*0.38,r*0.13);
    } else if(idx===4){     // циклоп-пришелец
      g.fillStyle=body; g.fillRect(cx-r*0.05,cy-r*1.45,r*0.1,r*0.6); circ(g,cx,cy-r*1.45,r*0.13);
      circ(g,cx,cy,r); g.fillStyle="#fff"; circ(g,cx,cy,r*0.45); g.fillStyle=DARK; circ(g,cx,cy,r*0.22);
    } else {                // проклятый глаз
      g.fillStyle="#fff"; circ(g,cx,cy,r); g.fillStyle=body; circ(g,cx,cy,r*0.56); g.fillStyle=DARK; circ(g,cx,cy,r*0.26);
      g.fillStyle="#fff"; circ(g,cx-r*0.12,cy-r*0.12,r*0.08);
      g.strokeStyle="#ff5d7a"; g.lineWidth=Math.max(1,r*0.05); g.beginPath(); g.moveTo(cx-r,cy); g.lineTo(cx-r*0.55,cy-r*0.08); g.moveTo(cx+r,cy+r*0.1); g.lineTo(cx+r*0.55,cy); g.stroke();
    }
  }
  function icon(idx,px){ try{ const o=document.createElement("canvas"); o.width=px;o.height=px; drawCreature(o.getContext("2d"),0,0,px,idx); return o.toDataURL(); }catch(e){ return ""; } }

  function create(opts){
    const canvas=opts.canvas, ctx=canvas.getContext("2d"), cb=opts.callbacks||{};
    let W=0,H=0,DPR=1,cell=40,ox=0,oy=0;
    let grid=[], sel=null, busy=false, score=0, moves=0, cascade=0, running=false, raf=0;
    let sliding=null, clearing=null, falling=null, parts=[], shake=0, glitch=null;

    function resize(){
      const r=canvas.getBoundingClientRect(); DPR=Math.min(2,window.devicePixelRatio||1);
      W=r.width; H=r.height; canvas.width=W*DPR|0; canvas.height=H*DPR|0; ctx.setTransform(DPR,0,0,DPR,0,0);
      cell=Math.floor(Math.min(W/COLS, (H-10)/ROWS)); ox=Math.floor((W-cell*COLS)/2); oy=8;
    }
    window.addEventListener("resize", resize);

    const key=(r,c)=>r*COLS+c;
    const rnd=()=>Math.floor(Math.random()*COLORS);
    function fill(){
      grid=[];
      for(let r=0;r<ROWS;r++){ grid[r]=[]; for(let c=0;c<COLS;c++){
        let v; do{ v=rnd(); }while((c>=2&&grid[r][c-1]===v&&grid[r][c-2]===v)||(r>=2&&grid[r-1][c]===v&&grid[r-2][c]===v));
        grid[r][c]=v; } }
    }
    function scan(){
      const clr=new Set(), rowsF=new Set(), colsF=new Set(), colC=new Set();
      for(let r=0;r<ROWS;r++){ let c=0; while(c<COLS){ const v=grid[r][c]; if(v<0){c++;continue;}
        let e=c; while(e<COLS&&grid[r][e]===v)e++; const n=e-c;
        if(n>=3){ for(let i=c;i<e;i++)clr.add(key(r,i)); if(n>=4)rowsF.add(r); if(n>=5)colC.add(v);} c=e; } }
      for(let c=0;c<COLS;c++){ let r=0; while(r<ROWS){ const v=grid[r][c]; if(v<0){r++;continue;}
        let e=r; while(e<ROWS&&grid[e][c]===v)e++; const n=e-r;
        if(n>=3){ for(let i=r;i<e;i++)clr.add(key(i,c)); if(n>=4)colsF.add(c); if(n>=5)colC.add(v);} r=e; } }
      if(!clr.size) return null;
      rowsF.forEach(r=>{ for(let c=0;c<COLS;c++)clr.add(key(r,c)); });
      colsF.forEach(c=>{ for(let r=0;r<ROWS;r++)clr.add(key(r,c)); });
      if(colC.size) for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++) if(colC.has(grid[r][c]))clr.add(key(r,c));
      return clr;
    }
    function applyGravity(){
      const drop=[]; for(let r=0;r<ROWS;r++){ drop[r]=[]; for(let c=0;c<COLS;c++)drop[r][c]=0; }
      for(let c=0;c<COLS;c++){ let w=ROWS-1;
        for(let r=ROWS-1;r>=0;r--){ if(grid[r][c]>=0){ if(w!==r){ grid[w][c]=grid[r][c]; grid[r][c]=-1; } drop[w][c]=w-r; w--; } }
        for(let r=w;r>=0;r--){ grid[r][c]=rnd(); drop[r][c]=w+1; }
      }
      return drop;
    }
    const adj=(a,b)=>Math.abs(a.r-b.r)+Math.abs(a.c-b.c)===1;

    function trySwap(a,b){
      busy=true; sel=null;
      [grid[a.r][a.c],grid[b.r][b.c]]=[grid[b.r][b.c],grid[a.r][a.c]];
      sliding={a,b,t0:now()};
      setTimeout(()=>{ sliding=null;
        if(scan()){ moves--; cb.moves&&cb.moves(moves); cascade=0; A&&A.fx.swap(); resolve(); }
        else { // откат
          [grid[a.r][a.c],grid[b.r][b.c]]=[grid[b.r][b.c],grid[a.r][a.c]];
          sliding={a,b,t0:now()}; A&&A.fx.bad();
          setTimeout(()=>{ sliding=null; busy=false; }, SWAP);
        }
      }, SWAP);
    }
    function resolve(){
      const clr=scan();
      if(!clr){ busy=false; if(moves<=0) over(); return; }
      cascade++;
      score += clr.size*30*cascade; cb.score&&cb.score(score, cascade);
      A&&A.fx.clear(cascade);
      clearing={set:clr,t0:now()};
      shake=Math.min(16, 4+cascade*3); glitch={t0:now(), amp:Math.min(1, 0.25+cascade*0.3)};
      setTimeout(()=>{
        clr.forEach(k=>{ const r=(k/COLS)|0,c=k%COLS; burst(r,c,grid[r][c]); grid[r][c]=-1; });
        const drop=applyGravity(); clearing=null; falling={drop,t0:now()};
        setTimeout(()=>{ falling=null; resolve(); }, FALL);
      }, CLEAR);
    }
    function burst(r,c,v){ const p=pos(r,c), col=PAL[v]||"#fff";
      for(let i=0;i<9;i++){ const a=Math.random()*6.28, sp=60+Math.random()*180;
        parts.push({x:p.x+cell/2,y:p.y+cell/2,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-60,life:1,col,sz:3+Math.random()*5}); } }
    function over(){ running=false; cancelAnimationFrame(raf); A&&A.fx.over(); cb.onOver&&cb.onOver(score); }

    function now(){ return (window.performance&&performance.now)?performance.now():Date.now(); }
    function cellAt(px,py){ const c=Math.floor((px-ox)/cell), r=Math.floor((py-oy)/cell);
      return (r>=0&&r<ROWS&&c>=0&&c<COLS)?{r,c}:null; }

    canvas.addEventListener("pointerdown",(e)=>{
      if(!running||busy) return; const rect=canvas.getBoundingClientRect();
      const cl=cellAt(e.clientX-rect.left, e.clientY-rect.top); if(!cl) return;
      if(!sel){ sel=cl; } else if(sel.r===cl.r&&sel.c===cl.c){ sel=null; }
      else if(adj(sel,cl)){ trySwap(sel,cl); } else { sel=cl; }
    });

    function pos(r,c){ return {x:ox+c*cell, y:oy+r*cell}; }
    function gem(x,y,s,idx){ drawCreature(ctx,x,y,s,idx); }
    function round(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

    const lerp=(a,b,t)=>a+(b-a)*t;
    const easeOut=t=>1-Math.pow(1-t,3);
    function draw(){
      const t=now();
      // проклятый фон
      const bg=ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,"#0c0716"); bg.addColorStop(1,"#05030a");
      ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
      const sp = sliding ? Math.min(1,(t-sliding.t0)/SWAP) : 0;
      const cp = clearing ? Math.min(1,(t-clearing.t0)/CLEAR) : 0;
      const fp = falling ? easeOut(Math.min(1,(t-falling.t0)/FALL)) : 1;
      const sx=shake?(Math.random()-0.5)*shake:0, sy=shake?(Math.random()-0.5)*shake:0;
      ctx.save(); ctx.translate(sx,sy);
      for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
        const v=grid[r][c]; if(v<0) continue;
        let {x,y}=pos(r,c), s=cell;
        if(sliding){ const a=sliding.a,b=sliding.b;
          if(r===a.r&&c===a.c){ const f=pos(b.r,b.c); x=lerp(f.x,x,sp); y=lerp(f.y,y,sp); }
          else if(r===b.r&&c===b.c){ const f=pos(a.r,a.c); x=lerp(f.x,x,sp); y=lerp(f.y,y,sp); }
        }
        if(falling){ const d=falling.drop[r][c]; if(d>0) y -= d*cell*(1-fp); }
        if(clearing&&clearing.set.has(key(r,c))){ s=cell*(1-cp*0.85); x+=(cell-s)/2; y+=(cell-s)/2; ctx.globalAlpha=1-cp; }
        gem(x,y,s,v); ctx.globalAlpha=1;
      }
      if(sel && !busy){ const p=pos(sel.r,sel.c); const pu=2+Math.sin(t/120)*1.5;
        ctx.strokeStyle="#fff"; ctx.lineWidth=3; round(p.x+pu,p.y+pu,cell-pu*2,cell-pu*2,cell*0.26); ctx.stroke(); }
      if(parts.length){ const dt=1/60;
        for(const p of parts){ p.vy+=700*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt*1.6; }
        parts=parts.filter(p=>p.life>0);
        for(const p of parts){ ctx.globalAlpha=Math.max(0,p.life); ctx.fillStyle=p.col; const z=p.sz||5; ctx.fillRect(p.x-z/2,p.y-z/2,z,z); }
        ctx.globalAlpha=1;
      }
      ctx.restore();
      if(shake>0.3) shake*=0.86; else shake=0;
      // виньетка
      const vg=ctx.createRadialGradient(W/2,H*0.45,H*0.3,W/2,H*0.5,H*0.75);
      vg.addColorStop(0,"rgba(0,0,0,0)"); vg.addColorStop(1,"rgba(0,0,0,.5)"); ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
      // глитч-слайсы при клире
      if(glitch){ const gp=(t-glitch.t0)/200;
        if(gp<1){ for(let i=0;i<3;i++){ const sliceY=oy+Math.random()*ROWS*cell, h=4+Math.random()*12, off=(Math.random()-0.5)*22*glitch.amp;
          try{ ctx.globalAlpha=.55; ctx.drawImage(canvas, 0, sliceY*DPR, canvas.width, h*DPR, off, sliceY, W, h); ctx.globalAlpha=1; }catch(e){} } }
        else glitch=null;
      }
      raf=requestAnimationFrame(draw);
    }

    function start(){ resize(); fill(); while(scan()){ fill(); } score=0; moves=MOVES; cascade=0; sel=null; busy=false; running=true;
      sliding=null; clearing=null; falling=null; parts=[]; shake=0; glitch=null;
      cb.score&&cb.score(0,0); cb.moves&&cb.moves(moves); cancelAnimationFrame(raf); raf=requestAnimationFrame(draw); }
    function stop(){ running=false; cancelAnimationFrame(raf); }
    return { start, stop, get score(){return score;}, get moves(){return moves;}, get grid(){return grid;} };
  }
  window.MATCH_GAME={ create, icon };
})();
