/* CivicFix final interaction + location layer. Keeps core app logic intact. */
(function(){
  "use strict";

  const CF_BUILD = "2026-08-16-final1";
  let reportMap = null;
  let reportMarker = null;
  let geocodeBusy = false;
  let lastGeocodeKey = "";
  let lastGeocodeAt = 0;

  const $id = id => document.getElementById(id);
  const escSafe = value => typeof esc === "function" ? esc(value) : String(value ?? "").replace(/[&<>\"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));

  /* ---------- Motion: dramatic, but compositor-friendly ---------- */
  const style = document.createElement("style");
  style.id = "cf-final-polish-style";
  style.textContent = `
    html{scroll-behavior:smooth}
    body{transition:opacity .22s ease}
    .cf-motion-ready .page{animation:cfPageIn .34s cubic-bezier(.16,1,.3,1) both}
    .cf-motion-ready .card,.cf-motion-ready .stat,.cf-motion-ready .support-card,.cf-motion-ready .cf-access-card{animation:cfCardIn .42s cubic-bezier(.16,1,.3,1) both;animation-delay:calc(min(var(--cf-i,0),7) * 32ms)}
    .primary,.secondary,.ghost,.nav button{transition:transform .18s cubic-bezier(.22,1,.36,1),box-shadow .22s ease,background .22s ease,border-color .22s ease,filter .22s ease}
    .primary:active,.secondary:active,.ghost:active,.nav button:active{transform:translateY(1px) scale(.975);filter:saturate(1.08)}
    .card,.support-card,.stat,.cf-access-card{transition:transform .24s cubic-bezier(.22,1,.36,1),box-shadow .28s ease,border-color .28s ease}
    .card:hover,.support-card:hover,.stat:hover,.cf-access-card:hover{transform:translateY(-3px);box-shadow:0 20px 42px rgba(31,91,176,.12),inset 0 1px rgba(255,255,255,.9)}
    .cf-location-panel{margin:10px 0 15px;padding:13px;border:1px solid rgba(255,255,255,.86);border-radius:19px;background:linear-gradient(135deg,rgba(244,250,255,.76),rgba(255,255,255,.48));box-shadow:0 12px 28px rgba(31,91,176,.08),inset 0 1px rgba(255,255,255,.95);backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%)}
    .cf-location-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.cf-location-kicker{font-size:9px;letter-spacing:1px;font-weight:950;color:#1769e0}.cf-location-title{font-size:13px;font-weight:950;margin-top:3px}.cf-location-copy{font-size:10px;color:#667085;line-height:1.45;margin-top:3px}.cf-location-mode{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}.cf-location-mode button{min-height:35px;border-radius:11px}.cf-location-map{height:220px;margin-top:10px;border-radius:15px;overflow:hidden;border:1px solid rgba(255,255,255,.9);box-shadow:inset 0 1px rgba(255,255,255,.9)}.cf-location-map .leaflet-control-attribution{font-size:8px}.cf-location-status{font-size:10px;color:#667085;margin-top:7px;min-height:15px}.cf-location-status.ok{color:#087a46;font-weight:900}.cf-location-status.error{color:#b42318;font-weight:900}.cf-location-address{font-size:10px;color:#344054;margin-top:6px;line-height:1.4}.cf-nav-btn{display:inline-flex!important;align-items:center;gap:6px;text-decoration:none!important}.cf-location-badge{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border-radius:999px;background:#edf6ff;color:#1769e0;font-size:9px;font-weight:950}.cf-location-mini{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border-radius:12px;background:rgba(238,247,255,.6);border:1px solid rgba(255,255,255,.8);font-size:10px;color:#566274}.cf-location-mini b{color:#1769e0}.cf-location-map .leaflet-marker-icon{filter:drop-shadow(0 5px 7px rgba(23,105,224,.28))}
    @keyframes cfPageIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
    @keyframes cfCardIn{from{opacity:0;transform:translateY(9px) scale(.992)}to{opacity:1;transform:none}}
    @media(max-width:700px){.cf-location-map{height:190px}.cf-location-mode{display:grid;grid-template-columns:1fr}.cf-location-mode button{width:100%}.cf-location-head{gap:7px}}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}}
  `;
  document.head.appendChild(style);

  function markMotion(){
    requestAnimationFrame(()=>document.documentElement.classList.add("cf-motion-ready"));
    document.querySelectorAll(".card,.stat,.support-card,.cf-access-card").forEach((el,i)=>el.style.setProperty("--cf-i",String(i)));
  }

  /* Avoid the old origin-based transition if a stale build ever survives in cache. */
  function killLegacyOriginLayer(){
    document.querySelectorAll("#cfTransitionLayer,#cfTransitionOrb").forEach(x=>x.remove());
    const legacy=document.getElementById("cf-origin-transition");
    if(legacy)legacy.remove();
  }
  killLegacyOriginLayer();

  /* ---------- Role-safe complaint cards ---------- */
  function navigateUrl(c){
    if(c?.latitude==null || c?.longitude==null) return "";
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${c.latitude},${c.longitude}`)}&travelmode=driving&dir_action=navigate`;
  }

  function finalFeatureAddon(c){
    const confirmations=typeof cfConfirmations==="function"?cfConfirmations(c.id):[];
    const duplicates=typeof cfDuplicateGroup==="function"?cfDuplicateGroup(c):[];
    const impact=typeof cfImpactScore==="function"?cfImpactScore(c):(Number(c.priority_score)||35);
    const route=typeof cfRouteInfo==="function"?cfRouteInfo(c):{department:c.department||"Municipal Services",reason:`${c.category} is routed to ${c.department||"Municipal Services"}`};
    const affected=typeof cfAffectedCount==="function"?cfAffectedCount(c):Math.max(1,1+confirmations.length);
    const actions=[];

    actions.push(`<button class="secondary" type="button" onclick="cfOpenTimeline('${c.id}')">View timeline</button>`);
    if(state.profile?.role==="citizen" && !cfUserOwnsComplaint(c)) actions.push(`<button class="secondary" type="button" onclick="cfConfirmIssue('${c.id}')">I have this problem too</button>`);
    if(state.profile?.role==="worker" && c.status==="In Progress") actions.push(`<button class="primary" type="button" onclick="cfUploadResolutionEvidence('${c.id}')">Upload resolution evidence</button>`);
    if(state.profile?.role==="worker" && c.latitude!=null && c.longitude!=null){
      actions.push(`<a class="secondary cf-nav-btn" href="${navigateUrl(c)}" target="_blank" rel="noopener noreferrer">↗ Navigate</a>`);
    }

    return `
      <div class="cf-case-tools">
        <div class="cf-impact"><span>Impact</span><b>${impact}/100</b><em>${typeof cfPriorityLabel==="function"?cfPriorityLabel(impact):""}</em></div>
        <div class="cf-community"><b>${affected}</b><span>citizen${affected===1?"":"s"} affected</span>${confirmations.length?`<small>+${confirmations.length} confirmations</small>`:""}</div>
      </div>
      ${duplicates.length?`<div class="cf-duplicate"><b>Possible duplicate cluster</b><span>${duplicates.length+1} nearby ${escSafe(c.category)} reports</span></div>`:""}
      <div class="cf-routing"><span>Routed to <b>${escSafe(route.department)}</b></span><span>${escSafe(route.reason)}</span></div>
      ${c.latitude!=null&&c.longitude!=null?`<div class="cf-location-mini"><span><b>●</b> Location pinned</span><span>${Number(c.latitude).toFixed(4)}, ${Number(c.longitude).toFixed(4)}</span></div>`:""}
      <div class="actions cf-feature-actions">${actions.join("")}</div>
      ${typeof cfResolutionBlock==="function"?cfResolutionBlock(c):""}`;
  }

  if(typeof cfOriginalCard==="function"){
    window.card=function(c,admin=false){
      /* Array.map passes the index as arg #2. Only literal true may grant admin controls. */
      const base=cfOriginalCard(c,admin===true);
      return base.replace("</article>",`${finalFeatureAddon(c)}</article>`);
    };
  }

  if(typeof cfOriginalCitizen==="function"){
    window.citizen=function(){
      /* Deliberately omit the retired Watch Case panel. */
      return cfOriginalCitizen()+((typeof cfNearbySection==="function")?cfNearbySection():"");
    };
  }

  /* Keep admin/worker views on the existing renderers; their card calls now receive a strict role flag. */

  /* ---------- Manual address + map picker ---------- */
  function setLocationStatus(text,type=""){
    const box=$id("cfLocationStatus");
    if(box){box.textContent=text;box.className="cf-location-status"+(type?` ${type}`:"");}
  }

  function setReportMarker(lat,lng,label){
    if(!reportMap) return;
    const point=[Number(lat),Number(lng)];
    if(reportMarker) reportMarker.setLatLng(point);
    else reportMarker=L.marker(point,{draggable:true}).addTo(reportMap);
    reportMarker.off("dragend").on("dragend",e=>{
      const p=e.target.getLatLng();
      gpsCoords=[p.lat,p.lng];
      setLocationStatus("Pin adjusted manually · location locked to the map.","ok");
      const area=$id("area");
      if(area && !area.dataset.manualText) area.value=`${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}`;
    });
    reportMap.setView(point,16,{animate:true,duration:.55});
    const addr=$id("cfLocationAddress");
    if(addr)addr.textContent=label||`Pinned at ${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`;
    setLocationStatus("Location pinned. You can drag the marker to fine-tune it.","ok");
    setTimeout(()=>reportMap?.invalidateSize(),80);
  }

  function initReportMap(){
    const host=$id("cfReportMap");
    if(!host || typeof L==="undefined") return;
    if(reportMap){reportMap.remove();reportMap=null;reportMarker=null;}
    reportMap=L.map(host,{zoomControl:true,attributionControl:true}).setView([23.3441,85.3096],10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"&copy; OpenStreetMap contributors"}).addTo(reportMap);
    reportMap.on("click",e=>{
      gpsCoords=[e.latlng.lat,e.latlng.lng];
      const area=$id("area");
      if(area){area.value=`${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`;area.dataset.manualText="";}
      setReportMarker(e.latlng.lat,e.latlng.lng,"Manual map pin");
    });
    setTimeout(()=>reportMap.invalidateSize(),120);
  }

  async function geocodeAddress(){
    const area=$id("area");
    if(!area) return false;
    const query=area.value.trim();
    if(!query) return false;
    if(/^[-+]?\d+(\.\d+)?\s*,\s*[-+]?\d+(\.\d+)?$/.test(query)){
      const parts=query.split(",").map(Number);
      if(parts[0]>=-90&&parts[0]<=90&&parts[1]>=-180&&parts[1]<=180){
        gpsCoords=[parts[0],parts[1]];setReportMarker(parts[0],parts[1],"Manual coordinate pin");return true;
      }
    }
    const now=Date.now();
    const key=query.toLowerCase();
    if(geocodeBusy) return false;
    if(key===lastGeocodeKey && now-lastGeocodeAt<60000 && gpsCoords?.length===2) return true;
    if(now-lastGeocodeAt<1000){
      setLocationStatus("Please wait a moment before searching another address.","error");
      return false;
    }
    geocodeBusy=true;
    const btn=$id("cfFindAddress");if(btn){btn.disabled=true;btn.textContent="Locating…";}
    setLocationStatus("Finding that address on the map…");
    try{
      const response=await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.error||"Address lookup failed.");
      const lat=Number(data.latitude),lng=Number(data.longitude);
      if(!Number.isFinite(lat)||!Number.isFinite(lng))throw new Error("That address could not be located. Try adding the city or district.");
      gpsCoords=[lat,lng];lastGeocodeKey=key;lastGeocodeAt=Date.now();
      area.dataset.manualText=query;
      setReportMarker(lat,lng,data.display_name||query);
      return true;
    }catch(err){
      setLocationStatus(err.message||"Could not locate that address.","error");
      gpsCoords=null;
      return false;
    }finally{
      geocodeBusy=false;if(btn){btn.disabled=false;btn.textContent="Find on map";}
    }
  }

  function injectLocationUI(){
    const form=$id("reportForm"), area=$id("area");
    if(!form||!area||$id("cfLocationPanel")) return;
    const locrow=area.closest(".locrow");
    if(locrow){
      const gps=locrow.querySelector("button");
      const wrap=document.createElement("div");wrap.className="cf-location-mode";
      const search=document.createElement("button");search.type="button";search.id="cfFindAddress";search.className="secondary";search.textContent="Find on map";search.onclick=geocodeAddress;
      if(gps){gps.className="secondary";gps.textContent="⌖ Use GPS";wrap.appendChild(search);wrap.appendChild(gps);locrow.appendChild(wrap);}
      area.placeholder="Enter address, landmark, road or locality";
      area.addEventListener("input",()=>{area.dataset.manualText=area.value;gpsCoords=null;setLocationStatus("Enter the location, then tap Find on map.");});
    }
    const panel=document.createElement("div");panel.id="cfLocationPanel";panel.className="cf-location-panel";
    panel.innerHTML=`<div class="cf-location-head"><div><div class="cf-location-kicker">PRECISION LOCATION</div><div class="cf-location-title">Pin the exact place</div><div class="cf-location-copy">Use GPS or enter an address. The confirmed pin is shared with the citizen, admin and assigned worker.</div></div><span class="cf-location-badge">● MAP SYNC</span></div><div class="cf-location-map" id="cfReportMap"></div><div class="cf-location-status" id="cfLocationStatus">Choose GPS, find an address, or tap the map to place a pin.</div><div class="cf-location-address" id="cfLocationAddress"></div>`;
    const gpsmsg=$id("gpsmsg");
    if(gpsmsg)gpsmsg.insertAdjacentElement("afterend",panel);else form.querySelector("#desc")?.parentNode.before(panel);
    initReportMap();
  }

  function resetReportLocation(){
    if(reportMap){reportMap.remove();reportMap=null;reportMarker=null;}
    geocodeBusy=false;lastGeocodeKey="";lastGeocodeAt=0;
  }

  /* Wrap the existing report modal. The original form and submission code remain authoritative. */
  if(typeof report==="function"){
    const baseReport=report;
    window.report=function(){
      resetReportLocation();
      baseReport.apply(this,arguments);
      requestAnimationFrame(()=>injectLocationUI());
    };
  }

  /* Ensure manual address is resolved before the existing submit pipeline runs. */
  if(typeof submitReport==="function"){
    const baseSubmit=submitReport;
    window.submitReport=async function(e){
      if(e && e.__cfLocationChecked) return baseSubmit.call(this,e);
      if(e) e.__cfLocationChecked=true;
      const area=$id("area");
      if(area && !gpsCoords){
        const ok=await geocodeAddress();
        if(!ok){
          const err=$id("rerr");
          if(err)err.innerHTML='<div class="error">Please use GPS, find the address on the map, or tap the map to place the complaint location.</div>';
          return;
        }
      }
      return baseSubmit.call(this,e);
    };
  }

  /* Existing GPS helper is wrapped so the new preview follows the same coordinates. */
  if(typeof useGPS==="function"){
    const baseGPS=useGPS;
    window.useGPS=function(){
      baseGPS.apply(this,arguments);
      const wait=()=>{if(gpsCoords?.length===2){setReportMarker(gpsCoords[0],gpsCoords[1],"Current device location");}else setTimeout(wait,120)};
      setTimeout(wait,120);
    };
  }

  /* Clean up report map when the existing modal closes. */
  if(typeof closeReport==="function"){
    const baseClose=closeReport;
    window.closeReport=function(){resetReportLocation();return baseClose.apply(this,arguments)};
  }

  /* Subtle animation indexing after every render. */
  const originalRender=window.render;
  if(typeof originalRender==="function"){
    window.render=function(){
      const result=originalRender.apply(this,arguments);
      requestAnimationFrame(markMotion);
      return result;
    };
  }

  window.CivicFixFinalPolish={version:CF_BUILD,locationGeocoder:"geocode.xyz",watchCase:false,adminAssignmentStrict:true};
  requestAnimationFrame(markMotion);
})();
