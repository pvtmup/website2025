/* ============================================================
   LORE — share-card export (Canvas → PNG). Makes the viral
   loop tangible: turn an episode into a postable 9:16 card.
   ============================================================ */
(function(){
  const ART = window.LORE_ART;

  // load an SVG data-uri (from poster css) into an Image
  function loadPoster(ep){
    return new Promise((res)=>{
      let url = null;
      if(ep.art){ const m = ep.art.match(/url\("([^"]+)"\)/); if(m) url=m[1]; }
      if(!url && ART){ url = "data:image/svg+xml,"+encodeURIComponent(ART.buildSVG({seed:ART.hashStr(ep.title||"x"),c1:(ep.palette||["#222"])[0],c2:(ep.palette||["#111","#111"])[1],accent:(ep.palette||[])[2]||"#ff7eb6",style:ART.STYLE[ep.worldId]||"city"})); }
      const img=new Image(); img.crossOrigin="anonymous";
      img.onload=()=>res(img); img.onerror=()=>res(null); img.src=url;
    });
  }

  function fmt(n){ n=Math.round(n||0); if(n>=1e6)return (n/1e6).toFixed(1)+"M"; if(n>=1e3)return (n/1e3).toFixed(1)+"k"; return ""+n; }
  function wrap(ctx, text, x, y, maxW, lh){
    const words=text.split(" "); let line="", yy=y;
    for(const w of words){ const test=line?line+" "+w:w;
      if(ctx.measureText(test).width>maxW && line){ ctx.fillText(line,x,yy); line=w; yy+=lh; } else line=test; }
    if(line) ctx.fillText(line,x,yy); return yy;
  }

  async function buildCard(ep, player){
    const W=1080, H=1920, c=document.createElement("canvas"); c.width=W; c.height=H;
    const g=c.getContext("2d");
    // bg
    g.fillStyle="#07070c"; g.fillRect(0,0,W,H);
    const poster=await loadPoster(ep);
    if(poster){ // cover-fit top 60%
      const ph=H*0.62, ratio=Math.max(W/poster.width, ph/poster.height);
      const pw=poster.width*ratio, phh=poster.height*ratio;
      g.drawImage(poster,(W-pw)/2,0,pw,phh);
    } else { g.fillStyle="#1a0b2e"; g.fillRect(0,0,W,H*0.62); }
    // gradient fade
    const grad=g.createLinearGradient(0,H*0.35,0,H*0.72);
    grad.addColorStop(0,"rgba(7,7,12,0)"); grad.addColorStop(1,"#07070c");
    g.fillStyle=grad; g.fillRect(0,H*0.3,W,H*0.45);

    // logo
    g.fillStyle="#fff"; g.font="700 44px Inter, sans-serif"; g.globalAlpha=.9;
    g.fillText("L O R E", 64, 96); g.globalAlpha=1;
    g.fillStyle="#ffd66b"; g.font="700 30px Inter, sans-serif";
    g.fillText((ep.badge||"")+"  ·  "+(ep.world||""), 64, 150);

    // title
    g.fillStyle="#fff"; g.font="800 96px Inter, sans-serif";
    let y=wrap(g, (ep.title||"").toUpperCase(), 64, H*0.66, W-128, 104);

    // a line of scene text
    const scene=(ep.scenes&&ep.scenes[0]?ep.scenes[0].t:"").replace(/<[^>]+>/g,"");
    g.fillStyle="#c9c7e0"; g.font="italic 40px Georgia, serif";
    y=wrap(g, scene, 64, y+90, W-128, 56);

    // hook caption — engagement bait for the feed
    g.fillStyle="#ff4d6d"; g.font="800 38px Inter, sans-serif";
    g.fillText("А ТЫ БЫ КАК?", 64, y+78);

    // stats row
    g.font="700 46px Inter, sans-serif"; g.fillStyle="#fff";
    const sy=H-220;
    g.fillText("👁 "+fmt(ep.views), 64, sy);
    g.fillText("❤️ "+fmt(ep.likes), 64, sy+72);
    if(ep.viral){ g.fillStyle="#ff4d6d"; g.fillText("🚀 VIRAL", W-360, sy); }

    // creator handle
    g.fillStyle="#9a98b4"; g.font="600 38px Inter, sans-serif";
    g.fillText("@"+((player&&player.name)||"you").toLowerCase().replace(/\s/g,"")+"  ·  снято в LORE", 64, H-90);

    return c.toDataURL("image/png");
  }

  async function exportCard(ep, player){
    const data=await buildCard(ep, player);
    // try native share, else download
    try{
      if(navigator.canShare){
        const blob=await (await fetch(data)).blob();
        const file=new File([blob], "lore-episode.png", {type:"image/png"});
        if(navigator.canShare({files:[file]})){ await navigator.share({files:[file], title:"LORE", text:`${ep.title} — а ты бы как? 🎬 снято в LORE`}); return "отправлен"; }
      }
    }catch(e){}
    const a=document.createElement("a"); a.href=data; a.download=`LORE-${(ep.title||"episode").replace(/\s+/g,"-")}.png`; a.click();
    return "скачан";
  }

  window.LORE_SHARE = { exportCard, buildCard };
})();
