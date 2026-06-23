/* ============================================================
   LORE — tiny WebAudio FX (no assets). Premium micro-feedback.
   ============================================================ */
(function(){
  let ctx=null, on = (localStorage.getItem("lore.sound")!=="0");
  const ac = ()=>{ if(!ctx){ try{ ctx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } return ctx; };

  function tone(freq, dur, type="sine", vol=0.06, slideTo){
    if(!on) return; const c=ac(); if(!c) return;
    const t=c.currentTime, o=c.createOscillator(), g=c.createGain();
    o.type=type; o.frequency.setValueAtTime(freq,t);
    if(slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t+dur);
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t+dur+0.02);
  }
  const fx = {
    tap(){ tone(420, .07, "triangle", .04); },
    pick(){ tone(620, .09, "sine", .05, 880); },
    whoosh(){ tone(180, .25, "sawtooth", .03, 60); },
    fans(){ tone(700,.08,"sine",.05,1040); setTimeout(()=>tone(1040,.1,"sine",.045,1320),60); },
    viral(){ [523,659,784,1046].forEach((f,i)=>setTimeout(()=>tone(f,.18,"triangle",.06),i*70)); },
    level(){ [392,523,659,880].forEach((f,i)=>setTimeout(()=>tone(f,.22,"sine",.06),i*90)); },
    achieve(){ [659,988,1318].forEach((f,i)=>setTimeout(()=>tone(f,.2,"triangle",.06),i*80)); },
    error(){ tone(160,.18,"square",.04,120); },
  };
  function setOn(v){ on=!!v; localStorage.setItem("lore.sound", on?"1":"0"); if(on) fx.pick(); }
  function isOn(){ return on; }

  window.LORE_AUDIO = { fx, setOn, isOn };
  // unlock audio on first gesture
  window.addEventListener("pointerdown", ()=>{ const c=ac(); if(c&&c.state==="suspended") c.resume(); }, {once:false});
})();
