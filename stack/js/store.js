/* СТЭК — состояние (localStorage) */
(function(){
  const KEY = "stack.save.v1";
  const fresh = ()=>({
    best: 0,
    dailyKey: null, dailyBest: 0,
    coins: 0,
    owned: ["rainbow"], equipped: "rainbow",
    streak: 0, lastDay: null,
    name: "",
    games: 0,
    sound: true,
  });
  let s = load();
  function load(){ try{ const r=localStorage.getItem(KEY); return r?Object.assign(fresh(),JSON.parse(r)):fresh(); }catch(e){ return fresh(); } }
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(s)); }catch(e){} }
  function reset(){ s = fresh(); save(); }

  function addCoins(n){ s.coins = Math.max(0, s.coins + n); save(); }
  function own(id){ if(!s.owned.includes(id)) s.owned.push(id); save(); }
  function equip(id){ s.equipped = id; save(); }

  function touchDay(){
    const d = new Date(); const today = d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();
    if(s.lastDay && s.lastDay!==today){
      const diff = (new Date(today) - new Date(s.lastDay))/86400000;
      s.streak = diff<=1.5 ? (s.streak||0)+1 : 1;
    } else if(!s.lastDay){ s.streak = 1; }
    s.lastDay = today; save();
  }

  function fmt(n){ n=Math.round(n||0); if(n>=1e6)return (n/1e6).toFixed(1)+"M"; if(n>=1e3)return (n/1e3).toFixed(1)+"k"; return ""+n; }

  window.STACK_STORE = {
    get s(){ return s; },
    save, reset, addCoins, own, equip, touchDay, fmt,
  };
})();
