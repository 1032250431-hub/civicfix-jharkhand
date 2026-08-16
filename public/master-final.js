/* CivicFix master entrypoint. Compatibility, dashboards, cleanup, final interaction fixes, then install support. */
(function(){
  "use strict";
  function load(src){return new Promise((resolve,reject)=>{const s=document.createElement("script");s.src=src;s.async=false;s.onload=resolve;s.onerror=reject;(document.body||document.head||document.documentElement).appendChild(s)})}
  load("/master-compat.js?v=2026-08-16-mastercompat1")
    .then(()=>load("/dashboard-final.js?v=2026-08-16-dashboard3"))
    .then(()=>load("/customer-care-dedupe.js?v=2026-08-16-cc1"))
    .then(()=>load("/duplicate-final.js?v=2026-08-17-dupdeck2"))
    .then(()=>load("/legacy-ui-cleanup.js?v=2026-08-17-cleanup1"))
    .then(()=>load("/duplicate-apple-final.js?v=2026-08-17-widgetstack1"))
    .then(()=>load("/duplicate-stack-polish.js?v=2026-08-17-stack3"))
    .then(()=>load("/final-product-cleanup.js?v=2026-08-17-product1"))
    .then(()=>load("/duplicate-stack-final.js?v=2026-08-17-stack4"))
    .then(()=>load("/voice-final-fix.js?v=2026-08-17-voice4"))
    .then(()=>load("/install-pwa.js?v=2026-08-17-pwa1"))
    .catch(err=>console.error("CivicFix master layers failed to load",err));
})();
