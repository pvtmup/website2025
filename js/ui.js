/* ============================================================
   LORE — UI / views (returns HTML strings; app.js wires events)
   ============================================================ */
(function(){
  const D = window.LORE_DATA;
  const E = window.LORE_ENGINE;
  const S = window.LORE_STORE;
  const esc = (s)=>(""+s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const fmt = S.fmt;

  // deterministic avatar gradient from a name
  function avatarStyle(name){
    let h=0; for(const ch of (name||"?")) h=(h*31+ch.charCodeAt(0))%360;
    return `background:linear-gradient(135deg,hsl(${h} 80% 62%),hsl(${(h+50)%360} 80% 55%))`;
  }
  const initial = (n)=> (n||"?").trim()[0]?.toUpperCase() || "?";

  /* ---------------- INTRO / TRAILER ---------------- */
  function viewIntro(){
    return `
    <section class="view intro">
      <div class="brand">L O R E</div>
      <div class="trailer">
        <div class="line l1 kicker">A LORE Original</div>
        <div class="line l2">
          <div class="tagline">In a world that never noticed you...</div>
          <div class="bigname">YOU ARE<br>THE MAIN<br>CHARACTER</div>
        </div>
        <div class="line l3 tagline">An AI showrunner writes the series.<br>Your friends play the cast.<br>The fans decide who becomes legend.</div>
      </div>
      <div>
        <button class="btn gold" data-act="start">Start your series →</button>
        <p class="foot">Everyone's a main character. Only some become legend.</p>
      </div>
    </section>`;
  }

  /* ---------------- ONBOARDING ---------------- */
  function viewOnboardName(){
    return `
    <section class="view" style="padding-top:60px">
      <div class="pad">
        <div class="kicker">Casting · 1 / 3</div>
        <h1 class="title-l" style="margin:10px 0 6px">What's your<br>character's name?</h1>
        <p class="muted" style="font-size:14px">This is the name the whole world will be chanting.</p>
        <label class="lab" style="display:block;margin-top:22px">Stage name</label>
        <input id="nameInput" class="field" maxlength="18" placeholder="e.g. Ariel, Kō, Blaze..." autocomplete="off" />
        <label class="lab" style="display:block;margin-top:18px">Who do you secretly want to be? (optional)</label>
        <input id="vibeInput" class="field" maxlength="60" placeholder="the one everyone underestimates..." autocomplete="off" />
        <div style="height:24px"></div>
        <button class="btn" data-act="name-next">Next →</button>
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
        <div class="kicker">Casting · 2 / 3</div>
        <h1 class="title-l" style="margin:10px 0 6px">Pick your<br>archetype</h1>
        <p class="muted" style="font-size:14px">The showrunner builds every plot around this.</p>
      </div>
      <div class="pad grid2" style="margin-top:18px">${cards}</div>
      <div class="pad" style="margin-top:18px">
        <button class="btn" data-act="arch-next" disabled id="archNext">Choose an archetype</button>
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
        <div class="kicker">Casting · 3 / 3</div>
        <h1 class="title-l" style="margin:10px 0 6px">Choose your<br>world</h1>
        <p class="muted" style="font-size:14px">Where your season unfolds.</p>
      </div>
      <div class="pad grid2" style="margin-top:18px">${cards}</div>
      <div class="pad" style="margin-top:18px">
        <button class="btn gold" data-act="world-next" disabled id="worldNext">Pick a world</button>
      </div>
    </section>`;
  }

  // cinematic "generating your pilot" beat
  function viewGenerating(name){
    return `
    <section class="view intro" style="justify-content:center;text-align:center;gap:0">
      <div></div>
      <div class="trailer" style="flex:none">
        <div class="kicker">The AI Showrunner is writing</div>
        <div class="bigname" style="font-size:54px;margin:14px 0">${esc(name||"YOUR")}<br>PILOT</div>
        <div class="loader-dots muted" id="genLine">casting your world…</div>
      </div>
      <div></div>
    </section>`;
  }

  /* ---------------- shared chrome ---------------- */
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
          <span><b style="color:var(--ink)" class="mono" id="fansNum">${fmt(st.fans)}</b> fans</span>
          <span>${nxt? `${fmt(hi-st.fans)} to ${esc(nxt.name)}` : "MAX · CANON"}</span>
        </div>
      </div>`;
  }

  /* ---------------- HOME / SERIES ---------------- */
  function fanBlock(ep){
    if(!ep.comments || !ep.comments.length) return "";
    const rows = ep.comments.map(c=>`
      <div class="fc">
        <div class="fc-av" style="${avatarStyle(c.name)}">${initial(c.name.replace("@",""))}</div>
        <div class="fc-body"><span class="fc-name">${esc(c.name)}</span> ${esc(c.txt)}
          <div class="fc-likes">❤ ${fmt(c.likes)}</div></div>
      </div>`).join("");
    return `<div class="fans-wrap"><div class="kicker" style="color:var(--accent-2);margin-bottom:8px">Fan reactions</div>${rows}</div>`;
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
          ${ep.isRetcon?'':`<button class="retcon-btn" data-retcon="${ep.num}">↺ Retcon</button>`}
          <button class="share-btn" data-share="${ep.num}">⇪ Share</button>
        </div>
        ${fanBlock(ep)}`;
    } else {
      const choices = ep.choices.map((c,i)=>`
        <button class="choice" data-choice="${i}">
          <span class="ck">${c.k}</span><span>${c.t}</span><span class="ch-tag">${c.tag}</span>
        </button>`).join("");
      interaction = `
        <div class="cliff"><b>CLIFFHANGER —</b> ${ep.cliff}</div>
        <div class="kicker" style="margin:16px 0 2px;color:var(--gold)">Your move decides the next episode</div>
        <div class="choices">${choices}</div>`;
    }
    return `
      <article class="ep ${ep.isFinale?'finale':''} ${ep.isRetcon?'retcon':''}" id="ep-${ep.num}">
        <div class="ep-poster" style="background:${bg}">
          ${ep.isFinale?'<span class="finale-tag">SEASON FINALE</span>':''}
          ${ep.isRetcon?'<span class="retcon-tag">↺ RETCON</span>':''}
          ${ep.isDuel?`<span class="duel-tag ${ep.won?'won':'lost'}">⚔️ DUEL · ${ep.won?'WON':'LOST'}</span>`:''}
          ${ep._ai?'<span class="ai-tag">✨ LIVE AI</span>':''}
          <span class="ep-badge">${esc(ep.badge)} · ${esc(ep.world)}</span>
          <h2 class="ep-title">${esc(ep.title)}</h2>
          <div class="ep-sub">Directed by the LORE Showrunner${ep.coName? " · feat. "+esc(ep.coName):""}</div>
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
      body += `<div class="pad"><button class="btn gold" data-act="next-ep">▶ Shoot the next episode</button></div>`;
    }
    if(history.length){
      body += `<h2 class="sec">Previously on your series</h2>`;
      body += history.map(ep=>episodeCard(ep, true)).join("");
    }
    return `
      <div class="view">
        ${topbar()}
        ${fansMeter()}
        <div style="height:14px"></div>
        ${body}
        <p class="foot">The world keeps moving when you're gone. Come back to see what changed.</p>
      </div>`;
  }

  /* ---------------- TRENDING ---------------- */
  function viewFeed(){
    const items = E.buildFeed(S.state).map(it=>`
      <div class="clip" style="background:${it.art||it.grad}" ${it.mine?'data-act="go-home"':''}>
        ${it.mine?'<span class="mine">YOUR CLIP</span>':''}
        <div class="who">${esc(it.who)}</div>
        <div class="ct">${esc(it.title)}</div>
        <div class="metrics"><span>👁 ${fmt(it.views)}</span><span>❤️ ${fmt(it.likes)}</span><span>🔁 ${fmt(it.likes/3)}</span></div>
      </div>`).join("");
    return `
      <div class="view">
        ${topbar()}
        <h2 class="sec">Trending across every world</h2>
        ${items}
        <p class="foot">Clips auto-export to your camera roll. Post one, pull in new fans.</p>
      </div>`;
  }

  /* ---------------- CAST ---------------- */
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
             <button class="mini gold" data-act="share-invite" data-id="${c.id}">📨 Share invite</button>
             <button class="mini" data-act="accept-costar" data-id="${c.id}">Accept (demo)</button>
           </div>`
        : `<div class="costar-actions">
             <button class="mini danger" data-duel="${c.id}">⚔️ Canon Duel</button>
           </div>`;
      return `
      <div class="costar ${pending?'pending':''}">
        <div class="av" style="${avatarStyle(c.name)}">${initial(c.name)}</div>
        <div style="flex:1;min-width:0">
          <div class="cn">${esc(c.name)} ${pending?'<span class="rel-pill" style="color:var(--faint);border-color:var(--line)">pending</span>':relPill(c.rel)}</div>
          <div class="rel ${c.rel}" style="font-size:11px">${pending?'Invite sent — waiting for them to accept their role':(D.relationships[c.rel]?.verb||"")}</div>
          ${actions}
        </div>
      </div>`;
    }).join("") : `<p class="muted pad" style="font-size:14px">No co-stars yet. A solo show only goes so far — the best drama needs real people.</p>`;

    const relbtns = Object.entries(D.relationships).map(([k,v],i)=>`
      <button class="relbtn ${i===0?'on':''}" data-rel="${k}">${v.label}</button>`).join("");

    return `
      <div class="view">
        ${topbar()}
        <h2 class="sec">Your cast (${st.cast.length})</h2>
        ${list}
        <div class="card" style="margin-top:8px">
          <div class="kicker" style="color:var(--gold)">Cast a co-star</div>
          <p class="muted" style="font-size:13px;margin:8px 0 0">Invite a friend by name. The showrunner writes them into your story. Drama hits different when the cast is real.</p>
          <input id="costarName" class="field" maxlength="18" placeholder="Friend's name or @handle" autocomplete="off"/>
          <div class="relrow" id="relRow">${relbtns}</div>
          <div style="height:14px"></div>
          <button class="btn" data-act="add-costar">+ Cast & send invite</button>
        </div>
        <p class="foot">In the full app this sends a real invite — your friend approves their character before they appear. Double opt-in, no deepfakes.</p>
      </div>`;
  }

  /* ---------------- WRITERS' ROOM ---------------- */
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
          <div class="poll-row"><span>${esc(o.t)} ${mine?'<b>· your vote</b>':''}</span><span class="mono">${pct}%</span></div>
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
          <div class="spread"><div class="kicker" style="color:var(--gold)">Writers' Room · today</div>
            <span class="weight-chip">🔥 vote ×${weight}</span></div>
          <h1 class="title-l" style="margin:8px 0 4px">Shape what<br>happens next</h1>
          <p class="muted" style="font-size:14px">${esc(wt.setup)}</p>
          <p class="faint" style="font-size:12px;margin-top:6px">Your daily streak makes your vote weigh <b style="color:var(--gold)">${weight}×</b>. Show up every day to out-vote the room.</p>
        </div>
        <div class="polls">${opts}</div>
        <div class="pad">
          ${voted
            ? `<div class="card center" style="margin:6px 0 0"><b style="color:var(--accent-2)">Vote locked in 🔒</b><br><span class="muted" style="font-size:13px">The showrunner writes the winner into everyone's next season. Come back tomorrow for a new vote.</span></div>`
            : `<p class="muted" style="font-size:13px">${friends?`${esc(friends)} and `:""}${E.rint(2,40)}k creators are voting right now. Pick before the room closes.</p>`}
        </div>
        <p class="foot">Daily collective storytelling. The crowd writes the canon — together.</p>
      </div>`;
  }

  /* ---------------- PROFILE ---------------- */
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
        <div class="rreq">${t.req? fmt(t.req)+" fans":"start"}</div>
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
          <div class="hn">${esc(st.name||"You")}</div>
          <div class="ha">${arch.emoji} ${esc(arch.name)} · ${esc(st.worldName)}</div>
        </div>
        <div class="statgrid">
          <div class="stat"><div class="n mono">${fmt(st.fans)}</div><div class="l">Fans</div></div>
          <div class="stat"><div class="n mono">${fmt(st.views)}</div><div class="l">Views</div></div>
          <div class="stat"><div class="n mono">🔥${st.streak}</div><div class="l">Day streak</div></div>
        </div>

        <h2 class="sec">Status ladder</h2>
        <div class="ladder">${ladder}</div>

        <h2 class="sec">Achievements (${st.achievements.length}/${D.achievements.length})</h2>
        ${ach}

        <div class="divider"></div>
        <div class="pad">
          ${st.plus
            ? `<div class="card center" style="margin:0 0 10px"><b style="color:var(--gold)">★ LORE+ active</b><br><span class="muted" style="font-size:13px">Unlimited episodes · cinematic renders · priority showrunner</span></div>`
            : `<button class="btn gold" data-act="open-plus">★ Upgrade to LORE+</button><div style="height:10px"></div>`}
          <button class="btn ghost" data-act="open-settings">⚙ Settings & AI</button>
        </div>
        <p class="foot">LORE · concept build · ${window.LORE_AI&&window.LORE_AI.enabled()?'✨ Live AI on':'local showrunner'} · runs in your browser.</p>
      </div>`;
  }

  /* ---------------- PAYWALL SHEET ---------------- */
  function plusSheet(){
    return `
      <div class="sheet-wrap" data-act="close-sheet">
        <div class="sheet" data-stop="1">
          <div class="center">
            <div class="kicker" style="color:var(--gold)">LORE+</div>
            <h2 class="title-l" style="margin:8px 0">Become the legend faster</h2>
            <p class="muted" style="font-size:13px">You're not buying intimacy. You're buying the spotlight.</p>
          </div>
          <div class="plan hot">
            <div class="spread"><div><div class="pp">$7.99<span style="font-size:13px">/mo</span></div><div class="pl">Unlimited episodes · cinematic renders · cast up to 8 · priority showrunner</div></div></div>
          </div>
          <div class="plan">
            <div class="spread"><div><div class="pp">Productions</div><div class="pl">Direct your own arc: custom twists, crossovers with other creators.</div></div></div>
          </div>
          <div style="height:16px"></div>
          <button class="btn gold" data-act="buy-plus">Activate LORE+ (demo)</button>
          <div style="height:8px"></div>
          <button class="btn ghost" data-act="close-sheet">Not yet</button>
        </div>
      </div>`;
  }

  /* ---------------- SETTINGS SHEET ---------------- */
  function settingsSheet(){
    const AI = window.LORE_AI, AU = window.LORE_AUDIO;
    const soundOn = AU ? AU.isOn() : true;
    const aiOn = AI ? AI.isOn() : false;
    const hasKey = AI ? AI.hasKey() : false;
    return `
      <div class="sheet-wrap" data-act="close-sheet">
        <div class="sheet" data-stop="1">
          <div class="center"><div class="kicker" style="color:var(--accent-2)">Settings</div>
            <h2 class="title-l" style="margin:6px 0 14px">Tune your world</h2></div>

          <div class="set-row">
            <div><div class="set-t">Sound FX</div><div class="set-d">Cinematic clicks & chimes</div></div>
            <button class="switch ${soundOn?'on':''}" data-act="toggle-sound"><span></span></button>
          </div>

          <div class="divider"></div>
          <div class="set-t" style="margin:0 0 4px">✨ Live AI showrunner</div>
          <div class="set-d" style="margin-bottom:10px">Add your Anthropic API key to have <b>Claude</b> write every episode live. Off = the built-in showrunner (works offline). Your key is stored only on this device.</div>
          <input id="aiKey" class="field" type="password" placeholder="sk-ant-..." value="${hasKey?'••••••••••••':''}" autocomplete="off"/>
          <div class="row" style="margin-top:8px;gap:8px">
            <button class="btn ghost sm" data-act="save-key" style="flex:1">Save key</button>
            <button class="btn ghost sm" data-act="test-key" style="flex:1">Test</button>
          </div>
          <div class="set-row" style="margin-top:12px">
            <div><div class="set-t">Use Live AI</div><div class="set-d" id="aiState">${aiOn?'On':'Off'} · model ${AI?AI.model():''}</div></div>
            <button class="switch ${aiOn?'on':''}" data-act="toggle-ai" id="aiSwitch"><span></span></button>
          </div>

          <div class="divider"></div>
          <button class="btn ghost" data-act="bug-bounty">🐛 Report a lore bug — earn a bounty</button>
          <div style="height:10px"></div>
          <button class="btn ghost" data-act="install">⤓ Install LORE as an app</button>
          <div style="height:10px"></div>
          <button class="btn ghost" data-act="reset" style="color:var(--hot)">Start a new life (erase)</button>
          <div style="height:14px"></div>
          <button class="btn" data-act="close-sheet">Done</button>
        </div>
      </div>`;
  }

  /* ---------------- INCOMING INVITE SHEET ---------------- */
  function inviteSheet(inv){
    const rel = D.relationships[inv.as] || D.relationships.ally;
    return `
      <div class="sheet-wrap">
        <div class="sheet" data-stop="1">
          <div class="center">
            <div class="kicker" style="color:var(--gold)">You've been cast 🎬</div>
            <div class="ring" style="width:80px;height:80px;border-radius:24px;margin:16px auto 12px;${avatarStyle(inv.from)};display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue';font-size:38px;color:#0a0a0f">${initial(inv.from)}</div>
            <h2 class="title-l" style="margin:0 0 6px">${esc(inv.from)} cast you</h2>
            <p class="muted" style="font-size:14px">as their <b style="color:${rel.color}">${esc(rel.label)}</b> in their LORE series. Accept your role to step into the story — and start your own.</p>
          </div>
          <div style="height:18px"></div>
          <button class="btn gold" data-act="accept-invite">Accept my role →</button>
          <div style="height:8px"></div>
          <button class="btn ghost" data-act="decline-invite">Maybe later</button>
        </div>
      </div>`;
  }

  /* ---------------- toast ---------------- */
  let toastTimer;
  function toast(html){
    const el = document.getElementById("toast");
    el.innerHTML = html; el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>el.classList.remove("show"), 3200);
  }

  window.LORE_UI = {
    viewIntro, viewOnboardName, viewOnboardArchetype, viewOnboardWorld, viewGenerating,
    viewHome, viewFeed, viewRoom, viewCast, viewProfile, episodeCard,
    plusSheet, settingsSheet, inviteSheet, toast,
    avatarStyle, initial, esc,
  };
})();
