/* CivicFix PWA install + service-worker registration. */
(function(){
  "use strict";
  let deferredPrompt=null;
  const STYLE_ID="cf-pwa-install-style";
  const BTN_ID="cfInstallApp";

  function installStyles(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement("style");s.id=STYLE_ID;s.textContent=`
      #${BTN_ID}{display:none;align-items:center;gap:8px;min-height:40px;padding:0 15px;border:1px solid rgba(255,255,255,.9);border-radius:13px;background:rgba(255,255,255,.78);color:#1769e0;font:800 12px/1 inherit;box-shadow:0 8px 22px rgba(23,105,224,.10),inset 0 1px rgba(255,255,255,.95);cursor:pointer;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
      #${BTN_ID}.show{display:inline-flex}
      #${BTN_ID}:active{transform:scale(.97)}
      .cf-pwa-install-bar{position:fixed;left:50%;bottom:18px;z-index:50000;transform:translate(-50%,12px);opacity:0;pointer-events:none;display:flex;align-items:center;gap:12px;width:min(440px,calc(100vw - 28px));padding:11px 12px;border:1px solid rgba(255,255,255,.88);border-radius:18px;background:rgba(248,252,255,.88);box-shadow:0 18px 45px rgba(20,67,125,.18),inset 0 1px rgba(255,255,255,.95);backdrop-filter:blur(24px) saturate(160%);-webkit-backdrop-filter:blur(24px);transition:opacity .28s ease,transform .28s ease}
      .cf-pwa-install-bar.show{opacity:1;transform:translate(-50%,0);pointer-events:auto}
      .cf-pwa-install-bar img{width:38px;height:38px;border-radius:11px;flex:none}
      .cf-pwa-install-copy{min-width:0;flex:1}.cf-pwa-install-copy b{display:block;font-size:12px;color:#16243a}.cf-pwa-install-copy span{display:block;margin-top:3px;font-size:10px;line-height:1.35;color:#667085}
      .cf-pwa-install-action{border:0;border-radius:11px;padding:9px 12px;background:#1769e0;color:#fff;font:800 10px/1 inherit;cursor:pointer;white-space:nowrap}
      .cf-pwa-close{border:0;background:transparent;color:#667085;font-size:18px;line-height:1;cursor:pointer;padding:3px}
      @media(max-width:600px){.cf-pwa-install-bar{bottom:12px}.cf-pwa-install-copy span{font-size:9px}}
    `;document.head.appendChild(s);
  }

  function makeButton(){
    if(document.getElementById(BTN_ID))return document.getElementById(BTN_ID);
    const b=document.createElement("button");b.id=BTN_ID;b.type="button";b.setAttribute("aria-label","Install CivicFix app");b.innerHTML='<span aria-hidden="true">⇩</span><span>Install app</span>';
    b.onclick=install;return b;
  }

  function addToHeader(){
    const existing=document.querySelector("header .actions,header .top-actions,.top .actions,.nav-actions,.header-actions");
    if(existing){existing.appendChild(makeButton());return true}
    const top=document.querySelector("header,.top");
    if(top){top.appendChild(makeButton());return true}
    return false;
  }

  function makeBar(){
    if(document.getElementById("cfPwaInstallBar"))return;
    const bar=document.createElement("div");bar.id="cfPwaInstallBar";bar.className="cf-pwa-install-bar";
    bar.innerHTML='<img src="/civicfix-icon.svg" alt=""><div class="cf-pwa-install-copy"><b>Install CivicFix</b><span>Keep CivicFix on your phone for one-tap access.</span></div><button class="cf-pwa-install-action" type="button">Install</button><button class="cf-pwa-close" type="button" aria-label="Dismiss">×</button>';
    bar.querySelector(".cf-pwa-install-action").onclick=install;
    bar.querySelector(".cf-pwa-close").onclick=()=>bar.classList.remove("show");
    document.body.appendChild(bar);
  }

  async function install(){
    if(deferredPrompt){
      deferredPrompt.prompt();
      const result=await deferredPrompt.userChoice.catch(()=>({outcome:"dismissed"}));
      deferredPrompt=null;
      document.querySelectorAll("#"+BTN_ID).forEach(b=>b.classList.remove("show"));
      document.getElementById("cfPwaInstallBar")?.classList.remove("show");
      return result;
    }
    if(/iphone|ipad|ipod/i.test(navigator.userAgent)&&!window.MSStream){
      makeBar();
      const bar=document.getElementById("cfPwaInstallBar");
      bar.querySelector(".cf-pwa-install-copy span").textContent="Tap Share, then Add to Home Screen to install CivicFix.";
      bar.querySelector(".cf-pwa-install-action").style.display="none";
      bar.classList.add("show");
    }
  }

  function isStandalone(){return window.matchMedia?.("(display-mode: standalone)").matches||navigator.standalone===true}

  function registerSW(){
    if(!("serviceWorker" in navigator))return;
    navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch(err=>console.warn("CivicFix service worker registration failed",err));
  }

  function init(){
    installStyles();registerSW();
    if(isStandalone())return;
    window.addEventListener("beforeinstallprompt",e=>{
      e.preventDefault();deferredPrompt=e;
      const b=makeButton();b.classList.add("show");
      makeBar();document.getElementById("cfPwaInstallBar")?.classList.add("show");
    });
    window.addEventListener("appinstalled",()=>{deferredPrompt=null;document.querySelectorAll("#"+BTN_ID).forEach(b=>b.classList.remove("show"));document.getElementById("cfPwaInstallBar")?.classList.remove("show")});
    setTimeout(()=>{if(!deferredPrompt&&!isStandalone()&&/iphone|ipad|ipod/i.test(navigator.userAgent)){makeButton().classList.add("show");makeBar()},1200);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
