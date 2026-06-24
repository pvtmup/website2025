/* СТЭК — Сезон / Батл-пасс (повод возвращаться + монетизация косметикой) */
(function(){
  const SEASONS = [
    { name:"Неоновый сезон",  emoji:"🌃", hue:270 },
    { name:"Ледяной сезон",   emoji:"❄️", hue:195 },
    { name:"Золотая лихорадка",emoji:"🏆", hue:42  },
    { name:"Кислотный сезон",  emoji:"🧪", hue:110 },
  ];
  // 10 уровней: порог XP (накопительно) + бесплатная и премиум-награда
  const TRACK = [
    { xp:100,  free:{coins:30},  prem:{coins:60} },
    { xp:250,  free:{coins:40},  prem:{coins:90} },
    { xp:450,  free:{coins:40},  prem:{coins:90} },
    { xp:700,  free:{coins:50},  prem:{coins:120} },
    { xp:1000, free:{coins:60},  prem:{skin:"aurora"} },
    { xp:1350, free:{coins:70},  prem:{coins:150} },
    { xp:1750, free:{coins:80},  prem:{coins:180} },
    { xp:2200, free:{coins:100}, prem:{coins:220} },
    { xp:2700, free:{coins:120}, prem:{coins:260} },
    { xp:3300, free:{coins:200}, prem:{skin:"lava", coins:150} },
  ];
  const PASS_COST = 1200;          // активация премиум-пасса (монетами) на текущий сезон
  const SEASON_DAYS = 14;

  function current(){
    const dayMs=86400000;
    const idx = Math.floor(Math.floor(Date.now()/dayMs)/SEASON_DAYS);
    const s = SEASONS[((idx%SEASONS.length)+SEASONS.length)%SEASONS.length];
    const endTs = (idx+1)*SEASON_DAYS*dayMs;
    const daysLeft = Math.max(1, Math.ceil((endTs-Date.now())/dayMs));
    return { ...s, idx, daysLeft };
  }
  function ensure(st){
    const c=current();
    if(!st.season || st.season.id!==c.idx){
      st.season = { id:c.idx, xp:0, owner:false, free:[], prem:[] };
    }
    return st.season;
  }
  function tierIndex(xp){ let n=0; for(const t of TRACK){ if(xp>=t.xp) n++; } return n; } // сколько уровней пройдено
  function addXP(st, n){ ensure(st); st.season.xp += n; return st.season.xp; }

  window.STACK_SEASON = { SEASONS, TRACK, PASS_COST, SEASON_DAYS, current, ensure, tierIndex, addXP };
})();
