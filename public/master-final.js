/* CivicFix master entrypoint. The dashboard layer is intentionally loaded last so role-specific UI and citizen resolution feedback override legacy presentation without changing core data services. */
(function(){
  "use strict";
  const script=document.createElement("script");
  script.src="/dashboard-final.js?v=2026-08-16-dashboard2";
  script.async=false;
  (document.body||document.head||document.documentElement).appendChild(script);
})();
