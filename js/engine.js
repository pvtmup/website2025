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
      .replace(/\{world2\}/g, ctx.world2 || "another world")
      .replace(/\{world\}/g, ctx.world)
      .replace(/\{co\}/g, ctx.co ? `<span class="nm">${ctx.co}</span>` : "someone")
      .replace(/\{a\}/g, ctx.a || "them")
      .replace(/\{b\}/g, ctx.b || "the other one");
  }
  const grad = (c)=>`linear-gradient(155deg, ${c[0]}, ${c[1]})`;

  const accepted = (state)=> (state.cast||[]).filter(c=>c.status!=="pending");

  // pick a co-star to feature, biased toward unresolved tension
  function featuredCostar(state){
    const cast = accepted(state);
    if(!cast.length) return null;
    const weighted = cast.flatMap(c=>{
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
    const acc = accepted(state);
    const loveCandidates = acc.length>=2 ? acc : acc.concat(
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
    if(acc.filter(c=>["love"].includes(c.rel)).length < 1){
      setPool = setPool.filter((_,i)=>i!==1); // drop the explicit "Choose {a}/{b}"
    }
    const set = rnd(setPool);
    const choices = set.map(c=>({
      t: fill(c.t, ctx),
      k: c.k, tag: c.tag, eff: c.eff,
      coId: co ? co.id : null,
    }));

    const epNum = (state.episodes?.length || 0) + 1;
    const epInSeason = ((epNum-1) % 6) + 1;     // 6 episodes per season
    const season = Math.floor((epNum-1)/6) + 1;
    const isFinale = epInSeason === 6;
    const title = isFinale ? rnd(D.finaleTitles) : `The ${rnd(D.titleA)} ${rnd(D.titleB)}`;

    const palette = [arch.g[0], arch.g[1], arch.accent || world.g[1]];
    const art = window.LORE_ART
      ? window.LORE_ART.forEpisode({ title, world: world.id, palette })
      : grad(arch.g);

    return {
      num: epNum,
      season, epInSeason, isFinale,
      title,
      badge: `S${season} · EP ${epInSeason}`,
      world: world.name,
      worldId: world.id,
      palette,
      grad: grad(arch.g),
      art,
      scenes,
      cliff,
      choices,
      coName: co ? co.name : null,
      ts: Date.now(),
    };
  }

  /* ---- RETCON: rewrite the past, flip a co-star to villain ---- */
  function generateRetcon(state, costar){
    const arch  = D.archetypes.find(a=>a.id===state.archetype) || D.archetypes[0];
    const world = D.worlds.find(w=>w.id===state.world) || D.worlds[0];
    const ctx = { co: costar.name };
    const f = (t)=> t.replace(/\{co\}/g, `<span class="nm">${costar.name}</span>`);
    const ft = (t)=> t.replace(/\{co\}/g, costar.name);

    // the flip
    costar.rel = "rival"; costar.heat = (costar.heat||0) + 5;

    const epNum = (state.episodes?.length || 0) + 1;
    const epInSeason = ((epNum-1) % 6) + 1;
    const season = Math.floor((epNum-1)/6) + 1;
    const title = ft(rnd(D.retconTitles));
    const palette = [arch.g[0], "#3a0a14", "#ff4d6d"]; // villain-red accent
    const art = window.LORE_ART ? window.LORE_ART.forEpisode({ title, world: world.id, palette }) : grad(arch.g);

    return {
      num: epNum, season, epInSeason, isFinale:false, isRetcon:true,
      title, badge:`S${season} · RETCON`, world: world.name, worldId: world.id,
      palette, grad: grad(arch.g), art,
      scenes:[ {t:f(rnd(D.retconScenes)), cls:""} ],
      cliff: f(rnd(D.retconCliffs)),
      choices:[], coName: costar.name, chosen:"Rewrote the past",
      ts: Date.now(),
    };
  }

  /* ---- CURSED CROSSOVER: collide your world with another ---- */
  function generateCrossover(state){
    const arch  = D.archetypes.find(a=>a.id===state.archetype) || D.archetypes[0];
    const world = D.worlds.find(w=>w.id===state.world) || D.worlds[0];
    const others= D.worlds.filter(w=>w.id!==world.id);
    const w2    = rnd(others);
    const co    = featuredCostar(state);
    const ctx = { you: state.name||"You", world: world.name, world2: w2.name, co: co?co.name:null };

    const scenes = [ {t: fill(rnd(D.crossoverOpens), ctx), cls:""} ];
    scenes.push(co
      ? {t: fill(rnd(D.beats[co.rel]), {...ctx, co:co.name}), cls:""}
      : {t: fill(rnd(D.solo), ctx), cls:""});

    const set = D.choiceSets[3]; // chaos / power / honest
    const choices = set.map(c=>({ t: fill(c.t, ctx), k:c.k, tag:c.tag, eff:c.eff, coId: co?co.id:null }));

    const epNum = (state.episodes?.length||0)+1;
    const season= Math.floor((epNum-1)/6)+1;
    const title = `CROSSOVER: ${world.name} × ${w2.name}`;
    const palette = [arch.g[0], w2.g[1], arch.accent || "#a98bff"];
    const art = window.LORE_ART ? window.LORE_ART.forEpisode({title, world:w2.id, palette}) : grad(arch.g);

    return {
      num:epNum, season, epInSeason:((epNum-1)%6)+1, isCrossover:true,
      title, badge:`S${season} · CROSSOVER`, world:`${world.name} × ${w2.name}`, worldId:w2.id,
      palette, grad:grad(arch.g), art,
      scenes, cliff: fill(rnd(D.cliffs), ctx), choices,
      coName: co?co.name:null, ts:Date.now(),
    };
  }

  /* ---- CANON DUEL: contested event, the room votes a winner ---- */
  function resolveDuel(state, costar){
    const arch  = D.archetypes.find(a=>a.id===state.archetype) || D.archetypes[0];
    const world = D.worlds.find(w=>w.id===state.world) || D.worlds[0];
    const claim = rnd(D.duelClaims);
    const fill = (t)=> t.replace(/\{you\}/g, state.name||"You").replace(/\{co\}/g, costar.name);

    // your sway grows with status; clamp into a believable 35–80% band, + luck
    const tier = tierForFans(state.fans).id;          // 0..4
    let yourPct = 42 + tier*6 + (Math.random()*24 - 10);
    yourPct = Math.max(28, Math.min(86, Math.round(yourPct)));
    const won = yourPct >= 50;

    const epNum = (state.episodes?.length||0)+1;
    const season = Math.floor((epNum-1)/6)+1;
    const title = won ? "CANON DUEL: You Won" : "CANON DUEL: You Lost";
    const verdict = won
      ? `The room sided with you. Official record on "${claim.topic}": ${fill(claim.a)}`
      : `The room sided with ${costar.name}. Official record on "${claim.topic}": ${fill(claim.b)}`;
    const palette = won ? [arch.g[0], "#0d2a1a", "#19e6c1"] : [arch.g[0], "#2a0d12", "#ff6b3d"];
    const art = window.LORE_ART ? window.LORE_ART.forEpisode({title, world:world.id, palette}) : grad(arch.g);

    // relationship sours either way
    if(won){ costar.heat=(costar.heat||0)+2; if(costar.rel==="ally") costar.rel="rival"; }
    else { costar.heat=(costar.heat||0)+1; }

    const ep = {
      num:epNum, season, epInSeason:((epNum-1)%6)+1, isDuel:true, won,
      title, badge:`S${season} · DUEL`, world:world.name, worldId:world.id,
      palette, grad:grad(arch.g), art,
      scenes:[ {t:`<span class="nm">${state.name}</span> and <span class="nm">${costar.name}</span> told two different stories about ${claim.topic}. So the room voted.`, cls:""},
               {t:verdict, cls:"dir"} ],
      cliff: won ? `${costar.name} is fuming. A rematch is coming.` : `You got out-canoned. Everyone saw it.`,
      choices:[], coName:costar.name, chosen:(won?"Won the duel":"Lost the duel"),
      ts:Date.now(),
    };
    return { ep, won, yourPct, theirPct:100-yourPct, costarName:costar.name };
  }

  /* ---- LORE BUG BOUNTY: surface a funny showrunner slip ---- */
  function reportBug(state){
    const txt = rnd(D.loreBugs).replace(/\{you\}/g, state.name||"You");
    const bounty = 30 + rint(0, 80);
    return { txt, bounty };
  }

  /* ---- generate fan reactions for a played episode ---- */
  function genFanComments(state, ep, score){
    const co = ep.coName;
    const pool = [];
    const tones = ["hype","hype","shock"];
    if(co) tones.push("ship");
    if(ep.chosen && /betray|villain|burn/i.test(ep.chosen)) tones.push("villain");
    if(score && score.viral) tones.push("hype","shock");
    const n = Math.min(4, 2 + Math.floor(Math.random()*3));
    const used = new Set();
    for(let i=0;i<n;i++){
      const tone = rnd(tones);
      let txt = rnd(D.fanComments[tone] || D.fanComments.hype);
      txt = txt.replace(/\{you\}/g, state.name||"you").replace(/\{co\}/g, co||"them");
      let name = rnd(D.fanNames).replace(/\{you\}/g,(state.name||"you").toLowerCase().replace(/\s/g,""));
      if(used.has(name)) name = name+rint(1,99);
      used.add(name);
      pool.push({ name, txt, likes: rint(2,400) });
    }
    return pool;
  }

  /* ---- Writers' Room: pick today's prompt + simulated tallies ---- */
  function writersToday(state){
    const day = new Date().toDateString();
    const seed = (window.LORE_ART? window.LORE_ART.hashStr(day+(state.name||"")):day.length);
    const prompt = D.writersPrompts[seed % D.writersPrompts.length];
    const ctxName = state.name||"You";
    const options = prompt.options.map((o,i)=>({
      t: o.t.replace(/\{you\}/g, ctxName),
      eff: o.eff,
      votes: 800 + ((seed>>>(i*5)) % 9000),
    }));
    return { setup: prompt.setup.replace(/\{you\}/g, ctxName), options, day };
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
    const acc = accepted(state);
    const co = acc.length ? rnd(acc) : null;
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
        art: ep.art || grad(ep.palette||["#222","#111"]),
      });
    });
    // world clips
    const worlds = D.worlds;
    for(let i=0;i<10;i++){
      const w = rnd(worlds);
      const title = rnd(D.feedTitles);
      const art = window.LORE_ART
        ? window.LORE_ART.forEpisode({ title, world:w.id, palette:[w.g[0],w.g[1],"#ff7eb6"] })
        : grad(w.g);
      items.push({
        mine:false, who: rnd(D.feedNames),
        title,
        views: rint(2,900)*1000 + rint(0,999),
        likes: rint(1,300)*1000,
        art,
      });
    }
    return items;
  }

  window.LORE_ENGINE = {
    generateEpisode, applyChoice, scoreEpisode, runWhileAway,
    buildFeed, tierForFans, nextTier, grad, rnd, rint,
    genFanComments, writersToday, generateRetcon, resolveDuel, reportBug,
    generateCrossover
  };
})();
