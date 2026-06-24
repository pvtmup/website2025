/* СТЭК — оркестрация */
(function(){
  const G=window.STACK_GAME, S=window.STACK_STORE, UI=window.STACK_UI,
        SK=window.STACK_SKINS, SH=window.STACK_SHARE, RNG=window.STACK_RNG, A=window.STACK_AUDIO;
  const overlay=document.getElementById("overlay");
  const hud=document.getElementById("hud");
  const canvas=document.getElementById("game");
  const wrap=document.getElementById("game-wrap");
  const mute=document.getElementById("mute");

  let game=null, playing=false, mode="endless", curSeed=0, lastScore=0, maxCombo=0, perfectCount=0, duel=null;
  const getSkin=()=>SK.byId(S.s.equipped);

  function parseURL(){
    const p=new URLSearchParams(location.search);
    if(p.get("ref") && !localStorage.getItem("stack.refclaimed")){
      S.addCoins(150); localStorage.setItem("stack.refclaimed","1");
      setTimeout(()=>UI.toast(`<b>+150 🪙</b> бонус за приглашение`),600);
    }
    if(p.get("seed")){ duel={ seed:(parseInt(p.get("seed"),10)>>>0), score: p.get("s")?parseInt(p.get("s"),10):null }; }
    try{ history.replaceState(null,"",location.pathname); }catch(e){}
  }

  function ensureGame(){ if(!game) game=G.create({ canvas, getSkin, audio:A, callbacks:{ onScore, onOver } }); }

  function onScore(score, info){
    if(info.combo>maxCombo) maxCombo=info.combo;
    if(info.perfect) perfectCount++;
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
    const earned = score + perfectCount*3;
    S.addCoins(earned);
    let best=false;
    if(score>S.s.best){ S.s.best=score; best=true; }
    if(mode==="daily"){ const k=UI.dailyKeyNow(); if(S.s.dailyKey!==k){ S.s.dailyKey=k; S.s.dailyBest=0; } if(score>S.s.dailyBest) S.s.dailyBest=score; }
    S.s.games=(S.s.games||0)+1; S.save();
    if(best) setTimeout(()=>A.fx.win(),300);
    setScreen(UI.screenOver({ score, best, coins:earned, maxCombo, mode, target: (mode==="duel"&&duel)?duel.score:null }));
  }

  function setScreen(html){ overlay.innerHTML=html; overlay.classList.remove("hidden"); }
  function home(){ setScreen(UI.screenHome(duel)); }

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
    const a=el.dataset.act; A.fx.tap();
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
  parseURL();
  refreshMute();
  home();
})();
