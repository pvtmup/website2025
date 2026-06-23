/* ============================================================
   LORE — procedural cinematic poster generator (SVG, deterministic)
   Turns an episode into a unique, premium-looking key-art.
   ============================================================ */
(function(){
  // seeded RNG (mulberry32) so each episode's art is stable
  function rng(seed){
    let s = seed>>>0;
    return ()=>{ s|=0; s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s);
      t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
  }
  function hashStr(str){ let h=2166136261; for(const c of (str||"")){ h^=c.charCodeAt(0); h=Math.imul(h,16777619);} return h>>>0; }

  const lerp=(a,b,t)=>a+(b-a)*t;
  // simple hex helpers
  function hex2rgb(h){ h=h.replace("#",""); if(h.length===3) h=h.split("").map(x=>x+x).join("");
    return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }
  function mix(c1,c2,t){ const a=hex2rgb(c1),b=hex2rgb(c2);
    return `rgb(${Math.round(lerp(a[0],b[0],t))},${Math.round(lerp(a[1],b[1],t))},${Math.round(lerp(a[2],b[2],t))})`; }

  const W=400, H=260;

  function skyline(R, color){
    let s=""; let x=-10;
    while(x<W+10){
      const w=12+R()*34, h=40+R()*120, y=H-h;
      s+=`<rect x="${x|0}" y="${y|0}" width="${w|0}" height="${h|0}" fill="${color}"/>`;
      // a few lit windows
      const cols=Math.max(1,(w/10)|0);
      for(let c=0;c<cols;c++){ if(R()<0.35){
        const wx=x+4+c*9, wy=y+6+((R()*(h-12))|0);
        s+=`<rect x="${wx|0}" y="${wy|0}" width="3" height="4" fill="#ffe9a8" opacity="${(0.4+R()*0.5).toFixed(2)}"/>`; }}
      x+=w+4+R()*8;
    }
    return s;
  }
  function mountains(R,color){
    let s=""; for(let layer=0;layer<3;layer++){
      const base=H-10-layer*8, c=color;
      let pts=`0,${H} 0,${base-R()*30}`;
      for(let x=0;x<=W;x+=40){ pts+=` ${x},${(base-(R()*70)*(1-layer*0.25))|0}`; }
      pts+=` ${W},${H}`;
      s+=`<polygon points="${pts}" fill="${c}" opacity="${(0.5+layer*0.2).toFixed(2)}"/>`;
    }
    return s;
  }
  function stageLights(R,accent){
    let s=`<rect x="0" y="${H-26}" width="${W}" height="26" fill="rgba(0,0,0,.5)"/>`;
    for(let i=0;i<4;i++){ const cx=40+i*((W-80)/3); const spread=40+R()*30;
      s+=`<polygon points="${cx},-10 ${cx-spread},${H} ${cx+spread},${H}" fill="${accent}" opacity="0.07"/>`; }
    return s;
  }
  function cosmos(R){
    let s=""; for(let i=0;i<60;i++){ s+=`<circle cx="${(R()*W)|0}" cy="${(R()*H*0.85)|0}" r="${(R()*1.4).toFixed(1)}" fill="#fff" opacity="${(0.2+R()*0.7).toFixed(2)}"/>`; }
    return s;
  }
  function silhouette(R,cx){
    // head + shoulders, lower-center
    const y=H-2;
    return `<g fill="rgba(0,0,0,.62)">
      <ellipse cx="${cx}" cy="${y-58}" rx="20" ry="23"/>
      <path d="M${cx-46},${y} C${cx-44},${y-46} ${cx-22},${y-40} ${cx},${y-40} C${cx+22},${y-40} ${cx+44},${y-46} ${cx+46},${y} Z"/>
    </g>`;
  }

  // styles per world
  const STYLE = { neon:"city", fame:"stage", academy:"stage", realm:"mountain", after:"cosmic" };

  function buildSVG({seed=1, c1="#1a0b2e", c2="#3d1361", accent="#ff7eb6", style="city", figure=true}={}){
    const R=rng(seed);
    const sunX=(40+R()*320)|0, sunY=(20+R()*70)|0, sunR=(70+R()*70)|0;
    let scene="";
    if(style==="city")   scene=skyline(R, mix(c1,"#000000",0.45));
    else if(style==="mountain") scene=mountains(R, mix(c2,"#000000",0.4));
    else if(style==="stage") scene=stageLights(R, accent);
    else if(style==="cosmic") scene=cosmos(R);
    // floating particles
    let parts=""; for(let i=0;i<14;i++){ parts+=`<circle cx="${(R()*W)|0}" cy="${(R()*H)|0}" r="${(0.6+R()*1.8).toFixed(1)}" fill="${accent}" opacity="${(0.15+R()*0.4).toFixed(2)}"/>`; }
    const fig = figure && style!=="cosmic" ? silhouette(R,(120+R()*160)|0) : "";

    const svg=`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} ${H}' preserveAspectRatio='xMidYMid slice'>
<defs>
<linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'>
<stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient>
<radialGradient id='sun' cx='50%' cy='50%' r='50%'>
<stop offset='0' stop-color='${accent}' stop-opacity='.85'/><stop offset='.6' stop-color='${accent}' stop-opacity='.18'/><stop offset='1' stop-color='${accent}' stop-opacity='0'/></radialGradient>
<radialGradient id='vig' cx='50%' cy='42%' r='75%'>
<stop offset='.55' stop-color='#000' stop-opacity='0'/><stop offset='1' stop-color='#000' stop-opacity='.6'/></radialGradient>
<filter id='gr'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter>
</defs>
<rect width='${W}' height='${H}' fill='url(#bg)'/>
<circle cx='${sunX}' cy='${sunY}' r='${sunR}' fill='url(#sun)'/>
${scene}
${parts}
${fig}
<rect width='${W}' height='${H}' fill='url(#vig)'/>
<rect width='${W}' height='${H}' filter='url(#gr)' opacity='.06'/>
</svg>`;
    return svg;
  }

  function toCss(opts){
    const svg = buildSVG(opts);
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}") center/cover no-repeat`;
  }

  // convenience: build from an episode-ish object
  function forEpisode({title, world, palette}){
    const seed = hashStr((title||"")+(world||""));
    const style = STYLE[world] || "city";
    return toCss({ seed, c1:palette[0], c2:palette[1], accent:palette[2]||"#ff7eb6", style });
  }

  window.LORE_ART = { toCss, buildSVG, forEpisode, hashStr, rng, STYLE, mix };
})();
