/* CivicFix Visual Final — performance-first glass motion + remove retired Watch Case UI. */
(function(){
  "use strict";
  const css=`
  /* Retired feature: Watch Case / Watching */
  #cf-watch-panel,.cf-watch-panel,[data-watch-case],.watching-section{display:none!important}

  /* Premium motion system: mostly transform/opacity so it stays GPU-friendly. */
  :root{--vf-blue:#1769e0;--vf-blue-hi:#67adff;--vf-ink:#122039}
  body{overflow-x:hidden}
  body:before,body:after{content:"";position:fixed;z-index:-2;pointer-events:none;border-radius:999px;filter:blur(70px);will-change:transform;opacity:.38}
  body:before{width:38vw;height:38vw;left:-15vw;top:-18vw;background:radial-gradient(circle,rgba(54,137,255,.32),transparent 68%);animation:vfFloatA 18s ease-in-out infinite alternate}
  body:after{width:34vw;height:34vw;right:-14vw;top:28vh;background:radial-gradient(circle,rgba(116,184,255,.24),transparent 68%);animation:vfFloatB 22s ease-in-out infinite alternate}
  @keyframes vfFloatA{to{transform:translate3d(7vw,5vh,0) scale(1.08)}}
  @keyframes vfFloatB{to{transform:translate3d(-6vw,-4vh,0) scale(1.12)}}

  /* Make existing glass surfaces feel layered instead of flat. */
  .df-hero,.df-panel,.df-kpi,.df-command-tile,.card,.modal-card,.modal,.map-wrap,.map-card{
    position:relative;isolation:isolate;overflow:hidden
  }
  .df-hero:before,.df-panel:before,.df-kpi:before,.df-command-tile:before,.card:before,.modal-card:before,.map-wrap:before,.map-card:before{
    content:"";position:absolute;inset:0;pointer-events:none;z-index:-1;border-radius:inherit;
    background:linear-gradient(120deg,rgba(255,255,255,.34),transparent 27%,transparent 72%,rgba(101,170,255,.08));
    opacity:.75
  }
  .df-hero:after{animation:vfOrb 9s ease-in-out infinite alternate;will-change:transform,opacity}
  @keyframes vfOrb{to{transform:translate3d(-34px,26px,0) scale(1.16);opacity:.68}}

  /* Entrance choreography — staggered but deliberately short. */
  .df-shell>.df-hero{animation:vfIn .62s cubic-bezier(.22,1,.36,1) both}
  .df-shell>.df-section{animation:vfIn .58s cubic-bezier(.22,1,.36,1) both}
  .df-shell>.df-section:nth-child(2){animation-delay:.06s}
  .df-shell>.df-section:nth-child(3){animation-delay:.11s}
  .df-shell>.df-section:nth-child(4){animation-delay:.16s}
  @keyframes vfIn{from{opacity:0;transform:translate3d(0,16px,0) scale(.985)}to{opacity:1;transform:none}}

  /* High-end interaction: magnetic-feeling lift, never scale-heavy. */
  .df-hero button,.df-panel button,.df-kpi,.df-command-tile,.df-priority-item,.df-job,.card,.nav button,.nav a{
    transition:transform .24s cubic-bezier(.22,1,.36,1),box-shadow .24s ease,background-color .24s ease,border-color .24s ease
  }
  .df-hero button:hover,.df-panel button:hover,.nav button:hover,.nav a:hover{transform:translateY(-2px)}
  .df-kpi:hover,.df-command-tile:hover,.df-priority-item:hover,.df-job:hover,.card:hover{transform:translateY(-3px)}
  .df-hero button:active,.df-panel button:active,.nav button:active,.nav a:active{transform:translateY(0) scale(.985);transition-duration:.08s}

  /* Premium blue: subtle moving highlight rather than a noisy gradient. */
  button.primary,.primary,.df-hero-actions .primary{
    position:relative;overflow:hidden;background:linear-gradient(115deg,#125ed0,#237be8 48%,#4d9cff);background-size:180% 100%;box-shadow:0 12px 30px rgba(23,105,224,.22),inset 0 1px rgba(255,255,255,.3);animation:vfBlue 7s ease-in-out infinite alternate
  }
  button.primary:after,.primary:after,.df-hero-actions .primary:after{content:"";position:absolute;inset:-80% -30%;background:linear-gradient(105deg,transparent 42%,rgba(255,255,255,.26) 50%,transparent 58%);transform:translateX(-65%);animation:vfSheen 5.8s ease-in-out infinite;pointer-events:none}
  @keyframes vfBlue{to{background-position:100% 0}}
  @keyframes vfSheen{0%,45%{transform:translateX(-65%)}72%,100%{transform:translateX(65%)}}

  /* Glass nav gets a quiet moving specular edge. */
  header,.topbar,.nav,.navbar{backdrop-filter:blur(26px) saturate(170%);-webkit-backdrop-filter:blur(26px) saturate(170%)}

  /* Map marker/cards get restrained depth instead of constant bouncing. */
  .leaflet-marker-icon{filter:drop-shadow(0 8px 9px rgba(15,54,104,.22));transition:filter .25s ease,transform .25s cubic-bezier(.22,1,.36,1)}
  .leaflet-marker-icon:hover{filter:drop-shadow(0 12px 15px rgba(15,54,104,.3))}

  /* Respect reduced-motion users and low-power devices. */
  @media(prefers-reduced-motion:reduce){*,*:before,*:after{animation-duration:.001ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.001ms!important}.df-shell>.df-hero,.df-shell>.df-section{animation:none!important}body:before,body:after{display:none}}
  @media(max-width:700px){body:before,body:after{filter:blur(50px);opacity:.24}.df-hero,.df-panel,.card{box-shadow:0 16px 40px rgba(31,91,176,.09)}}
  `;
  const s=document.createElement('style');s.id='cf-visual-final';s.textContent=css;document.head.appendChild(s);

  /* Patch the retired watcher before future renders can re-add it. */
  try{
    if(typeof window.cfWatchPanel==='function') window.cfWatchPanel=()=>'';
  }catch(e){}
  function removeRetired(){
    document.querySelectorAll('#cf-watch-panel,.cf-watch-panel,[data-watch-case],.watching-section').forEach(el=>el.remove());
    document.querySelectorAll('body *').forEach(el=>{
      if(el.children.length===0 && /^(Watching|Watch case)$/i.test((el.textContent||'').trim())){
        const p=el.closest('section,.df-section,.panel,.card')||el.parentElement;
        if(p && /watching|watch case/i.test(p.textContent||'')) p.remove();
      }
    });
  }
  removeRetired();
  let last=0;
  const obs=new MutationObserver(()=>{
    const now=performance.now();if(now-last<120)return;last=now;removeRetired();
  });
  obs.observe(document.body,{childList:true,subtree:true});
})();
