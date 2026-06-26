      const observer=new IntersectionObserver(entries=>{

      entries.forEach(entry=>{

      if(entry.isIntersecting){

      entry.target.classList.add("visible");

      }

      });

      },{threshold:.15});

      document.querySelectorAll(".fade-in").forEach(el=>{

      observer.observe(el);

      });
 // ── Color lerp helper ──
    function lerpColor(c1, c2, t) {
      const p1=parseInt(c1.slice(1),16), p2=parseInt(c2.slice(1),16);
      const r=Math.round(((p1>>16)&255)+t*(((p2>>16)&255)-((p1>>16)&255)));
      const g=Math.round(((p1>>8)&255)+t*(((p2>>8)&255)-((p1>>8)&255)));
      const b=Math.round((p1&255)+t*((p2&255)-(p1&255)));
      return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
    }

    // ── Intersection fade-in ──
    const fadeEls = document.querySelectorAll('.fade-in');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e,i) => {
        if (e.isIntersecting) { setTimeout(()=>e.target.classList.add('visible'), i*90); io.unobserve(e.target); }
      });
    }, {threshold:0.12});
    fadeEls.forEach(el=>io.observe(el));

    // ── Refs ──
    const root = document.documentElement;
    const pText = document.getElementById('p-text');
    const pCard = document.getElementById('p-card');
    const pStats = document.getElementById('p-stats');
    const pHow = document.getElementById('p-how');
    const pFeatures = document.getElementById('p-features');
    const steps = [document.getElementById('step-1'),document.getElementById('step-2'),document.getElementById('step-3')];
    const features = document.querySelectorAll('.feature');

    // ── Section parallax helper ──
    function secPct(el) {
      const r=el.getBoundingClientRect(), h=window.innerHeight;
      return Math.min(Math.max(1-(r.bottom/(h+r.height)),0),1);
    }

    let ticking=false;
    window.addEventListener('scroll',()=>{ if(!ticking){ requestAnimationFrame(tick); ticking=true; } },{passive:true});

    function tick() {
      ticking=false;
      const sy=window.scrollY, wh=window.innerHeight;

      // Hero parallax + bg fade
      const hp=Math.min(sy/wh,1);
      root.style.setProperty('--bg-current', lerpColor('#1c1c1c','#0a1505',hp));
      if(sy<wh*1.5){
        pText.style.transform='translate3d(0,'+(sy*0.25)+'px,0)';
        pCard.style.transform='translate3d(0,'+(sy*-0.15)+'px,0)';
      }

      // Stats parallax
      pStats.style.transform='translate3d(0,'+(secPct(pStats)*-28)+'px,0)';

      // How it works section + stagger steps
      pHow.style.transform='translate3d(0,'+(secPct(pHow)*-22)+'px,0)';
      steps.forEach((s,i)=>{ s.style.transform='translate3d(0,'+(secPct(s)*(-(18+i*10)))+'px,0)'; });

      // Features section + stagger cards
      pFeatures.style.transform='translate3d(0,'+(secPct(pFeatures)*-20)+'px,0)';
      features.forEach((f,i)=>{ f.style.transform='translate3d(0,'+(secPct(f)*(-(12+i*4)))+'px,0)'; });
    }

    tick(); // initial call
  
