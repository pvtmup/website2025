/* PRISM — мини WebAudio (без файлов, генерим тоны) */
(function(){
  let ctx=null, on=(localStorage.getItem("prism.sound")!=="0");
  const ac=()=>{ if(!ctx){ try{ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){} } return ctx; };
  function tone(f,d,t="sine",v=0.05,s){ if(!on)return; const c=ac(); if(!c)return;
    const n=c.currentTime,o=c.createOscillator(),g=c.createGain();
    o.type=t;o.frequency.setValueAtTime(f,n); if(s)o.frequency.exponentialRampToValueAtTime(s,n+d);
    g.gain.setValueAtTime(0,n);g.gain.linearRampToValueAtTime(v,n+0.01);g.gain.exponentialRampToValueAtTime(1e-4,n+d);
    o.connect(g);g.connect(c.destination);o.start(n);o.stop(n+d+0.02); }
  const fx={
    swap(){tone(440,.07,"triangle",.04,620);},
    bad(){tone(180,.12,"sawtooth",.04,120);},
    clear(ch){ const b=520+Math.min(ch,8)*72; tone(b,.1,"sine",.05,b*1.5); if(ch>1)setTimeout(()=>tone(b*1.6,.1,"triangle",.04),48);},
    boom(){tone(90,.22,"sawtooth",.06,40);},
    over(){ [340,255,200].forEach((f,i)=>setTimeout(()=>tone(f,.22,"sawtooth",.05),i*100)); }
  };
  function setOn(v){ on=!!v; localStorage.setItem("prism.sound",on?"1":"0"); }
  function isOn(){ return on; }
  window.PRISM_AUDIO={ fx,setOn,isOn };
  window.addEventListener("pointerdown",()=>{ const c=ac(); if(c&&c.state==="suspended")c.resume(); });
})();
