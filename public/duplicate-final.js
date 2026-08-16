/* CivicFix Duplicate Intelligence — admin-only, location-first duplicate clusters. */
(function(){
  "use strict";
  const BUILD="2026-08-17-dupdeck2";
  const escD=v=>typeof esc==="function"?esc(v):String(v??"").replace(/[&<>\"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
  const norm=v=>String(v||"").toLowerCase().replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();
  const tokens=v=>new Set(norm(v).split(" ").filter(x=>x.length>2));
  const textScore=(a,b)=>{const A=tokens(a),B=tokens(b);if(!A.size||!B.size)return 0;let n=0;A.forEach(x=>B.has(x)&&n++);return n/Math.max(1,Math.min(A.size,B.size));};
  const dist=(a,b)=>{const la=Number(a?.latitude),loa=Number(a?.longitude),lb=Number(b?.latitude),lob=Number(b?.longitude);if(![la,loa,lb,lob].every(Number.isFinite))return null;const R=6371,dLat=(lb-la)*Math.PI/180,dLon=(lob-loa)*Math.PI/180,s=Math.sin(dLat/2)**2+Math.cos(la*Math.PI/180)*Math.cos(lb*Math.PI/180)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(s));};
  function signals(a,b){
    const sameCat=norm(a.category||a.type)!==""&&norm(a.category||a.type)===norm(b.category||b.type);
    const km=dist(a,b);
    const sameArea=norm(a.area)!==""&&norm(a.area)===norm(b.area);
    const text=textScore(`${a.category||""} ${a.title||""} ${a.description||a.details||""}`,`${b.category||""} ${b.title||""} ${b.description||b.details||""}`);
    const location=(km==null)?0:(km<=0.10?45:km<=0.25?38:km<=0.50?28:km<=0.75?18:0);
    const area=sameArea?10:0;
    const language=Math.round(Math.min(1,text)*20);
    const score=(sameCat?25:0)+location+area+language;
    // Location is the primary duplicate signal. Text/area can strengthen a match,
    // but unrelated complaints in the same neighbourhood should not be clustered.
    const strongLocated=sameCat&&km!=null&&km<=0.50&&text>=0.20;
    const veryClose=sameCat&&km!=null&&km<=0.15&&text>=0.12;
    const strongTextFallback=sameCat&&sameArea&&km==null&&text>=0.78;
    return {sameCat,km,sameArea,text,score,match:strongLocated||veryClose||strongTextFallback};
  }
  function related(a,b){return signals(a,b).match;}
  function clusters(){
    const rows=(state?.complaints||[]).filter(c=>c.status!=="Verified");
    const seen=new Set(),out=[];
    rows.forEach(seed=>{
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
    const pairs=[];let located=0,total=0;
    for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length;j++){const s=signals(group[i],group[j]);total++;if(s.km!=null){located++;pairs.push(s.km);}}
    const spread=pairs.length?Math.max(...pairs):null;
    const avg=pairs.length?pairs.reduce((a,b)=>a+b,0)/pairs.length:null;
    const locationLabel=located?`Location checked · ${avg<1?avg.toFixed(2)+" km avg":"within " + Math.max(...pairs).toFixed(1)+" km"}`:"Text + area match";
    return {cat:cats[0]||"Civic issue",status:statuses.length===1?statuses[0]:"Mixed status",spread,locationLabel,located};
  }
  function deck(groups){
    if(!groups.length)return `<section class="dup-section"><div class="dup-head"><div><div class="df-kicker">DUPLICATE INTELLIGENCE</div><h2>No duplicate signals detected</h2><p>Location is checked first, then category and description similarity are used to strengthen the signal.</p></div><span class="df-badge">● AUTO SCANNED</span></div><div class="dup-empty">No strong duplicate clusters right now.</div></section>`;
    return `<section class="dup-section"><div class="dup-head"><div><div class="df-kicker">DUPLICATE INTELLIGENCE</div><h2>Possible duplicate cases</h2><p>Compact clusters highlight reports that appear to describe the same real-world problem.</p></div><div class="dup-count"><b>${groups.length}</b><span>clusters</span></div></div><div class="dup-grid">${groups.map((g,i)=>{
      const m=meta(g),lead=g[0];
      return `<article class="dup-stack" data-dup-index="${i}" tabindex="0" aria-expanded="false">
        <div class="dup-stack-glow"></div>
        <div class="dup-top"><span class="dup-pill">${g.length} related</span><span class="dup-score">${escD(m.locationLabel)}</span></div>
        <div class="dup-title"><h3>${escD(m.cat)}</h3><p>${escD(lead.area||lead.district||"Pinned location")} · ${escD(m.status)}</p></div>
        <div class="dup-peek">${g.slice(0,2).map((c,j)=>{const s=j?signals(lead,c):null;return `<div class="dup-mini" style="--i:${j}"><span>${j+1}</span><div><b>${escD(c.description||c.title||c.category||"Reported issue")}</b><small>${s?.km!=null?s.km<1?s.km.toFixed(2)+" km away":s.km.toFixed(1)+" km away":"location not available"} · ${escD(c.status||"Pending")}</small></div></div>`}).join("")}</div>
        <div class="dup-expand">${g.map((c,j)=>{const s=j?signals(lead,c):null;return `<div class="dup-case-row"><span class="dup-case-num">${j+1}</span><div><b>${escD(c.description||c.title||c.category||"Reported issue")}</b><small>${escD(c.case_number||c.id||"")} · ${escD(c.status||"Pending")}</small></div><span class="dup-case-distance">${s?.km!=null?(s.km<1?s.km.toFixed(2):s.km.toFixed(1))+" km":"—"}</span></div>`}).join("")}</div>
        <div class="dup-foot"><span>${m.located?"Location signal verified":"Similarity signal"}</span><button type="button" class="secondary dup-open">Inspect</button></div>
      </article>`;
    }).join("")}</div></section>`;
  }
  function css(){
    if(document.getElementById("cf-duplicate-final-style"))document.getElementById("cf-duplicate-final-style").remove();
    const s=document.createElement("style");s.id="cf-duplicate-final-style";s.textContent=`
      .dup-section{margin-top:8px}.dup-head{display:flex;justify-content:space-between;align-items:end;gap:14px;margin-bottom:10px}.dup-head h2{margin:3px 0 0;font-size:20px;letter-spacing:-.7px}.dup-head p{margin:4px 0 0;color:#667085;font-size:9px;max-width:620px;line-height:1.45}.dup-count{min-width:58px;padding:7px 10px;border-radius:15px;text-align:right;background:rgba(255,255,255,.48);border:1px solid rgba(255,255,255,.84);box-shadow:inset 0 1px rgba(255,255,255,.9)}.dup-count b{display:block;font-size:19px;line-height:1;color:#1769e0}.dup-count span{font-size:7px;color:#667085;font-weight:850}.dup-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.dup-stack{position:relative;min-height:205px;padding:14px;border-radius:23px;border:1px solid rgba(255,255,255,.9);background:linear-gradient(145deg,rgba(255,255,255,.72),rgba(221,237,255,.46));box-shadow:0 16px 40px rgba(31,91,176,.09),inset 0 1px rgba(255,255,255,.98);backdrop-filter:blur(25px) saturate(170%);-webkit-backdrop-filter:blur(25px) saturate(170%);cursor:pointer;overflow:hidden;isolation:isolate;transition:transform .42s cubic-bezier(.22,1,.36,1),box-shadow .42s cubic-bezier(.22,1,.36,1)}.dup-stack:hover{transform:translateY(-3px);box-shadow:0 21px 50px rgba(31,91,176,.14),inset 0 1px rgba(255,255,255,1)}.dup-stack:before,.dup-stack:after{content:"";position:absolute;z-index:-1;left:14px;right:14px;height:100%;border-radius:20px;background:rgba(224,239,255,.34);border:1px solid rgba(255,255,255,.55);transform-origin:top center;transition:transform .48s cubic-bezier(.22,1,.36,1),opacity .35s ease}.dup-stack:before{top:7px;transform:rotate(-1.4deg) scale(.98);opacity:.7}.dup-stack:after{top:13px;transform:rotate(1.2deg) scale(.96);opacity:.42}.dup-stack[aria-expanded="true"]{cursor:default;transform:translateY(-1px)}.dup-stack[aria-expanded="true"]:before{transform:translateY(11px) rotate(-2.5deg) scale(.98)}.dup-stack[aria-expanded="true"]:after{transform:translateY(21px) rotate(2.5deg) scale(.96)}.dup-stack-glow{position:absolute;width:190px;height:190px;right:-80px;top:-105px;border-radius:50%;background:radial-gradient(circle,rgba(66,145,255,.18),transparent 68%);filter:blur(6px);pointer-events:none}.dup-top,.dup-foot{display:flex;justify-content:space-between;align-items:center;gap:8px}.dup-pill{padding:5px 8px;border-radius:999px;background:rgba(219,236,255,.76);border:1px solid rgba(255,255,255,.84);color:#1769e0;font-size:7px;font-weight:950}.dup-score{font-size:7px;color:#667085;font-weight:850}.dup-title{margin:11px 0 8px}.dup-title h3{margin:0;font-size:16px;letter-spacing:-.35px}.dup-title p{margin:3px 0 0;font-size:8px;color:#667085}.dup-peek{display:grid;gap:5px;transition:opacity .25s ease,transform .35s ease,max-height .35s ease;max-height:105px;overflow:hidden}.dup-mini{display:grid;grid-template-columns:22px 1fr;gap:7px;align-items:center;padding:7px 8px;border-radius:12px;background:rgba(255,255,255,.42);border:1px solid rgba(255,255,255,.7);transition:transform .25s ease}.dup-mini span{width:21px;height:21px;display:grid;place-items:center;border-radius:7px;background:rgba(220,237,255,.78);color:#1769e0;font-size:7px;font-weight:950}.dup-mini b{display:block;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dup-mini small{display:block;margin-top:2px;color:#8a96a8;font-size:6.5px}.dup-stack:hover .dup-mini{transform:translateX(2px)}.dup-foot{margin-top:9px;padding-top:8px;border-top:1px solid rgba(150,180,216,.18)}.dup-foot span{font-size:7px;color:#778399}.dup-foot .dup-open{min-height:30px;padding:0 10px;font-size:8px}.dup-expand{display:grid;grid-template-rows:0fr;opacity:0;transform:translateY(-5px);overflow:hidden;transition:grid-template-rows .48s cubic-bezier(.22,1,.36,1),opacity .28s ease,transform .48s cubic-bezier(.22,1,.36,1)}.dup-expand>*{min-height:0;overflow:hidden}.dup-stack[aria-expanded="true"] .dup-peek{opacity:0;transform:scale(.98);max-height:0}.dup-stack[aria-expanded="true"] .dup-expand{grid-template-rows:1fr;opacity:1;transform:none;margin-top:8px}.dup-case-row{display:grid;grid-template-columns:23px 1fr auto;gap:7px;align-items:center;margin-top:5px;padding:7px 8px;border-radius:12px;background:rgba(255,255,255,.43);border:1px solid rgba(255,255,255,.72)}.dup-case-num{width:21px;height:21px;display:grid;place-items:center;border-radius:7px;background:rgba(220,237,255,.72);color:#1769e0;font-size:7px;font-weight:950}.dup-case-row b{display:block;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dup-case-row small{display:block;margin-top:2px;font-size:6.5px;color:#8a96a8}.dup-case-distance{font-size:7px;color:#1769e0;font-weight:900}.dup-open{position:relative;z-index:3}.dup-stack:focus-visible{outline:3px solid rgba(23,105,224,.22);outline-offset:3px}.dup-empty{padding:20px;border-radius:19px;border:1px dashed rgba(120,159,203,.4);background:rgba(255,255,255,.35);color:#667085;font-size:9px;text-align:center}@media(max-width:800px){.dup-grid{grid-template-columns:1fr}.dup-head{align-items:flex-start}.dup-count{display:none}}@media(prefers-reduced-motion:reduce){.dup-stack,.dup-stack:before,.dup-stack:after,.dup-expand,.dup-mini{transition:none!important}}
    `;document.head.appendChild(s);
  }
  function install(){
    css();
    if(typeof window.admin!=="function"||window.__cfDupInstalled)return;
    const base=window.admin;window.__cfDupInstalled=true;
    window.admin=function(){
      let html=base.apply(this,arguments);const section=deck(clusters());
      const marker='<section class="df-section"><div class="df-section-head"><div><div class="df-kicker">FULL QUEUE</div>';
      if(html.includes(marker))html=html.replace(marker,section+marker);else html+=section;return html;
    };
    const oldRender=window.render;
    if(typeof oldRender==='function'&&!window.__cfDupRenderWrapped){window.__cfDupRenderWrapped=true;window.render=function(){const r=oldRender.apply(this,arguments);setTimeout(bind,30);return r;};}
    setTimeout(bind,40);
  }
  function bind(){document.querySelectorAll('.dup-stack').forEach(el=>{if(el.dataset.bound)return;el.dataset.bound='1';const toggle=e=>{if(e.target.closest('button,a'))return;const open=el.getAttribute('aria-expanded')==='true';document.querySelectorAll('.dup-stack[aria-expanded="true"]').forEach(x=>{if(x!==el)x.setAttribute('aria-expanded','false')});el.setAttribute('aria-expanded',String(!open));if(!open)setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'nearest'}),40)};el.addEventListener('click',toggle);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle(e)}});const btn=el.querySelector('.dup-open');if(btn)btn.addEventListener('click',e=>{e.stopPropagation();el.setAttribute('aria-expanded',el.getAttribute('aria-expanded')!=='true'?'true':'false')});});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.CivicFixDuplicateIntelligence={build:BUILD,scan:clusters,signals};
})();
