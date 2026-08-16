/* CivicFix master entrypoint. Compatibility + dashboard + final presentation layers. */
(function(){
  "use strict";
  function load(src){
    return new Promise((resolve,reject)=>{
      const s=document.createElement("script");
      s.src=src;s.async=false;s.onload=resolve;s.onerror=reject;
      (document.body||document.head||document.documentElement).appendChild(s);
    });
  }
  load("/master-compat.js?v=2026-08-16-mastercompat1")
    .then(()=>load("/dashboard-final.js?v=2026-08-16-dashboard4"))
    .then(()=>load("/customer-care-dedupe.js?v=2026-08-16-cc1"))
    .then(()=>load("/visual-final.js?v=2026-08-16-visual1"))
    .catch(err=>console.error("CivicFix master layers failed to load",err));
})();
