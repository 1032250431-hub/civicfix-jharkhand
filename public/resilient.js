/* CivicFix Resilient Mode — offline queue, connection awareness, lightweight evidence. */
(function(){
  "use strict";
  const DB="civicfix-resilient", STORE="pending";
  let dbp=null;
  const id=x=>document.getElementById(x);
  const openDB=()=>dbp||(dbp=new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:"id",autoIncrement:true});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)}));
  async function put(item){const db=await openDB();return new Promise((resolve,reject)=>{const t=db.transaction(STORE,"readwrite");t.objectStore(STORE).add(item).onsuccess=e=>resolve(e.target.result);t.onerror=()=>reject(t.error)})}
  async function all(){const db=await openDB();return new Promise((resolve,reject)=>{const t=db.transaction(STORE,"readonly");const r=t.objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
  async function del(key){const db=await openDB();return new Promise((resolve,reject)=>{const t=db.transaction(STORE,"readwrite");t.objectStore(STORE).delete(key);t.oncomplete=resolve;t.onerror=()=>reject(t.error)})}

  const style=document.createElement("style");style.textContent=`
  #cfNetPill{position:fixed;right:16px;top:82px;z-index:28000;display:none;align-items:center;gap:7px;padding:8px 11px;border-radius:999px;background:linear-gradient(135deg,rgba(255,255,255,.86),rgba(232,243,255,.65));border:1px solid rgba(255,255,255,.95);box-shadow:0 14px 34px rgba(31,91,176,.15),inset 0 1px rgba(255,255,255,1);backdrop-filter:blur(22px) saturate(175%);-webkit-backdrop-filter:blur(22px) saturate(175%);font:800 10px Inter,system-ui;color:#566274;animation:cfNetIn .32s cubic-bezier(.22,1,.36,1)}
  #cfNetPill.show{display:flex}.cf-net-dot{width:7px;height:7px;border-radius:50%;background:#087a46;box-shadow:0 0 10px rgba(8,122,70,.25)}#cfNetPill.offline .cf-net-dot{background:#b42318;box-shadow:0 0 10px rgba(180,35,24,.22)}#cfNetPill.weak .cf-net-dot{background:#9a5b00;box-shadow:0 0 10px rgba(154,91,0,.22)}
  #cfOfflineTray{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:28001;display:none;width:min(430px,calc(100vw - 24px));padding:13px 15px;border-radius:20px;background:linear-gradient(135deg,rgba(255,255,255,.90),rgba(238,247,255,.72));border:1px solid rgba(255,255,255,.96);box-shadow:0 20px 48px rgba(31,91,176,.18),inset 0 1px rgba(255,255,255,1);backdrop-filter:blur(25px) saturate(175%);-webkit-backdrop-filter:blur(25px) saturate(175%);font:800 11px Inter,system-ui;color:#26364d;animation:cfTrayIn .38s cubic-bezier(.22,1,.36,1)}
  #cfOfflineTray.show{display:flex;align-items:center;gap:11px}.cf-off-icon{width:30px;height:30px;border-radius:11px;display:grid;place-items:center;background:rgba(154,91,0,.10);color:#9a5b00}.cf-off-copy{flex:1}.cf-off-copy small{display:block;margin-top:2px;color:#667085;font-weight:600;font-size:9px;line-height:1.4}.cf-off-sync{border:0;border-radius:11px;padding:9px 11px;background:#1769e0;color:#fff;font-weight:900;font-size:10px}.cf-off-close{border:0;background:transparent;color:#667085;font-size:17px;padding:2px}@keyframes cfNetIn{from{opacity:0;transform:translateY(-5px) scale(.97)}}@keyframes cfTrayIn{from{opacity:0;transform:translate(-50%,12px) scale(.97)}}
  @media(max-width:700px){#cfNetPill{right:10px;top:72px}#cfOfflineTray{bottom:calc(12px + env(safe-area-inset-bottom))}}
  @media(prefers-reduced-motion:reduce){#cfNetPill,#cfOfflineTray{animation:none}}
  `;document.head.appendChild(style);

  const pill=document.createElement("div");pill.id="cfNetPill";pill.innerHTML='<span class="cf-net-dot"></span><span id="cfNetText"></span>';document.body.appendChild(pill);
  const tray=document.createElement("div");tray.id="cfOfflineTray";tray.innerHTML='<div class="cf-off-icon">↻</div><div class="cf-off-copy"><b id="cfOffTitle">Saved on this device</b><small id="cfOffSub">Your complaint will be synced when the connection returns.</small></div><button class="cf-off-sync" id="cfOffSync">Sync</button><button class="cf-off-close" id="cfOffClose">×</button>';document.body.appendChild(tray);

  function network(){
    if(!navigator.onLine){pill.className="show offline";id("cfNetText").textContent="Offline · CivicFix is saving locally";return}
    const c=navigator.connection;
    if(c&&((c.effectiveType&&["slow-2g","2g"].includes(c.effectiveType))||c.saveData)){pill.className="show weak";id("cfNetText").textContent="Weak connection · resilient mode";return}
    pill.className="";
  }
  window.addEventListener("online",()=>{network();syncWhenReady()});window.addEventListener("offline",network);navigator.connection?.addEventListener?.("change",network);network();

  function formValue(form,name){const e=form.elements[name]||id(name);return e?.value||""}
  async function fileToData(file){if(!file)return null;return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve({name:file.name,type:file.type,data:r.result});r.onerror=()=>reject(r.error);r.readAsDataURL(file)})}
  async function compress(file){
    if(!file||!file.type.startsWith("image/")||file.size<500000)return file;
    try{const bmp=await createImageBitmap(file),max=1600,scale=Math.min(1,max/Math.max(bmp.width,bmp.height));const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(bmp.width*scale));canvas.height=Math.max(1,Math.round(bmp.height*scale));canvas.getContext("2d").drawImage(bmp,0,0,canvas.width,canvas.height);const blob=await new Promise(r=>canvas.toBlob(r,"image/jpeg",.78));if(!blob)return file;return new File([blob],file.name.replace(/\.[^.]+$/,".jpg"),{type:"image/jpeg",lastModified:Date.now()})}catch(_e){return file}
  }
  async function compressPhotoInput(){const input=id("photo");if(!input?.files?.[0])return;const original=input.files[0];const file=await compress(original);if(file===original)return;const dt=new DataTransfer();dt.items.add(file);input.files=dt.files;showToast("Evidence photo optimized for a slower connection.");}

  function showToast(text){if(typeof window.cfToast==="function")window.cfToast(text,"success");else if(id("cfOffSub"))id("cfOffSub").textContent=text}
  function showTray(count){id("cfOffTitle").textContent=`${count} complaint${count===1?"":"s"} saved offline`;id("cfOffSub").textContent="It stays on this device until CivicFix can submit it.";tray.classList.add("show")}
  async function queueForm(form){
    const photo=form.elements.photo||id("photo");
    const file=photo?.files?.[0]?await fileToData(photo.files[0]):null;
    const item={createdAt:Date.now(),category:formValue(form,"category"),priority:formValue(form,"priority"),area:formValue(form,"area"),description:formValue(form,"desc"),photo:file,latitude:window.gpsCoords?.[0]??null,longitude:window.gpsCoords?.[1]??null};
    const key=await put(item);showTray((await all()).length);return key;
  }

  /* Capture the existing form before its normal online handler. Nothing changes online. */
  document.addEventListener("submit",async e=>{
    if(e.target?.id!=="reportForm"||navigator.onLine)return;
    e.preventDefault();e.stopImmediatePropagation();
    const form=e.target;try{await queueForm(form);if(typeof window.closeReport==="function")window.closeReport();showToast("Complaint saved offline. It will sync automatically when you reconnect.");}catch(_err){showToast("Could not save offline. Please keep the form open and try again.","error")}
  },true);

  document.addEventListener("change",e=>{if(e.target?.id==="photo")compressPhotoInput()});

  async function restorePhoto(item){if(!item.photo)return null;const res=await fetch(item.photo.data);const blob=await res.blob();return new File([blob],item.photo.name,{type:item.photo.type})}
  async function fillAndSubmit(item){
    const form=id("reportForm");if(!form)return false;
    const set=(name,val)=>{const e=form.elements[name]||id(name);if(e)e.value=val||""};
    set("category",item.category);set("priority",item.priority);set("area",item.area);set("desc",item.description);
    if(item.photo){try{const input=form.elements.photo||id("photo");const dt=new DataTransfer();dt.items.add(await restorePhoto(item));input.files=dt.files}catch(_e){}}
    if(item.latitude!=null&&item.longitude!=null)window.gpsCoords=[item.latitude,item.longitude];
    if(typeof window.submitReport==="function"){const ev=new Event("submit",{bubbles:true,cancelable:true});form.dispatchEvent(ev);return true}
    return false;
  }
  async function syncWhenReady(){
    if(!navigator.onLine)return;
    const pending=await all().catch(()=>[]);if(!pending.length){tray.classList.remove("show");return}
    showTray(pending.length);
    /* Only submit when the real report form is already available; otherwise leave the queue safely intact. */
    if(!id("reportForm"))return;
    id("cfOffSync").disabled=true;id("cfOffSync").textContent="Syncing…";
    for(const item of pending){try{await fillAndSubmit(item);await new Promise(r=>setTimeout(r,500));await del(item.id)}catch(_e){break}}
    const left=await all();if(left.length){showTray(left.length);id("cfOffSync").disabled=false;id("cfOffSync").textContent="Retry sync"}else{tray.classList.remove("show");showToast("Offline complaints synced successfully.")}
  }
  id("cfOffSync").onclick=async()=>{if(typeof window.report==="function"&&!id("reportForm")&&navigator.onLine){try{window.report();await new Promise(r=>setTimeout(r,250))}catch(_e){}}await syncWhenReady()};id("cfOffClose").onclick=()=>tray.classList.remove("show");
  window.addEventListener("load",()=>{if(navigator.onLine)setTimeout(syncWhenReady,800)});

  if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch(()=>{}));
  window.CivicFixResilient={version:"1.0",queue:syncWhenReady};
})();