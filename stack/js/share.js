/* СТЭК — шеринг: ссылка-вызов по сиду + PNG-карточка результата */
(function(){
  const SK = window.STACK_SKINS;
  function baseUrl(){ return location.origin + location.pathname; }
  function challengeLink(seed, score){ return baseUrl() + "?seed=" + (seed>>>0) + (score!=null?("&s="+score):""); }

  function buildCard(score, seed, equippedId){
    const W=1080,H=1920, c=document.createElement("canvas"); c.width=W;c.height=H;
    const g=c.getContext("2d");
    const skin = SK.byId(equippedId||"rainbow");
    // фон-градиент
    const bg=g.createLinearGradient(0,0,0,H); bg.addColorStop(0,"#0b0b16"); bg.addColorStop(1,"#15101f");
    g.fillStyle=bg; g.fillRect(0,0,W,H);
    // мини-башня из скина
    const bw=420, bh=46; let x=(W-bw)/2;
    for(let i=0;i<16;i++){ const w=bw-Math.abs(8-i)*14; g.fillStyle=SK.colorFor(skin,i); g.fillRect((W-w)/2, 1180-i*bh, w, bh-6); }
    // лого
    g.fillStyle="#fff"; g.font="800 70px Inter,sans-serif"; g.textAlign="center";
    g.fillText("СТЭК", W/2, 200);
    g.fillStyle="#ffd66b"; g.font="700 36px Inter,sans-serif";
    g.fillText("башня в один тап", W/2, 250);
    // счёт
    g.fillStyle="#fff"; g.font="900 320px Inter,sans-serif"; g.fillText(""+score, W/2, 720);
    g.fillStyle="#9a98b4"; g.font="600 44px Inter,sans-serif"; g.fillText("мой результат", W/2, 790);
    // вызов
    g.fillStyle="#ff4d6d"; g.font="800 56px Inter,sans-serif"; g.fillText("ПОБЕЙ МЕНЯ 🧱", W/2, H-260);
    g.fillStyle="#c9c7e0"; g.font="500 38px Inter,sans-serif";
    g.fillText("та же башня по ссылке · честный матч", W/2, H-190);
    g.fillStyle="#5b5970"; g.font="600 34px Inter,sans-serif";
    g.fillText("играй в СТЭК", W/2, H-90);
    return c.toDataURL("image/png");
  }

  async function shareResult(score, seed, equippedId){
    const TG = window.STACK_TG;
    const tgLink = TG && TG.deepLink("d"+(seed>>>0)+"s"+score);
    const url = tgLink || challengeLink(seed, score);
    const text = `Я собрал ${score} в СТЭК 🧱 та же башня — побей меня:`;
    // внутри Telegram — нативный выбор чата
    if(TG && TG.isTG && TG.share(url, text)) return "вызов отправлен";
    const data = buildCard(score, seed, equippedId);
    try{
      if(navigator.canShare){
        const blob = await (await fetch(data)).blob();
        const file = new File([blob],"stack.png",{type:"image/png"});
        if(navigator.canShare({files:[file]})){ await navigator.share({files:[file], text:text+" "+url}); return "отправлено"; }
      }
      if(navigator.share){ await navigator.share({text, url}); return "отправлено"; }
    }catch(e){ if(e&&e.name==="AbortError") return "отмена"; }
    // фолбэк: скопировать ссылку + скачать картинку
    try{ await navigator.clipboard.writeText(url); }catch(e){}
    const a=document.createElement("a"); a.href=data; a.download="stack-"+score+".png"; a.click();
    return "ссылка скопирована";
  }

  function inviteLink(){ return baseUrl() + "?ref=" + Math.random().toString(36).slice(2,8); }
  async function shareInvite(){
    const TG = window.STACK_TG;
    const url = (TG && TG.deepLink("ref")) || inviteLink();
    const text = `Залетай в СТЭК — башня в один тап 🧱`;
    if(TG && TG.isTG && TG.share(url, text)) return "приглашение отправлено";
    try{ if(navigator.share){ await navigator.share({text,url}); return "отправлено"; } }catch(e){ if(e&&e.name==="AbortError") return "отмена"; }
    try{ await navigator.clipboard.writeText(url); return "ссылка скопирована"; }catch(e){ return url; }
  }

  window.STACK_SHARE = { challengeLink, shareResult, shareInvite, buildCard };
})();
