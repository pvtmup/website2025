/* СТЭК — удержание: ежедневные задания + долгосрочные цели */
(function(){
  const RNG = window.STACK_RNG;

  // пул дневных заданий (3 в день, по сиду дня)
  const POOL = [
    { id:"score20", text:"Набери 20 в одном забеге",  goal:20, reward:40,  type:"score" },
    { id:"score40", text:"Набери 40 в одном забеге",  goal:40, reward:80,  type:"score" },
    { id:"score60", text:"Набери 60 в одном забеге",  goal:60, reward:120, type:"score" },
    { id:"perf10",  text:"10 перфектов за забег",      goal:10, reward:60,  type:"perfect" },
    { id:"perf20",  text:"20 перфектов за забег",      goal:20, reward:120, type:"perfect" },
    { id:"combo8",  text:"Комбо ×8 в одном забеге",    goal:8,  reward:60,  type:"combo" },
    { id:"combo15", text:"Комбо ×15 в одном забеге",   goal:15, reward:110, type:"combo" },
    { id:"daily",   text:"Сыграй дневной челлендж",    goal:1,  reward:50,  type:"daily" },
    { id:"games3",  text:"Сыграй 3 забега",            goal:3,  reward:40,  type:"games" },
    { id:"games5",  text:"Сыграй 5 забегов",           goal:5,  reward:70,  type:"games" },
  ];

  // долгосрочные цели (одноразовая награда)
  const ACHS = [
    { id:"h25",     text:"Высота 25",            reward:100, check:s=>s.best>=25 },
    { id:"h50",     text:"Высота 50",            reward:250, check:s=>s.best>=50 },
    { id:"h100",    text:"Высота 100",           reward:600, check:s=>s.best>=100 },
    { id:"perf100", text:"100 перфектов всего",  reward:200, check:s=>(s.totalPerfects||0)>=100 },
    { id:"skins3",  text:"3 скина в коллекции",  reward:150, check:s=>(s.owned||[]).length>=3 },
    { id:"week",    text:"Стрик 7 дней",         reward:300, check:s=>(s.streak||0)>=7 },
    { id:"games50", text:"50 забегов",           reward:200, check:s=>(s.games||0)>=50 },
  ];

  function defById(id){ return POOL.find(q=>q.id===id); }

  // сгенерировать/обновить дневные задания
  function ensureDaily(s, todayKey, seed){
    if(s.quests && s.quests.key===todayKey) return s.quests;
    const rng = RNG.mulberry32((seed>>>0) ^ 0x51ed);
    const pool = POOL.slice(); const items=[];
    for(let i=0;i<3 && pool.length;i++){
      const q = pool.splice(Math.floor(rng()*pool.length),1)[0];
      items.push({ id:q.id, prog:0, claimed:false });
    }
    s.quests = { key:todayKey, items };
    return s.quests;
  }

  // обновить прогресс по итогу забега. result: {score, perfects, maxCombo, mode}
  function applyResult(s, result){
    if(!s.quests) return [];
    const done=[];
    s.quests.items.forEach(it=>{
      const d=defById(it.id); if(!d || it.claimed) return;
      const was = it.prog>=d.goal;
      if(d.type==="score")   it.prog=Math.max(it.prog, result.score||0);
      else if(d.type==="perfect") it.prog=Math.max(it.prog, result.perfects||0);
      else if(d.type==="combo")   it.prog=Math.max(it.prog, result.maxCombo||0);
      else if(d.type==="daily")   { if(result.mode==="daily") it.prog=1; }
      else if(d.type==="games")   it.prog=it.prog+1;
      if(!was && it.prog>=d.goal) done.push(d);
    });
    return done; // задания, ставшие выполненными (для тоста)
  }

  function claim(s, id){
    const it = s.quests && s.quests.items.find(x=>x.id===id);
    const d = defById(id);
    if(!it || !d || it.claimed || it.prog < d.goal) return 0;
    it.claimed = true;
    return d.reward;
  }

  // проверить долгосрочные цели → вернуть новые выполненные (с авто-наградой выше по стеку)
  function checkAchs(s){
    s.achdone = s.achdone || [];
    const fresh=[];
    ACHS.forEach(a=>{ if(!s.achdone.includes(a.id) && a.check(s)){ s.achdone.push(a.id); fresh.push(a); } });
    return fresh;
  }

  window.STACK_QUESTS = { POOL, ACHS, defById, ensureDaily, applyResult, claim, checkAchs };
})();
