/* МЭТЧ — оболочка (home/игра/over), счёт, рекорд */
(function(){
  const G=window.MATCH_GAME, A=window.MATCH_AUDIO;
  const TG=(window.Telegram&&window.Telegram.WebApp)?window.Telegram.WebApp:null;
  const overlay=document.getElementById("overlay"), hud=document.getElementById("hud");
  const canvas=document.getElementById("game"), wrap=document.getElementById("wrap"), mute=document.getElementById("mute");
  const best=()=>+(localStorage.getItem("match.best")||0);
  const setBest=v=>localStorage.setItem("match.best",v);
  let game=null, lastCombo=0;

  function hudScore(s,ch){ hud.querySelector(".s").textContent=s; const c=hud.querySelector(".c");
    if(ch>1){ c.textContent="x"+ch; c.style.opacity=1; c.classList.remove("pop"); void c.offsetWidth; c.classList.add("pop"); lastCombo=Math.max(lastCombo,ch);} else c.style.opacity=0; }
  function hudMoves(m){ hud.querySelector(".m").textContent="ходов: "+m; }

  function ensure(){ if(!game) game=G.create({canvas,callbacks:{score:hudScore,moves:hudMoves,onOver}}); }
  function play(){ ensure(); lastCombo=0; overlay.classList.add("hidden"); hud.classList.remove("hidden"); game.start(); }
  function onOver(score){
    hud.classList.add("hidden");
    const b=best(), nb=score>b; if(nb) setBest(score);
    if(TG&&TG.HapticFeedback){ try{TG.HapticFeedback.notificationOccurred(nb?"success":"warning");}catch(e){} }
    overlay.innerHTML=`<div class="scr">
      <div class="card">
        ${nb?'<div class="nb">🏆 НОВЫЙ РЕКОРД</div>':''}
        <div class="big" id="cnt">0</div>
        <div class="sub">очки · макс комбо x${lastCombo}</div>
        <div class="stat">рекорд: <b>${nb?score:b}</b></div>
        <button class="btn play" data-a="play">↺ Ещё раз</button>
        <button class="btn ghost" data-a="home">🏠 Меню</button>
      </div></div>`;
    overlay.classList.remove("hidden"); count(document.getElementById("cnt"),score);
  }
  function home(){
    overlay.innerHTML=`<div class="scr home">
      <div class="logo">МЭТЧ</div><div class="slogan">три в ряд · 20 ходов</div>
      <div class="hint">Меняй местами соседние камни, собирай 3+ в ряд. 4 — взрыв линии, 5 — очистка цвета. Лови каскады!</div>
      <button class="btn play" data-a="play">▶ Играть</button>
      <div class="bestrow">🏆 рекорд: <b>${best()}</b></div>
    </div>`;
    overlay.classList.remove("hidden");
  }
  function count(el,to){ if(!el)return; const t0=performance.now();
    (function tick(){ const k=Math.min(1,(performance.now()-t0)/600); el.textContent=Math.round(to*(1-Math.pow(1-k,3))); if(k<1)requestAnimationFrame(tick); })(); }

  document.addEventListener("click",e=>{ const b=e.target.closest("[data-a]"); if(!b)return;
    if(TG&&TG.HapticFeedback){try{TG.HapticFeedback.impactOccurred("light");}catch(e){}}
    if(b.dataset.a==="play")play(); else if(b.dataset.a==="home")home(); });
  mute.addEventListener("click",()=>{ A.setOn(!A.isOn()); mute.textContent=A.isOn()?"🔊":"🔇"; });

  if(TG){ try{ TG.ready(); TG.expand(); TG.setHeaderColor&&TG.setHeaderColor("#0b0b16"); }catch(e){} }
  mute.textContent=A.isOn()?"🔊":"🔇";
  home();
})();
