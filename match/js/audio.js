/* МЭТЧ — мини WebAudio */
(function(){
  let ctx=null, on=(localStorage.getItem("match.sound")!=="0");
  const ac=()=>{ if(!ctx){ try{ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){} } return ctx; };
  function tone(f,d,t="sine",v=0.05,s){ if(!on)return; const c=ac(); if(!c)return; const n=c.currentTime,o=c.createOscillator(),g=c.createGain();
    o.type=t;o.frequency.setValueAtTime(f,n); if(s)o.frequency.exponentialRampToValueAtTime(s,n+d);
    g.gain.setValueAtTime(0,n);g.gain.linearRampToValueAtTime(v,n+0.01);g.gain.exponentialRampToValueAtTime(1e-4,n+d);
    o.connect(g);g.connect(c.destination);o.start(n);o.stop(n+d+0.02); }
  const fx={ swap(){tone(420,.07,"triangle",.04,560);}, bad(){tone(180,.12,"sawtooth",.04,120);},
    clear(ch){ const b=500+Math.min(ch,8)*70; tone(b,.1,"sine",.05,b*1.4); if(ch>1)setTimeout(()=>tone(b*1.5,.1,"sine",.04),50);},
    over(){ [330,247,196].forEach((f,i)=>setTimeout(()=>tone(f,.2,"sawtooth",.05),i*100)); } };
  function setOn(v){ on=!!v; localStorage.setItem("match.sound",on?"1":"0"); }
  function isOn(){ return on; }
  window.MATCH_AUDIO={ fx,setOn,isOn };
  window.addEventListener("pointerdown",()=>{ const c=ac(); if(c&&c.state==="suspended")c.resume(); });
})();
