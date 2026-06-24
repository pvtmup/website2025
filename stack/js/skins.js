/* СТЭК — косметические скины (палитры башни). Меняют только вид. */
(function(){
  // каждый скин: color(index) -> {top,side} цвета блока по высоте
  const SKINS = [
    { id:"rainbow", name:"Радуга", cost:0, hue:i=>(200+i*9)%360, sat:70, light:58 },
    { id:"neon",    name:"Неон",   cost:250, hue:i=>(290+i*14)%360, sat:90, light:60 },
    { id:"sunset",  name:"Закат",  cost:250, hue:i=>(10+i*4)%60,    sat:85, light:58 },
    { id:"ice",     name:"Лёд",    cost:400, hue:i=>(180+i*3)%220+170-170, sat:55, light:66, fixed:[190,210] },
    { id:"toxic",   name:"Кислота",cost:400, hue:i=>(90+i*7)%160,   sat:80, light:55 },
    { id:"gold",    name:"Золото", cost:800, hue:i=>(40+i*1)%50,    sat:85, light:58 },
    { id:"mono",    name:"Нуар",   cost:600, mono:true },
  ];
  function colorFor(skin, i){
    if(skin.mono){ const l = 30 + (i*4)%55; return `hsl(230 8% ${l}%)`; }
    if(skin.fixed){ const h = skin.fixed[0] + ((i*7) % (skin.fixed[1]-skin.fixed[0])); return `hsl(${h} ${skin.sat}% ${skin.light}%)`; }
    return `hsl(${skin.hue(i)} ${skin.sat}% ${skin.light}%)`;
  }
  function byId(id){ return SKINS.find(s=>s.id===id) || SKINS[0]; }
  window.STACK_SKINS = { SKINS, colorFor, byId };
})();
