/* СТЭК — оркестрация */
(function(){
  const G=window.STACK_GAME, S=window.STACK_STORE, UI=window.STACK_UI,
        SK=window.STACK_SKINS, SH=window.STACK_SHARE, RNG=window.STACK_RNG, A=window.STACK_AUDIO,
        TG=window.STACK_TG, Q=window.STACK_QUESTS, SE=window.STACK_SEASON;
  const REWARD_TABLE=[20,40,60,80,100,120,150];
  function rewardFor(streak){ return REWARD_TABLE[Math.min(Math.max((streak||1)-1,0),6)]; }
  window.STACK_REWARD = rewardFor; // для UI
  const overlay=document.getElementById("overlay");
  const hud=document.getElementById("hud");
  const canvas=document.getElementById("game");
  const wrap=document.getElementById("game-wrap");
  const mute=document.getElementById("mute");
  const coach=document.getElementById("coach");
  const langBtn=document.getElementById("lang");

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
    // веб-фолбэк ?seed=&s=&n=
    if(!duel && p.get("seed")){ duel={ seed:(parseInt(p.get("seed"),10)>>>0), score: p.get("s")?parseInt(p.get("s"),10):null, name: p.get("n")?decodeURIComponent(p.get("n")).slice(0,18):null }; }
    try{ history.replaceState(null,"",location.pathname); }catch(e){}
  }

  const getBg = ()=>{ try{ return SE.current().hue; }catch(e){ return 250; } };
  function onMilestone(score){
    const reward = 20 + score;            // растёт с высотой
    S.addCoins(reward); if(SE) SE.addXP(S.s, 25); S.save();
    A.fx.win(); if(TG) TG.haptic("success");
    UI.toast(`🏔️ Высота ${score}! <b>+${reward} 🪙</b>`);
  }
  function ensureGame(){ if(!game) game=G.create({ canvas, getSkin, getBg, audio:A, callbacks:{ onScore, onOver, onMilestone } }); }

  function onScore(score, info){
    if(info.combo>maxCombo) maxCombo=info.combo;
    if(info.perfect) perfectCount++;
    if(info.bonus){ S.addCoins(15); if(SE) SE.addXP(S.s,30); S.save(); if(TG) TG.haptic("success"); UI.toast("✨ Золотой блок: <b>+15 🪙</b>"); }
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
    playing=true; if(TG) TG.back(false); game.start(curSeed);
    A.startMusic(()=>game?game.score:0);
    if(coach){ if(S.s.games===0) coach.classList.remove("hidden"); else coach.classList.add("hidden"); }
  }

  function onOver(score){
    playing=false; lastScore=score; hud.classList.add("hidden");
    A.stopMusic();
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
    // XP сезона
    const xpGain = score + perfectCount*2 + (mode==="daily"?20:0);
    SE.addXP(S.s, xpGain);
    S.save();
    if(best){ setTimeout(()=>A.fx.win(),300); if(TG) TG.haptic("success"); }
    setScreen(UI.screenOver({ score, best, coins:earned, maxCombo, mode, first:(S.s.games===1),
      target: (mode==="duel"&&duel)?duel.score:null, duelName: (mode==="duel"&&duel)?duel.name:null }));
    countUp(overlay.querySelector(".over-score"), score);
    if(TG) TG.back(true);
    // тосты о заданиях/целях поверх
    let delay=400;
    doneQ.forEach(q=>{ const d=delay; delay+=1500; setTimeout(()=>{ A.fx.coin(); UI.toast(`✅ Задание: <b>${q.text}</b> — забери награду`); }, d); });
    freshA.forEach(a=>{ const d=delay; delay+=1500; setTimeout(()=>{ A.fx.win(); if(TG)TG.haptic("success"); UI.toast(`🏅 Цель: <b>${a.text}</b> +${a.reward} 🪙`); }, d); });
  }

  const I18N=window.STACK_I18N;
  function setScreen(html){ overlay.innerHTML=I18N?I18N.t(html):html; overlay.classList.remove("hidden"); }
  function openSub(html){ if(TG) TG.back(true); setScreen(html); }
  function localizeChrome(){
    if(!I18N) return;
    const hint=hud&&hud.querySelector(".hud-hint"); if(hint) hint.textContent=I18N.t("тап — поставить блок");
    if(coach) coach.textContent=I18N.t("Тапни, чтобы поставить блок")+" 👆";
    if(langBtn) langBtn.textContent = I18N.get()==="en" ? "RU" : "EN";
  }
  function countUp(el, to){
    if(!el) return; const dur=600, t0=(window.performance&&performance.now)?performance.now():Date.now();
    function tick(){ const now=(window.performance&&performance.now)?performance.now():Date.now();
      const k=Math.min(1,(now-t0)/dur); el.textContent=Math.round(to*(1-Math.pow(1-k,3)));
      if(k<1) requestAnimationFrame(tick); else el.textContent=to; }
    requestAnimationFrame(tick);
  }
  function home(){
    Q.ensureDaily(S.s, UI.dailyKeyNow(), RNG.todaySeed().seed);
    SE.ensure(S.s); S.save();
    if(TG) TG.back(false);
    setScreen(UI.screenHome(duel));
  }

  function claimSeason(kind, i){
    const t=SE.TRACK[i], st=S.s; SE.ensure(st);
    if(!t || st.season.xp < t.xp) return;
    if(kind==="prem" && !st.season.owner){ UI.toast("Нужен премиум-пасс 🎟️"); return; }
    const arr = kind==="prem" ? st.season.prem : st.season.free;
    if(arr.includes(i)) return;
    const rew = kind==="prem" ? t.prem : t.free;
    if(rew.coins) S.addCoins(rew.coins);
    if(rew.skin) S.own(rew.skin);
    arr.push(i); S.save(); A.fx.coin(); if(TG)TG.haptic("success");
    setScreen(UI.screenSeason());
    UI.toast(`Награда забрана${rew.skin?": скин "+SK.byId(rew.skin).name:" +"+rew.coins+"🪙"}`);
  }
  async function buyPassStars(){
    const P=window.STACK_PAY; if(!P) return;
    const r=await P.buy("pass");
    if(r==="paid"){ SE.ensure(S.s); S.s.season.owner=true; S.save(); A.fx.coin(); if(TG)TG.haptic("success"); setScreen(UI.screenSeason()); UI.toast("🎟️ Пасс куплен за Stars!"); }
    else if(r==="off"){ UI.toast("Покупки за Stars скоро будут включены"); }
    else if(r!=="cancelled"){ A.fx.over(); UI.toast("Оплата не прошла"); }
  }
  function buyPass(){
    if(S.s.coins>=SE.PASS_COST){ S.addCoins(-SE.PASS_COST); SE.ensure(S.s); S.s.season.owner=true; S.save(); A.fx.coin(); if(TG)TG.haptic("success"); setScreen(UI.screenSeason()); UI.toast("🎟️ Премиум-пасс активирован!"); }
    else { A.fx.over(); UI.toast("Не хватает монет на пасс 🪙"); }
  }

  // ввод: тап по полю = поставить блок
  wrap.addEventListener("pointerdown",(e)=>{ if(playing){ e.preventDefault(); if(coach) coach.classList.add("hidden"); game.tap(); } }, {passive:false});
  window.addEventListener("keydown",(e)=>{ if(e.code==="Space"||e.code==="ArrowDown"){ if(playing){ e.preventDefault(); game.tap(); } } });

  function refreshMute(){ mute.textContent = S.s.sound ? "🔊" : "🔇"; }

  document.addEventListener("click",(e)=>{
    const el=e.target.closest("[data-act],[data-buy],[data-equip]"); if(!el) return;
    if(el.dataset.buy){ const sk=SK.byId(el.dataset.buy);
      if(S.s.coins>=sk.cost){ S.addCoins(-sk.cost); S.own(sk.id); S.equip(sk.id); A.fx.coin(); setScreen(UI.screenShop()); }
      else { A.fx.over(); UI.toast("Не хватает монет 🪙"); } return; }
    if(TG) TG.haptic("light");
    if(el.dataset.equip){ S.equip(el.dataset.equip); A.fx.tap(); setScreen(UI.screenShop()); return; }
    if(el.dataset.claimq){ const r=Q.claim(S.s, el.dataset.claimq); if(r>0){ S.addCoins(r); A.fx.coin(); if(TG)TG.haptic("success"); S.save(); home(); UI.toast(`+${r} 🪙 за задание`);} return; }
    if(el.dataset.claimfree){ claimSeason("free", parseInt(el.dataset.claimfree,10)); return; }
    if(el.dataset.claimprem){ claimSeason("prem", parseInt(el.dataset.claimprem,10)); return; }
    const a=el.dataset.act; A.fx.tap();
    if(a==="open-season"){ openSub(UI.screenSeason()); return; }
    if(a==="buy-pass"){ buyPass(); return; }
    if(a==="buy-pass-stars"){ buyPassStars(); return; }
    if(a==="claim-reward"){
      const k=UI.dailyKeyNow();
      if(S.s.claimedRewardDay!==k){ S.touchDay(); const r=rewardFor(S.s.streak); S.s.claimedRewardDay=k; S.addCoins(r); S.save(); A.fx.coin(); if(TG)TG.haptic("success"); home(); UI.toast(`🎁 Ежедневная награда: <b>+${r} 🪙</b> · стрик ${S.s.streak}🔥`); }
      return;
    }
    if(a==="open-achs"){ openSub(UI.screenAchs()); return; }
    if(a==="how-ok"){ S.s.seenHow=true; S.save(); home(); return; }
    if(a==="open-how"){ setScreen(UI.screenHow()); return; }
    if(a==="play-endless") startMode("endless");
    else if(a==="play-daily") startMode("daily");
    else if(a==="play-duel" && duel) startMode("duel", duel.seed);
    else if(a==="retry") startMode(mode, mode==="endless"?null:curSeed);
    else if(a==="go-home") home();
    else if(a==="open-shop") openSub(UI.screenShop());
    else if(a==="open-board") openSub(UI.screenBoard());
    else if(a==="invite") SH.shareInvite().then(r=>{ UI.toast("📨 "+r); viralReward(r); });
    else if(a==="share") SH.shareResult(lastScore, curSeed, S.s.equipped, S.s.name).then(r=>{ UI.toast("⇪ "+r); viralReward(r); });
  });

  // награда за первый отправленный вызов/инвайт — буст вирального действия
  function viralReward(status){
    if(status==="отмена" || S.s.firstShareDone) return;
    S.s.firstShareDone=true; S.addCoins(200); S.save();
    if(TG) TG.haptic("success");
    setTimeout(()=>UI.toast("🎉 <b>+200 🪙</b> за первый вызов другу!"), 1100);
  }

  mute.addEventListener("click",()=>{
    S.s.sound=!S.s.sound; S.save(); refreshMute();
    if(S.s.sound){ A.fx.tap(); if(playing) A.startMusic(()=>game?game.score:0); }
    else A.stopMusic();
  });

  if(langBtn) langBtn.addEventListener("click",()=>{
    const nl = (I18N && I18N.get()==="en") ? "ru" : "en";
    S.s.lang=nl; S.save(); if(I18N) I18N.set(nl); localizeChrome(); A.fx.tap();
    if(!playing) home();
  });

  // boot
  if(TG){ TG.ready(); TG.onBack(()=>{ if(!playing) home(); }); const n=TG.user(); if(n && !S.s.name){ S.s.name=n; S.save(); } }
  // язык: сохранённый → из Telegram → ru по умолчанию
  (function(){ let lng=S.s.lang;
    if(!lng){ const lc=(TG&&TG.langCode?TG.langCode():"").toLowerCase(); lng = lc.startsWith("ru")?"ru":((TG&&TG.isTG)?"en":"ru"); }
    if(I18N) I18N.set(lng); })();
  localizeChrome();
  parseURL();
  refreshMute();
  if(!S.s.seenHow){ setScreen(UI.screenHow()); } else { home(); }
  // подтянуть облачный сейв (если он новее локального) — синк между устройствами
  if(TG && TG.isTG){
    TG.cloudGet("save", (v)=>{ if(!v) return;
      try{ const data=JSON.parse(v); if((data.savedAt||0) > (S.s.savedAt||0)){ S.adopt(data); if(!playing){ if(S.s.seenHow) home(); } } }catch(e){}
    });
  }
})();
