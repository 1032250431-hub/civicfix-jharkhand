/* CivicFix final product cleanup — remove unsupported metrics and retired Watch Case UI. */
(function(){
  "use strict";
  const STYLE_ID="cf-final-product-cleanup";

  function installStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      /* The citizen dashboard intentionally has three grounded command metrics. */
      .df-citizen .df-command{grid-template-columns:repeat(3,minmax(0,1fr))!important}
      .df-citizen .df-hero-actions .secondary{display:none!important}
      @media(max-width:800px){.df-citizen .df-command{grid-template-columns:1fr 1fr!important}}
      @media(max-width:390px){.df-citizen .df-command{grid-template-columns:1fr!important}}
      /* Watch Case was retired; never leave a stale panel visible. */
      .cf-watch-panel,#cf-watch-panel,.watch-panel,.watching-panel,[data-watch-panel]{display:none!important}
    `;
    document.head.appendChild(s);
  }

  function removeUnsupportedUI(){
    document.querySelectorAll(".df-citizen .df-command-tile").forEach(tile=>{
      const text=(tile.textContent||"").toLowerCase();
      if(text.includes("impact points") || text.includes("community signal")) tile.remove();
    });
    document.querySelectorAll(".df-citizen .df-kpi").forEach(tile=>{
      const text=(tile.textContent||"").toLowerCase();
      if(text.includes("combined case impact") || text.trim().startsWith("impact")) tile.remove();
    });

    /* Remove any legacy Watch Case/Watching block that survived an old renderer. */
    document.querySelectorAll("section,div,article").forEach(el=>{
      if(el.closest("nav,header,.card")) return;
      const text=(el.textContent||"").trim();
      if(text.length>0 && text.length<260 && /^watching\b/i.test(text)) el.remove();
    });
  }

  function install(){
    installStyle();
    removeUnsupportedUI();
    if(typeof window.cfWatchPanel!=="undefined") window.cfWatchPanel=()=>"";
    const observer=new MutationObserver(()=>removeUnsupportedUI());
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),15000);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",install,{once:true});
  else install();
})();
