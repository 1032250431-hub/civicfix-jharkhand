/* CivicFix Duplicate Stack — final physical widget treatment. */
(function(){
  "use strict";
  const s=document.createElement("style");
  s.id="cf-duplicate-stack-final";
  s.textContent=`
    /* One readable front surface. Depth is communicated by material edges only. */
    .dup-grid{align-items:start!important;grid-auto-rows:max-content!important}
    .dup-stack{
      position:relative!important;isolation:isolate!important;overflow:visible!important;
      min-height:0!important;height:auto!important;padding:18px!important;border-radius:26px!important;
      background:linear-gradient(145deg,#ffffff 0%,#f4f9ff 52%,#eaf3ff 100%)!important;
      border:1px solid rgba(255,255,255,.98)!important;
      box-shadow:0 18px 42px rgba(30,76,140,.10),0 2px 0 rgba(255,255,255,.95) inset!important;
      transform:translateZ(0)!important;
      transition:transform .34s cubic-bezier(.22,1,.36,1),box-shadow .34s cubic-bezier(.22,1,.36,1)!important;
    }
    /* The rear cards are blank physical shells. No text can bleed through them. */
    .dup-stack:before,.dup-stack:after{
      content:""!important;position:absolute!important;pointer-events:none!important;
      left:9px!important;right:9px!important;top:100%!important;height:15px!important;
      border-radius:0 0 19px 19px!important;border:1px solid rgba(255,255,255,.88)!important;
      border-top:0!important;background:linear-gradient(180deg,#dcecff,#cbdff6)!important;
      box-shadow:0 7px 14px rgba(37,82,139,.08)!important;z-index:-1!important;
    }
    .dup-stack:before{transform:translateY(-1px) scaleX(.985)!important;opacity:.96!important}
    .dup-stack:after{left:17px!important;right:17px!important;top:calc(100% + 8px)!important;transform:scaleX(.97)!important;opacity:.72!important}
    /* Remove the old ghosted mini-card pile. Only the lead report is visible. */
    .dup-peek{position:relative!important;height:54px!important;max-height:54px!important;overflow:visible!important;display:block!important}
    .dup-mini{display:none!important}
    .dup-mini:first-child{
      display:grid!important;position:absolute!important;inset:0!important;
      grid-template-columns:32px minmax(0,1fr)!important;gap:10px!important;align-items:center!important;
      padding:9px 11px!important;min-height:52px!important;height:52px!important;box-sizing:border-box!important;
      border-radius:16px!important;background:#ffffff!important;border:1px solid rgba(222,234,248,.9)!important;
      box-shadow:0 8px 18px rgba(30,78,138,.08),0 1px 0 #fff inset!important;
      transform:none!important;z-index:5!important;
    }
    .dup-mini:first-child span{width:29px!important;height:29px!important;border-radius:10px!important;font-size:11px!important}
    .dup-mini:first-child b{font-size:12px!important;line-height:1.2!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
    .dup-mini:first-child small{font-size:9px!important;margin-top:2px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
    .dup-stack:hover{transform:translateY(-3px)!important;box-shadow:0 25px 54px rgba(30,76,140,.15),0 2px 0 #fff inset!important}
    .dup-stack:hover:before{transform:translateY(2px) scaleX(.985)!important}
    .dup-stack:hover:after{transform:translateY(5px) scaleX(.97)!important}
    .dup-stack[aria-expanded="true"]{z-index:20!important}
    .dup-stack[aria-expanded="true"] .dup-peek{display:none!important}
    .dup-stack[aria-expanded="true"]:before{transform:translateY(3px) scaleX(.985)!important}
    .dup-stack[aria-expanded="true"]:after{transform:translateY(8px) scaleX(.97)!important}
    .dup-title h3{font-size:22px!important;line-height:1.1!important}
    .dup-title p{font-size:11px!important;line-height:1.35!important}
    .dup-foot{position:relative!important;z-index:6!important;margin-top:12px!important}
    .dup-expand{position:relative!important;z-index:7!important}
    @media(prefers-reduced-motion:reduce){.dup-stack,.dup-stack:before,.dup-stack:after{transition:none!important}}
  `;
  document.head.appendChild(s);
})();
