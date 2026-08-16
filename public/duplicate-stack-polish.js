/* CivicFix Duplicate Stack Polish — compact, legible, no stretched cards. */
(function(){
  "use strict";
  const style=document.createElement("style");
  style.id="cf-duplicate-stack-polish";
  style.textContent=`
    /* Reset the over-expanded deck geometry from earlier iterations. */
    .dup-section{margin:18px 0 20px!important}
    .dup-head{margin-bottom:12px!important}
    .dup-head h2{font-size:22px!important;line-height:1.12!important}
    .dup-head p{font-size:11px!important;line-height:1.4!important}
    .dup-grid{align-items:start!important;grid-auto-rows:max-content!important}
    .dup-stack{height:auto!important;min-height:0!important;align-self:start!important;padding:16px!important;border-radius:24px!important;overflow:hidden!important}
    .dup-stack:before,.dup-stack:after{height:calc(100% - 8px)!important;bottom:auto!important;pointer-events:none!important}
    .dup-top{min-height:25px!important}
    .dup-pill{font-size:10px!important;padding:6px 10px!important}
    .dup-score{font-size:10px!important;letter-spacing:-.1px!important}
    .dup-title{margin:13px 0 10px!important}
    .dup-title h3{font-size:21px!important;line-height:1.12!important;letter-spacing:-.55px!important}
    .dup-title p{font-size:11px!important;line-height:1.3!important;margin-top:4px!important}

    /* A readable front widget, with two quiet depth cards behind it. */
    .dup-peek{gap:7px!important;max-height:104px!important;position:relative!important;z-index:2!important}
    .dup-mini{min-height:43px!important;box-sizing:border-box!important;grid-template-columns:30px 1fr!important;gap:9px!important;padding:7px 10px!important;border-radius:14px!important;background:rgba(255,255,255,.62)!important;box-shadow:0 5px 16px rgba(32,82,145,.06),inset 0 1px rgba(255,255,255,.95)!important}
    .dup-mini span{width:28px!important;height:28px!important;border-radius:9px!important;font-size:10px!important}
    .dup-mini b{font-size:12px!important;line-height:1.15!important;font-weight:800!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
    .dup-mini small{font-size:9px!important;line-height:1.15!important;margin-top:3px!important}

    .dup-foot{margin-top:12px!important;padding-top:10px!important;min-height:34px!important;position:relative!important;z-index:4!important}
    .dup-foot span{font-size:10px!important}
    .dup-foot .dup-open{min-height:34px!important;padding:0 13px!important;border-radius:11px!important;font-size:10px!important;font-weight:800!important}

    /* Expanded state remains compact instead of turning into a giant panel. */
    .dup-stack[aria-expanded="true"] .dup-peek{display:none!important}
    .dup-stack[aria-expanded="true"] .dup-expand{max-height:240px!important;overflow:auto!important;display:block!important;margin-top:8px!important}
    .dup-case-row{grid-template-columns:30px minmax(0,1fr) auto!important;gap:9px!important;margin-top:6px!important;padding:8px 10px!important;border-radius:14px!important}
    .dup-case-num{width:28px!important;height:28px!important;border-radius:9px!important;font-size:10px!important}
    .dup-case-row b{font-size:11px!important;line-height:1.2!important}
    .dup-case-row small{font-size:9px!important;line-height:1.15!important;margin-top:3px!important}
    .dup-case-distance{font-size:9px!important}

    /* Make the stack read visually as one object rather than two giant rectangles. */
    .dup-stack-glow{width:150px!important;height:150px!important;right:-65px!important;top:-80px!important;opacity:.65!important}
    .dup-stack:hover{transform:translateY(-2px)!important}
    .dup-stack:hover:before{transform:translateY(2px) rotate(-2deg) scale(.985)!important}
    .dup-stack:hover:after{transform:translateY(5px) rotate(2deg) scale(.97)!important}

    @media(max-width:800px){
      .dup-grid{grid-template-columns:1fr!important}
      .dup-stack{width:100%!important;box-sizing:border-box!important}
    }
  `;
  document.head.appendChild(style);
})();
