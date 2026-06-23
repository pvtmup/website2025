/* ============================================================
   LORE — persistent state (localStorage)
   Makes the world feel like it kept living between visits.
   ============================================================ */
(function(){
  const KEY = "lore.save.v1";

  const fresh = ()=>({
    onboarded:false,
    name:"", archetype:null, world:null, worldName:"",
    vibe:"", // free-text "who do you want to be"
    cast:[],            // {id,name,rel,heat}
    activeEp:null,      // the unplayed episode awaiting a choice
    episodes:[],        // generated + played
    fans:0, views:0, likes:0,
    achievements:[],    // ids
    streak:1, lastDay:null,
    writersDay:null, writersChoice:null,  // daily Writers' Room vote
    sabotageDay:null, pendingTwist:null,  // anonymous twist injected into next episode
    plus:false,
    lastSeen:Date.now(),
    created:Date.now(),
  });

  let state = load();

  function load(){
    try{
      const raw = localStorage.getItem(KEY);
      if(!raw) return fresh();
      return Object.assign(fresh(), JSON.parse(raw));
    }catch(e){ return fresh(); }
  }
  function save(){
    state.lastSeen = Date.now();
    try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){}
  }
  function reset(){ state = fresh(); save(); }

  function addCostar(name, rel, status){
    const id = "c"+Date.now()+Math.floor(Math.random()*99);
    const code = Math.random().toString(36).slice(2,8).toUpperCase();
    const c = { id, code, name:name.trim().slice(0,18)||"Guest", rel:rel||"ally", heat:0,
                status: status || "pending" };
    state.cast.push(c);
    save();
    return c;
  }
  function acceptCostar(id){
    const c = state.cast.find(x=>x.id===id);
    if(c){ c.status="active"; save(); }
    return c;
  }
  // accepted co-stars (treat legacy entries without status as active)
  function activeCast(){ return state.cast.filter(c=>c.status!=="pending"); }

  function unlock(id){
    if(state.achievements.includes(id)) return false;
    state.achievements.push(id); save();
    return true;
  }

  // daily streak check
  function touchDay(){
    const today = new Date().toDateString();
    if(state.lastDay && state.lastDay!==today){
      const diff = (new Date(today)-new Date(state.lastDay))/8.64e7;
      state.streak = diff<=1.5 ? (state.streak||1)+1 : 1;
    }
    state.lastDay = today; save();
  }

  // pretty numbers: 1200 -> 1.2k
  function fmt(n){
    n = Math.round(n||0);
    if(n>=1e6) return (n/1e6).toFixed(n%1e6?1:0)+"M";
    if(n>=1e3) return (n/1e3).toFixed(n%1e3?1:0)+"k";
    return ""+n;
  }

  window.LORE_STORE = {
    get state(){ return state; },
    save, reset, addCostar, acceptCostar, activeCast, unlock, touchDay, fmt,
  };
})();
