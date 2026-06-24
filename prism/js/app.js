/* PRISM — оболочка: home → игра → итог, рекорд, фолбэк при отсутствии WebGL */
(function(){
  const G=window.PRISM_GAME, A=window.PRISM_AUDIO, T=window.PRISM_TEX;
  const TG=(window.Telegram&&window.Telegram.WebApp)?window.Telegram.WebApp:null;
  const host=document.getElementById("stage");
  const overlay=document.getElementById("overlay"), hud=document.getElementById("hud");
  const mute=document.getElementById("mute");
  const best=()=>+(localStorage.getItem("prism.best")||0);
  const setBest=v=>localStorage.setItem("prism.best",v);
  let game=null, lastCombo=0, booting=false;

  function hudScore(s,ch){ hud.querySelector(".s").textContent=s; const c=hud.querySelector(".c");
    if(ch>1){ c.textContent="x"+ch; c.style.opacity=1; c.classList.remove("pop"); void c.offsetWidth; c.classList.add("pop"); lastCombo=Math.max(lastCombo,ch);} else c.style.opacity=0; }
  function hudMoves(m){ hud.querySelector(".m").textContent="ходов: "+m; }

  async function ensure(){
    if(game) return game;
    game=await G.create({host,callbacks:{score:hudScore,moves:hudMoves,onOver}});
    return game;
  }
  async function play(){
    if(booting) return; booting=true;
    try{ await ensure(); }
    catch(e){ booting=false; return fallback(); }
    booting=false; lastCombo=0; overlay.classList.add("hidden"); hud.classList.remove("hidden"); game.start();
  }
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
    const n=(T&&T.count)||5;
    const crew=Array.from({length:n},(_,i)=>`<img src="${G.icon(i,96)}" style="--i:${i}" alt="">`).join("");
    overlay.innerHTML=`<div class="scr home">
      <div class="floaters" aria-hidden="true">${crew}</div>
      <div class="hero">
        <div class="logo">PRISM</div>
        <div class="slogan">kinetic refraction</div>
        <div class="crew">${crew}</div>
      </div>
      <div class="hint">Меняй местами соседние кристаллы, собирай <b>3+ в ряд</b>.<br>4+ — взрыв и бонус. Лови каскады за 20 ходов!</div>
      <div class="cta">
        <button class="btn play" data-a="play">▶ Играть</button>
        <div class="bestrow">🏆 рекорд: <b>${best()}</b></div>
      </div>
    </div>`;
    overlay.classList.remove("hidden");
  }
  function fallback(){
    overlay.innerHTML=`<div class="scr"><div class="card">
      <div class="nb">⚠ WebGL недоступен</div>
      <div class="hint">Твоё устройство/браузер не дал запустить графику.<br>
      Открой в Telegram или Chrome/Safari, либо сыграй в облегчённую версию.</div>
      <a class="btn play" href="../match/?v=3">▶ Лёгкая версия</a>
      <button class="btn ghost" data-a="home">🏠 Меню</button>
    </div></div>`;
    overlay.classList.remove("hidden");
  }
  function count(el,to){ if(!el)return; const t0=performance.now();
    (function tick(){ const k=Math.min(1,(performance.now()-t0)/600); el.textContent=Math.round(to*(1-Math.pow(1-k,3))); if(k<1)requestAnimationFrame(tick); })(); }

  document.addEventListener("click",e=>{ const b=e.target.closest("[data-a]"); if(!b)return;
    if(TG&&TG.HapticFeedback){try{TG.HapticFeedback.impactOccurred("light");}catch(e){}}
    if(b.dataset.a==="play")play(); else if(b.dataset.a==="home")home(); });
  mute.addEventListener("click",()=>{ A.setOn(!A.isOn()); mute.textContent=A.isOn()?"🔊":"🔇"; });

  if(TG){ try{ TG.ready(); TG.expand(); TG.setHeaderColor&&TG.setHeaderColor("#05060f"); }catch(e){} }
  mute.textContent=A.isOn()?"🔊":"🔇";
  // нет PIXI вовсе — сразу мягкий фолбэк на меню (играть → лёгкая версия)
  if(!window.PIXI){ home(); /* play() сам уйдёт в fallback */ }
  else home();
})();
