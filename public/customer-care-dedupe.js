/* CivicFix — remove duplicate Customer Care CTA from the citizen hero.
   Navigation already provides the canonical Customer Care entry point. */
(function(){
  "use strict";
  const removeDuplicate=()=>{
    document.querySelectorAll('.df-citizen .df-hero-actions button.secondary').forEach(btn=>{
      if((btn.textContent||'').trim().toLowerCase()==='customer care') btn.remove();
    });
  };
  const observer=new MutationObserver(removeDuplicate);
  observer.observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',removeDuplicate,{once:true});
  else removeDuplicate();
})();
