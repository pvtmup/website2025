/* СТЭК — синхронизация с сервером удержания (см. bot/server.js).
   Без SYNC_API всё no-op: игра работает как раньше (лидерборд — симуляция). */
(function(){
  /* ── URL бэкенда удержания после деплоя (см. LAUNCH.md), напр. "https://host/api" ── */
  const SYNC_API = "";

  function on(){ const TG=window.STACK_TG; return !!(SYNC_API && TG && TG.isTG); }
  function hdr(){ const TG=window.STACK_TG; return { "content-type":"application/json", "X-Init-Data": (TG&&TG.initData?TG.initData():"") }; }

  // отправить статы на сервер (стрик/рекорд/дневной счёт) — повод для пушей и лидерборда
  function syncStats(){
    if(!on()) return; const s=window.STACK_STORE.s;
    try{ fetch(SYNC_API+"/sync", { method:"POST", headers:hdr(),
      body:JSON.stringify({ streak:s.streak||0, best:s.best||0, dailyKey:s.dailyKey, dailyScore:s.dailyBest||0, name:s.name||"" }) }).catch(()=>{}); }catch(e){}
  }
  // настоящий дневной лидерборд → [{name,score}] | null (тогда UI берёт симуляцию)
  async function leaderboard(){
    if(!on()) return null;
    try{ const key=encodeURIComponent(window.STACK_STORE.s.dailyKey||"");
      const r=await fetch(SYNC_API+"/leaderboard?key="+key, { headers:hdr() }); if(!r.ok) return null;
      const j=await r.json(); return Array.isArray(j.top)?j.top:null; }catch(e){ return null; }
  }
  // победил в дуэли → пингануть того, кто бросил вызов («тебя обогнали, реванш?»)
  function duelWin(challengerId, score, target){
    if(!on() || !challengerId) return;
    try{ fetch(SYNC_API+"/duel/win", { method:"POST", headers:hdr(),
      body:JSON.stringify({ challenger:challengerId, score, target }) }).catch(()=>{}); }catch(e){}
  }

  window.STACK_SYNC = { enabled:on, syncStats, leaderboard, duelWin };
})();
