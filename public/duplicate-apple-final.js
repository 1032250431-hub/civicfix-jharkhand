/* CivicFix Duplicate Intelligence — intentional widget-stack depth treatment. */
(function(){
  "use strict";
  const STYLE_ID="cf-duplicate-apple-final";
  function install(){
    const old=document.getElementById(STYLE_ID);
    if(old)old.remove();
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      /*
       * Depth rule:
       * The rear layers are MATERIAL ONLY — never translucent enough to reveal
       * the typography of the front report. Their job is to suggest hidden cards,
       * not to display duplicate text behind the hero card.
       */
      .dup-section{margin-top:18px!important}
      .dup-head{align-items:center!important;margin-bottom:14px!important}
      .dup-head h2{font-size:25px!important;letter-spacing:-.9px!important;font-weight:800!important}
      .dup-head p{font-size:11px!important;line-height:1.45!important;max-width:700px!important}
      .dup-count{min-width:82px!important;padding:10px 13px!important;border-radius:19px!important}
      .dup-count b{font-size:25px!important}.dup-count span{font-size:10px!important}
      .dup-grid{grid-template-columns:repeat(2,minmax(300px,1fr))!important;gap:20px!important}

      .dup-stack{
        position:relative!important;
        min-height:238px!important;
        padding:19px!important;
        border-radius:29px!important;
        overflow:visible!important;
        isolation:isolate!important;
        background:linear-gradient(145deg,rgba(255,255,255,.94),rgba(232,243,255,.88))!important;
        border:1px solid rgba(255,255,255,.98)!important;
        box-shadow:0 18px 45px rgba(28,82,157,.11),inset 0 1px 0 rgba(255,255,255,1),inset 0 -1px 0 rgba(122,166,220,.07)!important;
        transition:transform .46s cubic-bezier(.22,1,.36,1),box-shadow .46s cubic-bezier(.22,1,.36,1)!important;
      }

      /* Rear cards: deliberately opaque and contentless. They read as physical
         cards sitting underneath, never as ghosted text bleeding through. */
      .dup-stack:before,.dup-stack:after{
        content:""!important;
        position:absolute!important;
        z-index:-2!important;
        pointer-events:none!important;
        left:12px!important;right:12px!important;
        height:calc(100% - 2px)!important;
        border-radius:25px!important;
        border:1px solid rgba(255,255,255,.88)!important;
        background:linear-gradient(145deg,rgba(222,237,255,.98),rgba(198,220,248,.96))!important;
        box-shadow:0 8px 18px rgba(40,89,148,.07),inset 0 1px rgba(255,255,255,.9)!important;
        filter:none!important;
      }
      .dup-stack:before{top:9px!important;transform:rotate(-2.1deg) scale(.982)!important;opacity:.88!important}
      .dup-stack:after{top:17px!important;transform:rotate(2.1deg) scale(.965)!important;opacity:.68!important}

      /* A thin edge/highlight makes the stack readable even when the rear cards
         are intentionally opaque. */
      .dup-stack-glow{z-index:-1!important;opacity:.45!important;filter:blur(10px)!important}
      .dup-top,.dup-title,.dup-peek,.dup-foot{position:relative!important;z-index:4!important}

      .dup-stack:hover{transform:translateY(-5px)!important;box-shadow:0 28px 65px rgba(28,82,157,.16),inset 0 1px 0 #fff!important}
      .dup-stack:hover:before{transform:translate(-2px,4px) rotate(-3deg) scale(.982)!important}
      .dup-stack:hover:after{transform:translate(2px,8px) rotate(3deg) scale(.965)!important}
      .dup-stack[aria-expanded="true"]{transform:translateY(-2px)!important;z-index:10!important}
      .dup-stack[aria-expanded="true"]:before{transform:translate(-3px,7px) rotate(-3deg) scale(.982)!important}
      .dup-stack[aria-expanded="true"]:after{transform:translate(3px,14px) rotate(3deg) scale(.965)!important}

      .dup-pill{font-size:11px!important;padding:7px 11px!important}
      .dup-score{font-size:11px!important;font-weight:750!important;color:#52627a!important}
      .dup-title{margin:16px 0 10px!important}.dup-title h3{font-size:23px!important;letter-spacing:-.65px!important;line-height:1.08!important}.dup-title p{font-size:12px!important;margin-top:6px!important;color:#5d6b80!important}

      /* The visible front stack preview is now a single clear surface. */
      .dup-peek{gap:0!important;position:relative!important;height:78px!important;padding:0!important;overflow:visible!important}
      .dup-mini{
        min-height:49px!important;height:49px!important;box-sizing:border-box!important;
        grid-template-columns:31px 1fr!important;gap:10px!important;padding:9px 11px!important;
        border-radius:16px!important;background:rgba(255,255,255,.92)!important;
        border:1px solid rgba(255,255,255,.98)!important;
        box-shadow:0 8px 20px rgba(32,82,145,.09),inset 0 1px rgba(255,255,255,1)!important;
        position:absolute!important;left:0;right:0;top:0!important;
        transform:translateY(calc(var(--i) * 11px)) scale(calc(1 - var(--i) * .022))!important;
        transform-origin:top center!important;z-index:calc(3 - var(--i))!important;
      }
      .dup-mini span{width:27px!important;height:27px!important;border-radius:9px!important;font-size:11px!important}.dup-mini b{font-size:11px!important;line-height:1.2!important}.dup-mini small{font-size:9px!important;margin-top:3px!important}
      .dup-stack:hover .dup-mini{transform:translateY(calc(var(--i) * 16px)) scale(calc(1 - var(--i) * .018))!important}
      .dup-foot{margin-top:10px!important;padding-top:10px!important;border-top:1px solid rgba(150,180,216,.18)!important}.dup-foot span{font-size:10px!important;color:#66758a!important}.dup-foot .dup-open{min-height:36px!important;padding:0 14px!important;font-size:11px!important;border-radius:14px!important}

      /* Expanded stack: rear layers stay behind and the front surface grows smoothly. */
      .dup-stack[aria-expanded="true"] .dup-peek{max-height:0!important;height:0!important;opacity:0!important;margin:0!important;transform:scale(.985)!important;overflow:hidden!important;transition:height .36s ease,max-height .36s ease,opacity .2s ease,transform .36s ease!important}
      .dup-stack[aria-expanded="true"] .dup-expand{margin-top:4px!important}
      .dup-empty{font-size:11px!important;padding:30px!important}
      @media(max-width:800px){.dup-grid{grid-template-columns:1fr!important}.dup-stack{min-height:238px!important}}
      @media(prefers-reduced-motion:reduce){.dup-stack,.dup-stack:before,.dup-stack:after,.dup-mini,.dup-expand{transition:none!important}}
    `;
    document.head.appendChild(s);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install);else install();
})();
