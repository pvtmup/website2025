/* ============================================================
   LORE — app orchestration: routing, onboarding, play loop
   ============================================================ */
(function(){
  const D = window.LORE_DATA;
  const E = window.LORE_ENGINE;
  const S = window.LORE_STORE;
  const UI = window.LORE_UI;
  const AI = window.LORE_AI;
  const SH = window.LORE_SHARE;
  const sfx = (n)=>{ try{ window.LORE_AUDIO && window.LORE_AUDIO.fx[n] && window.LORE_AUDIO.fx[n](); }catch(e){} };
  let installPrompt = null;

  const screen = document.getElementById("screen");
  const tabbar = document.getElementById("tabbar");

  // transient UI state
  let route = "home";      // active main tab
  let onbStep = null;      // 'name' | 'arch' | 'world'
  let draft = { name:"", vibe:"", archetype:null, world:null, cast:[] };
  let castRel = "ally";    // selected relationship in cast form
  let incomingInvite = null;   // parsed from ?join= link
  let pendingInviter = null;   // inviter to add after onboarding
  let discoverList = [];       // cached Discover creators for current view

  /* ---------------- render ---------------- */
  function render(){
    const st = S.state;
    if(!st.onboarded){
      tabbar.classList.add("hidden");
      if(onbStep===null){ screen.innerHTML = UI.viewIntro(); }
      else if(onbStep==="name"){ screen.innerHTML = UI.viewOnboardName(); }
      else if(onbStep==="arch"){ screen.innerHTML = UI.viewOnboardArchetype(); restorePicks(); }
      else if(onbStep==="world"){ screen.innerHTML = UI.viewOnboardWorld(); restorePicks(); }
      else if(onbStep==="cast"){ screen.innerHTML = UI.viewOnboardCast(draft.cast); }
      return;
    }
    tabbar.classList.remove("hidden");
    if(route==="home")    screen.innerHTML = UI.viewHome();
    if(route==="feed")    screen.innerHTML = UI.viewFeed();
    if(route==="discover"){ discoverList = E.buildDiscover(S.state); screen.innerHTML = UI.viewDiscover(discoverList); }
    if(route==="room")    screen.innerHTML = UI.viewRoom();
    if(route==="cast")    screen.innerHTML = UI.viewCast();
    if(route==="profile") screen.innerHTML = UI.viewProfile();
    syncTabs();
    screen.scrollTop = 0;
  }

  function restorePicks(){
    if(draft.archetype){
      const el = screen.querySelector(`[data-pick="arch"][data-id="${draft.archetype}"]`);
      if(el){ el.classList.add("on"); enable("archNext","Next →"); }
    }
    if(draft.world){
      const el = screen.querySelector(`[data-pick="world"][data-id="${draft.world}"]`);
      if(el){ el.classList.add("on"); enable("worldNext","Roll the pilot →"); }
    }
  }
  function enable(id,label){ const b=document.getElementById(id); if(b){b.disabled=false; if(label)b.textContent=label;} }
  function syncTabs(){
    document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active", t.dataset.view===route));
  }

  /* ---------------- onboarding actions ---------------- */
  function commitOnboard(){
    const st = S.state;
    const world = D.worlds.find(w=>w.id===draft.world);
    st.name = draft.name; st.vibe = draft.vibe;
    st.archetype = draft.archetype; st.world = draft.world;
    st.worldName = world ? world.name : "";
    st.onboarded = true;

    // seed the cast from onboarding (demo stand-ins); auto-add a couple if empty
    const rels = ["love","rival","secret","ally"];
    let names = draft.cast.map(c=>c.name);
    if(!names.length){
      const pool = D.seedNames.slice();
      names = [ pool.splice(Math.floor(Math.random()*pool.length),1)[0],
                pool.splice(Math.floor(Math.random()*pool.length),1)[0] ];
    }
    names.forEach((n,i)=> S.addCostar(n, rels[i%rels.length], "active", true));

    if(pendingInviter){
      S.addCostar(pendingInviter.from, pendingInviter.as, "active");
      S.unlock("caster"); pendingInviter=null;
    }
    if(S.state.cast.length) S.unlock("costar");
    st.activeEp = E.generateEpisode(st);   // the pilot
    S.touchDay(); S.save();
  }

  function generatingThenHome(){
    screen.innerHTML = UI.viewGenerating(draft.name);
    const lines = ["подбираем твой мир…","пишем твой пилот…","расставляем камеры…","готовим клиффхэнгер…"];
    let i=0; const el=()=>document.getElementById("genLine");
    const iv = setInterval(()=>{ i++; if(el()) el().textContent = lines[i%lines.length]; }, 520);
    setTimeout(()=>{ clearInterval(iv); commitOnboard(); route="home"; render(); }, 2300);
  }

  /* ---------------- play loop ---------------- */
  let generating = false;
  async function shootNext(){
    if(generating) return;
    const st = S.state;
    sfx("whoosh");
    // Live AI path (with loading state) → falls back to local engine
    if(AI && AI.enabled()){
      generating = true;
      const btn = document.querySelector('[data-act="next-ep"]');
      if(btn){ btn.disabled=true; btn.textContent="✨ ИИ-шоураннер пишет…"; }
      let ep = null;
      try{ ep = await AI.tryGenerate(st); }catch(e){}
      generating = false;
      st.activeEp = ep || E.generateEpisode(st);
    } else {
      st.activeEp = E.generateEpisode(st);
    }
    consumeTwist(st.activeEp);
    S.save(); render();
    setTimeout(()=>{ const e=document.getElementById("ep-"+st.activeEp.num); if(e) e.scrollIntoView({behavior:"smooth",block:"start"}); }, 60);
  }

  // an injected anonymous twist lands at the top of the next episode
  function consumeTwist(ep){
    const st=S.state;
    if(st.pendingTwist){
      ep.scenes.unshift({ t:`Анонимный твист зала прилетает: <span class="nm">${UI.esc(st.pendingTwist)}</span>`, cls:"dir" });
      st.pendingTwist=null;
    }
  }

  /* ---------------- Cursed Crossover ---------------- */
  function doCrossover(){
    const st=S.state;
    sfx("whoosh");
    st.activeEp=E.generateCrossover(st);
    consumeTwist(st.activeEp);
    S.unlock("crossover"); S.save(); render();
    setTimeout(()=>{ const e=document.getElementById("ep-"+st.activeEp.num); if(e) e.scrollIntoView({behavior:"smooth",block:"start"}); }, 60);
    UI.toast(`<span class="tt">🌀 Миры столкнулись</span> · ${UI.esc(st.activeEp.world)}`);
    checkAchievements(null,null);
  }

  /* ---------------- Episode Drop / батл-пасс ---------------- */
  function syncDrop(){
    const d=E.currentDrop(); const st=S.state;
    if(st.dropWeek!==d.week){ st.dropWeek=d.week; st.dropPoints=0; st.dropClaimed=[]; S.save(); }
  }
  function addDropProgress(n){
    const st=S.state; st.dropPoints=(st.dropPoints||0)+n; let delay=1700;
    D.dropTrack.forEach((t,i)=>{
      if(!t.premium && st.dropPoints>=t.at && !st.dropClaimed.includes(i)){
        st.dropClaimed.push(i); st.equippedTitle=t.title;
        const ti=t; const dd=delay; delay+=1400;
        setTimeout(()=>{ sfx("achieve"); UI.toast(`<span class="tt">🏅 Награда дропа</span> Титул «${UI.esc(ti.title)}» разблокирован`); }, dd);
      }
    });
    S.save();
  }
  function claimDrop(i){
    const st=S.state; const t=D.dropTrack[i]; if(!t) return;
    if(st.dropPoints<t.at) return;
    if(t.premium && !st.plus){ sfx("error"); return; }
    if(!st.dropClaimed.includes(i)) st.dropClaimed.push(i);
    st.equippedTitle=t.title; S.save();
    sfx("achieve"); closeSheet(); screen.insertAdjacentHTML("beforeend", UI.dropSheet());
    UI.toast(`<span class="tt">🏅 Награда забрана</span> Титул «${UI.esc(t.title)}»`);
  }

  /* ---------------- Discover / Guest Star ---------------- */
  function guestStar(i){
    const st=S.state; const creator=discoverList[i]; if(!creator) return;
    sfx("whoosh");
    st.activeEp = E.generateGuestEpisode(st, creator);
    consumeTwist(st.activeEp);
    S.unlock("gueststar"); S.save();
    route="home"; render();
    setTimeout(()=>{ const el=document.getElementById("ep-"+st.activeEp.num); if(el) el.scrollIntoView({behavior:"smooth",block:"start"}); }, 80);
    UI.toast(`<span class="tt">🎬 Ты в гостях у ${UI.esc(creator.handle)}</span> · их фанаты смотрят — не подведи`);
    checkAchievements(null,null);
  }

  /* ---------------- Writers' Room Sabotage ---------------- */
  function injectSabotage(i){
    const st=S.state; const today=new Date().toDateString();
    if(st.sabotageDay===today){ sfx("error"); UI.toast("Ты уже саботировал(а) зал сегодня."); return; }
    const txt=(D.sabotageOptions[i]||"").replace(/\{you\}/g, st.name||"you");
    st.sabotageDay=today; st.pendingTwist=txt;
    const bonus=Math.round(50+st.fans*0.01);
    st.fans+=bonus; S.unlock("saboteur"); S.save();
    sfx("pick"); render();
    UI.toast(`<span class="tt">🕵️ Твист вброшен</span> +${S.fmt(bonus)} хаоса · никто не знает, что это ты`);
    checkAchievements(null,null);
  }

  function playChoice(idx){
    const st = S.state;
    const ep = st.activeEp; if(!ep) return;
    const choice = ep.choices[idx]; if(!choice) return;
    sfx("tap");

    const prevTier = E.tierForFans(st.fans).id;
    const score = E.applyChoice(st, choice);
    // guesting on a bigger creator exposes you to their audience
    if(ep.isGuest && ep.hostFans){
      const boost = Math.round(ep.hostFans*(0.01+Math.random()*0.02));
      score.newFans += boost; score.views += Math.round(ep.hostFans*(0.05+Math.random()*0.1));
      st.fans += boost; st.views += Math.round(ep.hostFans*0.05);
    }
    ep.views = score.views; ep.likes = score.likes; ep.newFans = score.newFans;
    ep.chosen = choice.t; ep.viral = score.viral;
    ep.comments = E.genFanComments(st, ep, score);
    st.episodes.push(ep);
    st.activeEp = null;
    S.touchDay(); S.save();

    addDropProgress(ep.isFinale?90:50);
    sfx(score.viral ? "viral" : "fans");
    render();
    // animate the just-played (now most recent in history) card into view
    setTimeout(()=>{ const e=document.getElementById("ep-"+ep.num); if(e) e.scrollIntoView({behavior:"smooth",block:"center"}); }, 80);

    // outcome toast
    UI.toast(`<span class="tt">+${S.fmt(score.newFans)} фанатов</span> · ${S.fmt(score.views)} просмотров${score.viral?' · 🚀 ВИРАЛ':''}`);

    // relationship shift feedback — choices should visibly change things
    if(score.relChange){
      const rc=score.relChange;
      setTimeout(()=>UI.toast(`<span class="tt">${UI.esc(rc.name)} → ${UI.esc(rc.label)}</span> отношения изменились`), 900);
    }

    // tier-up celebration
    const newTier = E.tierForFans(st.fans);
    if(newTier.id>prevTier){
      setTimeout(()=>{ sfx("level"); UI.toast(`<span class="tt">НОВЫЙ УРОВЕНЬ →</span> Теперь ты <b>${UI.esc(newTier.name)}</b>`); }, 1400);
    }
    checkAchievements(choice, score);
  }

  /* ---------------- achievements ---------------- */
  function checkAchievements(choice, score){
    const st = S.state;
    const fresh = [];
    const grab = (id)=>{ if(S.unlock(id)) fresh.push(D.achievements.find(a=>a.id===id)); };

    if(st.episodes.length>=1) grab("pilot");
    if(st.fans>=100)  grab("firstfan");
    if(st.cast.length>=1) grab("costar");
    if((st.episodes||[]).some(e=>e.isRetcon)) grab("retconwar");
    if(score && (score.views>=10000)) grab("cliff");
    if(score && score.viral) grab("viral");
    if(choice && choice.tag==="villain") grab("villain");
    if(choice && choice.tag==="power")  grab("heartbreak");
    if(st.streak>=7)  grab("streak");
    if(st.fans>=7000) grab("legend");
    if(st.fans>=25000)grab("canon");

    if(fresh.length){
      let k=0;
      const show=()=>{ if(k>=fresh.length) return; const a=fresh[k++];
        setTimeout(()=>{ sfx("achieve"); UI.toast(`<span class="tt">${a.icon} Достижение —</span> ${UI.esc(a.t)}`); show(); }, 2300); };
      show();
    }
  }

  /* ---------------- co-stars / invites ---------------- */
  function addCostar(){
    const inp = document.getElementById("costarName");
    const name = (inp?.value||"").trim();
    if(!name){ sfx("error"); UI.toast("Сначала впиши имя со-актёра."); inp?.focus(); return; }
    const rel = castRel;
    const c = S.addCostar(name, rel, "pending");   // pending until they accept (double opt-in)
    castRel = "ally";
    sfx("pick");
    render();
    UI.toast(`<span class="tt">${UI.esc(name)} в касте</span> как твой(я) ${UI.esc(D.relationships[rel]?.label||"")} — теперь отправь инвайт.`);
    setTimeout(()=>shareInvite(c.id), 400);
  }

  function inviteUrl(c, fromName, rel){
    const base = location.origin + location.pathname;
    const q = `?join=${encodeURIComponent(c.code)}&from=${encodeURIComponent(fromName)}&as=${encodeURIComponent(rel)}&name=${encodeURIComponent(c.name)}`;
    return base + q;
  }
  async function shareInvite(id){
    const st=S.state; const c=st.cast.find(x=>x.id===id); if(!c) return;
    const url=inviteUrl(c, st.name||"Друг", c.rel);
    const text=`Беру тебя на роль «${D.relationships[c.rel]?.label||"со-актёр"}» в мой сериал LORE 🎬 Прими роль:`;
    sfx("whoosh");
    try{
      if(navigator.share){ await navigator.share({title:"LORE", text, url}); UI.toast(`<span class="tt">Инвайт отправлен</span> · примут роль — и они в касте`); return; }
    }catch(e){ if(e&&e.name==="AbortError") return; }
    try{ await navigator.clipboard.writeText(url); UI.toast(`<span class="tt">Ссылка-инвайт скопирована</span> · отправь её ${UI.esc(c.name)}`); }
    catch(e){ UI.toast(`Ссылка-инвайт: ${UI.esc(url)}`); }
  }
  function acceptCostar(id){
    const c=S.acceptCostar(id); if(!c) return;
    sfx("fans"); S.unlock("caster"); render();
    UI.toast(`<span class="tt">${UI.esc(c.name)} в касте</span> · теперь он(а) в твоей истории`);
    checkAchievements(null,null);
  }

  /* ---------------- Canon Duel ---------------- */
  function startDuel(id){
    const st=S.state; const c=st.cast.find(x=>x.id===id); if(!c) return;
    if(c.status==="pending"){ sfx("error"); UI.toast("Сначала пусть примут роль — потом дуэль."); return; }
    if(!confirm(`Вынести спор с ${c.name} в зал? Они голосуют, чья версия — канон. Победа или поражение — это останется.`)) return;
    const res=E.resolveDuel(st, c);
    const score=E.scoreEpisode(st,{eff:{fans: res.won?1.7:1.0}});
    const fanDelta = res.won ? score.newFans : -Math.round(score.newFans*0.4);
    st.fans=Math.max(0, st.fans+fanDelta); st.views+=score.views; st.likes+=score.likes;
    const ep=res.ep; ep.views=score.views; ep.likes=score.likes; ep.newFans=fanDelta;
    ep.comments=E.genFanComments(st, ep, score);
    st.episodes.push(ep); if(res.won) S.unlock("canonduel");
    S.touchDay(); S.save();
    addDropProgress(45);
    sfx(res.won?"level":"error");
    route="home"; render();
    setTimeout(()=>{ const el=document.getElementById("ep-"+ep.num); if(el) el.scrollIntoView({behavior:"smooth",block:"center"}); }, 100);
    UI.toast(res.won
      ? `<span class="tt">⚔️ Ты выиграл(а) дуэль ${res.yourPct}–${res.theirPct}</span> · теперь канон — твоя версия`
      : `<span class="tt">⚔️ Ты проиграл(а) ${res.theirPct}–${res.yourPct}</span> · ${UI.esc(res.costarName)} вписал(а) свою версию`);
    checkAchievements(null, score);
  }

  /* ---------------- Lore Bug Bounty ---------------- */
  function bugBounty(){
    const st=S.state; const b=E.reportBug(st);
    st.fans+=b.bounty; S.unlock("bughunter"); S.save();
    sfx("achieve"); closeSheet(); render();
    UI.toast(`<span class="tt">🐛 Bounty +${S.fmt(b.bounty)}</span> ${UI.esc(b.txt)}`);
    checkAchievements(null,null);
  }

  /* ---------------- event delegation ---------------- */
  document.addEventListener("click", (e)=>{
    const pick = e.target.closest("[data-pick]");
    if(pick){
      const grp = pick.dataset.pick;
      screen.querySelectorAll(`[data-pick="${grp}"]`).forEach(x=>x.classList.remove("on"));
      pick.classList.add("on"); sfx("pick");
      if(grp==="arch"){ draft.archetype = pick.dataset.id; enable("archNext","Next →"); }
      if(grp==="world"){ draft.world = pick.dataset.id; enable("worldNext","Roll the pilot →"); }
      return;
    }

    const castAdd = e.target.closest("[data-castadd]");
    if(castAdd){
      const n=castAdd.dataset.castadd;
      const i=draft.cast.findIndex(c=>c.name===n);
      if(i>=0) draft.cast.splice(i,1); else draft.cast.push({name:n});
      sfx("pick"); render(); return;
    }
    const castRemove = e.target.closest("[data-castremove]");
    if(castRemove){ draft.cast.splice(parseInt(castRemove.dataset.castremove,10),1); sfx("tap"); render(); return; }

    const relBtn = e.target.closest("[data-rel]");
    if(relBtn){
      castRel = relBtn.dataset.rel;
      document.querySelectorAll("#relRow .relbtn").forEach(b=>b.classList.toggle("on", b===relBtn));
      return;
    }

    const choiceBtn = e.target.closest("[data-choice]");
    if(choiceBtn){ playChoice(parseInt(choiceBtn.dataset.choice,10)); return; }

    const voteBtn = e.target.closest("[data-vote]");
    if(voteBtn){ castVote(parseInt(voteBtn.dataset.vote,10)); return; }

    const shareBtn = e.target.closest("[data-share]");
    if(shareBtn){ shareEpisode(parseInt(shareBtn.dataset.share,10)); return; }

    const retconBtn = e.target.closest("[data-retcon]");
    if(retconBtn){ doRetcon(parseInt(retconBtn.dataset.retcon,10)); return; }

    const duelBtn = e.target.closest("[data-duel]");
    if(duelBtn){ startDuel(duelBtn.dataset.duel); return; }

    const sabBtn = e.target.closest("[data-sabotage]");
    if(sabBtn){ injectSabotage(parseInt(sabBtn.dataset.sabotage,10)); return; }

    const guestBtn = e.target.closest("[data-guest]");
    if(guestBtn){ guestStar(parseInt(guestBtn.dataset.guest,10)); return; }

    const claimBtn = e.target.closest("[data-claimdrop]");
    if(claimBtn){ claimDrop(parseInt(claimBtn.dataset.claimdrop,10)); return; }

    const tab = e.target.closest(".tab");
    if(tab){ sfx("tap"); route = tab.dataset.view; render(); return; }

    const act = e.target.closest("[data-act]");
    if(act){
      const a = act.dataset.act;
      if(a==="start"){ onbStep="name"; render(); }
      else if(a==="name-next"){
        const n=document.getElementById("nameInput").value.trim();
        if(!n){ UI.toast("Персонажу нужно имя."); return; }
        draft.name=n; draft.vibe=document.getElementById("vibeInput").value.trim();
        onbStep="arch"; render();
      }
      else if(a==="arch-next"){ if(!draft.archetype) return; onbStep="world"; render(); }
      else if(a==="world-next"){ if(!draft.world) return; sfx("pick"); onbStep="cast"; render(); }
      else if(a==="onb-add-costar"){
        const inp=document.getElementById("castInput"); const v=(inp?.value||"").trim();
        if(!v){ inp?.focus(); return; }
        if(!draft.cast.some(c=>c.name.toLowerCase()===v.toLowerCase())) draft.cast.push({name:v.slice(0,18)});
        sfx("pick"); render();
      }
      else if(a==="cast-done"){ generatingThenHome(); }
      else if(a==="next-ep"){ shootNext(); }
      else if(a==="crossover"){ doCrossover(); }
      else if(a==="add-costar"){ addCostar(); }
      else if(a==="share-invite"){ shareInvite(act.dataset.id); }
      else if(a==="accept-costar"){ acceptCostar(act.dataset.id); }
      else if(a==="bug-bounty"){ bugBounty(); }
      else if(a==="go-home"){ route="home"; render(); }
      else if(a==="go-cast"){ sfx("tap"); route="cast"; render(); }
      else if(a==="open-plus"){ sfx("pick"); screen.insertAdjacentHTML("beforeend", UI.plusSheet()); }
      else if(a==="buy-plus"){ S.state.plus=true; S.save(); closeSheet(); render(); sfx("achieve"); UI.toast(`<span class="tt">LORE+ активен</span> · добро пожаловать под софиты`); }
      else if(a==="open-settings"){ sfx("pick"); screen.insertAdjacentHTML("beforeend", UI.settingsSheet()); }
      else if(a==="open-drop"){ sfx("pick"); screen.insertAdjacentHTML("beforeend", UI.dropSheet()); }
      else if(a==="drop-play"){ closeSheet(); shootNext(); }
      else if(a==="close-sheet"){ sfx("tap"); closeSheet(); }
      else if(a==="accept-invite"){
        sfx("fans"); const inv=incomingInvite; incomingInvite=null; closeSheet();
        if(S.state.onboarded){
          S.addCostar(inv.from, inv.as, "active"); S.unlock("caster");
          route="cast"; render();
          UI.toast(`<span class="tt">Ты в истории ${UI.esc(inv.from)}</span> · а они — в твоей`);
          checkAchievements(null,null);
        } else {
          pendingInviter=inv; onbStep="name"; render();
          UI.toast(`<span class="tt">Сначала создай своего персонажа →</span>`);
        }
      }
      else if(a==="decline-invite"){ sfx("tap"); incomingInvite=null; closeSheet(); }
      else if(a==="toggle-sound"){ const on=!(window.LORE_AUDIO&&window.LORE_AUDIO.isOn()); window.LORE_AUDIO&&window.LORE_AUDIO.setOn(on); act.classList.toggle("on",on); }
      else if(a==="save-key"){
        const v=document.getElementById("aiKey").value.trim();
        if(v && !/^•+$/.test(v)){ AI.setKey(v); UI.toast(`<span class="tt">Ключ сохранён</span> · только на этом устройстве`); }
        else UI.toast("Сначала вставь ключ sk-ant-…");
      }
      else if(a==="test-key"){
        const v=document.getElementById("aiKey").value.trim();
        if(v && !/^•+$/.test(v)) AI.setKey(v);
        UI.toast("Проверяем соединение…");
        AI.test().then(r=>{ sfx(r.ok?"achieve":"error"); UI.toast(`<span class="tt">${r.ok?'✓ ':'✕ '}</span>${UI.esc(r.msg)}`); });
      }
      else if(a==="toggle-ai"){
        if(!AI.hasKey()){ sfx("error"); UI.toast("Сначала добавь API-ключ для живого ИИ."); return; }
        const on=!AI.isOn(); AI.setOn(on); act.classList.toggle("on",on);
        const st=document.getElementById("aiState"); if(st) st.textContent=(on?'Вкл':'Выкл')+' · модель '+AI.model();
        sfx("pick"); UI.toast(on?`<span class="tt">✨ Живой ИИ включён</span> · эпизоды пишет Claude`:"Живой ИИ выключен · встроенный режиссёр");
      }
      else if(a==="install"){
        if(installPrompt){ installPrompt.prompt(); installPrompt=null; }
        else UI.toast("Меню браузера → Добавить на экран «Домой».");
      }
      else if(a==="reset"){
        if(confirm("Начать новую жизнь? Твой текущий сериал исчезнет навсегда.")){
          S.reset(); closeSheet(); onbStep=null; route="home"; draft={name:"",vibe:"",archetype:null,world:null,cast:[]}; render();
        }
      }
      return;
    }
  });

  /* ---------------- writers' room ---------------- */
  function castVote(idx){
    const st=S.state; const wt=E.writersToday(st);
    if(st.writersDay===wt.day) return;
    st.writersDay=wt.day; st.writersChoice=idx;
    const weight = Math.min(5, st.streak||1);
    const bonus = Math.round((40 + st.fans*0.02*(wt.options[idx]?.eff||1)) * weight);
    st.fans += bonus; S.save();
    sfx("fans"); render();
    UI.toast(`<span class="tt">Голос ×${weight} засчитан</span> +${S.fmt(bonus)} влияния · зал вписывает это в сюжет`);
  }

  /* ---------------- RETCON WAR ---------------- */
  function doRetcon(num){
    const st=S.state;
    const src=(st.episodes||[]).find(e=>e.num===num); if(!src) return;
    // pick a target: the episode's co-star, else a non-rival cast member, else anyone
    let target = st.cast.find(c=>c.name===src.coName)
              || st.cast.find(c=>c.rel!=="rival")
              || st.cast[0];
    if(!target){ sfx("error"); UI.toast("Для реткона нужен со-актёр — сначала позови друга."); route="cast"; render(); return; }
    if(!confirm(`Переписать прошлое и сделать ${target.name} злодеем? Это необратимо — они узнают.`)) return;

    const ep = E.generateRetcon(st, target);
    const score = E.scoreEpisode(st, {eff:{fans:1.9}});
    if(!score.viral && Math.random()<0.5){ score.viral=true; score.views=Math.max(score.views, E.rint(12000,50000)); }
    st.fans += score.newFans; st.views += score.views; st.likes += score.likes;
    ep.views=score.views; ep.likes=score.likes; ep.newFans=score.newFans; ep.viral=score.viral;
    ep.chosen="betrayal retcon";
    ep.comments=E.genFanComments(st, ep, score);
    st.episodes.push(ep);
    S.touchDay(); S.save();

    addDropProgress(45);
    sfx(score.viral?"viral":"achieve");
    render();
    setTimeout(()=>{ const el=document.getElementById("ep-"+ep.num); if(el) el.scrollIntoView({behavior:"smooth",block:"center"}); }, 80);
    UI.toast(`<span class="tt">↺ Прошлое переписано</span> · теперь злодей — ${UI.esc(target.name)} · ${S.fmt(score.views)} просмотров`);
    checkAchievements(null, score);
  }

  /* ---------------- share ---------------- */
  async function shareEpisode(num){
    const ep=(S.state.episodes||[]).find(e=>e.num===num); if(!ep||!SH) return;
    sfx("whoosh"); UI.toast("Рендерим твой клип…");
    try{ const how=await SH.exportCard(ep, S.state);
      UI.toast(`<span class="tt">Клип ${how}</span> · выложи — приведёшь новых фанатов`);
    }catch(e){ sfx("error"); UI.toast("Не получилось отрендерить клип здесь."); }
  }

  // clicking a sheet's inner content shouldn't close it
  function closeSheet(){ const s=screen.querySelector(".sheet-wrap"); if(s) s.remove(); }

  // capture PWA install prompt
  window.addEventListener("beforeinstallprompt",(e)=>{ e.preventDefault(); installPrompt=e; });

  function parseInvite(){
    try{
      const p=new URLSearchParams(location.search);
      if(p.get("join")){
        const inv={ code:p.get("join"), from:(p.get("from")||"A friend").slice(0,18),
                    as:p.get("as")||"ally", name:(p.get("name")||"").slice(0,18) };
        history.replaceState(null,"",location.pathname);   // clean the URL
        return inv;
      }
    }catch(e){}
    return null;
  }

  /* ---------------- boot ---------------- */
  function boot(){
    const st = S.state;
    incomingInvite = parseInvite();
    if(st.onboarded){
      S.touchDay();
      syncDrop();
      const missed = E.runWhileAway(st);
      S.save();
      render();
      if(missed && missed.hrs>0.02 && !incomingInvite){
        setTimeout(()=>UI.toast(`<span class="tt">Пока тебя не было —</span> ${UI.esc(missed.missed)} (+${S.fmt(missed.drift)} фанатов)`), 700);
      }
    } else {
      render();
    }
    if(incomingInvite){
      setTimeout(()=>screen.insertAdjacentHTML("beforeend", UI.inviteSheet(incomingInvite)), 350);
    }
  }
  boot();
})();
