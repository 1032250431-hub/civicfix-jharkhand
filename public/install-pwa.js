/* CivicFix PWA install + service-worker registration. */
(function(){
  "use strict";
  let deferredPrompt=null;
  const STYLE_ID="cf-pwa-install-style";
  const BTN_ID="cfInstallApp";

  function installStyles(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement("style");s.id=STYLE_ID;s.textContent=`
      #${BTN_ID}{display:none;align-items:center;gap:7px;min-height:40px;padding:0 14px;border:1px solid rgba(255,255,255,.92);border-radius:13px;background:rgba(255,255,255,.78);color:#1769e0;font:800 12px/1 inherit;box-shadow:0 8px 22px rgba(23,105,224,.10),inset 0 1px rgba(255,255,255,.95);cursor:pointer;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);white-space:nowrap}
      #${BTN_ID}.show{display:inline-flex}
      #${BTN_ID}:active{transform:scale(.97)}
      .cf-pwa-install-bar{position:fixed;left:50%;bottom:18px;z-index:50000;transform:translate(-50%,12px);opacity:0;pointer-events:none;display:flex;align-items:center;gap:12px;width:min(440px,calc(100vw - 28px));padding:11px 12px;border:1px solid rgba(255,255,255,.88);border-radius:18px;background:rgba(248,252,255,.90);box-shadow:0 18px 45px rgba(20,67,125,.18),inset 0 1px rgba(255,255,255,.95);backdrop-filter:blur(24px) saturate(160%);-webkit-backdrop-filter:blur(24px);transition:opacity .28s ease,transform .28s ease}
      .cf-pwa-install-bar.show{opacity:1;transform:translate(-50%,0);pointer-events:auto}
      .cf-pwa-install-bar img{width:38px;height:38px;border-radius:11px;flex:none}.cf-pwa-install-copy{min-width:0;flex:1}.cf-pwa-install-copy b{display:block;font-size:12px;color:#16243a}.cf-pwa-install-copy span{display:block;margin-top:3px;font-size:10px;line-height:1.35;color:#667085}.cf-pwa-install-action{border:0;border-radius:11px;padding:9px 12px;background:#1769e0;color:#fff;font:800 10px/1 inherit;cursor:pointer;white-space:nowrap}.cf-pwa-close{border:0;background:transparent;color:#667085;font-size:18px;line-height:1;cursor:pointer;padding:3px}
      .cf-pwa-guide{position:fixed;inset:0;z-index:50001;display:none;place-items:center;padding:22px;background:rgba(15,27,48,.32);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}.cf-pwa-guide.show{display:grid}.cf-pwa-guide-card{width:min(390px,calc(100vw - 32px));padding:24px;border:1px solid rgba(255,255,255,.9);border-radius:24px;background:rgba(248,252,255,.94);box-shadow:0 28px 80px rgba(15,50,95,.24)}.cf-pwa-guide-card h3{margin:0 0 8px;color:#16243a;font-size:20px}.cf-pwa-guide-card p{margin:0;color:#667085;font-size:13px;line-height:1.5}.cf-pwa-guide-card .step{margin-top:14px;padding:11px 12px;border-radius:13px;background:rgba(255,255,255,.72);color:#26364d;font-size:12px;font-weight:700}.cf-pwa-guide-card button{margin-top:18px;width:100%;padding:12px;border:0;border-radius:13px;background:#1769e0;color:#fff;font:800 12px inherit}
      @media(max-width:600px){#${BTN_ID}{min-height:36px;padding:0 11px;font-size:11px}.cf-pwa-install-bar{bottom:12px}.cf-pwa-install-copy span{font-size:9px}}
    `;document.head.appendChild(s);
  }

  function makeButton(){
    if(document.getElementById(BTN_ID))return document.getElementById(BTN_ID);
    const b=document.createElement("button");b.id=BTN_ID;b.type="button";b.setAttribute("aria-label","Install CivicFix app");b.innerHTML='<span aria-hidden="true">⇩</span><span>Install app</span>';b.onclick=install;
    return b;
  }

  function addToHeader(){
    if(isStandalone())return true;
    const b=makeButton();
    const existing=document.querySelector("header .actions,header .top-actions,.top .actions,.nav-actions,.header-actions");
    if(existing){if(!existing.contains(b))existing.appendChild(b);b.classList.add("show");return true}
    const nav=document.querySelector("header nav,.top nav,.navbar,.nav,.topbar");
    if(nav){if(!nav.contains(b))nav.appendChild(b);b.classList.add("show");return true}
    const top=document.querySelector("header,.top");
    if(top){if(!top.contains(b))top.appendChild(b);b.classList.add("show");return true}
    return false;
  }

  function makeBar(){
    if(document.getElementById("cfPwaInstallBar"))return;
    const bar=document.createElement("div");bar.id="cfPwaInstallBar";bar.className="cf-pwa-install-bar";
    bar.innerHTML='<img src="/civicfix-icon.svg" alt=""><div class="cf-pwa-install-copy"><b>Install CivicFix</b><span>Keep CivicFix on your phone for one-tap access.</span></div><button class="cf-pwa-install-action" type="button">Install</button><button class="cf-pwa-close" type="button" aria-label="Dismiss">×</button>';
    bar.querySelector(".cf-pwa-install-action").onclick=install;bar.querySelector(".cf-pwa-close").onclick=()=>bar.classList.remove("show");document.body.appendChild(bar);
  }

  function showGuide(text){
    let g=document.getElementById("cfPwaGuide");
    if(!g){g=document.createElement("div");g.id="cfPwaGuide";g.className="cf-pwa-guide";g.innerHTML='<div class="cf-pwa-guide-card"><h3>Install CivicFix</h3><p class="cf-pwa-guide-text"></p><div class="step">1. Open your browser menu or Share menu.</div><div class="step">2. Choose “Install app” or “Add to Home Screen”.</div><div class="step">3. Open CivicFix from your home screen like a normal app.</div><button type="button">Got it</button></div>';g.querySelector("button").onclick=()=>g.classList.remove("show");document.body.appendChild(g)}
    g.querySelector(".cf-pwa-guide-text").textContent=text;g.classList.add("show");
  }

  async function install(){
    if(deferredPrompt){
      deferredPrompt.prompt();
      await deferredPrompt.userChoice.catch(()=>({outcome:"dismissed"}));
      deferredPrompt=null;document.querySelectorAll("#"+BTN_ID).forEach(b=>b.classList.remove("show"));document.getElementById("cfPwaInstallBar")?.classList.remove("show");return;
    }
    if(/iphone|ipad|ipod/i.test(navigator.userAgent)&&!window.MSStream){showGuide("On iPhone or iPad, use Share → Add to Home Screen. Safari will then place CivicFix on your home screen.");return}
    showGuide("Your browser has not exposed the automatic install prompt yet. Open the browser menu and choose Install app or Add to Home Screen.");
  }

  function isStandalone(){return window.matchMedia?.("(display-mode: standalone)").matches||navigator.standalone===true}

  function registerSW(){if(!("serviceWorker" in navigator))return;navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch(err=>console.warn("CivicFix service worker registration failed",err))}

  function init(){
    installStyles();registerSW();
    if(isStandalone())return;
    addToHeader();
    window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;addToHeader();makeBar();document.getElementById("cfPwaInstallBar")?.classList.add("show")});
    window.addEventListener("appinstalled",()=>{deferredPrompt=null;document.querySelectorAll("#"+BTN_ID).forEach(b=>b.classList.remove("show"));document.getElementById("cfPwaInstallBar")?.classList.remove("show")});
    let tries=0;const timer=setInterval(()=>{if(addToHeader()||++tries>20)clearInterval(timer)},500);
    setTimeout(()=>{if(!deferredPrompt&&!isStandalone()){addToHeader();if(/iphone|ipad|ipod/i.test(navigator.userAgent))makeBar()},1200);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
