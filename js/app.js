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
  let draft = { name:"", vibe:"", archetype:null, world:null };
  let castRel = "ally";    // selected relationship in cast form

  /* ---------------- render ---------------- */
  function render(){
    const st = S.state;
    if(!st.onboarded){
      tabbar.classList.add("hidden");
      if(onbStep===null){ screen.innerHTML = UI.viewIntro(); }
      else if(onbStep==="name"){ screen.innerHTML = UI.viewOnboardName(); }
      else if(onbStep==="arch"){ screen.innerHTML = UI.viewOnboardArchetype(); restorePicks(); }
      else if(onbStep==="world"){ screen.innerHTML = UI.viewOnboardWorld(); restorePicks(); }
      return;
    }
    tabbar.classList.remove("hidden");
    if(route==="home")    screen.innerHTML = UI.viewHome();
    if(route==="feed")    screen.innerHTML = UI.viewFeed();
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
    st.activeEp = E.generateEpisode(st);   // the pilot
    S.touchDay(); S.save();
  }

  function generatingThenHome(){
    screen.innerHTML = UI.viewGenerating(draft.name);
    const lines = ["casting your world…","writing your pilot…","placing the cameras…","cueing the cliffhanger…"];
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
      if(btn){ btn.disabled=true; btn.textContent="✨ The AI showrunner is writing…"; }
      let ep = null;
      try{ ep = await AI.tryGenerate(st); }catch(e){}
      generating = false;
      st.activeEp = ep || E.generateEpisode(st);
    } else {
      st.activeEp = E.generateEpisode(st);
    }
    S.save(); render();
    setTimeout(()=>{ const e=document.getElementById("ep-"+st.activeEp.num); if(e) e.scrollIntoView({behavior:"smooth",block:"start"}); }, 60);
  }

  function playChoice(idx){
    const st = S.state;
    const ep = st.activeEp; if(!ep) return;
    const choice = ep.choices[idx]; if(!choice) return;
    sfx("tap");

    const prevTier = E.tierForFans(st.fans).id;
    const score = E.applyChoice(st, choice);
    ep.views = score.views; ep.likes = score.likes; ep.newFans = score.newFans;
    ep.chosen = choice.t; ep.viral = score.viral;
    ep.comments = E.genFanComments(st, ep, score);
    st.episodes.push(ep);
    st.activeEp = null;
    S.touchDay(); S.save();

    sfx(score.viral ? "viral" : "fans");
    render();
    // animate the just-played (now most recent in history) card into view
    setTimeout(()=>{ const e=document.getElementById("ep-"+ep.num); if(e) e.scrollIntoView({behavior:"smooth",block:"center"}); }, 80);

    // outcome toast
    UI.toast(`<span class="tt">+${S.fmt(score.newFans)} fans</span> · ${S.fmt(score.views)} views${score.viral?' · 🚀 VIRAL':''}`);

    // tier-up celebration
    const newTier = E.tierForFans(st.fans);
    if(newTier.id>prevTier){
      setTimeout(()=>{ sfx("level"); UI.toast(`<span class="tt">LEVEL UP →</span> You are now <b>${UI.esc(newTier.name)}</b>`); }, 1400);
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
        setTimeout(()=>{ sfx("achieve"); UI.toast(`<span class="tt">${a.icon} Achievement —</span> ${UI.esc(a.t)}`); show(); }, 2300); };
      show();
    }
  }

  /* ---------------- co-stars ---------------- */
  function addCostar(){
    const inp = document.getElementById("costarName");
    const name = (inp?.value||"").trim();
    if(!name){ UI.toast("Give your co-star a name first."); inp?.focus(); return; }
    S.addCostar(name, castRel);
    castRel = "ally";
    UI.toast(`<span class="tt">${UI.esc(name)} cast</span> as your ${UI.esc(D.relationships[castRel]?.label||"")} — invite sent.`);
    checkAchievements(null, null);
    render();
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

    const tab = e.target.closest(".tab");
    if(tab){ sfx("tap"); route = tab.dataset.view; render(); return; }

    const act = e.target.closest("[data-act]");
    if(act){
      const a = act.dataset.act;
      if(a==="start"){ onbStep="name"; render(); }
      else if(a==="name-next"){
        const n=document.getElementById("nameInput").value.trim();
        if(!n){ UI.toast("Your character needs a name."); return; }
        draft.name=n; draft.vibe=document.getElementById("vibeInput").value.trim();
        onbStep="arch"; render();
      }
      else if(a==="arch-next"){ if(!draft.archetype) return; onbStep="world"; render(); }
      else if(a==="world-next"){ if(!draft.world) return; generatingThenHome(); }
      else if(a==="next-ep"){ shootNext(); }
      else if(a==="add-costar"){ addCostar(); }
      else if(a==="go-home"){ route="home"; render(); }
      else if(a==="open-plus"){ sfx("pick"); screen.insertAdjacentHTML("beforeend", UI.plusSheet()); }
      else if(a==="buy-plus"){ S.state.plus=true; S.save(); closeSheet(); render(); sfx("achieve"); UI.toast(`<span class="tt">LORE+ active</span> · welcome to the spotlight`); }
      else if(a==="open-settings"){ sfx("pick"); screen.insertAdjacentHTML("beforeend", UI.settingsSheet()); }
      else if(a==="close-sheet"){ sfx("tap"); closeSheet(); }
      else if(a==="toggle-sound"){ const on=!(window.LORE_AUDIO&&window.LORE_AUDIO.isOn()); window.LORE_AUDIO&&window.LORE_AUDIO.setOn(on); act.classList.toggle("on",on); }
      else if(a==="save-key"){
        const v=document.getElementById("aiKey").value.trim();
        if(v && !/^•+$/.test(v)){ AI.setKey(v); UI.toast(`<span class="tt">Key saved</span> · stored on this device only`); }
        else UI.toast("Paste your sk-ant- key first.");
      }
      else if(a==="test-key"){
        const v=document.getElementById("aiKey").value.trim();
        if(v && !/^•+$/.test(v)) AI.setKey(v);
        UI.toast("Testing connection…");
        AI.test().then(r=>{ sfx(r.ok?"achieve":"error"); UI.toast(`<span class="tt">${r.ok?'✓ ':'✕ '}</span>${UI.esc(r.msg)}`); });
      }
      else if(a==="toggle-ai"){
        if(!AI.hasKey()){ sfx("error"); UI.toast("Add an API key first to use Live AI."); return; }
        const on=!AI.isOn(); AI.setOn(on); act.classList.toggle("on",on);
        const st=document.getElementById("aiState"); if(st) st.textContent=(on?'On':'Off')+' · model '+AI.model();
        sfx("pick"); UI.toast(on?`<span class="tt">✨ Live AI on</span> · Claude writes your episodes`:"Live AI off · using built-in showrunner");
      }
      else if(a==="install"){
        if(installPrompt){ installPrompt.prompt(); installPrompt=null; }
        else UI.toast("Use your browser menu → ‘Add to Home Screen’.");
      }
      else if(a==="reset"){
        if(confirm("Start a new life? Your current series will be gone forever.")){
          S.reset(); closeSheet(); onbStep=null; route="home"; draft={name:"",vibe:"",archetype:null,world:null}; render();
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
    const bonus = Math.round(40 + st.fans*0.02*(wt.options[idx]?.eff||1));
    st.fans += bonus; S.save();
    sfx("fans"); render();
    UI.toast(`<span class="tt">Vote counted</span> +${S.fmt(bonus)} influence · the room is writing it in`);
  }

  /* ---------------- share ---------------- */
  async function shareEpisode(num){
    const ep=(S.state.episodes||[]).find(e=>e.num===num); if(!ep||!SH) return;
    sfx("whoosh"); UI.toast("Rendering your clip…");
    try{ const how=await SH.exportCard(ep, S.state);
      UI.toast(`<span class="tt">Clip ${how}</span> · post it, pull in new fans`);
    }catch(e){ sfx("error"); UI.toast("Couldn't render the clip here."); }
  }

  // clicking a sheet's inner content shouldn't close it
  function closeSheet(){ const s=screen.querySelector(".sheet-wrap"); if(s) s.remove(); }

  // capture PWA install prompt
  window.addEventListener("beforeinstallprompt",(e)=>{ e.preventDefault(); installPrompt=e; });

  /* ---------------- boot ---------------- */
  function boot(){
    const st = S.state;
    if(st.onboarded){
      S.touchDay();
      const missed = E.runWhileAway(st);
      S.save();
      render();
      if(missed && missed.hrs>0.02){
        setTimeout(()=>UI.toast(`<span class="tt">While you were gone —</span> ${UI.esc(missed.missed)} (+${S.fmt(missed.drift)} fans)`), 700);
      }
    } else {
      render();
    }
  }
  boot();
})();
