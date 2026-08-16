/* CivicFix smooth motion compositor layer. Overrides legacy CSS animation stacks without changing app logic. */
(function(){
  "use strict";
  const reduce=()=>matchMedia("(prefers-reduced-motion:reduce)").matches;
  const style=document.createElement("style");style.textContent=`
    .cf-motion-page,.cf-motion-ready .page,.cf-motion-ready .card,.cf-motion-ready .stat,.cf-motion-ready .support-card,.cf-motion-ready .cf-access-card,.card,.stat,.support-card,.cf-access-card{animation:none!important;filter:none!important}
    .cf-motion-press{animation:none!important;transform:scale(.975)!important}
    #cfMotionGlow{animation:none!important}
    .cf-smooth-button{will-change:transform}
  `;document.head.appendChild(style);
  let previousPage=null;
  const animatePage=page=>{
    if(!page||page===previousPage)return;previousPage=page;
    if(reduce){page.style.opacity="1";page.style.transform="none";return}
    page.animate([{opacity:0,transform:"translate3d(0,10px,0) scale(.996)"},{opacity:1,transform:"translate3d(0,0,0) scale(1)"}],{duration:360,easing:"cubic-bezier(.16,1,.3,1)",fill:"both"});
    const items=[...page.querySelectorAll(".card,.stat,.support-card,.cf-access-card")];
    items.slice(0,10).forEach((el,i)=>{el.animate([{opacity:0,transform:"translate3d(0,12px,0) scale(.985)"},{opacity:1,transform:"translate3d(0,0,0) scale(1)"}],{duration:380,delay:Math.min(i,7)*34,easing:"cubic-bezier(.16,1,.3,1)",fill:"both"})});
  };
  const observer=new MutationObserver(()=>requestAnimationFrame(()=>animatePage(document.querySelector("main.page"))));observer.observe(document.body,{childList:true,subtree:true});
  const initial=document.querySelector("main.page");if(initial)requestAnimationFrame(()=>animatePage(initial));
  document.addEventListener("click",e=>{const b=e.target.closest?.("button,.primary,.secondary,.ghost,.nav button");if(!b||b.disabled||reduce)return;b.animate([{transform:"scale(1)"},{transform:"scale(.975)"},{transform:"scale(1)"}],{duration:180,easing:"cubic-bezier(.22,1,.36,1)"})},{capture:true});
  const modalObserver=new MutationObserver(()=>{if(reduce)return;document.querySelectorAll(".modalcard:not([data-cf-smooth])").forEach(m=>{m.dataset.cfSmooth="1";m.animate([{opacity:0,transform:"translate3d(0,14px,0) scale(.985)"},{opacity:1,transform:"translate3d(0,0,0) scale(1)"}],{duration:320,easing:"cubic-bezier(.16,1,.3,1)"})})});modalObserver.observe(document.body,{childList:true,subtree:true});
})();