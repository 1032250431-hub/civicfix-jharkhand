/* CivicFix Duplicate Intelligence — compact Liquid Glass widget-stack presentation. */
(function(){
  "use strict";
  const STYLE_ID="cf-duplicate-apple-final";
  function install(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      /* Apple-inspired widget-stack treatment: layered depth, readable type, restrained motion. */
      .dup-section{margin-top:18px!important}
      .dup-head{align-items:center!important;margin-bottom:14px!important}
      .dup-head h2{font-size:25px!important;letter-spacing:-.9px!important;font-weight:800!important}
      .dup-head p{font-size:11px!important;line-height:1.45!important;max-width:700px!important}
      .dup-count{min-width:82px!important;padding:10px 13px!important;border-radius:19px!important}
      .dup-count b{font-size:25px!important}
      .dup-count span{font-size:10px!important}
      .dup-grid{grid-template-columns:repeat(2,minmax(300px,1fr))!important;gap:20px!important}
      .dup-stack{
        min-height:288px!important;
        padding:19px!important;
        border-radius:29px!important;
        background:linear-gradient(145deg,rgba(255,255,255,.82),rgba(224,239,255,.54))!important;
        box-shadow:0 18px 45px rgba(28,82,157,.12),inset 0 1px 0 rgba(255,255,255,.98),inset 0 -1px 0 rgba(122,166,220,.08)!important;
        transition:transform .5s cubic-bezier(.2,.8,.2,1),box-shadow .5s cubic-bezier(.2,.8,.2,1)!important;
      }
      .dup-stack:before,.dup-stack:after{
        left:14px!important;right:14px!important;border-radius:26px!important;
        background:linear-gradient(145deg,rgba(244,250,255,.78),rgba(205,226,252,.48))!important;
        box-shadow:0 7px 18px rgba(45,93,157,.06)!important;
      }
      .dup-stack:before{top:10px!important;transform:rotate(-2.2deg) scale(.975)!important}
      .dup-stack:after{top:19px!important;transform:rotate(2.2deg) scale(.95)!important}
      .dup-stack:hover{transform:translateY(-7px) scale(1.008)!important;box-shadow:0 30px 70px rgba(28,82,157,.18),inset 0 1px 0 #fff!important}
      .dup-stack[aria-expanded="true"]{transform:translateY(-3px)!important}
      .dup-top{position:relative;z-index:2!important}
      .dup-pill{font-size:11px!important;padding:7px 11px!important;letter-spacing:.05px!important}
      .dup-score{font-size:11px!important;font-weight:750!important;color:#52627a!important}
      .dup-title{margin:18px 0 12px!important;position:relative;z-index:2}
      .dup-title h3{font-size:23px!important;letter-spacing:-.65px!important;line-height:1.08!important}
      .dup-title p{font-size:12px!important;margin-top:6px!important;color:#5d6b80!important}
      .dup-peek{gap:0!important;position:relative!important;height:100px!important;padding:0 4px 0 0!important}
      .dup-mini{
        min-height:49px!important;height:49px!important;box-sizing:border-box!important;
        grid-template-columns:31px 1fr!important;gap:10px!important;padding:9px 11px!important;
        border-radius:16px!important;background:rgba(255,255,255,.68)!important;
        border:1px solid rgba(255,255,255,.9)!important;
        box-shadow:0 7px 18px rgba(32,82,145,.08),inset 0 1px rgba(255,255,255,.9)!important;
        position:absolute!important;left:0;right:0;top:0!important;
        transform:translateY(calc(var(--i) * 12px)) scale(calc(1 - var(--i) * .025))!important;
        transform-origin:top center!important;
        z-index:calc(3 - var(--i))!important;
      }
      .dup-mini span{width:27px!important;height:27px!important;border-radius:9px!important;font-size:11px!important}
      .dup-mini b{font-size:11px!important;line-height:1.2!important}
      .dup-mini small{font-size:9px!important;margin-top:3px!important}
      .dup-stack:hover .dup-mini{transform:translateY(calc(var(--i) * 18px)) scale(calc(1 - var(--i) * .02))!important}
      .dup-foot{margin-top:14px!important;padding-top:12px!important;position:relative;z-index:5}
      .dup-foot span{font-size:10px!important;color:#66758a!important}
      .dup-foot .dup-open{min-height:38px!important;padding:0 14px!important;font-size:11px!important;border-radius:14px!important}
      .dup-expand{margin-top:0!important}
      .dup-stack[aria-expanded="true"] .dup-peek{max-height:0!important;height:0!important;opacity:0!important;margin:0!important;transform:scale(.97)!important}
      .dup-stack[aria-expanded="true"] .dup-expand{margin-top:4px!important}
      .dup-case{margin-top:10px!important;border-radius:18px!important}
      .dup-empty{font-size:11px!important;padding:30px!important}
      @media(max-width:800px){.dup-grid{grid-template-columns:1fr!important}.dup-stack{min-height:280px!important}}
      @media(prefers-reduced-motion:reduce){.dup-stack,.dup-stack:before,.dup-stack:after,.dup-mini,.dup-expand{transition:none!important}}
    `;
    document.head.appendChild(s);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install);else install();
})();
