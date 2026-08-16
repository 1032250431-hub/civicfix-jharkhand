/* CivicFix Duplicate Intelligence — admin-only, visual-first duplicate clusters. */
(function(){
  "use strict";
  const BUILD="2026-08-17-dupdeck1";
  const escD=v=>typeof esc==="function"?esc(v):String(v??"").replace(/[&<>\"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
  const norm=v=>String(v||"").toLowerCase().replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();
  const tokens=v=>new Set(norm(v).split(" ").filter(x=>x.length>2));
  const textScore=(a,b)=>{const A=tokens(a),B=tokens(b);if(!A.size||!B.size)return 0;let n=0;A.forEach(x=>B.has(x)&&n++);return n/Math.max(1,Math.min(A.size,B.size));};
  const dist=(a,b)=>{const la=Number(a?.latitude),loa=Number(a?.longitude),lb=Number(b?.latitude),lob=Number(b?.longitude);if(![la,loa,lb,lob].every(Number.isFinite))return Infinity;const R=6371,dLat=(lb-la)*Math.PI/180,dLon=(lob-loa)*Math.PI/180,s=Math.sin(dLat/2)**2+Math.cos(la*Math.PI/180)*Math.cos(lb*Math.PI/180)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(s));};
  function related(a,b){
    const sameCat=norm(a.category||a.type)===norm(b.category||b.type);
    const km=dist(a,b);
    const sameArea=norm(a.area)===norm(b.area)&&norm(a.area)!=="";
    const score=textScore(`${a.category||""} ${a.title||""} ${a.description||a.details||""}`,`${b.category||""} ${b.title||""} ${b.description||b.details||""}`);
    return (sameCat&&km<=0.75)||(sameCat&&sameArea&&score>=0.35)||(km<=0.3&&score>=0.35)||(sameArea&&score>=0.68);
  }
  function clusters(){
    const rows=(state?.complaints||[]).filter(c=>c.status!=="Verified");
    const seen=new Set(),out=[];
    rows.forEach((seed)=>{
      if(seen.has(seed.id))return;
      const group=[seed],queue=[seed];seen.add(seed.id);
      while(queue.length){const a=queue.shift();rows.forEach(b=>{if(seen.has(b.id)||!related(a,b))return;seen.add(b.id);group.push(b);queue.push(b);});}
      if(group.length>1)out.push(group);
    });
    return out.sort((a,b)=>b.length-a.length).slice(0,8);
  }
  function meta(group){
    const cats=[...new Set(group.map(c=>c.category||c.type||"Civic issue"))];
    const statuses=[...new Set(group.map(c=>c.status||"Pending"))];
    const kms=[];for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length;j++){const d=dist(group[i],group[j]);if(Number.isFinite(d))kms.push(d);}
    const spread=kms.length?Math.max(...kms):null;
    return {cat:cats[0]||"Civic issue",status:statuses.length===1?statuses[0]:"Mixed status",spread};
  }
  function deck(groups){
    if(!groups.length)return `<section class="dup-section"><div class="dup-head"><div><div class="df-kicker">DUPLICATE INTELLIGENCE</div><h2>No duplicate signals detected</h2><p>CivicFix will surface nearby, similar reports here when the signal is strong enough.</p></div><span class="df-badge">● AUTO SCANNED</span></div><div class="dup-empty">No high-confidence duplicate clusters right now.</div></section>`;
    return `<section class="dup-section"><div class="dup-head"><div><div class="df-kicker">DUPLICATE INTELLIGENCE</div><h2>Possible duplicate cases</h2><p>Nearby or highly similar complaints are grouped so one civic problem does not become five separate admin jobs.</p></div><div class="dup-count"><b>${groups.length}</b><span>clusters</span></div></div><div class="dup-grid">${groups.map((g,i)=>{
      const m=meta(g),lead=g[0];
      return `<article class="dup-stack" data-dup-index="${i}" tabindex="0" aria-expanded="false">
        <div class="dup-stack-glow"></div>
        <div class="dup-top"><span class="dup-pill">${g.length} related reports</span><span class="dup-score">${m.spread!=null?m.spread.toFixed(1)+" km spread":"similar signal"}</span></div>
        <div class="dup-title"><h3>${escD(m.cat)}</h3><p>${escD(lead.area||lead.district||"Location pinned")} · ${escD(m.status)}</p></div>
        <div class="dup-peek">${g.slice(0,3).map((c,j)=>`<div class="dup-mini" style="--i:${j}"><span>${j+1}</span><div><b>${escD(c.description||c.title||c.category||"Reported issue")}</b><small>${escD(c.case_number||c.id||"")}</small></div></div>`).join("")}</div>
        <div class="dup-expand">${g.map(c=>`<div class="dup-case">${typeof card==='function'?card(c,true):`<b>${escD(c.category)}</b><span>${escD(c.description||"")}</span>`}</div>`).join("")}</div>
        <div class="dup-foot"><span>Click to inspect the cluster</span><button type="button" class="secondary dup-open">Open cluster</button></div>
      </article>`;
    }).join("")}</div></section>`;
  }
  function css(){
    if(document.getElementById("cf-duplicate-final-style"))return;
    const s=document.createElement("style");s.id="cf-duplicate-final-style";s.textContent=`
      .dup-section{margin-top:2px}.dup-head{display:flex;justify-content:space-between;align-items:end;gap:14px;margin-bottom:12px}.dup-head h2{margin:3px 0 0;font-size:22px;letter-spacing:-.8px}.dup-head p{margin:4px 0 0;color:#667085;font-size:10px;max-width:650px;line-height:1.5}.dup-count{min-width:74px;padding:9px 11px;border-radius:17px;text-align:right;background:rgba(255,255,255,.48);border:1px solid rgba(255,255,255,.84);box-shadow:inset 0 1px rgba(255,255,255,.9)}.dup-count b{display:block;font-size:23px;line-height:1;color:#1769e0}.dup-count span{font-size:8px;color:#667085;font-weight:850}.dup-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.dup-stack{position:relative;min-height:275px;padding:16px;border-radius:26px;border:1px solid rgba(255,255,255,.9);background:linear-gradient(145deg,rgba(255,255,255,.72),rgba(221,237,255,.46));box-shadow:0 22px 55px rgba(31,91,176,.11),inset 0 1px rgba(255,255,255,.98);backdrop-filter:blur(28px) saturate(170%);-webkit-backdrop-filter:blur(28px) saturate(170%);cursor:pointer;overflow:hidden;isolation:isolate;transition:transform .48s cubic-bezier(.22,1,.36,1),box-shadow .48s cubic-bezier(.22,1,.36,1),border-color .35s ease}.dup-stack:hover{transform:translateY(-5px);box-shadow:0 28px 70px rgba(31,91,176,.17),inset 0 1px rgba(255,255,255,1)}.dup-stack:before,.dup-stack:after{content:"";position:absolute;z-index:-1;left:18px;right:18px;height:100%;border-radius:22px;background:rgba(224,239,255,.38);border:1px solid rgba(255,255,255,.58);transform-origin:top center;transition:transform .55s cubic-bezier(.22,1,.36,1),opacity .4s ease}.dup-stack:before{top:9px;transform:rotate(-1.7deg) scale(.98);opacity:.75}.dup-stack:after{top:17px;transform:rotate(1.5deg) scale(.96);opacity:.48}.dup-stack[aria-expanded="true"]{cursor:default;transform:translateY(-2px);box-shadow:0 34px 85px rgba(31,91,176,.19)}.dup-stack[aria-expanded="true"]:before{transform:translateY(17px) rotate(-3deg) scale(.98);opacity:.62}.dup-stack[aria-expanded="true"]:after{transform:translateY(33px) rotate(3deg) scale(.96);opacity:.34}.dup-stack-glow{position:absolute;width:260px;height:260px;right:-100px;top:-130px;border-radius:50%;background:radial-gradient(circle,rgba(66,145,255,.22),transparent 68%);filter:blur(7px);pointer-events:none}.dup-top,.dup-foot{display:flex;justify-content:space-between;align-items:center;gap:8px}.dup-pill{padding:6px 9px;border-radius:999px;background:rgba(219,236,255,.76);border:1px solid rgba(255,255,255,.84);color:#1769e0;font-size:8px;font-weight:950}.dup-score{font-size:8px;color:#667085;font-weight:850}.dup-title{margin:16px 0 10px}.dup-title h3{margin:0;font-size:19px;letter-spacing:-.5px}.dup-title p{margin:4px 0 0;font-size:9px;color:#667085}.dup-peek{display:grid;gap:6px}.dup-mini{display:grid;grid-template-columns:25px 1fr;gap:8px;align-items:center;padding:8px 9px;border-radius:14px;background:rgba(255,255,255,.42);border:1px solid rgba(255,255,255,.72);transform:translateY(calc(var(--i)*1px));transition:transform .28s ease,background .28s ease}.dup-mini span{width:23px;height:23px;display:grid;place-items:center;border-radius:8px;background:rgba(220,237,255,.78);color:#1769e0;font-size:8px;font-weight:950}.dup-mini b{display:block;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dup-mini small{display:block;margin-top:2px;color:#8a96a8;font-size:7px}.dup-stack:hover .dup-mini{transform:translateX(2px)}.dup-foot{margin-top:13px;padding-top:10px;border-top:1px solid rgba(150,180,216,.2)}.dup-foot span{font-size:8px;color:#778399}.dup-foot .dup-open{min-height:34px;padding:0 11px}.dup-expand{display:grid;grid-template-rows:0fr;opacity:0;transform:translateY(-6px);overflow:hidden;transition:grid-template-rows .55s cubic-bezier(.22,1,.36,1),opacity .35s ease,transform .55s cubic-bezier(.22,1,.36,1);margin-top:0}.dup-expand>*{min-height:0;overflow:hidden}.dup-stack[aria-expanded="true"] .dup-peek{opacity:.3;transform:scale(.98);max-height:0;overflow:hidden;transition:opacity .25s ease,max-height .4s ease,transform .35s ease}.dup-stack[aria-expanded="true"] .dup-expand{grid-template-rows:1fr;opacity:1;transform:none;margin-top:11px}.dup-stack[aria-expanded="true"] .dup-foot span{color:#1769e0}.dup-case{margin-top:8px;border-radius:17px;overflow:hidden}.dup-case .card{margin:0!important;box-shadow:0 8px 25px rgba(31,91,176,.07)!important}.dup-empty{padding:26px;border-radius:22px;border:1px dashed rgba(120,159,203,.45);background:rgba(255,255,255,.35);color:#667085;font-size:10px;text-align:center}.dup-open{position:relative;z-index:3}.dup-stack:focus-visible{outline:3px solid rgba(23,105,224,.25);outline-offset:3px}@media(max-width:800px){.dup-grid{grid-template-columns:1fr}.dup-head{align-items:flex-start}.dup-count{display:none}}
      @media(prefers-reduced-motion:reduce){.dup-stack,.dup-stack:before,.dup-stack:after,.dup-expand,.dup-mini{transition:none!important}}
    `;document.head.appendChild(s);
  }
  function install(){
    css();
    if(typeof window.admin!=="function"||window.__cfDupInstalled)return;
    const base=window.admin;window.__cfDupInstalled=true;
    window.admin=function(){
      let html=base.apply(this,arguments);
      const groups=clusters();
      const section=deck(groups);
      const marker='<section class="df-section"><div class="df-section-head"><div><div class="df-kicker">FULL QUEUE</div>';
      if(html.includes(marker))html=html.replace(marker,section+marker);else html+=section;
      return html;
    };
    const oldRender=window.render;
    if(typeof oldRender==='function'&&!window.__cfDupRenderWrapped){
      window.__cfDupRenderWrapped=true;
      window.render=function(){const r=oldRender.apply(this,arguments);setTimeout(bind,30);return r;};
    }
    setTimeout(bind,40);
  }
  function bind(){
    document.querySelectorAll('.dup-stack').forEach(el=>{
      if(el.dataset.bound)return;el.dataset.bound='1';
      const toggle=e=>{if(e.target.closest('button,a'))return;const open=el.getAttribute('aria-expanded')==='true';document.querySelectorAll('.dup-stack[aria-expanded="true"]').forEach(x=>{if(x!==el)x.setAttribute('aria-expanded','false')});el.setAttribute('aria-expanded',String(!open));if(!open)setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'nearest'}),40)};
      el.addEventListener('click',toggle);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle(e)}});
      const btn=el.querySelector('.dup-open');if(btn)btn.addEventListener('click',e=>{e.stopPropagation();el.setAttribute('aria-expanded',el.getAttribute('aria-expanded')!=='true'?'true':'false')});
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.CivicFixDuplicateIntelligence={build:BUILD,scan:clusters};
})();
