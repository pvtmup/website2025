/* СТЭК — покупки за Telegram Stars (XTR).
   Требует платёжный бэкенд (см. bot/payments.js): он создаёт invoice-ссылку,
   а Mini App открывает её через openInvoice. Без бэкенда/вне Telegram — фолбэк. */
(function(){
  /* ── ВСТАВЬ URL своего платёжного бэкенда после деплоя (см. LAUNCH.md) ──
     напр. "https://your-host.example/api". Пусто → покупки за Stars выключены,
     работает только внутриигровая валюта. */
  const PAY_API = "";

  // товары и цены в Stars (XTR). coins=сколько монет начислить (для паков)
  const PRODUCTS = {
    pass:   { title:"Премиум-пасс сезона", stars:150 },
    coins1: { title:"500 монет",  stars:75,  coins:500 },
    coins2: { title:"1500 монет", stars:199, coins:1500 },
  };

  function available(){
    const TG=window.STACK_TG;
    return !!(PAY_API && TG && TG.isTG && window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openInvoice);
  }

  // buy → "paid" | "cancelled" | "failed" | "pending" | "off"
  async function buy(productId){
    if(!available()) return "off";
    const wa=window.Telegram.WebApp;
    const initData = wa.initData || "";
    try{
      const r = await fetch(PAY_API+"/invoice?product="+encodeURIComponent(productId), {
        headers:{ "X-Init-Data": initData }   // бэкенд валидирует подпись Telegram
      });
      if(!r.ok) return "failed";
      const { link } = await r.json();
      if(!link) return "failed";
      return await new Promise(res=>{ wa.openInvoice(link, status=>res(status||"failed")); });
    }catch(e){ return "failed"; }
  }

  window.STACK_PAY = { PRODUCTS, available, buy };
})();
