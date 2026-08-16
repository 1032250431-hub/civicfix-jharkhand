/* CivicFix master compatibility layer. Keeps the legacy polish/resolution behavior that used to live in master-final.js while the new dashboard layer is loaded separately. */
(function(){
  "use strict";
  const reduce=()=>window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const style=document.createElement("style");
  style.textContent=`
    :root{--cf-blue:#1558c8;--cf-blue-hi:#3c8cff;--cf-blue-deep:#0d3f91}
    body{background:radial-gradient(900px 520px at 18% -8%,rgba(74,145,255,.15),transparent 62%),radial-gradient(760px 500px at 100% 18%,rgba(21,88,200,.12),transparent 60%),linear-gradient(180deg,#f7faff 0%,#edf5ff 100%)!important}
    .topin{background:linear-gradient(135deg,rgba(255,255,255,.74),rgba(226,239,255,.48))!important;box-shadow:0 18px 48px rgba(25,78,150,.11),inset 0 1px rgba(255,255,255,.98)!important}
    .logo,.primary{background:linear-gradient(145deg,var(--cf-blue-hi),var(--cf-blue) 48%,var(--cf-blue-deep))!important;border-color:transparent!important;box-shadow:0 9px 24px rgba(21,88,200,.24),inset 0 1px rgba(255,255,255,.28)!important}
    .brand b,.eyebrow,.cf-location-kicker,.cf-voice-kicker,.cf-location-badge,.pill{color:var(--cf-blue)!important}.pill{background:rgba(224,237,255,.78)!important}
    .hero{background:linear-gradient(135deg,rgba(255,255,255,.78),rgba(229,240,255,.45))!important;box-shadow:0 28px 70px rgba(25,78,150,.12),inset 0 1px rgba(255,255,255,.98)!important}
    .cf-compat-page{animation:cfCompatPage .34s cubic-bezier(.16,1,.3,1) both}.cf-compat-item{animation:cfCompatItem .42s cubic-bezier(.16,1,.3,1) both;animation-delay:calc(min(var(--cf-compat-i,0),7)*34ms)}
    .cf-compat-modal{animation:cfCompatModal .32s cubic-bezier(.16,1,.3,1) both}.cf-compat-press{animation:cfCompatPress .18s cubic-bezier(.22,1,.36,1)}
    @keyframes cfCompatPage{from{opacity:0;transform:translate3d(0,9px,0)}to{opacity:1;transform:none}}@keyframes cfCompatItem{from{opacity:0;transform:translate3d(0,11px,0) scale(.988)}to{opacity:1;transform:none}}@keyframes cfCompatModal{from{opacity:0;transform:translate3d(0,12px,0) scale(.985)}to{opacity:1;transform:none}}@keyframes cfCompatPress{0%{transform:scale(1)}45%{transform:scale(.975)}100%{transform:scale(1)}}
    .card:hover,.stat:hover,.support-card:hover,.cf-access-card:hover{transform:translateY(-2px)!important;transition:transform .24s cubic-bezier(.22,1,.36,1),box-shadow .24s ease!important}
    @media(prefers-reduced-motion:reduce){.cf-compat-page,.cf-compat-item,.cf-compat-modal,.cf-compat-press{animation:none!important}.card:hover,.stat:hover,.support-card:hover,.cf-access-card:hover{transform:none!important}}
    #cfNetPill{background:linear-gradient(135deg,rgba(255,255,255,.90),rgba(231,242,255,.72))!important}
  `;
  document.head.appendChild(style);

  function refresh(){
    const page=document.querySelector("main.page,.page");
    if(page&&!page.dataset.cfCompatMotion){page.dataset.cfCompatMotion="1";page.classList.add("cf-compat-page");if(!reduce())setTimeout(()=>page.classList.remove("cf-compat-page"),420)}
    document.querySelectorAll(".card,.stat,.support-card,.cf-access-card").forEach((el,i)=>{if(el.dataset.cfCompatItem)return;el.dataset.cfCompatItem="1";el.style.setProperty("--cf-compat-i",String(i));el.classList.add("cf-compat-item")});
    document.querySelectorAll(".modalcard:not([data-cf-compat-modal])").forEach(el=>{el.dataset.cfCompatModal="1";if(!reduce()){el.classList.add("cf-compat-modal");setTimeout(()=>el.classList.remove("cf-compat-modal"),380)}})
  }
  const mo=new MutationObserver(()=>requestAnimationFrame(refresh));
  window.addEventListener("DOMContentLoaded",()=>refresh());
  mo.observe(document.documentElement,{childList:true,subtree:true});
  requestAnimationFrame(refresh);

  function toast(text,type="success"){
    if(typeof window.cfToast==="function")return window.cfToast(text,type);
    const x=document.createElement("div");x.textContent=text;x.style.cssText="position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:60000;padding:12px 16px;border-radius:16px;background:rgba(20,32,51,.94);color:white;font:800 12px Inter,system-ui;box-shadow:0 16px 40px rgba(0,0,0,.22)";document.body.appendChild(x);setTimeout(()=>x.remove(),3200);
  }

  /* Guaranteed citizen feedback path: Resolved -> In Progress. */
  document.addEventListener("click",async e=>{
    const btn=e.target.closest?.("button,.secondary,.primary");
    if(!btn||!btn.textContent.toLowerCase().includes("still not fixed"))return;
    if(typeof window.cfVerifyResolution!=="function")return;
    e.preventDefault();e.stopImmediatePropagation();
    const card=btn.closest(".card,article,[data-complaint-id]");
    const id=btn.dataset.complaintId||card?.dataset?.complaintId||card?.getAttribute("data-id");
    let caseId=id;
    if(!caseId){
      const onclick=btn.getAttribute("onclick")||"";
      const m=onclick.match(/[\"']([0-9a-fA-F-]{20,})[\"']/);if(m)caseId=m[1];
    }
    if(!caseId&&Array.isArray(window.state?.complaints)){
      const text=(card?.textContent||"").toLowerCase();const match=window.state.complaints.find(c=>text.includes(String(c.id).toLowerCase())||text.includes(String(c.category||"").toLowerCase())&&text.includes(String(c.area||"").toLowerCase()));caseId=match?.id;
    }
    if(!caseId){toast("We couldn't identify this case. Please open the case timeline and try again.","error");return;}
    try{await window.cfVerifyResolution(caseId,false)}catch(err){console.error(err);toast("Could not reopen this case. Please try again.","error")}
  },true);
})();
