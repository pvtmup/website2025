/* СТЭК — WebAudio FX (без ассетов) */
(function(){
  let ctx=null;
  const S = ()=>window.STACK_STORE;
  const ac=()=>{ if(!ctx){ try{ ctx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } return ctx; };
  function on(){ return !S() || S().s.sound; }
  function tone(freq,dur,type="sine",vol=0.05,slide){
    if(!on()) return; const c=ac(); if(!c) return;
    const t=c.currentTime,o=c.createOscillator(),g=c.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,t);
    if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+dur);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+dur+0.02);
  }
  const fx={
    place(combo){ const base=420+Math.min(18,combo||0)*40; tone(base,.09,"triangle",.05,base*1.3); },
    perfect(combo){ const b=560+Math.min(20,combo||0)*45; tone(b,.12,"sine",.06,b*1.5); setTimeout(()=>tone(b*1.5,.1,"sine",.05),50); },
    slice(){ tone(220,.12,"sawtooth",.035,90); },
    over(){ [330,247,196].forEach((f,i)=>setTimeout(()=>tone(f,.22,"sawtooth",.05),i*110)); },
    coin(){ tone(880,.07,"square",.04,1320); setTimeout(()=>tone(1320,.08,"square",.035),60); },
    tap(){ tone(400,.05,"triangle",.03); },
    win(){ [523,659,784,1046,1318].forEach((f,i)=>setTimeout(()=>tone(f,.16,"triangle",.06),i*70)); },
  };
  window.STACK_AUDIO={ fx };
  window.addEventListener("pointerdown",()=>{ const c=ac(); if(c&&c.state==="suspended")c.resume(); });

  /* ── генеративный бит: нарастает с высотой, уважает тумблер звука ── */
  const SCALE=[0,3,5,7,10]; // минорная пентатоника
  let musicOn=false, timer=null, noteT=0, step=0, getScore=()=>0;
  const mfreq=m=>440*Math.pow(2,(m-69)/12);
  function playAt(midi, when, dur, vol, type){
    const c=ac(); if(!c) return;
    const o=c.createOscillator(), g=c.createGain();
    o.type=type; o.frequency.setValueAtTime(mfreq(midi), when);
    g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol, when+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when+dur);
    o.connect(g); g.connect(c.destination); o.start(when); o.stop(when+dur+0.02);
  }
  function schedule(){
    if(!musicOn) return;
    if(!on()){ stopMusic(); return; }
    const c=ac(); if(!c) return;
    while(noteT < c.currentTime + 0.25){
      const sc=getScore()||0;
      const bpm=92 + Math.min(sc*2.2, 96);
      const beat=60/bpm/2;                 // восьмые
      const root=48;                        // C3
      const deg=SCALE[step%SCALE.length];
      if(step%4===0) playAt(root+deg-12, noteT, beat*0.95, 0.045, "sawtooth"); // бас
      else playAt(root+deg+(Math.floor(sc/12)%2?12:0), noteT, beat*0.7, 0.022, "triangle"); // арп
      noteT+=beat; step++;
    }
    timer=setTimeout(schedule, 45);
  }
  function startMusic(fn){
    if(!on()) return; const c=ac(); if(!c) return;
    getScore=fn||(()=>0); musicOn=true; step=0; noteT=c.currentTime+0.12; schedule();
  }
  function stopMusic(){ musicOn=false; if(timer){ clearTimeout(timer); timer=null; } }

  window.STACK_AUDIO.startMusic = startMusic;
  window.STACK_AUDIO.stopMusic = stopMusic;
})();
