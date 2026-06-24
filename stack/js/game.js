/* СТЭК — игровой движок (canvas, один тап). Детерминирован сидом. */
(function(){
  const SKINS = window.STACK_SKINS;
  const RNG = window.STACK_RNG;
  const AUDIO = window.STACK_AUDIO;

  function create(opts){
    const canvas = opts.canvas, ctx = canvas.getContext("2d");
    const getSkin = opts.getSkin || (()=>SKINS.SKINS[0]);
    const cb = opts.callbacks || {};
    let W=0,H=0,DPR=1;
    let blockH=34, baseY=0, INIT_W=0, PERFECT=5;
    let placed=[], cur=null, slices=[], parts=[];
    let running=false, last=0, score=0, combo=0, shake=0, rng=Math.random, raf=0;

    function resize(){
      const r = canvas.getBoundingClientRect();
      DPR = Math.min(2, window.devicePixelRatio||1);
      W = r.width; H = r.height;
      canvas.width = Math.round(W*DPR); canvas.height = Math.round(H*DPR);
      ctx.setTransform(DPR,0,0,DPR,0,0);
      blockH = Math.max(24, Math.min(40, H*0.05));
      baseY = H*0.30;
      INIT_W = Math.min(W*0.64, 260);
      PERFECT = Math.max(4, W*0.012);
    }
    window.addEventListener("resize", ()=>{ resize(); draw(); });

    function speed(){ return (0.42 + Math.min(score*0.028, 1.5)) * W; } // px/sec

    function spawn(prevW){
      const side = rng() < 0.5 ? 0 : 1;
      const w = prevW;
      cur = { x: side? (W-w) : 0, w, dir: side? -1: 1, ci: placed.length };
    }

    function start(seed){
      resize();
      rng = (seed!=null) ? RNG.mulberry32(seed>>>0) : Math.random;
      placed = []; slices = []; parts = []; score = 0; combo = 0; shake = 0;
      const w = INIT_W, x = (W-w)/2;
      placed.push({ x, w, ci:0 });
      spawn(w);
      running = true; last = 0;
      cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    }
    function stop(){ running=false; cancelAnimationFrame(raf); }

    function addParticles(cx, cy, color){
      for(let i=0;i<14;i++){
        const a = Math.random()*Math.PI*2, sp = 60+Math.random()*180;
        parts.push({ x:cx, y:cy, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-60, life:1, color });
      }
    }

    function tap(){
      if(!running || !cur) return;
      const top = placed[placed.length-1];
      const ovS = Math.max(cur.x, top.x), ovE = Math.min(cur.x+cur.w, top.x+top.w);
      const ov = ovE - ovS;
      if(ov <= 0){ gameover(); return; }
      const delta = cur.x - top.x;
      const perfect = Math.abs(delta) <= PERFECT;
      let nx, nw;
      if(perfect){
        nx = top.x; nw = Math.min(top.w + 4, INIT_W); combo++;
        shake = Math.min(0.35, 0.12+combo*0.02);
        addParticles(top.x+top.w/2, baseY, SKINS.colorFor(getSkin(), placed.length));
        AUDIO && AUDIO.fx.perfect(combo);
      } else {
        combo = 0; nx = ovS; nw = ov; shake = 0.1;
        // отрезанный кусок падает
        const cutW = cur.w - ov;
        const cutX = (cur.x < top.x) ? cur.x : ovE;
        if(cutW>0.5) slices.push({ x:cutX, y:baseY, w:cutW, vy:0, vx:(cur.x<top.x?-40:40), a:1, ci:cur.ci });
        AUDIO && AUDIO.fx.slice(); AUDIO && AUDIO.fx.place(combo);
      }
      placed.push({ x:nx, w:nw, ci:placed.length });
      score++;
      cb.onScore && cb.onScore(score, { perfect, combo });
      spawn(nw);
    }

    function gameover(){
      running = false; cancelAnimationFrame(raf);
      AUDIO && AUDIO.fx.over();
      cb.onOver && cb.onOver(score);
    }

    function loop(ts){
      if(!running) return;
      if(!last) last = ts;
      let dt = (ts-last)/1000; last = ts; if(dt>0.05) dt=0.05;
      // move current
      if(cur){
        cur.x += cur.dir * speed() * dt;
        if(cur.x < 0){ cur.x = 0; cur.dir = 1; }
        if(cur.x + cur.w > W){ cur.x = W - cur.w; cur.dir = -1; }
      }
      // physics for slices + particles
      slices.forEach(s=>{ s.vy += 900*dt; s.y += s.vy*dt; s.x += s.vx*dt; s.a -= dt*0.9; });
      slices = slices.filter(s=>s.a>0 && s.y < H+80);
      parts.forEach(p=>{ p.vy += 500*dt; p.x += p.vx*dt; p.y += p.vy*dt; p.life -= dt*1.6; });
      parts = parts.filter(p=>p.life>0);
      if(shake>0) shake = Math.max(0, shake - dt*1.4);
      draw();
      raf = requestAnimationFrame(loop);
    }

    function block(x,y,w,h,color){
      ctx.fillStyle = color;
      ctx.fillRect(x,y,w,h);
      // верхняя грань светлее (псевдо-3D)
      ctx.fillStyle = "rgba(255,255,255,.14)";
      ctx.fillRect(x,y,w,3);
      ctx.fillStyle = "rgba(0,0,0,.16)";
      ctx.fillRect(x,y+h-3,w,3);
    }

    function draw(){
      const skin = getSkin();
      ctx.clearRect(0,0,W,H);
      let ox=0, oy=0;
      if(shake>0){ ox=(Math.random()-0.5)*shake*22; oy=(Math.random()-0.5)*shake*22; }
      ctx.save(); ctx.translate(ox,oy);
      // tower downward from baseY
      const visible = Math.ceil(H/blockH)+2;
      for(let i=placed.length-1, row=0; i>=0 && row<visible; i--, row++){
        const b = placed[i];
        const y = baseY + blockH + row*blockH;
        block(b.x, y, b.w, blockH-2, SKINS.colorFor(skin, b.ci));
      }
      // slices
      slices.forEach(s=>{ ctx.globalAlpha=Math.max(0,s.a); block(s.x,s.y,s.w,blockH-2,SKINS.colorFor(skin,s.ci)); ctx.globalAlpha=1; });
      // current moving block
      if(cur) block(cur.x, baseY, cur.w, blockH-2, SKINS.colorFor(skin, cur.ci));
      // particles
      parts.forEach(p=>{ ctx.globalAlpha=Math.max(0,p.life); ctx.fillStyle=p.color; ctx.fillRect(p.x-3,p.y-3,6,6); });
      ctx.globalAlpha=1;
      ctx.restore();
    }

    return { start, stop, tap, resize, get score(){ return score; },
      _debug(){ const top=placed[placed.length-1]; return cur&&top?{x:cur.x,w:cur.w,topX:top.x,perfectTol:PERFECT}:null; } };
  }
  window.STACK_GAME = { create };
})();
