/* СТЭК — детерминированный ГПСЧ (сид → одинаковая игра у всех) */
(function(){
  function mulberry32(seed){
    let s = seed>>>0;
    return function(){
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s>>>15), 1 | s);
      t = (t + Math.imul(t ^ (t>>>7), 61 | t)) ^ t;
      return ((t ^ (t>>>14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(str){
    let h = 2166136261 >>> 0;
    for(const c of (""+str)){ h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function todaySeed(){
    const d = new Date();
    const key = d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();
    return { seed: hashStr("daily:"+key), key };
  }
  window.STACK_RNG = { mulberry32, hashStr, todaySeed };
})();
