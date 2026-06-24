/* МЭТЧ — движок «три в ряд» (canvas). Свапы, матчи 3/4/5, каскады, спец-клиры. */
(function(){
  const ROWS=8, COLS=7, COLORS=6, MOVES=20;
  const PAL=["#ff4d6d","#ffd66b","#19e6c1","#7c5cff","#ff9d3d","#5cd6ff"];
  const SWAP=130, CLEAR=170;
  const A=window.MATCH_AUDIO;

  function create(opts){
    const canvas=opts.canvas, ctx=canvas.getContext("2d"), cb=opts.callbacks||{};
    let W=0,H=0,DPR=1,cell=40,ox=0,oy=0;
    let grid=[], sel=null, busy=false, score=0, moves=0, cascade=0, running=false, raf=0;
    let sliding=null, clearing=null;

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
      for(let c=0;c<COLS;c++){ let w=ROWS-1;
        for(let r=ROWS-1;r>=0;r--){ if(grid[r][c]>=0){ grid[w][c]=grid[r][c]; if(w!==r)grid[r][c]=-1; w--; } }
        for(let r=w;r>=0;r--) grid[r][c]=rnd();
      }
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
      setTimeout(()=>{ clr.forEach(k=>{ grid[(k/COLS)|0][k%COLS]=-1; }); applyGravity(); clearing=null; resolve(); }, CLEAR);
    }
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
    function gem(x,y,s,color,k){
      const m=s*0.08, sz=s-m*2;
      ctx.fillStyle=color; round(x+m,y+m,sz,sz,s*0.22); ctx.fill();
      ctx.fillStyle="rgba(255,255,255,.25)"; round(x+m,y+m,sz,sz*0.42,s*0.22); ctx.fill();
    }
    function round(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

    function draw(){
      ctx.clearRect(0,0,W,H);
      const t=now();
      const sp = sliding ? Math.min(1,(t-sliding.t0)/SWAP) : 0;
      const cp = clearing ? Math.min(1,(t-clearing.t0)/CLEAR) : 0;
      for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
        const v=grid[r][c]; if(v<0) continue;
        let {x,y}=pos(r,c), s=cell;
        if(sliding){ const a=sliding.a,b=sliding.b;
          if(r===a.r&&c===a.c){ const f=pos(b.r,b.c); x=lerp(f.x,x,sp); y=lerp(f.y,y,sp); }
          else if(r===b.r&&c===b.c){ const f=pos(a.r,a.c); x=lerp(f.x,x,sp); y=lerp(f.y,y,sp); }
        }
        if(clearing&&clearing.set.has(key(r,c))){ s=cell*(1-cp*0.8); x+=(cell-s)/2; y+=(cell-s)/2; ctx.globalAlpha=1-cp; }
        gem(x,y,s,PAL[v]); ctx.globalAlpha=1;
      }
      if(sel){ const p=pos(sel.r,sel.c); ctx.strokeStyle="#fff"; ctx.lineWidth=3; round(p.x+2,p.y+2,cell-4,cell-4,cell*0.22); ctx.stroke(); }
      raf=requestAnimationFrame(draw);
    }
    const lerp=(a,b,t)=>a+(b-a)*t;

    function start(){ resize(); fill(); while(scan()){ fill(); } score=0; moves=MOVES; cascade=0; sel=null; busy=false; running=true;
      cb.score&&cb.score(0,0); cb.moves&&cb.moves(moves); cancelAnimationFrame(raf); raf=requestAnimationFrame(draw); }
    function stop(){ running=false; cancelAnimationFrame(raf); }
    return { start, stop, get score(){return score;}, get moves(){return moves;}, get grid(){return grid;} };
  }
  window.MATCH_GAME={ create };
})();
