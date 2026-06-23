/* ============================================================
   LORE — optional LIVE generation via Claude API
   Off by default. If the user adds a key in Settings and toggles
   "Live AI", episodes are written by Claude. Always falls back to
   the local showrunner engine on any error (offline-safe).
   ============================================================ */
(function(){
  const LS_KEY="lore.anthropic.key", LS_ON="lore.ai.on", LS_MODEL="lore.ai.model";
  const DEFAULT_MODEL="claude-haiku-4-5-20251001";

  const get =(k,d)=>{ try{return localStorage.getItem(k)??d;}catch(e){return d;} };
  const set =(k,v)=>{ try{localStorage.setItem(k,v);}catch(e){} };

  function enabled(){ return get(LS_ON,"0")==="1" && !!get(LS_KEY,""); }
  function hasKey(){ return !!get(LS_KEY,""); }
  function setKey(v){ set(LS_KEY,(v||"").trim()); }
  function setOn(v){ set(LS_ON, v?"1":"0"); }
  function isOn(){ return get(LS_ON,"0")==="1"; }
  function model(){ return get(LS_MODEL, DEFAULT_MODEL); }
  function setModel(m){ set(LS_MODEL, m||DEFAULT_MODEL); }

  function buildPrompt(state){
    const D=window.LORE_DATA;
    const arch=(D.archetypes.find(a=>a.id===state.archetype)||{}).name||"a protagonist";
    const world=state.worldName||"a vivid world";
    const cast=(state.cast||[]).map(c=>`${c.name} (${c.rel})`).join(", ")||"no co-stars yet";
    const recent=(state.episodes||[]).slice(-2).map(e=>e.title).join("; ")||"none";
    return `You are the AI SHOWRUNNER of an addictive vertical drama series. Write the next 60-second episode.
Protagonist: ${state.name} — archetype "${arch}". World: ${world}. Co-stars: ${cast}. Recent episodes: ${recent}.
Tone: cinematic, teen-to-young-adult, high-tension, soapy, PG-13 (romance/rivalry/secrets, no explicit content).
Return ONLY minified JSON, no prose, with this exact shape:
{"title":"The X Y (max 4 words)","scenes":["sentence 1","sentence 2"],"cliff":"one shocking cliffhanger sentence","choices":[{"t":"choice text","tag":"bold|sly|chaos|romance|villain|power|loyal|honest","fans":1.4},{"t":"...","tag":"...","fans":1.0},{"t":"...","tag":"...","fans":1.7}]}
Use the protagonist's and co-stars' names. Make every choice feel consequential.`;
  }

  async function generate(state){
    const key=get(LS_KEY,""); if(!key) throw new Error("no key");
    const res=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{
        "content-type":"application/json",
        "x-api-key":key,
        "anthropic-version":"2023-06-01",
        "anthropic-dangerous-direct-browser-access":"true",
      },
      body:JSON.stringify({
        model:model(), max_tokens:700, temperature:1,
        messages:[{role:"user",content:buildPrompt(state)}],
      }),
    });
    if(!res.ok) throw new Error("api "+res.status);
    const data=await res.json();
    const text=(data.content||[]).map(c=>c.text||"").join("");
    const json=JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}")+1));
    return normalize(json);
  }

  // map Claude JSON onto the engine's episode shape (+ art/season metadata)
  function normalize(j){
    const D=window.LORE_DATA, ART=window.LORE_ART;
    const kmap={bold:"🔥",sly:"🌙",chaos:"🎭",romance:"💗",villain:"🗡️",power:"👑",loyal:"🤝",honest:"🕊️"};
    return {
      _ai:true,
      title:(j.title||"The Untitled Hour").slice(0,40),
      scenes:(j.scenes||[]).slice(0,3).map(t=>({t:String(t),cls:""})),
      cliff:String(j.cliff||"To be continued..."),
      choices:(j.choices||[]).slice(0,3).map(c=>({
        t:String(c.t||"Make a move"), k:kmap[c.tag]||"✦", tag:c.tag||"bold",
        eff:{fans: typeof c.fans==="number"?c.fans:1.2},
      })),
    };
  }

  // public: returns full episode obj or null (caller falls back to engine)
  async function tryGenerate(state){
    if(!enabled()) return null;
    try{
      const E=window.LORE_ENGINE, ART=window.LORE_ART, D=window.LORE_DATA;
      const ai=await generate(state);
      const base=E.generateEpisode(state);  // gives season/art/palette scaffolding
      // merge AI content over scaffolding
      base.title=ai.title; base.scenes=ai.scenes; base.cliff=ai.cliff; base.choices=ai.choices; base._ai=true;
      if(ART){ base.art=ART.forEpisode({title:base.title, world:base.worldId, palette:base.palette}); }
      // featured co-star name if any referenced
      return base;
    }catch(e){ console.warn("LORE AI fallback:", e.message); return null; }
  }

  async function test(){
    const key=get(LS_KEY,""); if(!key) return {ok:false,msg:"No API key"};
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",
        headers:{"content-type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({model:model(),max_tokens:16,messages:[{role:"user",content:"Reply with the single word: ok"}]})});
      if(!res.ok) return {ok:false,msg:"HTTP "+res.status};
      return {ok:true,msg:"Connected · "+model()};
    }catch(e){ return {ok:false,msg:e.message}; }
  }

  window.LORE_AI={ tryGenerate, enabled, hasKey, setKey, setOn, isOn, model, setModel, test, DEFAULT_MODEL };
})();
