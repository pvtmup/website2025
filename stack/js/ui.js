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
    const c = window.STACK_SEASON ? window.STACK_SEASON.current() : {hue:250};
    const homeBg = ` style="background:radial-gradient(120% 65% at 50% 0%, hsl(${c.hue} 45% 15%), rgba(11,11,22,.96) 70%)"`;
    const duelBanner = duel
      ? `<div class="duel-ban" data-act="play-duel"><b>⚔️ Дуэль</b><br><span>тебя вызвали: побей <b>${duel.score||"рекорд"}</b> на той же башне → играть</span></div>`
      : "";
    return `
      <div class="scr home"${homeBg}>
        ${topStats()}
        <div class="logo-wrap">
          <div class="logo">СТЭК</div>
          <div class="slogan">башня в один тап</div>
        </div>
        ${duelBanner}
        ${rewardBtn()}
        ${seasonBanner()}
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

  function screenHow(){
    return `
      <div class="scr how-scr">
        <div></div>
        <div class="how-mid">
          <div class="logo" style="font-size:64px">СТЭК</div>
          <div class="how-list">
            <div class="how-i"><span>👆</span><div><b>Тап по экрану</b> — ставит движущийся блок на башню.</div></div>
            <div class="how-i"><span>🎯</span><div><b>Точно по центру</b> — комбо растёт, башня даже шире.</div></div>
            <div class="how-i"><span>✂️</span><div><b>Промах</b> режет край. Промахнулся мимо — конец.</div></div>
            <div class="how-i"><span>✨</span><div><b>Золотой блок</b> по центру — бонусные монеты.</div></div>
          </div>
        </div>
        <button class="big-btn play" data-act="how-ok">Поехали →</button>
      </div>`;
  }
  function seasonBanner(){
    const SE=window.STACK_SEASON, st=S.s; if(!SE) return "";
    const c=SE.current(); SE.ensure(st);
    const tier=SE.tierIndex(st.season.xp);
    const next=SE.TRACK[tier];
    const prevXp = tier>0?SE.TRACK[tier-1].xp:0;
    const hiXp = next?next.xp:SE.TRACK[SE.TRACK.length-1].xp;
    const pct = next? Math.min(100,((st.season.xp-prevXp)/(hiXp-prevXp))*100) : 100;
    // есть ли что забрать
    const claimable = SE.TRACK.some((t,i)=> st.season.xp>=t.xp && (!st.season.free.includes(i) || (st.season.owner && !st.season.prem.includes(i))));
    return `<div class="season-ban" data-act="open-season">
      <div class="spread"><div class="sb-name">${c.emoji} ${esc(c.name)} ${st.season.owner?'<span class="sb-pass">PASS</span>':''}</div><span class="sb-timer">⏳ ${c.daysLeft} дн.</span></div>
      <div class="sb-bar"><div class="sb-fill" style="width:${pct}%"></div></div>
      <div class="sb-sub">Уровень ${tier}/10 · ${st.season.xp} XP ${claimable?'· <b>есть награды →</b>':'· открыть'}</div>
    </div>`;
  }
  function rewLabel(r){ return r.skin ? ("скин "+SK.byId(r.skin).name) : ("+"+r.coins+"🪙"); }
  function screenSeason(){
    const SE=window.STACK_SEASON, st=S.s; const c=SE.current(); SE.ensure(st);
    const tier=SE.tierIndex(st.season.xp);
    const rows = SE.TRACK.map((t,i)=>{
      const reached = st.season.xp>=t.xp;
      const fClaimed = st.season.free.includes(i), pClaimed = st.season.prem.includes(i);
      const free = fClaimed?`<span class="q-done">✓</span>` : reached?`<button class="trk-btn free" data-claimfree="${i}">${rewLabel(t.free)}</button>` : `<span class="trk-lock">${rewLabel(t.free)}</span>`;
      const prem = pClaimed?`<span class="q-done">✓</span>` : (st.season.owner ? (reached?`<button class="trk-btn prem" data-claimprem="${i}">${rewLabel(t.prem)}</button>`:`<span class="trk-lock">${rewLabel(t.prem)}</span>`) : `<span class="trk-lock">🔒 ${rewLabel(t.prem)}</span>`);
      return `<div class="trk ${reached?'on':''}">
        <div class="trk-lvl">${i+1}<span>${t.xp}xp</span></div>
        <div class="trk-col"><div class="trk-cap">free</div>${free}</div>
        <div class="trk-col"><div class="trk-cap gold">pass</div>${prem}</div>
      </div>`;
    }).join("");
    const passBox = st.season.owner
      ? `<div class="pass-on">🎟️ Премиум-пасс активен в этом сезоне</div>`
      : `<button class="big-btn gold" data-act="buy-pass">🎟️ Активировать пасс — ${SE.PASS_COST} 🪙<span class="hint">открывает все премиум-награды сезона + эксклюзивные скины</span></button>`;
    return `
      <div class="scr">
        <div class="bar"><button class="back" data-act="go-home">←</button><div class="bar-t">${c.emoji} ${esc(c.name)}</div><div class="st"><span>🪙</span> <b>${fmt(st.coins)}</b></div></div>
        <p class="muted center" style="margin:2px 20px 10px">осталось ${c.daysLeft} дн. · уровень ${tier}/10 · ${st.season.xp} XP · играй, чтобы прокачивать</p>
        ${passBox}
        <div style="height:12px"></div>
        <div class="track">${rows}</div>
        <p class="foot">XP капает за каждый забег (выше башня и больше перфектов — больше XP). Сезон сменится через ${c.daysLeft} дн.</p>
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
          <button class="big-btn gold" data-act="share">⇪ Бросить вызов другу${S.s.firstShareDone?'':'<span class="hint">+200 🪙 за первый вызов</span>'}</button>
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

  window.STACK_UI = { screenHome, screenOver, screenShop, screenBoard, screenAchs, screenSeason, screenHow, toast, dailyKeyNow };
})();
