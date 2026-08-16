/* Final UI cleanup: retired Watching/Watch Case feature is intentionally removed. */
(function(){
  "use strict";
  window.cfWatchPanel=function(){return "";};
  window.cfWatchCase=function(){return "";};
  function purge(){
    document.querySelectorAll('.watching-section,.watch-section,[data-feature="watching"],[data-feature="watch-case"]').forEach(n=>n.remove());
    document.querySelectorAll('button,a').forEach(n=>{
      const t=(n.textContent||"").trim().toLowerCase();
      if(t==='watch case'||t==='watching')n.remove();
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',purge);else purge();
  const oldRender=window.render;
  if(typeof oldRender==='function'&&!window.__cfLegacyCleanupRender){
    window.__cfLegacyCleanupRender=true;
    window.render=function(){const r=oldRender.apply(this,arguments);setTimeout(purge,20);return r;};
  }
})();
