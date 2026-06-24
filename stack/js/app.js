/* СТЭК — оркестрация */
(function(){
  const G=window.STACK_GAME, S=window.STACK_STORE, UI=window.STACK_UI,
        SK=window.STACK_SKINS, SH=window.STACK_SHARE, RNG=window.STACK_RNG, A=window.STACK_AUDIO,
        TG=window.STACK_TG, Q=window.STACK_QUESTS;
  const REWARD_TABLE=[20,40,60,80,100,120,150];
  function rewardFor(streak){ return REWARD_TABLE[Math.min(Math.max((streak||1)-1,0),6)]; }
  window.STACK_REWARD = rewardFor; // для UI
  const overlay=document.getElementById("overlay");
  const hud=document.getElementById("hud");
  const canvas=document.getElementById("game");
  const wrap=document.getElementById("game-wrap");
  const mute=document.getElementById("mute");

  let game=null, playing=false, mode="endless", curSeed=0, lastScore=0, maxCombo=0, perfectCount=0, duel=null;
  const getSkin=()=>SK.byId(S.s.equipped);

  function parseURL(){
    const p=new URLSearchParams(location.search);
    // Telegram start_param: "d<seed>s<score>" (дуэль) или "ref" (реферал)
    const sp = (TG && TG.startParam()) || "";
    const m = /^d(\d+)(?:s(\d+))?$/.exec(sp);
    if(m){ duel={ seed:(parseInt(m[1],10)>>>0), score: m[2]?parseInt(m[2],10):null }; }
    const isRef = (sp==="ref") || p.get("ref");
    if(isRef && !localStorage.getItem("stack.refclaimed")){
      S.addCoins(150); localStorage.setItem("stack.refclaimed","1");
      setTimeout(()=>UI.toast(`<b>+150 🪙</b> бонус за приглашение`),600);
    }
    // веб-фолбэк ?seed=&s=
    if(!duel && p.get("seed")){ duel={ seed:(parseInt(p.get("seed"),10)>>>0), score: p.get("s")?parseInt(p.get("s"),10):null }; }
    try{ history.replaceState(null,"",location.pathname); }catch(e){}
  }

  function ensureGame(){ if(!game) game=G.create({ canvas, getSkin, audio:A, callbacks:{ onScore, onOver } }); }

  function onScore(score, info){
    if(info.combo>maxCombo) maxCombo=info.combo;
    if(info.perfect) perfectCount++;
    if(TG) TG.haptic(info.perfect ? "rigid" : "light");
    hud.querySelector(".hud-score").textContent=score;
    const cc=hud.querySelector(".hud-combo");
    if(info.combo>1){ cc.textContent="×"+info.combo+" комбо"; cc.style.opacity="1"; cc.classList.remove("pop"); void cc.offsetWidth; cc.classList.add("pop"); }
    else cc.style.opacity="0";
  }

  function startMode(m, seed){
    ensureGame(); mode=m; maxCombo=0; perfectCount=0;
    curSeed = (seed!=null) ? (seed>>>0) : (m==="daily" ? RNG.todaySeed().seed : RNG.hashStr(Date.now()+"-"+Math.random()));
    S.touchDay();
    overlay.classList.add("hidden"); hud.classList.remove("hidden");
    hud.querySelector(".hud-score").textContent="0"; hud.querySelector(".hud-combo").style.opacity="0";
    playing=true; game.start(curSeed);
  }

  function onOver(score){
    playing=false; lastScore=score; hud.classList.add("hidden");
    if(TG) TG.haptic("error");
    const earned = score + perfectCount*3;
    S.addCoins(earned);
    let best=false;
    if(score>S.s.best){ S.s.best=score; best=true; }
    if(mode==="daily"){ const k=UI.dailyKeyNow(); if(S.s.dailyKey!==k){ S.s.dailyKey=k; S.s.dailyBest=0; } if(score>S.s.dailyBest) S.s.dailyBest=score; }
    S.s.games=(S.s.games||0)+1;
    S.s.totalPerfects=(S.s.totalPerfects||0)+perfectCount;
    // прогресс заданий
    const doneQ = Q.applyResult(S.s, { score, perfects:perfectCount, maxCombo, mode });
    // долгосрочные цели (авто-награда)
    const freshA = Q.checkAchs(S.s);
    freshA.forEach((a,i)=>{ S.addCoins(a.reward); });
    S.save();
    if(best){ setTimeout(()=>A.fx.win(),300); if(TG) TG.haptic("success"); }
    setScreen(UI.screenOver({ score, best, coins:earned, maxCombo, mode, target: (mode==="duel"&&duel)?duel.score:null }));
    // тосты о заданиях/целях поверх
    let delay=400;
    doneQ.forEach(q=>{ const d=delay; delay+=1500; setTimeout(()=>{ A.fx.coin(); UI.toast(`✅ Задание: <b>${q.text}</b> — забери награду`); }, d); });
    freshA.forEach(a=>{ const d=delay; delay+=1500; setTimeout(()=>{ A.fx.win(); if(TG)TG.haptic("success"); UI.toast(`🏅 Цель: <b>${a.text}</b> +${a.reward} 🪙`); }, d); });
  }

  function setScreen(html){ overlay.innerHTML=html; overlay.classList.remove("hidden"); }
  function home(){
    Q.ensureDaily(S.s, UI.dailyKeyNow(), RNG.todaySeed().seed); S.save();
    setScreen(UI.screenHome(duel));
  }

  // ввод: тап по полю = поставить блок
  wrap.addEventListener("pointerdown",(e)=>{ if(playing){ e.preventDefault(); game.tap(); } }, {passive:false});
  window.addEventListener("keydown",(e)=>{ if(e.code==="Space"||e.code==="ArrowDown"){ if(playing){ e.preventDefault(); game.tap(); } } });

  function refreshMute(){ mute.textContent = S.s.sound ? "🔊" : "🔇"; }

  document.addEventListener("click",(e)=>{
    const el=e.target.closest("[data-act],[data-buy],[data-equip]"); if(!el) return;
    if(el.dataset.buy){ const sk=SK.byId(el.dataset.buy);
      if(S.s.coins>=sk.cost){ S.addCoins(-sk.cost); S.own(sk.id); S.equip(sk.id); A.fx.coin(); setScreen(UI.screenShop()); }
      else { A.fx.over(); UI.toast("Не хватает монет 🪙"); } return; }
    if(el.dataset.equip){ S.equip(el.dataset.equip); A.fx.tap(); setScreen(UI.screenShop()); return; }
    if(el.dataset.claimq){ const r=Q.claim(S.s, el.dataset.claimq); if(r>0){ S.addCoins(r); A.fx.coin(); if(TG)TG.haptic("success"); S.save(); home(); UI.toast(`+${r} 🪙 за задание`);} return; }
    const a=el.dataset.act; A.fx.tap();
    if(a==="claim-reward"){
      const k=UI.dailyKeyNow();
      if(S.s.claimedRewardDay!==k){ S.touchDay(); const r=rewardFor(S.s.streak); S.s.claimedRewardDay=k; S.addCoins(r); S.save(); A.fx.coin(); if(TG)TG.haptic("success"); home(); UI.toast(`🎁 Ежедневная награда: <b>+${r} 🪙</b> · стрик ${S.s.streak}🔥`); }
      return;
    }
    if(a==="open-achs"){ setScreen(UI.screenAchs()); return; }
    if(a==="play-endless") startMode("endless");
    else if(a==="play-daily") startMode("daily");
    else if(a==="play-duel" && duel) startMode("duel", duel.seed);
    else if(a==="retry") startMode(mode, mode==="endless"?null:curSeed);
    else if(a==="go-home") home();
    else if(a==="open-shop") setScreen(UI.screenShop());
    else if(a==="open-board") setScreen(UI.screenBoard());
    else if(a==="invite") SH.shareInvite().then(r=>UI.toast("📨 "+r));
    else if(a==="share") SH.shareResult(lastScore, curSeed, S.s.equipped).then(r=>UI.toast("⇪ "+r));
  });

  mute.addEventListener("click",()=>{ S.s.sound=!S.s.sound; S.save(); refreshMute(); if(S.s.sound) A.fx.tap(); });

  // boot
  if(TG){ TG.ready(); const n=TG.user(); if(n && !S.s.name){ S.s.name=n; S.save(); } }
  parseURL();
  refreshMute();
  home();
})();
