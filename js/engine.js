/* ============================================================
   LORE — the AI Showrunner engine
   Composes episodes, scores virality, runs the world while
   you're away. Deterministic-ish per session, feels alive.
   ============================================================ */
(function(){
  const D = window.LORE_DATA;
  const rnd  = (a)=>a[Math.floor(Math.random()*a.length)];
  const rint = (min,max)=>Math.floor(min+Math.random()*(max-min+1));

  function fill(tpl, ctx){
    return tpl
      .replace(/\{you\}/g, `<span class="nm">${ctx.you}</span>`)
      .replace(/\{world\}/g, ctx.world)
      .replace(/\{co\}/g, ctx.co ? `<span class="nm">${ctx.co}</span>` : "someone")
      .replace(/\{a\}/g, ctx.a || "them")
      .replace(/\{b\}/g, ctx.b || "the other one");
  }
  const grad = (c)=>`linear-gradient(155deg, ${c[0]}, ${c[1]})`;

  // pick a co-star to feature, biased toward unresolved tension
  function featuredCostar(state){
    if(!state.cast.length) return null;
    const weighted = state.cast.flatMap(c=>{
      const w = 1 + (c.rel==="rival"?2:0) + (c.rel==="love"?2:0) + (c.rel==="secret"?1:0);
      return Array(w).fill(c);
    });
    return rnd(weighted);
  }

  function tierForFans(fans){
    let t = D.tiers[0];
    for(const tier of D.tiers){ if(fans>=tier.req) t=tier; }
    return t;
  }
  function nextTier(fans){
    return D.tiers.find(t=>t.req>fans) || null;
  }

  /* ---- generate one episode object (not yet scored) ---- */
  function generateEpisode(state){
    const arch  = D.archetypes.find(a=>a.id===state.archetype) || D.archetypes[0];
    const world = D.worlds.find(w=>w.id===state.world) || D.worlds[0];
    const co    = featuredCostar(state);

    const ctx = {
      you: state.name || "You",
      world: world.name,
      co: co ? co.name : null,
    };

    // two co-stars for romance-style choice sets
    const loveCandidates = state.cast.length>=2 ? state.cast : state.cast.concat(
      [{name: rnd(D.seedNames)},{name: rnd(D.seedNames)}]);
    ctx.a = loveCandidates[0] ? loveCandidates[0].name : rnd(D.seedNames);
    ctx.b = loveCandidates[1] ? loveCandidates[1].name : rnd(D.seedNames);

    const scenes = [];
    // cold open by archetype
    scenes.push({ t: fill(rnd(D.opens[arch.id]), ctx), cls:"" });
    // a directed beat (italic stage direction flavor)
    if(co){
      scenes.push({ t: fill(rnd(D.beats[co.rel]), {...ctx, co:co.name}), cls:"" });
    } else {
      scenes.push({ t: fill(rnd(D.solo), ctx), cls:"" });
    }

    const cliff = fill(rnd(D.cliffs), ctx);

    // choose a choice set; prefer romance set only if we have love-able cast
    let setPool = D.choiceSets.slice();
    if(state.cast.filter(c=>["love"].includes(c.rel)).length < 1){
      setPool = setPool.filter((_,i)=>i!==1); // drop the explicit "Choose {a}/{b}"
    }
    const set = rnd(setPool);
    const choices = set.map(c=>({
      t: fill(c.t, ctx),
      k: c.k, tag: c.tag, eff: c.eff,
      coId: co ? co.id : null,
    }));

    const title = `The ${rnd(D.titleA)} ${rnd(D.titleB)}`;
    const epNum = (state.episodes?.length || 0) + 1;

    return {
      num: epNum,
      title,
      badge: `S1 · EP ${epNum}`,
      world: world.name,
      grad: grad(arch.g),
      scenes,
      cliff,
      choices,
      coName: co ? co.name : null,
      ts: Date.now(),
    };
  }

  /* ---- score an episode's reach based on fans + choice ---- */
  function scoreEpisode(state, choice){
    const base = 40 + state.fans*rint(2,5);
    const mult = choice && choice.eff && choice.eff.fans ? choice.eff.fans : 1;
    const luck = 1 + (Math.random()*0.6 - 0.15);
    const views = Math.max(50, Math.round(base*mult*luck));
    const likes = Math.round(views*(0.18 + Math.random()*0.12));
    const newFans = Math.round(likes*(0.25 + Math.random()*0.2));
    const viral = views > 10000 || Math.random() < 0.06; // rare breakout
    return { views: viral?Math.max(views, rint(11000,48000)):views, likes, newFans, viral };
  }

  /* ---- apply a choice: mutate relationships + return summary ---- */
  function applyChoice(state, choice){
    const eff = choice.eff || {};
    // relationship drift on the featured co-star
    if(choice.coId){
      const c = state.cast.find(x=>x.id===choice.coId);
      if(c){
        ["ally","rival","love","secret"].forEach(r=>{ if(eff[r]) c.heat=(c.heat||0)+eff[r]; });
        // promote relationship if a stat got hot
        if(eff.love && (c.heat||0)>=3) c.rel="love";
        else if(eff.rival && (c.heat||0)>=3) c.rel="rival";
        else if(eff.ally) c.rel = c.rel==="rival"?c.rel:"ally";
        else if(eff.secret) c.rel = "secret";
      }
    }
    const score = scoreEpisode(state, choice);
    state.fans   += score.newFans;
    state.views  += score.views;
    state.likes  += score.likes;
    return score;
  }

  /* ---- simulate the world while the player was away ---- */
  function runWhileAway(state){
    const last = state.lastSeen || Date.now();
    const hrs = (Date.now()-last)/3.6e6;
    if(hrs < 0.0001) return null;
    // accrue passive fans + a "what you missed" headline
    const drift = Math.round(state.fans * Math.min(hrs,18) * 0.012);
    state.fans += drift;
    const co = state.cast.length ? rnd(state.cast) : null;
    const missed = co
      ? rnd([
          `While you were gone, ${co.name} made a move. The fans are losing it.`,
          `${co.name} dropped a clip about you. ${rint(2,40)}k views and climbing.`,
          `A rumor about you and ${co.name} is trending across ${state.worldName}.`,
        ])
      : rnd([
          `Your last cliffhanger blew up overnight. New fans are waiting.`,
          `Someone re-cut your episode. It's spreading beyond the app.`,
        ]);
    return { drift, missed, hrs };
  }

  /* ---- trending feed: your clips mixed with the "world" ---- */
  function buildFeed(state){
    const items = [];
    // your best episodes first
    (state.episodes||[]).slice(-4).reverse().forEach(ep=>{
      items.push({
        mine:true, who:`@${(state.name||"you").toLowerCase().replace(/\s/g,"")}`,
        title: ep.title, views: ep.views||0, likes: ep.likes||0,
        grad: ep.grad,
      });
    });
    // world clips
    const worlds = D.worlds;
    for(let i=0;i<10;i++){
      const w = rnd(worlds);
      items.push({
        mine:false, who: rnd(D.feedNames),
        title: rnd(D.feedTitles),
        views: rint(2,900)*1000 + rint(0,999),
        likes: rint(1,300)*1000,
        grad: grad(w.g),
      });
    }
    return items;
  }

  window.LORE_ENGINE = {
    generateEpisode, applyChoice, scoreEpisode, runWhileAway,
    buildFeed, tierForFans, nextTier, grad, rnd, rint
  };
})();
