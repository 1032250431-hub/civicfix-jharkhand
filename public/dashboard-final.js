/* CivicFix Dashboard Final — role-specific visual redesign + resolution feedback fix. */
(function(){
  "use strict";
  const BUILD="2026-08-16-dashboard2";
  const $=id=>document.getElementById(id);
  const escSafe=v=>typeof esc==="function"?esc(v):String(v??"").replace(/[&<>\"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
  const toast=(m,t="success")=>typeof window.cfToast==="function"?window.cfToast(m,t):console.warn(m);

  const style=document.createElement("style");
  style.id="cf-dashboard-final-style";
  style.textContent=`
    :root{--df-blue:#1769e0;--df-blue2:#5aa2ff;--df-ink:#142033;--df-muted:#667085;--df-line:rgba(255,255,255,.78);--df-glass:rgba(255,255,255,.55);--df-shadow:0 24px 65px rgba(31,91,176,.12)}
    body{background:radial-gradient(800px 460px at 8% 0%,rgba(78,154,255,.14),transparent 62%),radial-gradient(720px 500px at 100% 28%,rgba(23,105,224,.12),transparent 62%),linear-gradient(180deg,#f7faff,#edf5ff)!important}
    .df-shell{display:grid;gap:16px}
    .df-hero{position:relative;overflow:hidden;display:grid;grid-template-columns:1.25fr .75fr;gap:18px;align-items:stretch;padding:27px;border-radius:30px;border:1px solid rgba(255,255,255,.92);background:linear-gradient(135deg,rgba(255,255,255,.76),rgba(226,239,255,.43));box-shadow:var(--df-shadow),inset 0 1px rgba(255,255,255,.98);backdrop-filter:blur(30px) saturate(175%);-webkit-backdrop-filter:blur(30px) saturate(175%)}
    .df-hero:after{content:"";position:absolute;width:330px;height:330px;right:-110px;top:-160px;border-radius:50%;background:radial-gradient(circle,rgba(71,151,255,.23),transparent 68%);filter:blur(12px);pointer-events:none}
    .df-kicker{font-size:9px;letter-spacing:1.5px;font-weight:950;color:var(--df-blue)}
    .df-hero h1{margin:8px 0 9px;font-size:clamp(36px,5vw,58px);line-height:.96;letter-spacing:-2.7px;max-width:680px}
    .df-hero p{margin:0;color:#5e6d82;line-height:1.55;max-width:610px;font-size:12px}
    .df-hero-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:17px}
    .df-hero-actions button{min-height:44px}
    .df-command{position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr;gap:8px;align-content:center}
    .df-command-tile{padding:15px;border-radius:20px;background:rgba(255,255,255,.42);border:1px solid rgba(255,255,255,.78);box-shadow:inset 0 1px rgba(255,255,255,.95);backdrop-filter:blur(18px)}
    .df-command-tile b{display:block;font-size:25px;letter-spacing:-1px}.df-command-tile span{display:block;margin-top:3px;color:#667085;font-size:9px;font-weight:800}.df-command-tile small{display:block;margin-top:7px;color:var(--df-blue);font-size:8px;font-weight:900}
    .df-section{margin-top:1px}.df-section-head{display:flex;justify-content:space-between;align-items:end;gap:12px;margin-bottom:10px}.df-section-head h2{margin:2px 0 0;font-size:20px;letter-spacing:-.7px}.df-section-head p{margin:3px 0 0;color:#667085;font-size:10px}
    .df-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.df-kpi{position:relative;overflow:hidden;padding:16px;border-radius:21px;border:1px solid rgba(255,255,255,.86);background:linear-gradient(135deg,rgba(255,255,255,.68),rgba(233,244,255,.42));box-shadow:0 15px 38px rgba(31,91,176,.09),inset 0 1px rgba(255,255,255,.96);backdrop-filter:blur(24px)}.df-kpi:after{content:"";position:absolute;width:90px;height:90px;right:-42px;top:-42px;border-radius:50%;background:rgba(74,151,255,.11)}.df-kpi-label{font-size:9px;color:#667085;font-weight:850}.df-kpi b{display:block;margin-top:5px;font-size:29px;letter-spacing:-1.4px}.df-kpi small{display:block;margin-top:4px;font-size:8px;color:#1769e0;font-weight:900}
    .df-panel{padding:18px;border-radius:25px;border:1px solid rgba(255,255,255,.88);background:linear-gradient(135deg,rgba(255,255,255,.68),rgba(231,242,255,.42));box-shadow:0 18px 45px rgba(31,91,176,.10),inset 0 1px rgba(255,255,255,.96);backdrop-filter:blur(26px) saturate(165%)}
    .df-panel-grid{display:grid;grid-template-columns:1.35fr .65fr;gap:12px}.df-priority-list{display:grid;gap:8px}.df-priority-item{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;padding:11px 12px;border-radius:17px;background:rgba(255,255,255,.38);border:1px solid rgba(255,255,255,.72);transition:transform .22s cubic-bezier(.22,1,.36,1),box-shadow .22s ease}.df-priority-item:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(31,91,176,.09)}.df-priority-dot{width:9px;height:9px;border-radius:50%;background:#1769e0;box-shadow:0 0 14px rgba(23,105,224,.3)}.df-priority-item.high .df-priority-dot{background:#b42318;box-shadow:0 0 14px rgba(180,35,24,.2)}.df-priority-item b{font-size:11px}.df-priority-item span{display:block;color:#667085;font-size:8px;margin-top:2px}.df-priority-score{font-size:10px;font-weight:950;color:#1769e0}.df-progress{height:8px;margin-top:10px;border-radius:999px;background:rgba(188,211,238,.32);overflow:hidden}.df-progress i{display:block;height:100%;width:var(--v);border-radius:inherit;background:linear-gradient(90deg,#1769e0,#65a9ff);box-shadow:0 0 15px rgba(45,131,246,.2)}
    .df-ops{display:grid;gap:9px}.df-ops-row{display:flex;justify-content:space-between;gap:10px;padding:11px 12px;border-radius:17px;background:rgba(255,255,255,.36);border:1px solid rgba(255,255,255,.7)}.df-ops-row span{font-size:9px;color:#667085}.df-ops-row b{font-size:12px}.df-ops-row .good{color:#087a46}.df-ops-row .warn{color:#9a5b00}.df-ops-row .bad{color:#b42318}
    .df-case-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.df-case-grid .card{margin:0}
    .df-worker-queue{display:grid;grid-template-columns:1fr auto;gap:10px}.df-job{display:grid;grid-template-columns:auto 1fr auto;gap:11px;align-items:center;padding:13px;border-radius:19px;background:rgba(255,255,255,.42);border:1px solid rgba(255,255,255,.74);box-shadow:inset 0 1px rgba(255,255,255,.9)}.df-job-index{width:34px;height:34px;border-radius:13px;display:grid;place-items:center;color:#1769e0;font-size:12px;font-weight:950;background:rgba(220,237,255,.72);border:1px solid rgba(255,255,255,.82)}.df-job b{font-size:11px}.df-job span{display:block;margin-top:3px;color:#667085;font-size:9px}.df-job-actions{display:flex;gap:6px}.df-job-actions button{min-height:36px;padding:0 11px}
    .df-empty{padding:24px;text-align:center;border-radius:21px;background:rgba(255,255,255,.38);border:1px dashed rgba(130,166,207,.45);color:#667085;font-size:11px}
    .df-badge{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border-radius:999px;background:rgba(222,238,255,.72);border:1px solid rgba(255,255,255,.84);color:#1769e0;font-size:8px;font-weight:950}
    .df-admin .df-hero{background:linear-gradient(135deg,rgba(255,255,255,.78),rgba(218,235,255,.48))}.df-worker .df-hero{background:linear-gradient(135deg,rgba(255,255,255,.76),rgba(225,240,255,.45))}.df-citizen .df-hero{background:linear-gradient(135deg,rgba(255,255,255,.80),rgba(231,243,255,.46))}
    @media(max-width:800px){.df-hero{grid-template-columns:1fr;padding:21px 16px;border-radius:27px}.df-command{grid-template-columns:1fr 1fr}.df-kpis{grid-template-columns:1fr 1fr}.df-panel-grid{grid-template-columns:1fr}.df-case-grid{grid-template-columns:1fr}.df-worker-queue{grid-template-columns:1fr}.df-job{grid-template-columns:auto 1fr}.df-job-actions{grid-column:2}.df-job-actions button{width:100%}.df-section-head{align-items:flex-start;flex-direction:column}.df-hero h1{font-size:clamp(36px,11vw,50px)}}
    @media(max-width:390px){.df-command{grid-template-columns:1fr}.df-kpis{grid-template-columns:1fr 1fr}.df-kpi b{font-size:25px}}
  `;
  document.head.appendChild(style);

  function citizenFinal(){
    const mine=(state.complaints||[]).filter(c=>c.citizen_id===state.session.user.id);
    const active=mine.filter(c=>!['Verified'].includes(c.status));
    const resolved=mine.filter(c=>c.status==='Resolved'||c.status==='Verified').length;
    const verified=mine.filter(c=>c.status==='Verified').length;
    const impact=mine.reduce((n,c)=>n+(typeof cfImpactScore==='function'?cfImpactScore(c):Number(c.priority_score)||0),0);
    const latest=mine.slice(0,4);
    return `<div class="df-shell df-citizen">
      <section class="df-hero">
        <div>
          <div class="df-kicker">CITIZEN COMMAND CENTER</div>
          <h1>Your city. Your voice.<br><span style="color:var(--df-blue)">Your impact.</span></h1>
          <p>Report a problem, follow its progress and verify the fix. Every report becomes a visible civic case with a location, priority and accountable status.</p>
          <div class="df-hero-actions"><button class="primary" onclick="report()">＋ Report an issue</button><button class="secondary" onclick="state.view='support';render()">Customer Care</button></div>
        </div>
        <div class="df-command">
          <div class="df-command-tile"><b>${mine.length}</b><span>Total reports</span><small>YOUR CASES</small></div>
          <div class="df-command-tile"><b>${active.length}</b><span>Active cases</span><small>IN PROGRESS</small></div>
          <div class="df-command-tile"><b>${resolved}</b><span>Resolved</span><small>${verified} VERIFIED</small></div>
          <div class="df-command-tile"><b>${impact}</b><span>Impact points</span><small>COMMUNITY SIGNAL</small></div>
        </div>
      </section>
      <section class="df-section"><div class="df-section-head"><div><div class="df-kicker">LIVE OVERVIEW</div><h2>Your civic activity</h2><p>Everything important at a glance.</p></div><span class="df-badge">● LIVE DATA</span></div>
        <div class="df-kpis"><div class="df-kpi"><span class="df-kpi-label">ACTIVE</span><b>${active.length}</b><small>cases being tracked</small></div><div class="df-kpi"><span class="df-kpi-label">RESOLVED</span><b>${resolved}</b><small>fixes reached resolution</small></div><div class="df-kpi"><span class="df-kpi-label">VERIFIED</span><b>${verified}</b><small>confirmed by you</small></div><div class="df-kpi"><span class="df-kpi-label">IMPACT</span><b>${impact}</b><small>combined case impact</small></div></div>
      </section>
      <section class="df-section"><div class="df-section-head"><div><div class="df-kicker">RECENT CASES</div><h2>What you've reported</h2><p>Open a case to see its timeline, location and next action.</p></div></div>
        <div class="df-case-grid">${latest.length?latest.map(card).join(""):`<div class="df-empty">No reports yet. Your first report can start the fix.</div>`}</div>
      </section>
      ${mapBox(mine)}
      ${typeof cfWatchPanel==='function'?cfWatchPanel():''}
      ${typeof cfNearbySection==='function'?cfNearbySection():''}
    </div>`;
  }

  function adminFinal(){
    const x=state.complaints||[];
    const pending=x.filter(c=>c.status==='Pending').length;
    const assigned=x.filter(c=>c.status==='Assigned').length;
    const progress=x.filter(c=>c.status==='In Progress').length;
    const done=x.filter(c=>c.status==='Resolved'||c.status==='Verified').length;
    const delayed=typeof cfIsEscalationEligible==='function'?x.filter(cfIsEscalationEligible).length:0;
    const high=x.filter(c=>c.priority==='High').length;
    const priority=[...x].sort((a,b)=>(Number(b.priority_score)||0)-(Number(a.priority_score)||0)).slice(0,4);
    const departments={};x.forEach(c=>{const d=c.department||'Municipal Services';departments[d]=(departments[d]||0)+1});
    const deptRows=Object.entries(departments).sort((a,b)=>b[1]-a[1]).slice(0,5);const max=Math.max(1,...deptRows.map(x=>x[1]));
    return `<div class="df-shell df-admin">
      <section class="df-hero"><div><div class="df-kicker">OPERATIONS COMMAND CENTER</div><h1>See the queue.<br><span style="color:var(--df-blue)">Move the city.</span></h1><p>Prioritize high-impact complaints, monitor response performance and keep every field team moving toward resolution.</p><div class="df-hero-actions"><button class="primary" onclick="document.getElementById('dfPriority')?.scrollIntoView({behavior:'smooth'})">Review priority queue</button><button class="secondary" onclick="state.view='support';render()">Customer Care queue</button></div></div><div class="df-command"><div class="df-command-tile"><b>${x.length}</b><span>Total cases</span><small>LIVE QUEUE</small></div><div class="df-command-tile"><b>${high}</b><span>High priority</span><small>ATTENTION</small></div><div class="df-command-tile"><b>${progress}</b><span>In progress</span><small>FIELD WORK</small></div><div class="df-command-tile"><b>${delayed}</b><span>Delayed</span><small>ESCALATION</small></div></div></section>
      <section class="df-section"><div class="df-section-head"><div><div class="df-kicker">OPERATIONS SNAPSHOT</div><h2>Queue health</h2><p>Current workload across the civic pipeline.</p></div><span class="df-badge">● ${done} RESOLVED</span></div><div class="df-kpis"><div class="df-kpi"><span class="df-kpi-label">PENDING</span><b>${pending}</b><small>awaiting assignment</small></div><div class="df-kpi"><span class="df-kpi-label">ASSIGNED</span><b>${assigned}</b><small>with field workers</small></div><div class="df-kpi"><span class="df-kpi-label">IN PROGRESS</span><b>${progress}</b><small>currently being fixed</small></div><div class="df-kpi"><span class="df-kpi-label">RESOLVED</span><b>${done}</b><small>completed cases</small></div></div></section>
      <section class="df-section" id="dfPriority"><div class="df-section-head"><div><div class="df-kicker">PRIORITY CONTROL</div><h2>Highest-impact cases</h2><p>Start with the cases carrying the strongest urgency signal.</p></div></div><div class="df-panel-grid"><div class="df-panel"><div class="df-priority-list">${priority.length?priority.map((c,i)=>`<div class="df-priority-item ${c.priority==='High'?'high':''}"><span class="df-priority-dot"></span><div><b>${escSafe(c.category)}</b><span>${escSafe(c.area)} · ${escSafe(c.status)}</span></div><strong class="df-priority-score">${typeof cfImpactScore==='function'?cfImpactScore(c):(c.priority_score||0)}/100</strong></div>`).join(''):'<div class="df-empty">No active cases.</div>'}</div></div><div class="df-panel"><div class="df-kicker">PIPELINE</div><h3 style="margin:5px 0 2px">Resolution progress</h3><p class="muted">Resolved or verified cases.</p><div style="margin-top:17px;font-size:34px;font-weight:950;letter-spacing:-1.5px">${x.length?Math.round(done/x.length*100):0}%</div><div class="df-progress"><i style="--v:${x.length?Math.round(done/x.length*100):0}%"></i></div><div class="df-ops" style="margin-top:14px"><div class="df-ops-row"><span>Pending</span><b>${pending}</b></div><div class="df-ops-row"><span>In progress</span><b>${progress}</b></div><div class="df-ops-row"><span>Delayed</span><b class="${delayed?'bad':'good'}">${delayed}</b></div></div></div></div></section>
      <section class="df-section"><div class="df-section-head"><div><div class="df-kicker">DEPARTMENT LOAD</div><h2>Where work is concentrated</h2><p>Live case distribution by responsible department.</p></div></div><div class="df-panel"><div class="df-ops">${deptRows.length?deptRows.map(([name,n])=>`<div><div class="df-ops-row"><span>${escSafe(name)}</span><b>${n}</b></div><div class="df-progress"><i style="--v:${Math.round(n/max*100)}%"></i></div></div>`).join(''):'<div class="df-empty">No department workload yet.</div>'}</div></div></section>
      ${mapBox(x)}
      <section class="df-section"><div class="df-section-head"><div><div class="df-kicker">FULL QUEUE</div><h2>All civic cases</h2><p>Use the existing case controls for assignment and oversight.</p></div></div><div class="df-case-grid">${x.map(c=>card(c,true)).join('')||'<div class="df-empty">No complaints yet.</div>'}</div></section>
    </div>`;
  }

  function workerFinal(){
    const x=(state.complaints||[]).filter(c=>c.assigned_worker_id===state.profile.id||!c.assigned_worker_id);
    const assigned=x.filter(c=>c.assigned_worker_id===state.profile.id);
    const active=assigned.filter(c=>c.status==='In Progress').length;
    const pending=assigned.filter(c=>c.status==='Assigned').length;
    const resolved=assigned.filter(c=>c.status==='Resolved'||c.status==='Verified').length;
    const next=[...assigned].sort((a,b)=>(Number(b.priority_score)||0)-(Number(a.priority_score)||0)).slice(0,4);
    return `<div class="df-shell df-worker">
      <section class="df-hero"><div><div class="df-kicker">FIELD OPERATIONS</div><h1>Know the job.<br><span style="color:var(--df-blue)">Own the fix.</span></h1><p>Your field queue is built around location, priority and the next action. Open a case, navigate to the site and submit resolution evidence when the work is complete.</p><div class="df-hero-actions"><button class="primary" onclick="document.getElementById('dfJobs')?.scrollIntoView({behavior:'smooth'})">Open my queue</button></div></div><div class="df-command"><div class="df-command-tile"><b>${assigned.length}</b><span>Assigned jobs</span><small>YOUR QUEUE</small></div><div class="df-command-tile"><b>${active}</b><span>In progress</span><small>ON SITE / ACTIVE</small></div><div class="df-command-tile"><b>${pending}</b><span>Ready to start</span><small>NEXT UP</small></div><div class="df-command-tile"><b>${resolved}</b><span>Resolved</span><small>COMPLETED</small></div></div></section>
      <section class="df-section"><div class="df-section-head"><div><div class="df-kicker">FIELD SNAPSHOT</div><h2>Today's operating picture</h2><p>Keep the most urgent work at the top.</p></div><span class="df-badge">● GPS READY</span></div><div class="df-kpis"><div class="df-kpi"><span class="df-kpi-label">ASSIGNED</span><b>${assigned.length}</b><small>your cases</small></div><div class="df-kpi"><span class="df-kpi-label">STARTED</span><b>${active}</b><small>work in progress</small></div><div class="df-kpi"><span class="df-kpi-label">READY</span><b>${pending}</b><small>awaiting your start</small></div><div class="df-kpi"><span class="df-kpi-label">DONE</span><b>${resolved}</b><small>resolution recorded</small></div></div></section>
      <section class="df-section" id="dfJobs"><div class="df-section-head"><div><div class="df-kicker">NEXT JOBS</div><h2>Priority field queue</h2><p>Highest-priority assignments appear first.</p></div></div><div class="df-panel"><div class="df-priority-list">${next.length?next.map((c,i)=>`<div class="df-job"><div class="df-job-index">${i+1}</div><div><b>${escSafe(c.category)}</b><span>${escSafe(c.area)} · ${escSafe(c.district||'Jharkhand')} · ${escSafe(c.status)}</span></div><div class="df-job-actions">${c.latitude!=null&&c.longitude!=null?`<a class="secondary cf-nav-btn" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${c.latitude},${c.longitude}`)}&travelmode=driving" target="_blank" rel="noopener noreferrer">Navigate</a>`:''}</div></div>`).join(''):'<div class="df-empty">No assigned jobs right now.</div>'}</div></div></section>
      ${mapBox(x)}
      <section class="df-section"><div class="df-section-head"><div><div class="df-kicker">CASE DETAIL</div><h2>Field case cards</h2><p>Existing controls remain available below.</p></div></div><div class="df-case-grid">${x.map(card).join('')||'<div class="df-empty">No assigned jobs.</div>'}</div></section>
    </div>`;
  }

  /* Fix: citizen resolution feedback must reopen to In Progress, not Pending. */
  window.cfVerifyResolution=async function(id,verified){
    const c=(state.complaints||[]).find(x=>x.id===id);
    if(!c||state.profile?.role!=="citizen"||c.citizen_id!==state.session?.user?.id) return;
    const next=verified?"Verified":"In Progress";
    const note=verified?"Citizen confirmed the resolution.":"Citizen reported that the issue is still present and requested follow-up work.";
    const {error}=await sb.from("complaints").update({status:next,updated_at:new Date().toISOString()}).eq("id",id).eq("citizen_id",state.session.user.id).eq("status","Resolved");
    if(error){toast(error.message,"error");return;}
    if(typeof cfAddEvent==='function'){
      try{await cfAddEvent(id,verified?"Verified":"Reopened",note,state.session.user.id)}catch(_e){}
    }
    await loadComplaints();
    if(typeof loadCivicExtras==='function') await loadCivicExtras();
    toast(verified?"Resolution verified successfully.":"Case reopened. The field team has been asked to continue the fix.","success");
    render();
  };

  /* Replace the role dashboard renderers while keeping all existing case/map logic. */
  window.citizen=citizenFinal;
  window.admin=adminFinal;
  window.worker=workerFinal;
  window.CivicFixDashboard={build:BUILD,roles:["citizen","admin","worker"]};

  function refresh(){
    if(state?.session&&state?.profile&&typeof render==="function") render();
  }
  window.addEventListener("load",()=>setTimeout(refresh,120));
})();
