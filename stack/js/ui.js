/* СТЭК — экраны (HTML), вешает события app.js */
(function(){
  const S = window.STACK_STORE, SK = window.STACK_SKINS, RNG = window.STACK_RNG;
  const esc = (s)=>(""+s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const fmt = S.fmt;

  const NAMES = ["Соня","Кай","Макс","Алиса","Дэн","Ника","Лёва","Рита","Тимур","Ева","Глеб","Маша","Артём","Юля","Стас","Лера","Марк","Аня"];

  function topStats(){
    const st=S.s;
    return `<div class="stats">
      <div class="st"><span>🪙</span> <b>${fmt(st.coins)}</b></div>
      <div class="st"><span>🔥</span> <b>${st.streak||0}</b></div>
      <div class="st"><span>🏆</span> <b>${fmt(st.best)}</b></div>
    </div>`;
  }

  function rewardBtn(){
    const st=S.s; const rf=window.STACK_REWARD||(()=>20);
    if(st.claimedRewardDay===dailyKeyNow()) return "";
    return `<button class="big-btn gold reward" data-act="claim-reward">🎁 Ежедневная награда +${rf(st.streak||1)} 🪙<span class="hint">стрик ${st.streak||0}🔥 · заходи каждый день — награда растёт</span></button>`;
  }
  function questsPanel(){
    const Q=window.STACK_QUESTS, st=S.s;
    if(!Q || !st.quests) return "";
    const rows = st.quests.items.map(it=>{
      const d=Q.defById(it.id); if(!d) return "";
      const ready = it.prog>=d.goal;
      const right = it.claimed ? `<span class="q-done">✓</span>`
        : ready ? `<button class="q-claim" data-claimq="${it.id}">+${d.reward}🪙</button>`
        : `<span class="q-prog">${Math.min(it.prog,d.goal)}/${d.goal}</span>`;
      const pct = Math.min(100, (Math.min(it.prog,d.goal)/d.goal)*100);
      return `<div class="quest ${it.claimed?'cl':''}">
        <div class="q-fill" style="width:${it.claimed?100:pct}%"></div>
        <div class="q-row"><span>${esc(d.text)}</span>${right}</div>
      </div>`;
    }).join("");
    return `<div class="panel"><div class="panel-h">🎯 Задания дня<span class="muted">обновятся завтра</span></div><div class="quests">${rows}</div></div>`;
  }
  function screenHome(duel){
    const st=S.s;
    const duelBanner = duel
      ? `<div class="duel-ban" data-act="play-duel"><b>⚔️ Дуэль</b><br><span>тебя вызвали: побей <b>${duel.score||"рекорд"}</b> на той же башне → играть</span></div>`
      : "";
    return `
      <div class="scr home">
        ${topStats()}
        <div class="logo-wrap">
          <div class="logo">СТЭК</div>
          <div class="slogan">башня в один тап</div>
        </div>
        ${duelBanner}
        ${rewardBtn()}
        <div class="menu">
          <button class="big-btn play" data-act="play-endless">▶ Играть</button>
          <button class="big-btn ghost" data-act="play-daily">📅 Дневной челлендж<span class="hint">сегодня · твой рекорд ${st.dailyKey===dailyKeyNow()?fmt(st.dailyBest):0}</span></button>
        </div>
        ${questsPanel()}
        <div class="menu-row wrap">
          <button class="m-btn" data-act="open-shop">🎨 Магазин</button>
          <button class="m-btn" data-act="open-board">📊 Таблица</button>
          <button class="m-btn" data-act="open-achs">🏅 Цели</button>
          <button class="m-btn" data-act="invite">📨 Позвать</button>
        </div>
        <p class="foot">Один тап — ставишь блок. Точно по центру — комбо и шире башня. Заходи каждый день: награда за стрик и новые задания.</p>
      </div>`;
  }

  function screenAchs(){
    const Q=window.STACK_QUESTS, st=S.s;
    const rows = Q.ACHS.map(a=>{
      const done = (st.achdone||[]).includes(a.id);
      return `<div class="ach ${done?'on':''}">
        <div class="ach-i">${done?'🏅':'🔒'}</div>
        <div class="ach-b"><div class="ach-t">${esc(a.text)}</div><div class="ach-r">+${a.reward} 🪙</div></div>
        <div>${done?'<span class="q-done">✓</span>':''}</div>
      </div>`;
    }).join("");
    const got=(st.achdone||[]).length;
    return `
      <div class="scr">
        <div class="bar"><button class="back" data-act="go-home">←</button><div class="bar-t">Цели (${got}/${Q.ACHS.length})</div><div class="st"><span>🪙</span> <b>${fmt(st.coins)}</b></div></div>
        <div class="achs">${rows}</div>
        <p class="foot">Долгосрочные цели — награда начисляется автоматически при выполнении. Есть к чему возвращаться.</p>
      </div>`;
  }
  function dailyKeyNow(){ const d=new Date(); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }

  function screenOver(o){
    const st=S.s;
    const isBest = o.best;
    return `
      <div class="scr over">
        <div class="over-card">
          ${isBest?'<div class="newbest">🏆 НОВЫЙ РЕКОРД</div>':''}
          <div class="over-score">${o.score}</div>
          <div class="over-sub">${o.mode==="daily"?"дневной челлендж":(o.mode==="duel"?"дуэль":"высота башни")}</div>
          <div class="over-stats">
            <div><b>${fmt(st.best)}</b><span>рекорд</span></div>
            <div><b>+${o.coins}</b><span>🪙 монет</span></div>
            <div><b>${o.maxCombo}</b><span>макс комбо</span></div>
          </div>
          ${o.mode==="duel"&&o.target!=null?`<div class="duel-res ${o.score>o.target?'win':'lose'}">${o.score>o.target?`🎉 ты побил(а) ${o.target}!`:`до цели не хватило: ${o.target}`}</div>`:''}
          <button class="big-btn play" data-act="retry">↺ Ещё раз</button>
          <button class="big-btn gold" data-act="share">⇪ Бросить вызов другу</button>
          <div class="menu-row">
            <button class="m-btn" data-act="open-shop">🎨 Магазин</button>
            <button class="m-btn" data-act="go-home">🏠 Домой</button>
          </div>
        </div>
      </div>`;
  }

  function screenShop(){
    const st=S.s;
    const cards = SK.SKINS.map(sk=>{
      const owned = st.owned.includes(sk.id);
      const eq = st.equipped===sk.id;
      // мини-превью башни
      let prev=""; for(let i=0;i<7;i++){ const w=46-Math.abs(3-i)*5; prev+=`<span class="pv" style="width:${w}px;background:${SK.colorFor(sk,i)}"></span>`; }
      const btn = eq ? `<span class="owned eq">✓ надет</span>`
        : owned ? `<button class="m-btn" data-equip="${sk.id}">Надеть</button>`
        : `<button class="m-btn buy ${st.coins>=sk.cost?'':'no'}" data-buy="${sk.id}">🪙 ${sk.cost}</button>`;
      return `<div class="shop-card ${eq?'on':''}">
        <div class="pv-tower">${prev}</div>
        <div class="sk-name">${esc(sk.name)}</div>
        ${btn}
      </div>`;
    }).join("");
    return `
      <div class="scr">
        <div class="bar"><button class="back" data-act="go-home">←</button><div class="bar-t">Магазин скинов</div><div class="st"><span>🪙</span> <b>${fmt(st.coins)}</b></div></div>
        <div class="shop-grid">${cards}</div>
        <p class="foot">Скины меняют только вид башни — никакого преимущества. Монеты капают за высоту и перфекты.</p>
      </div>`;
  }

  function genBoard(seed, myScore){
    const rng = RNG.mulberry32((seed>>>0) ^ 0x9e37);
    const list=[];
    const pool=NAMES.slice();
    for(let i=0;i<12;i++){
      const n = pool.splice(Math.floor(rng()*pool.length),1)[0] || ("Игрок"+i);
      const sc = Math.max(3, Math.round((myScore||20)*(0.6+rng()*1.7)));
      list.push({n, sc, me:false});
    }
    list.push({n: S.s.name||"Ты", sc: myScore||0, me:true});
    list.sort((a,b)=>b.sc-a.sc);
    return list;
  }
  function screenBoard(){
    const st=S.s;
    const rows = genBoard(RNG.todaySeed().seed, st.dailyKey===dailyKeyNow()?st.dailyBest:0)
      .map((r,i)=>`<div class="brow ${r.me?'me':''}"><span class="rk">${i+1}</span><span class="bn">${esc(r.n)} ${r.me?'<b>· ты</b>':''}</span><span class="bs">${fmt(r.sc)}</span></div>`).join("");
    return `
      <div class="scr">
        <div class="bar"><button class="back" data-act="go-home">←</button><div class="bar-t">Таблица · сегодня</div><div></div></div>
        <p class="muted center" style="margin:6px 20px">Один сид на день у всех. ${st.dailyKey===dailyKeyNow()?"":"Сыграй дневной челлендж, чтобы попасть в список."}</p>
        <div class="board">${rows}</div>
        <p class="foot">Каждый день — новая башня и новый рейтинг. Возвращайся за местом в топе.</p>
      </div>`;
  }

  let toastT;
  function toast(html){ const el=document.getElementById("toast"); el.innerHTML=html; el.classList.add("show"); clearTimeout(toastT); toastT=setTimeout(()=>el.classList.remove("show"),2600); }

  window.STACK_UI = { screenHome, screenOver, screenShop, screenBoard, screenAchs, toast, dailyKeyNow };
})();
