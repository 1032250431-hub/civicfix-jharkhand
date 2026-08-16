/* CivicFix PWA install support — native prompt first, graceful platform fallback. */
(function(){
  "use strict";

  let deferredPrompt = null;
  let observer = null;
  const STYLE_ID = "cf-pwa-install-style";
  const BTN_ID = "cfInstallApp";
  const BAR_ID = "cfPwaInstallBar";

  const isStandalone = () => !!(
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    (window.matchMedia && window.matchMedia("(display-mode: fullscreen)").matches) ||
    navigator.standalone === true
  );

  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent || "") && !window.MSStream;

  function styles(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      #${BTN_ID}{
        display:none;align-items:center;justify-content:center;gap:7px;
        min-height:38px;padding:0 13px;border:1px solid rgba(255,255,255,.9);
        border-radius:13px;background:rgba(255,255,255,.72);color:#1769e0;
        font:800 11px/1 inherit;box-shadow:0 7px 20px rgba(23,105,224,.10),inset 0 1px rgba(255,255,255,.95);
        cursor:pointer;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
        white-space:nowrap;transition:transform .22s cubic-bezier(.22,1,.36,1),box-shadow .22s ease,background .22s ease;
      }
      #${BTN_ID}.show{display:inline-flex}
      #${BTN_ID}:hover{background:rgba(255,255,255,.92);box-shadow:0 10px 28px rgba(23,105,224,.16);transform:translateY(-1px)}
      #${BTN_ID}:active{transform:scale(.96)}
      .cf-pwa-install-bar{
        position:fixed;left:50%;bottom:18px;z-index:50000;width:min(460px,calc(100vw - 28px));
        display:flex;align-items:center;gap:12px;padding:12px;opacity:0;pointer-events:none;
        transform:translate(-50%,14px) scale(.98);border:1px solid rgba(255,255,255,.88);border-radius:19px;
        background:rgba(248,252,255,.94);box-shadow:0 20px 55px rgba(20,67,125,.20),inset 0 1px rgba(255,255,255,.95);
        backdrop-filter:blur(24px) saturate(160%);-webkit-backdrop-filter:blur(24px);
        transition:opacity .28s ease,transform .28s cubic-bezier(.22,1,.36,1)
      }
      .cf-pwa-install-bar.show{opacity:1;pointer-events:auto;transform:translate(-50%,0) scale(1)}
      .cf-pwa-install-bar img{width:40px;height:40px;border-radius:11px;flex:none}
      .cf-pwa-install-copy{min-width:0;flex:1}.cf-pwa-install-copy b{display:block;font-size:12px;color:#16243a}
      .cf-pwa-install-copy span{display:block;margin-top:3px;font-size:10px;line-height:1.4;color:#667085}
      .cf-pwa-install-action{border:0;border-radius:11px;padding:10px 13px;background:#1769e0;color:#fff;font:800 10px/1 inherit;cursor:pointer;white-space:nowrap;box-shadow:0 6px 18px rgba(23,105,224,.22)}
      .cf-pwa-close{border:0;background:transparent;color:#667085;font-size:18px;line-height:1;cursor:pointer;padding:3px}
      .cf-pwa-guide{position:fixed;inset:0;z-index:50001;display:grid;place-items:center;padding:20px;background:rgba(15,27,48,.30);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);opacity:0;pointer-events:none;transition:opacity .25s ease}
      .cf-pwa-guide.show{opacity:1;pointer-events:auto}.cf-pwa-guide-card{width:min(390px,calc(100vw - 32px));padding:24px;border:1px solid rgba(255,255,255,.9);border-radius:24px;background:rgba(248,252,255,.96);box-shadow:0 28px 80px rgba(15,50,95,.24)}
      .cf-pwa-guide-card h3{margin:0 0 8px;color:#16243a;font-size:20px}.cf-pwa-guide-card p{margin:0;color:#667085;font-size:13px;line-height:1.5}
      .cf-pwa-guide-card button{margin-top:18px;width:100%;padding:12px;border:0;border-radius:13px;background:#1769e0;color:#fff;font:800 12px inherit}
      @media(max-width:700px){#${BTN_ID}{min-height:36px;padding:0 10px;font-size:10px}.cf-pwa-install-bar{bottom:12px}.cf-pwa-install-copy span{font-size:9px}}
    `;
    document.head.appendChild(s);
  }

  function makeButton(){
    let b=document.getElementById(BTN_ID);
    if(b) return b;
    b=document.createElement("button");
    b.id=BTN_ID;b.type="button";
    b.setAttribute("aria-label","Install CivicFix app");
    b.innerHTML='<span aria-hidden="true">⇩</span><span>Install app</span>';
    b.addEventListener("click",install);
    return b;
  }

  function placeButton(){
    if(isStandalone() || !deferredPrompt) return false;
    const b=makeButton();
    const host=document.querySelector(".topin");
    if(host){
      const acct=host.querySelector(".acct");
      if(acct && !acct.previousElementSibling?.isSameNode(b)) host.insertBefore(b,acct);
      else if(!host.contains(b)) host.appendChild(b);
      b.classList.add("show");
      return true;
    }
    const nav=document.querySelector(".nav");
    if(nav){if(!nav.contains(b))nav.appendChild(b);b.classList.add("show");return true}
    return false;
  }

  function removeButton(){document.getElementById(BTN_ID)?.remove()}

  function showIOSGuide(){
    let g=document.getElementById("cfPwaGuide");
    if(!g){
      g=document.createElement("div");g.id="cfPwaGuide";g.className="cf-pwa-guide";
      g.innerHTML='<div class="cf-pwa-guide-card"><h3>Install CivicFix</h3><p>Safari does not expose a web-controlled install prompt on iPhone or iPad.</p><p style="margin-top:10px"><b>Use Share → Add to Home Screen.</b> CivicFix will then launch like an app.</p><button type="button">Done</button></div>';
      g.querySelector("button").onclick=()=>g.classList.remove("show");
      document.body.appendChild(g);
    }
    requestAnimationFrame(()=>g.classList.add("show"));
  }

  async function install(){
    if(!deferredPrompt){
      if(isIOS()) showIOSGuide();
      return;
    }
    const prompt=deferredPrompt;
    deferredPrompt=null;
    removeButton();
    try{
      await prompt.prompt();
      await prompt.userChoice.catch(()=>null);
    }catch(err){
      console.warn("CivicFix install prompt failed",err);
    }
  }

  function serviceWorker(){
    if(!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js?v=2026-08-17-pwa5",{scope:"/"})
      .catch(err=>console.warn("CivicFix service worker registration failed",err));
  }

  function watchHeader(){
    if(observer || !document.body) return;
    observer=new MutationObserver(()=>{
      if(deferredPrompt && !document.getElementById(BTN_ID)) placeButton();
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }

  function init(){
    styles();serviceWorker();watchHeader();
    if(isStandalone()) return;

    window.addEventListener("beforeinstallprompt",event=>{
      event.preventDefault();
      deferredPrompt=event;
      placeButton();
    });

    window.addEventListener("appinstalled",()=>{
      deferredPrompt=null;
      removeButton();
      document.getElementById("cfPwaGuide")?.classList.remove("show");
    });

    /* Safari/iOS has no beforeinstallprompt; expose a clearly labeled fallback. */
    if(isIOS()){
      const b=makeButton();
      b.addEventListener("click",showIOSGuide,{once:true});
      const host=document.querySelector(".topin");
      if(host){const acct=host.querySelector(".acct");if(acct)host.insertBefore(b,acct);else host.appendChild(b);b.classList.add("show")}
    }
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
