/* СТЭК — интеграция с Telegram Mini App (с фолбэком на обычный браузер) */
(function(){
  const wa = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
  const isTG = !!(wa && wa.platform && wa.platform !== "unknown");

  /* ────────────────────────────────────────────────────────────
     ВАЖНО: после создания бота и Mini App в @BotFather укажи сюда
     ссылку на приложение, например "https://t.me/your_bot/stack".
     Тогда дуэли/инвайты будут открываться прямо внутри Telegram.
     Пусто → фолбэк на веб-ссылку GitHub Pages. (см. TELEGRAM.md)
  ──────────────────────────────────────────────────────────── */
  const APP_URL = "https://t.me/towerappbot";

  function ready(){
    if(!wa) return;
    try{
      wa.ready();
      wa.expand();
      if(wa.disableVerticalSwipes) wa.disableVerticalSwipes(); // не закрывать игру свайпом
      if(wa.setHeaderColor) wa.setHeaderColor("#0b0b16");
      if(wa.setBackgroundColor) wa.setBackgroundColor("#0b0b16");
    }catch(e){}
  }

  function user(){
    try{ const u = wa && wa.initDataUnsafe && wa.initDataUnsafe.user;
      return u ? (u.first_name || u.username || "") : ""; }catch(e){ return ""; }
  }
  function startParam(){
    try{ return (wa && wa.initDataUnsafe && wa.initDataUnsafe.start_param) || ""; }catch(e){ return ""; }
  }
  function langCode(){
    try{ return (wa && wa.initDataUnsafe && wa.initDataUnsafe.user && wa.initDataUnsafe.user.language_code) || ""; }catch(e){ return ""; }
  }

  // тактильная отдача
  function haptic(kind){
    try{
      const h = wa && wa.HapticFeedback; if(!h) return;
      if(kind==="light") h.impactOccurred("light");
      else if(kind==="medium") h.impactOccurred("medium");
      else if(kind==="rigid") h.impactOccurred("rigid");
      else if(kind==="success") h.notificationOccurred("success");
      else if(kind==="error") h.notificationOccurred("error");
    }catch(e){}
  }

  // дип-линк внутрь Mini App: startapp кодирует "d<seed>s<score>" / "ref"
  function deepLink(param){
    if(!APP_URL) return null;
    return APP_URL + "?startapp=" + encodeURIComponent(param);
  }
  // открыть нативный шер Telegram (выбор чата)
  function share(url, text){
    const link = "https://t.me/share/url?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(text);
    try{ if(wa && wa.openTelegramLink){ wa.openTelegramLink(link); return true; } }catch(e){}
    try{ if(wa && wa.openLink){ wa.openLink(link); return true; } }catch(e){}
    return false;
  }

  // Telegram CloudStorage — синхрон сейва между устройствами
  function cloudSet(key, val){
    try{ const cs = wa && wa.CloudStorage; if(cs && cs.setItem) cs.setItem(key, val, ()=>{}); }catch(e){}
  }
  function cloudGet(key, cb){
    try{ const cs = wa && wa.CloudStorage; if(cs && cs.getItem){ cs.getItem(key, (e,v)=>cb(e?null:v)); return; } }catch(e){}
    cb(null);
  }

  function back(show){ try{ const b=wa&&wa.BackButton; if(b){ show?b.show():b.hide(); } }catch(e){} }
  function onBack(cb){ try{ const b=wa&&wa.BackButton; if(b&&b.onClick) b.onClick(cb); }catch(e){} }

  window.STACK_TG = { isTG, ready, user, startParam, langCode, haptic, deepLink, share, cloudSet, cloudGet, back, onBack, APP_URL };
})();
