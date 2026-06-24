/* ============================================================
   LORE — UI / экраны (возвращают HTML; события вешает app.js) — RU
   ============================================================ */
(function(){
  const D = window.LORE_DATA;
  const E = window.LORE_ENGINE;
  const S = window.LORE_STORE;
  const esc = (s)=>(""+s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const fmt = S.fmt;

  function avatarStyle(name){
    let h=0; for(const ch of (name||"?")) h=(h*31+ch.charCodeAt(0))%360;
    return `background:linear-gradient(135deg,hsl(${h} 80% 62%),hsl(${(h+50)%360} 80% 55%))`;
  }
  const initial = (n)=> (n||"?").trim()[0]?.toUpperCase() || "?";

  /* ---------------- ИНТРО / ТРЕЙЛЕР ---------------- */
  function viewIntro(){
    return `
    <section class="view intro">
      <div class="brand">L O R E</div>
      <div class="trailer">
        <div class="line l1 kicker">Оригинал LORE</div>
        <div class="line l2">
          <div class="tagline">В мире, который тебя не замечал…</div>
          <div class="bigname">ТЫ —<br>ГЛАВНЫЙ<br>ГЕРОЙ</div>
        </div>
        <div class="line l3 tagline">ИИ-режиссёр пишет сериал про тебя.<br>Твои друзья — актёры.<br>Фанаты решают, кто станет легендой.</div>
      </div>
      <div>
        <div class="how">
          <div class="how-row"><span class="how-i">🎬</span><span><b>ИИ пишет драму про тебя</b> — каждый эпизод обрывается на клиффхэнгере</span></div>
          <div class="how-row"><span class="how-i">🤝</span><span><b>Зови друзей в каст</b> — союзник, враг, любовь или тайна</span></div>
          <div class="how-row"><span class="how-i">🚀</span><span><b>Набирай фанатов и статус</b> — от «Никто» до «КАНОН»</span></div>
        </div>
        <button class="btn gold" data-act="start">Запустить свой сериал →</button>
        <p class="foot">Каждый — главный герой. Легендой станут не все.</p>
      </div>
    </section>`;
  }

  /* ---------------- ОНБОРДИНГ ---------------- */
  function viewOnboardName(){
    return `
    <section class="view" style="padding-top:60px">
      <div class="pad">
        <div class="kicker">Кастинг · 1 / 3</div>
        <h1 class="title-l" style="margin:10px 0 6px">Как зовут<br>твоего персонажа?</h1>
        <p class="muted" style="font-size:14px">Это имя будет скандировать весь мир.</p>
        <label class="lab" style="display:block;margin-top:22px">Сценическое имя</label>
        <input id="nameInput" class="field" maxlength="18" placeholder="напр. Ариэль, Ко, Блейз…" autocomplete="off" />
        <label class="lab" style="display:block;margin-top:18px">Кем ты втайне хочешь быть? (необязательно)</label>
        <input id="vibeInput" class="field" maxlength="60" placeholder="тот, кого все недооценивают…" autocomplete="off" />
        <div style="height:24px"></div>
        <button class="btn" data-act="name-next">Дальше →</button>
      </div>
    </section>`;
  }

  function viewOnboardArchetype(){
    const cards = D.archetypes.map(a=>`
      <button class="pick" data-pick="arch" data-id="${a.id}">
        <div class="emoji">${a.emoji}</div>
        <div class="pname">${a.name}</div>
        <div class="pdesc">${a.desc}</div>
      </button>`).join("");
    return `
    <section class="view" style="padding-top:60px">
      <div class="pad">
        <div class="kicker">Кастинг · 2 / 3</div>
        <h1 class="title-l" style="margin:10px 0 6px">Выбери свой<br>архетип</h1>
        <p class="muted" style="font-size:14px">Вокруг него режиссёр строит весь сюжет.</p>
      </div>
      <div class="pad grid2" style="margin-top:18px">${cards}</div>
      <div class="pad" style="margin-top:18px">
        <button class="btn" data-act="arch-next" disabled id="archNext">Выбери архетип</button>
      </div>
    </section>`;
  }

  function viewOnboardWorld(){
    const cards = D.worlds.map(w=>`
      <button class="pick" data-pick="world" data-id="${w.id}">
        <div class="emoji">${w.emoji}</div>
        <div class="pname">${w.name}</div>
        <div class="pdesc">${w.desc}</div>
      </button>`).join("");
    return `
    <section class="view" style="padding-top:60px">
      <div class="pad">
        <div class="kicker">Кастинг · 3 / 3</div>
        <h1 class="title-l" style="margin:10px 0 6px">Выбери свой<br>мир</h1>
        <p class="muted" style="font-size:14px">Где развернётся твой сезон.</p>
      </div>
      <div class="pad grid2" style="margin-top:18px">${cards}</div>
      <div class="pad" style="margin-top:18px">
        <button class="btn gold" data-act="world-next" disabled id="worldNext">Выбери мир</button>
      </div>
    </section>`;
  }

  function viewOnboardCast(draftCast){
    draftCast = draftCast || [];
    const picked = new Set(draftCast.map(c=>c.name));
    const chips = D.seedNames.slice(0,8).map(n=>`
      <button class="castchip ${picked.has(n)?'on':''}" data-castadd="${esc(n)}">${esc(n)}</button>`).join("");
    const list = draftCast.length ? `<div class="castlist">`+draftCast.map((c,i)=>`
      <span class="castitem">${esc(c.name)} <b data-castremove="${i}">✕</b></span>`).join("")+`</div>` : "";
    return `
    <section class="view" style="padding-top:60px">
      <div class="pad">
        <div class="kicker">Кастинг · финал</div>
        <h1 class="title-l" style="margin:10px 0 6px">Кто в твоём<br>касте?</h1>
        <p class="muted" style="font-size:14px">Вся соль LORE — драма с реальными людьми. Добавь друзей (можно пока вымышленных — реальных позовёшь в один тап позже).</p>
        <label class="lab" style="display:block;margin-top:20px">Быстрый выбор</label>
        <div class="castchips">${chips}</div>
        <label class="lab" style="display:block;margin-top:16px">Или впиши своё имя / @ник</label>
        <div class="row" style="gap:8px;margin-top:8px">
          <input id="castInput" class="field" style="margin-top:0" maxlength="18" placeholder="напр. Саша, Кристина…" autocomplete="off"/>
          <button class="btn sm ghost" data-act="onb-add-costar" style="white-space:nowrap">Добавить</button>
        </div>
        ${list}
        <div style="height:22px"></div>
        <button class="btn gold" data-act="cast-done">${draftCast.length?`Снять пилот с кастом (${draftCast.length}) →`:"Снять пилот →"}</button>
        <p class="foot">Без каста мы добавим пару персонажей-стендинов, чтобы пилот был с драмой. Заменишь их на реальных друзей позже.</p>
      </div>
    </section>`;
  }

  function viewGenerating(name){
    return `
    <section class="view intro" style="justify-content:center;text-align:center;gap:0">
      <div></div>
      <div class="trailer" style="flex:none">
        <div class="kicker">ИИ-шоураннер пишет</div>
        <div class="bigname" style="font-size:54px;margin:14px 0">${esc(name||"ТВОЙ")}<br>ПИЛОТ</div>
        <div class="loader-dots muted" id="genLine">подбираем твой мир…</div>
      </div>
      <div></div>
    </section>`;
  }

  /* ---------------- общий каркас ---------------- */
  function topbar(){
    const st = S.state;
    const tier = E.tierForFans(st.fans);
    return `
      <div class="topbar">
        <div class="logo">LORE</div>
        <div class="tier"><span class="dot"></span>${esc(tier.name)}</div>
      </div>`;
  }
  function fansMeter(){
    const st = S.state;
    const tier = E.tierForFans(st.fans);
    const nxt = E.nextTier(st.fans);
    const lo = tier.req, hi = nxt? nxt.req : tier.req;
    const pct = nxt ? Math.min(100, ((st.fans-lo)/(hi-lo))*100) : 100;
    return `
      <div class="meter">
        <div class="bar"><div class="fill" id="fansFill" style="width:${pct}%"></div></div>
        <div class="labels">
          <span><b style="color:var(--ink)" class="mono" id="fansNum">${fmt(st.fans)}</b> фанатов</span>
          <span>${nxt? `${fmt(hi-st.fans)} до «${esc(nxt.name)}»` : "МАКС · КАНОН"}</span>
        </div>
      </div>`;
  }

  /* ---------------- ГЛАВНАЯ / СЕРИАЛ ---------------- */
  function fanBlock(ep){
    if(!ep.comments || !ep.comments.length) return "";
    const rows = ep.comments.map(c=>`
      <div class="fc">
        <div class="fc-av" style="${avatarStyle(c.name)}">${initial(c.name.replace("@",""))}</div>
        <div class="fc-body"><span class="fc-name">${esc(c.name)}</span> ${esc(c.txt)}
          <div class="fc-likes">❤ ${fmt(c.likes)}</div></div>
      </div>`).join("");
    return `<div class="fans-wrap"><div class="kicker" style="color:var(--accent-2);margin-bottom:8px">Реакции фанатов</div>${rows}</div>`;
  }

  function episodeCard(ep, played){
    const scenes = ep.scenes.map(s=>`<p class="scene ${s.cls}">${s.t}</p>`).join("");
    const bg = ep.art || ep.grad;
    let interaction;
    if(played){
      interaction = `
        <div class="ep-stats">
          <span>👁 <b class="mono">${fmt(ep.views)}</b></span>
          <span>❤️ <b class="mono">${fmt(ep.likes)}</b></span>
          <span>📈 <b class="mono">+${fmt(ep.newFans||0)}</b></span>
          ${ep.isRetcon?'':`<button class="retcon-btn" data-retcon="${ep.num}">↺ Реткон</button>`}
          <button class="share-btn" data-share="${ep.num}">⇪ Клип</button>
        </div>
        ${fanBlock(ep)}`;
    } else {
      const choices = ep.choices.map((c,i)=>`
        <button class="choice" data-choice="${i}">
          <span class="ck">${c.k}</span><span>${c.t}</span><span class="ch-tag">${c.tag}</span>
        </button>`).join("");
      interaction = `
        <div class="cliff"><b>КЛИФФХЭНГЕР —</b> ${ep.cliff}</div>
        <div class="kicker" style="margin:16px 0 2px;color:var(--gold)">Твой выбор решает, что будет дальше</div>
        <div class="choices">${choices}</div>`;
    }
    return `
      <article class="ep ${ep.isFinale?'finale':''} ${ep.isRetcon?'retcon':''}" id="ep-${ep.num}">
        <div class="ep-poster" style="background:${bg}">
          ${ep.isFinale?'<span class="finale-tag">ФИНАЛ СЕЗОНА</span>':''}
          ${ep.isRetcon?'<span class="retcon-tag">↺ РЕТКОН</span>':''}
          ${ep.isDuel?`<span class="duel-tag ${ep.won?'won':'lost'}">⚔️ ДУЭЛЬ · ${ep.won?'ПОБЕДА':'ПОРАЖЕНИЕ'}</span>`:''}
          ${ep.isCrossover?'<span class="crossover-tag">🌀 КРОССОВЕР</span>':''}
          ${ep.isGuest?`<span class="guest-tag">🎬 ГОСТЬ · ${esc(ep.host||"")}</span>`:''}
          ${ep._ai?'<span class="ai-tag">✨ ЖИВОЙ ИИ</span>':''}
          <span class="ep-badge">${esc(ep.badge)} · ${esc(ep.world)}</span>
          <h2 class="ep-title">${esc(ep.title)}</h2>
          <div class="ep-sub">Режиссёр: ИИ-шоураннер LORE${ep.coName? " · при участии "+esc(ep.coName):""}</div>
        </div>
        <div class="ep-body">
          ${scenes}
          ${interaction}
        </div>
      </article>`;
  }

  function viewHome(){
    const st = S.state;
    const active = st.activeEp;
    const history = (st.episodes||[]).slice().reverse();
    let body = "";
    if(active){
      body += episodeCard(active, false);
    } else {
      body += `<div class="pad">
        <button class="btn gold" data-act="next-ep">▶ Снять следующий эпизод</button>
        <div style="height:10px"></div>
        <button class="btn ghost" data-act="crossover">🌀 Проклятый кроссовер — столкни два мира</button>
      </div>`;
    }
    if(history.length){
      body += `<h2 class="sec">Ранее в твоём сериале</h2>`;
      body += history.map(ep=>episodeCard(ep, true)).join("");
    }
    const onlyDemo = st.cast.length && st.cast.every(c=>c.demo);
    const nudge = onlyDemo
      ? `<div class="nudge" data-act="go-cast"><span>📨</span><div><b>Позови реального друга в каст</b><br><span class="muted">Драма с настоящим человеком бьёт совсем иначе →</span></div></div>`
      : "";
    return `
      <div class="view">
        ${topbar()}
        ${fansMeter()}
        <div style="height:14px"></div>
        ${dropBanner()}
        ${nudge}
        ${body}
        <p class="foot">Мир продолжает жить, пока тебя нет. Возвращайся — узнаешь, что изменилось.</p>
      </div>`;
  }

  /* ---------------- ТРЕНДЫ ---------------- */
  function viewFeed(){
    const items = E.buildFeed(S.state).map(it=>`
      <div class="clip" style="background:${it.art||it.grad}" ${it.mine?'data-act="go-home"':''}>
        ${it.mine?'<span class="mine">ТВОЙ КЛИП</span>':''}
        <div class="who">${esc(it.who)}</div>
        <div class="ct">${esc(it.title)}</div>
        <div class="metrics"><span>👁 ${fmt(it.views)}</span><span>❤️ ${fmt(it.likes)}</span><span>🔁 ${fmt(it.likes/3)}</span></div>
      </div>`).join("");
    return `
      <div class="view">
        ${topbar()}
        <h2 class="sec">В тренде по всем мирам</h2>
        ${items}
        <p class="foot">Клипы сохраняются в галерею. Выложи — приведёшь новых фанатов.</p>
      </div>`;
  }

  /* ---------------- КАСТ ---------------- */
  function relPill(rel){
    const r = D.relationships[rel] || D.relationships.ally;
    return `<span class="rel-pill" style="color:${r.color};border-color:${r.color}55">${r.label}</span>`;
  }
  function viewCast(){
    const st = S.state;
    const list = st.cast.length ? st.cast.map(c=>{
      const pending = c.status==="pending";
      const actions = pending
        ? `<div class="costar-actions">
             <button class="mini gold" data-act="share-invite" data-id="${c.id}">📨 Отправить инвайт</button>
             <button class="mini" data-act="accept-costar" data-id="${c.id}">Принять (демо)</button>
           </div>`
        : `<div class="costar-actions">
             ${c.demo?`<button class="mini gold" data-act="share-invite" data-id="${c.id}">📨 Позвать по-настоящему</button>`:''}
             <button class="mini danger" data-duel="${c.id}">⚔️ Канон-дуэль</button>
           </div>`;
      const tag = pending
        ? '<span class="rel-pill" style="color:var(--faint);border-color:var(--line)">ждёт</span>'
        : (c.demo?'<span class="rel-pill" style="color:var(--faint);border-color:var(--line)">демо</span> '+relPill(c.rel):relPill(c.rel));
      return `
      <div class="costar ${pending?'pending':''}">
        <div class="av" style="${avatarStyle(c.name)}">${initial(c.name)}</div>
        <div style="flex:1;min-width:0">
          <div class="cn">${esc(c.name)} ${tag}</div>
          <div class="rel ${c.rel}" style="font-size:11px">${pending?'Инвайт отправлен — ждём, пока примут роль':(c.demo?'персонаж-стендин · позови реального друга':(D.relationships[c.rel]?.verb||""))}</div>
          ${actions}
        </div>
      </div>`;
    }).join("") : `<p class="muted pad" style="font-size:14px">Пока нет со-актёров. Соло-шоу далеко не уедет — лучшая драма нужна с реальными людьми.</p>`;

    const relbtns = Object.entries(D.relationships).map(([k,v],i)=>`
      <button class="relbtn ${i===0?'on':''}" data-rel="${k}">${v.label}</button>`).join("");

    return `
      <div class="view">
        ${topbar()}
        <h2 class="sec">Твой каст (${st.cast.length})</h2>
        ${list}
        <div class="card" style="margin-top:8px">
          <div class="kicker" style="color:var(--gold)">Добавить со-актёра</div>
          <p class="muted" style="font-size:13px;margin:8px 0 0">Пригласи друга по имени. Режиссёр впишет его в твой сюжет. Драма с реальными людьми бьёт совсем иначе.</p>
          <input id="costarName" class="field" maxlength="18" placeholder="Имя друга или @ник" autocomplete="off"/>
          <div class="relrow" id="relRow">${relbtns}</div>
          <div style="height:14px"></div>
          <button class="btn" data-act="add-costar">+ Пригласить в каст</button>
        </div>
        <p class="foot">В полной версии это отправит реальный инвайт — друг сам подтвердит своего персонажа. Двойное согласие, без дипфейков.</p>
      </div>`;
  }

  /* ---------------- DISCOVER ---------------- */
  function viewDiscover(list){
    list = list || [];
    const cards = list.map((c,i)=>`
      <div class="disc">
        <div class="disc-art" style="background:${c.art}">
          <span class="disc-fans">${fmt(c.fans)} фанатов</span>
        </div>
        <div class="disc-body">
          <div class="disc-handle">${esc(c.handle)}</div>
          <div class="disc-meta">${esc(c.archName)} · ${esc(c.worldName)} · С${c.season}</div>
          <div class="disc-tag muted">${esc(c.handle)}${esc(c.tag)}</div>
          <button class="btn sm gold disc-guest" data-guest="${i}">🎬 Стать гостем</button>
        </div>
      </div>`).join("");
    return `
      <div class="view">
        ${topbar()}
        <div class="pad">
          <div class="kicker" style="color:var(--accent-2)">Discover</div>
          <h1 class="title-l" style="margin:8px 0 4px">Чужие<br>истории</h1>
          <p class="muted" style="font-size:14px">Появись гостем в сериале другого создателя. Ты приводишь своих фанатов, он — своих, и оба взлетают.</p>
        </div>
        <div class="disc-grid">${cards}</div>
        <p class="foot">Каждое гостевое появление — кроссовер аудиторий. Так миры соединяются.</p>
      </div>`;
  }

  /* ---------------- РЕЖИССЁРКА ---------------- */
  function viewRoom(){
    const st = S.state;
    const wt = E.writersToday(st);
    const voted = st.writersDay===wt.day;
    const myIdx = st.writersChoice;
    const total = wt.options.reduce((s,o)=>s+o.votes,0) + (voted?1:0);

    const opts = wt.options.map((o,i)=>{
      if(voted){
        const votes = o.votes + (myIdx===i?1:0);
        const pct = Math.round(votes/total*100);
        const mine = myIdx===i;
        return `<div class="poll ${mine?'mine':''}">
          <div class="poll-fill" style="width:${pct}%"></div>
          <div class="poll-row"><span>${esc(o.t)} ${mine?'<b>· твой голос</b>':''}</span><span class="mono">${pct}%</span></div>
        </div>`;
      }
      return `<button class="poll vote" data-vote="${i}"><div class="poll-row"><span>${esc(o.t)}</span><span>›</span></div></button>`;
    }).join("");

    const friends = st.cast.slice(0,3).map(c=>c.name).join(", ");
    const weight = Math.min(5, st.streak||1);
    return `
      <div class="view">
        ${topbar()}
        <div class="pad">
          <div class="spread"><div class="kicker" style="color:var(--gold)">Режиссёрка · сегодня</div>
            <span class="weight-chip">🔥 голос ×${weight}</span></div>
          <h1 class="title-l" style="margin:8px 0 4px">Реши, что<br>будет дальше</h1>
          <p class="muted" style="font-size:14px">${esc(wt.setup)}</p>
          <p class="faint" style="font-size:12px;margin-top:6px">Ежедневный стрик усиливает твой голос до <b style="color:var(--gold)">${weight}×</b>. Заходи каждый день, чтобы перевесить зал.</p>
        </div>
        <div class="polls">${opts}</div>
        <div class="pad">
          ${voted
            ? `<div class="card center" style="margin:6px 0 0"><b style="color:var(--accent-2)">Голос засчитан 🔒</b><br><span class="muted" style="font-size:13px">Режиссёр впишет победителя в следующий сезон всем. Возвращайся завтра за новым голосованием.</span></div>`
            : `<p class="muted" style="font-size:13px">${friends?`${esc(friends)} и `:""}${E.rint(2,40)}к создателей голосуют прямо сейчас. Успей, пока зал не закрылся.</p>`}
        </div>

        ${sabotageBlock()}

        <p class="foot">Ежедневный коллективный сторителлинг. Толпа пишет канон — вместе.</p>
      </div>`;
  }

  function sabotageBlock(){
    const st = S.state;
    const today = new Date().toDateString();
    const done = st.sabotageDay===today;
    if(done){
      return `
        <h2 class="sec">🕵️ Анонимный твист · вброшен</h2>
        <div class="card sabotage-done" style="margin-top:0">
          <div class="muted" style="font-size:12px;margin-bottom:6px">Кто-то подбросил это в сегодняшний канон. Никто не знает кто.</div>
          <div style="font-weight:700;font-size:15px">«${esc(st.pendingTwist||"…")}»</div>
          <div class="faint" style="font-size:11px;margin-top:8px">(это был ты 🤫) — прилетит в твоём следующем эпизоде.</div>
        </div>`;
    }
    const opts = D.sabotageOptions.slice(0,4).map((o,i)=>`
      <button class="sab-opt" data-sabotage="${i}">🕵️ ${esc(o.replace(/\{you\}/g, st.name||"ты"))}</button>`).join("");
    return `
      <h2 class="sec">🕵️ Саботаж зала</h2>
      <p class="muted pad" style="font-size:13px;margin-top:-2px">Подбрось один анонимный твист в сегодняшний канон. Он станет реальным — и тебя не вычислят. Раз в день.</p>
      <div class="sabs">${opts}</div>`;
  }

  /* ---------------- ПРОФИЛЬ ---------------- */
  function viewProfile(){
    const st = S.state;
    const arch = D.archetypes.find(a=>a.id===st.archetype) || D.archetypes[0];
    const tier = E.tierForFans(st.fans);

    const ladder = D.tiers.map(t=>{
      const reached = st.fans>=t.req;
      const current = t.id===tier.id;
      return `<div class="rung ${reached?'reached':''} ${current?'current':''}">
        <div class="num">${t.id+1}</div>
        <div class="rname">${esc(t.name)}</div>
        <div class="rreq">${t.req? fmt(t.req)+" фанатов":"старт"}</div>
      </div>`;
    }).join("");

    const ach = D.achievements.map(a=>{
      const got = st.achievements.includes(a.id);
      return `<div class="ach ${got?'':'locked'}">
        <div class="ai">${a.icon}</div>
        <div><div class="at">${esc(a.t)}</div><div class="ad">${esc(a.d)}</div></div>
        <div style="margin-left:auto">${got?'<span style="color:var(--gold)">✓</span>':'🔒'}</div>
      </div>`;
    }).join("");

    return `
      <div class="view">
        ${topbar()}
        <div class="hero">
          <div class="ring" style="${avatarStyle(st.name)}">${initial(st.name)}</div>
          <div class="hn">${esc(st.name||"Ты")}</div>
          ${st.equippedTitle?`<div class="hero-title">🏅 ${esc(st.equippedTitle)}</div>`:""}
          <div class="ha">${arch.emoji} ${esc(arch.name)} · ${esc(st.worldName)}</div>
        </div>
        <div class="statgrid">
          <div class="stat"><div class="n mono">${fmt(st.fans)}</div><div class="l">Фанаты</div></div>
          <div class="stat"><div class="n mono">${fmt(st.views)}</div><div class="l">Просмотры</div></div>
          <div class="stat"><div class="n mono">🔥${st.streak}</div><div class="l">Дней подряд</div></div>
        </div>

        <h2 class="sec">Лестница статусов</h2>
        <div class="ladder">${ladder}</div>

        <h2 class="sec">Достижения (${st.achievements.length}/${D.achievements.length})</h2>
        ${ach}

        <div class="divider"></div>
        <div class="pad">
          ${st.plus
            ? `<div class="card center" style="margin:0 0 10px"><b style="color:var(--gold)">★ LORE+ активен</b><br><span class="muted" style="font-size:13px">Безлимит эпизодов · кинорендер · приоритет режиссёра</span></div>`
            : `<button class="btn gold" data-act="open-plus">★ Перейти на LORE+</button><div style="height:10px"></div>`}
          <button class="btn ghost" data-act="open-settings">⚙ Настройки и ИИ</button>
        </div>
        <p class="foot">LORE · концепт-сборка · ${window.LORE_AI&&window.LORE_AI.enabled()?'✨ Живой ИИ включён':'встроенный режиссёр'} · работает в браузере.</p>
      </div>`;
  }

  /* ---------------- EPISODE DROP / БАТЛ-ПАСС ---------------- */
  function dropBanner(){
    const st = S.state; const d = E.currentDrop();
    const next = D.dropTrack.find(t=>t.at>st.dropPoints);
    const prevAt = (()=>{ let p=0; for(const t of D.dropTrack){ if(t.at<=st.dropPoints) p=t.at; } return p; })();
    const hiAt = next? next.at : (D.dropTrack[D.dropTrack.length-1].at);
    const pct = next? Math.min(100, ((st.dropPoints-prevAt)/(hiAt-prevAt))*100) : 100;
    return `
      <div class="drop-ban" data-act="open-drop" style="background:linear-gradient(135deg,${d.g[0]},${d.g[1]})">
        <div class="spread"><div class="drop-name">${d.emoji} ${esc(d.name)}</div><span class="drop-timer">⏳ ${d.daysLeft} дн.</span></div>
        <div class="drop-bar"><div class="drop-fill" style="width:${pct}%"></div></div>
        <div class="drop-sub">${esc(d.desc)} · ${st.dropPoints} очков · открыть награды →</div>
      </div>`;
  }

  function dropSheet(){
    const st = S.state; const d = E.currentDrop();
    const rows = D.dropTrack.map((t,i)=>{
      const reached = st.dropPoints>=t.at;
      const claimed = st.dropClaimed.includes(i);
      let right;
      if(claimed) right = `<span style="color:var(--gold)">✓</span>`;
      else if(reached && t.premium && !st.plus) right = `<button class="mini gold" data-act="open-plus">🔒 LORE+</button>`;
      else if(reached && t.premium) right = `<button class="mini gold" data-claimdrop="${i}">Забрать</button>`;
      else if(reached) right = `<span style="color:var(--gold)">✓</span>`;
      else right = `<span class="faint">${t.at} очк.</span>`;
      return `<div class="drow ${reached?'reached':''}">
        <div class="dnum">${t.at}</div>
        <div style="flex:1"><div class="dttl">${esc(t.title)}</div>${t.premium?'<div class="dprem">LORE+ награда</div>':'<div class="dprem free">бесплатно</div>'}</div>
        ${right}
      </div>`;
    }).join("");
    return `
      <div class="sheet-wrap" data-act="close-sheet">
        <div class="sheet" data-stop="1" style="max-height:88%;overflow-y:auto">
          <div class="center">
            <div class="kicker" style="color:var(--gold)">Дроп недели · ⏳ ${d.daysLeft} дн.</div>
            <h2 class="title-l" style="margin:6px 0 2px">${d.emoji} ${esc(d.name)}</h2>
            <p class="muted" style="font-size:13px">${esc(d.desc)}</p>
            <div class="kicker" style="margin-top:10px">${st.dropPoints} очков дропа</div>
          </div>
          <div style="height:14px"></div>
          <div class="drows">${rows}</div>
          <div style="height:14px"></div>
          <button class="btn gold" data-act="drop-play">▶ Снять эпизод дропа (+очки)</button>
          <div style="height:8px"></div>
          <button class="btn ghost" data-act="close-sheet">Закрыть</button>
          <p class="foot">Очки капают за каждый эпизод, дуэль, реткон и кроссовер. Дроп сменится через ${d.daysLeft} дн. — успей забрать награды.</p>
        </div>
      </div>`;
  }

  /* ---------------- ПЕЙВОЛЛ ---------------- */
  function plusSheet(){
    return `
      <div class="sheet-wrap" data-act="close-sheet">
        <div class="sheet" data-stop="1">
          <div class="center">
            <div class="kicker" style="color:var(--gold)">LORE+</div>
            <h2 class="title-l" style="margin:8px 0">Стань легендой быстрее</h2>
            <p class="muted" style="font-size:13px">Ты покупаешь не близость. Ты покупаешь софиты.</p>
          </div>
          <div class="plan hot">
            <div class="spread"><div><div class="pp">599₽<span style="font-size:13px">/мес</span></div><div class="pl">Безлимит эпизодов · кинорендер · каст до 8 · приоритет режиссёра</div></div></div>
          </div>
          <div class="plan">
            <div class="spread"><div><div class="pp">Продюсирование</div><div class="pl">Режиссируй свою арку: кастомные повороты, кроссоверы с другими создателями.</div></div></div>
          </div>
          <div style="height:16px"></div>
          <button class="btn gold" data-act="buy-plus">Активировать LORE+ (демо)</button>
          <div style="height:8px"></div>
          <button class="btn ghost" data-act="close-sheet">Не сейчас</button>
        </div>
      </div>`;
  }

  /* ---------------- НАСТРОЙКИ ---------------- */
  function settingsSheet(){
    const AI = window.LORE_AI, AU = window.LORE_AUDIO;
    const soundOn = AU ? AU.isOn() : true;
    const aiOn = AI ? AI.isOn() : false;
    const hasKey = AI ? AI.hasKey() : false;
    return `
      <div class="sheet-wrap" data-act="close-sheet">
        <div class="sheet" data-stop="1">
          <div class="center"><div class="kicker" style="color:var(--accent-2)">Настройки</div>
            <h2 class="title-l" style="margin:6px 0 14px">Настрой свой мир</h2></div>

          <div class="set-row">
            <div><div class="set-t">Звук</div><div class="set-d">Кинематографичные клики и звуки</div></div>
            <button class="switch ${soundOn?'on':''}" data-act="toggle-sound"><span></span></button>
          </div>

          <div class="divider"></div>
          <div class="set-t" style="margin:0 0 4px">✨ Живой ИИ-шоураннер</div>
          <div class="set-d" style="margin-bottom:10px">Добавь свой Anthropic API-ключ, чтобы каждый эпизод писал <b>Claude</b> вживую. Выкл = встроенный режиссёр (работает офлайн). Ключ хранится только на этом устройстве.</div>
          <input id="aiKey" class="field" type="password" placeholder="sk-ant-…" value="${hasKey?'••••••••••••':''}" autocomplete="off"/>
          <div class="row" style="margin-top:8px;gap:8px">
            <button class="btn ghost sm" data-act="save-key" style="flex:1">Сохранить ключ</button>
            <button class="btn ghost sm" data-act="test-key" style="flex:1">Тест</button>
          </div>
          <div class="set-row" style="margin-top:12px">
            <div><div class="set-t">Включить живой ИИ</div><div class="set-d" id="aiState">${aiOn?'Вкл':'Выкл'} · модель ${AI?AI.model():''}</div></div>
            <button class="switch ${aiOn?'on':''}" data-act="toggle-ai" id="aiSwitch"><span></span></button>
          </div>

          <div class="divider"></div>
          <button class="btn ghost" data-act="bug-bounty">🐛 Сообщить о баге лора — получить награду</button>
          <div style="height:10px"></div>
          <button class="btn ghost" data-act="install">⤓ Установить LORE как приложение</button>
          <div style="height:10px"></div>
          <button class="btn ghost" data-act="reset" style="color:var(--hot)">Начать новую жизнь (стереть)</button>
          <div style="height:14px"></div>
          <button class="btn" data-act="close-sheet">Готово</button>
        </div>
      </div>`;
  }

  /* ---------------- ВХОДЯЩИЙ ИНВАЙТ ---------------- */
  function inviteSheet(inv){
    const rel = D.relationships[inv.as] || D.relationships.ally;
    return `
      <div class="sheet-wrap">
        <div class="sheet" data-stop="1">
          <div class="center">
            <div class="kicker" style="color:var(--gold)">Тебя взяли в каст 🎬</div>
            <div class="ring" style="width:80px;height:80px;border-radius:24px;margin:16px auto 12px;${avatarStyle(inv.from)};display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue';font-size:38px;color:#0a0a0f">${initial(inv.from)}</div>
            <h2 class="title-l" style="margin:0 0 6px">${esc(inv.from)} взял(а) тебя</h2>
            <p class="muted" style="font-size:14px">на роль <b style="color:${rel.color}">${esc(rel.label)}</b> в своём сериале LORE. Прими роль, чтобы войти в историю — и начать свою.</p>
          </div>
          <div style="height:18px"></div>
          <button class="btn gold" data-act="accept-invite">Принять роль →</button>
          <div style="height:8px"></div>
          <button class="btn ghost" data-act="decline-invite">Может позже</button>
        </div>
      </div>`;
  }

  /* ---------------- тост ---------------- */
  let toastTimer;
  function toast(html){
    const el = document.getElementById("toast");
    el.innerHTML = html; el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>el.classList.remove("show"), 3200);
  }

  window.LORE_UI = {
    viewIntro, viewOnboardName, viewOnboardArchetype, viewOnboardWorld, viewOnboardCast, viewGenerating,
    viewHome, viewFeed, viewDiscover, viewRoom, viewCast, viewProfile, episodeCard,
    plusSheet, settingsSheet, inviteSheet, dropSheet, toast,
    avatarStyle, initial, esc,
  };
})();
