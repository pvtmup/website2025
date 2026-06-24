/* PRISM — процедурная отрисовка 5 типов фишек на 2D-канвасе.
   Рисуем «matcap»-стиль (объёмное освещение градиентами) — это надёжно
   на любом устройстве и из этого делаем PIXI-текстуры + иконки для HTML. */
(function(){
  // палитра «свечения» по типам
  const HUE = [
    {a:"#19e6ff",b:"#0a6cff",glow:"#19e6ff"}, // 0 Cyber-Prism (стекло)
    {a:"#eaf0ff",b:"#8b93b8",glow:"#cfe0ff"}, // 1 Mercury (ртуть)
    {a:"#ff3da6",b:"#7a1450",glow:"#ff3da6"}, // 2 Carbon Cube
    {a:"#ff9a2e",b:"#ff2e2e",glow:"#ff7a00"}, // 3 Plasma Torus
    {a:"#b98bff",b:"#5a2eff",glow:"#9a6bff"}  // 4 Quantum Knot
  ];
  const NAMES=["призма","ртуть","куб","плазма","узел"];

  function lg(ctx,x0,y0,x1,y1,stops){ const g=ctx.createLinearGradient(x0,y0,x1,y1);
    stops.forEach(s=>g.addColorStop(s[0],s[1])); return g; }
  function rg(ctx,x,y,r,stops){ const g=ctx.createRadialGradient(x,y,r*0.04,x,y,r);
    stops.forEach(s=>g.addColorStop(s[0],s[1])); return g; }

  // ——— рисовалки фишек, центр (cx,cy), радиус R, ctx уже масштабирован ———
  function prism(ctx,cx,cy,R,c){ // граненая стеклянная призма (треугольник)
    const h=R*1.15, w=R*1.15;
    const top=[cx,cy-h], bl=[cx-w,cy+h*0.72], br=[cx+w,cy+h*0.72];
    // хроматическая кайма
    ctx.globalCompositeOperation="lighter";
    [["#ff2e63",-2],["#19e6ff",2]].forEach(([col,dx])=>{
      ctx.beginPath();ctx.moveTo(top[0]+dx,top[1]);ctx.lineTo(bl[0]+dx,bl[1]);ctx.lineTo(br[0]+dx,br[1]);ctx.closePath();
      ctx.strokeStyle=col;ctx.lineWidth=R*0.06;ctx.globalAlpha=.5;ctx.stroke();ctx.globalAlpha=1;
    });
    ctx.globalCompositeOperation="source-over";
    // тело
    ctx.beginPath();ctx.moveTo(...top);ctx.lineTo(...bl);ctx.lineTo(...br);ctx.closePath();
    ctx.fillStyle=lg(ctx,cx,cy-h,cx,cy+h,[[0,c.a],[1,c.b]]);ctx.fill();
    // грани
    ctx.strokeStyle="rgba(255,255,255,.5)";ctx.lineWidth=R*0.05;ctx.stroke();
    const mid=[(bl[0]+br[0])/2,(bl[1]+br[1])/2];
    ctx.beginPath();ctx.moveTo(...top);ctx.lineTo(...mid);
    ctx.moveTo(cx,cy-h*0.1);ctx.lineTo(...bl);ctx.moveTo(cx,cy-h*0.1);ctx.lineTo(...br);
    ctx.strokeStyle="rgba(255,255,255,.22)";ctx.lineWidth=R*0.03;ctx.stroke();
    // блик
    ctx.globalCompositeOperation="lighter";
    ctx.beginPath();ctx.moveTo(top[0],top[1]+R*0.1);ctx.lineTo(cx-w*0.3,cy);ctx.lineTo(cx+w*0.05,cy-R*0.1);ctx.closePath();
    ctx.fillStyle="rgba(255,255,255,.35)";ctx.fill();ctx.globalCompositeOperation="source-over";
  }
  function mercury(ctx,cx,cy,R,c){ // жидкометаллическая сфера (хром)
    ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.closePath();
    ctx.fillStyle=rg(ctx,cx-R*0.3,cy-R*0.35,R*1.5,[[0,"#ffffff"],[0.18,c.a],[0.55,"#5b6488"],[0.8,"#252a40"],[1,"#10121f"]]);
    ctx.fill();
    // «горизонт» окружения (хромовое отражение)
    ctx.save();ctx.clip();
    ctx.fillStyle="rgba(20,200,255,.18)";ctx.fillRect(cx-R,cy+R*0.1,R*2,R*0.5);
    ctx.fillStyle="rgba(255,61,166,.14)";ctx.fillRect(cx-R,cy+R*0.45,R*2,R*0.5);
    ctx.restore();
    // спекуляр
    ctx.globalCompositeOperation="lighter";
    ctx.beginPath();ctx.ellipse(cx-R*0.32,cy-R*0.4,R*0.26,R*0.18,-0.5,0,7);
    ctx.fillStyle="rgba(255,255,255,.9)";ctx.fill();
    ctx.beginPath();ctx.arc(cx+R*0.35,cy+R*0.4,R*0.1,0,7);ctx.fillStyle="rgba(255,255,255,.5)";ctx.fill();
    ctx.globalCompositeOperation="source-over";
  }
  function rrect(ctx,x,y,w,h,r){ ctx.beginPath();
    ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath(); }
  function cube(ctx,cx,cy,R,c){ // карбоновый куб с неоновыми рёбрами
    const s=R*1.7, x=cx-s/2, y=cy-s/2, rad=R*0.28;
    // свечение ребра
    ctx.shadowColor=c.glow;ctx.shadowBlur=R*0.5;
    rrect(ctx,x,y,s,s,rad);
    ctx.fillStyle=lg(ctx,x,y,x+s,y+s,[[0,"#221426"],[1,"#0c0712"]]);ctx.fill();
    ctx.shadowBlur=0;
    // карбоновое плетение
    ctx.save();rrect(ctx,x,y,s,s,rad);ctx.clip();
    ctx.strokeStyle="rgba(255,255,255,.05)";ctx.lineWidth=R*0.05;
    for(let i=-s;i<s*2;i+=R*0.22){ctx.beginPath();ctx.moveTo(x+i,y);ctx.lineTo(x+i+s,y+s);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x+i,y+s);ctx.lineTo(x+i+s,y);ctx.stroke();}
    ctx.restore();
    // неоновое ребро
    rrect(ctx,x,y,s,s,rad);ctx.strokeStyle=c.a;ctx.lineWidth=R*0.07;ctx.stroke();
    ctx.strokeStyle="rgba(255,255,255,.6)";ctx.lineWidth=R*0.02;ctx.stroke();
    // верхний блик
    ctx.globalCompositeOperation="lighter";
    rrect(ctx,x+R*0.1,y+R*0.1,s-R*0.2,s*0.34,rad*0.7);
    ctx.fillStyle="rgba(255,61,166,.16)";ctx.fill();ctx.globalCompositeOperation="source-over";
  }
  function torus(ctx,cx,cy,R,c){ // плазменное кольцо
    ctx.globalCompositeOperation="lighter";
    // внешнее свечение
    ctx.beginPath();ctx.arc(cx,cy,R*1.05,0,7);
    ctx.fillStyle=rg(ctx,cx,cy,R*1.15,[[0,"rgba(0,0,0,0)"],[0.62,"rgba(0,0,0,0)"],[0.78,c.glow],[1,"rgba(0,0,0,0)"]]);
    ctx.fill();
    ctx.globalCompositeOperation="source-over";
    // тело кольца
    ctx.lineWidth=R*0.42;
    ctx.beginPath();ctx.arc(cx,cy,R*0.66,0,7);
    ctx.strokeStyle=lg(ctx,cx,cy-R,cx,cy+R,[[0,c.a],[1,c.b]]);ctx.stroke();
    // внутренний жар
    ctx.globalCompositeOperation="lighter";
    ctx.lineWidth=R*0.16;ctx.beginPath();ctx.arc(cx,cy,R*0.66,0,7);
    ctx.strokeStyle="rgba(255,255,200,.85)";ctx.stroke();
    // блик
    ctx.lineWidth=R*0.08;ctx.beginPath();ctx.arc(cx,cy,R*0.66,-2.3,-0.9);
    ctx.strokeStyle="rgba(255,255,255,.9)";ctx.lineCap="round";ctx.stroke();
    ctx.globalCompositeOperation="source-over";
  }
  function knot(ctx,cx,cy,R,c){ // квантовый узел — переплетённые петли
    ctx.globalCompositeOperation="lighter";
    ctx.beginPath();ctx.arc(cx,cy,R,0,7);
    ctx.fillStyle=rg(ctx,cx,cy,R,[[0,"rgba(0,0,0,0)"],[0.45,"rgba(0,0,0,0)"],[0.7,c.glow+"66"],[1,"rgba(0,0,0,0)"]]);
    ctx.fill();
    ctx.lineCap="round";ctx.lineJoin="round";
    const lobe=(rot)=>{ ctx.save();ctx.translate(cx,cy);ctx.rotate(rot);
      ctx.beginPath();ctx.ellipse(0,-R*0.36,R*0.32,R*0.6,0,0,7);
      ctx.lineWidth=R*0.18;ctx.strokeStyle=lg(ctx,-R,-R,R,R,[[0,c.a],[1,c.b]]);ctx.stroke();
      ctx.lineWidth=R*0.06;ctx.strokeStyle="rgba(255,255,255,.7)";ctx.stroke();
      ctx.restore(); };
    lobe(0);lobe(2.094);lobe(4.188); // трилистник
    ctx.beginPath();ctx.arc(cx,cy,R*0.14,0,7);ctx.fillStyle="rgba(255,255,255,.95)";ctx.fill();
    ctx.globalCompositeOperation="source-over";
  }
  const DRAW=[prism,mercury,cube,torus,knot];

  function drawTile(ctx,idx,cx,cy,R){ (DRAW[idx]||prism)(ctx,cx,cy,R,HUE[idx]||HUE[0]); }

  // мягкое круглое свечение (для VFX/частиц) — белое, тонируем через tint
  function softCircle(S){
    const cv=document.createElement("canvas");cv.width=cv.height=S;
    const ctx=cv.getContext("2d");const r=S/2;
    const g=ctx.createRadialGradient(r,r,0,r,r,r);
    g.addColorStop(0,"rgba(255,255,255,1)");g.addColorStop(.4,"rgba(255,255,255,.6)");
    g.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=g;ctx.fillRect(0,0,S,S);return cv;
  }
  // маленький «осколок» — для частиц разрушения
  function shard(S){
    const cv=document.createElement("canvas");cv.width=cv.height=S;
    const ctx=cv.getContext("2d");ctx.translate(S/2,S/2);
    ctx.beginPath();ctx.moveTo(0,-S*0.45);ctx.lineTo(S*0.32,0);ctx.lineTo(0,S*0.45);ctx.lineTo(-S*0.32,0);ctx.closePath();
    ctx.fillStyle="#fff";ctx.fill();return cv;
  }

  function tileCanvas(idx,S){
    const cv=document.createElement("canvas");cv.width=cv.height=S;
    const ctx=cv.getContext("2d");drawTile(ctx,idx,S/2,S/2,S*0.4);return cv;
  }
  // иконка для HTML (home/floaters)
  function icon(idx,px){ return tileCanvas(idx,px||96).toDataURL(); }

  // строит PIXI-текстуры из канвасов
  function buildPixi(PIXI,S){
    const tiles=HUE.map((_,i)=>PIXI.Texture.from(tileCanvas(i,S)));
    const glow=PIXI.Texture.from(softCircle(128));
    const shardTex=PIXI.Texture.from(shard(48));
    return {tiles,glow,shard:shardTex,hue:HUE,names:NAMES,count:HUE.length};
  }

  window.PRISM_TEX={buildPixi,icon,drawTile,hue:HUE,names:NAMES,count:HUE.length};
})();
