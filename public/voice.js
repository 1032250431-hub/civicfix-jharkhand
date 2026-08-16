/* CivicFix Voice Reporting + smooth motion layer. */
(function(){
  let recorder=null, stream=null, chunks=[], startedAt=0, timer=null, transcript="", discarded=false;
  const el=id=>document.getElementById(id);
  const status=(text,type="")=>{const x=el("cfVoiceStatus");if(x){x.className="cf-voice-status"+(type?" "+type:"");x.textContent=text;}};
  const timerText=sec=>{const x=el("cfVoiceTimer");if(x){const s=Math.max(0,Math.floor(sec));x.textContent=`00:${String(s).padStart(2,"0")}`;}};
  const stopTimer=()=>{if(timer){clearInterval(timer);timer=null;}};
  const release=()=>{if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}};

  /* Kill the legacy origin-expansion layer at runtime so stale deployments cannot show it. */
  const legacy=document.getElementById("cfTransitionLayer");
  if(legacy)legacy.remove();

  /* Premium motion: dramatic enough to feel alive, restrained enough to stay fluid. */
  const motionStyle=document.createElement("style");
  motionStyle.textContent=`
    #cfTransitionLayer,#cfTransitionOrb{display:none!important;animation:none!important;transition:none!important}
    html.cf-transition-enter,html.cf-transition-enter body{animation:none!important;transform:none!important;filter:none!important}
    #cfMotionGlow{position:fixed;inset:0;z-index:49999;pointer-events:none;opacity:0;overflow:hidden}
    #cfMotionGlow::before{content:"";position:absolute;left:var(--mx,50%);top:var(--my,50%);width:220px;height:220px;border-radius:50%;transform:translate(-50%,-50%) scale(.15);background:radial-gradient(circle,rgba(255,255,255,.30),rgba(93,162,255,.12) 28%,transparent 68%);filter:blur(2px);opacity:0}
    #cfMotionGlow.play{animation:cfGlowFade .42s cubic-bezier(.22,1,.36,1)}
    #cfMotionGlow.play::before{animation:cfGlowBurst .42s cubic-bezier(.22,1,.36,1)}
    .cf-motion-page{animation:cfPageShift .34s cubic-bezier(.22,1,.36,1) both}
    .cf-motion-press{animation:cfPress .18s cubic-bezier(.22,1,.36,1)}
    .cf-motion-modal{animation:cfModalIn .34s cubic-bezier(.22,1,.36,1) both}
    @keyframes cfGlowFade{0%{opacity:0}18%{opacity:1}100%{opacity:0}}
    @keyframes cfGlowBurst{0%{opacity:0;transform:translate(-50%,-50%) scale(.15)}32%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(1.25)}}
    @keyframes cfPageShift{from{opacity:.58;transform:translateY(8px) scale(.992);filter:blur(2px)}58%{opacity:1;filter:blur(.2px)}to{opacity:1;transform:none;filter:none}}
    @keyframes cfPress{0%{transform:scale(1)}45%{transform:scale(.975)}100%{transform:scale(1)}}
    @keyframes cfModalIn{from{opacity:0;transform:translateY(12px) scale(.985)}to{opacity:1;transform:none}}
    @media(prefers-reduced-motion:reduce){#cfMotionGlow,.cf-motion-page,.cf-motion-press,.cf-motion-modal{animation:none!important}}
  `;
  document.head.appendChild(motionStyle);

  const glow=document.createElement("div");
  glow.id="cfMotionGlow";
  glow.setAttribute("aria-hidden","true");
  document.body.appendChild(glow);

  let lastPage=null;
  let pageTimer=0;
  function playGlow(target){
    if(!target||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    const r=target.getBoundingClientRect?.();
    if(!r)return;
    glow.style.setProperty("--mx",`${r.left+r.width/2}px`);
    glow.style.setProperty("--my",`${r.top+r.height/2}px`);
    glow.classList.remove("play");
    void glow.offsetWidth;
    glow.classList.add("play");
  }
  function animatePage(){
    const page=document.querySelector("main.page")||document.querySelector(".page");
    if(!page||page===lastPage)return;
    lastPage=page;
    clearTimeout(pageTimer);
    page.classList.remove("cf-motion-page");
    void page.offsetWidth;
    page.classList.add("cf-motion-page");
    pageTimer=setTimeout(()=>page.classList.remove("cf-motion-page"),420);
  }
  document.addEventListener("click",event=>{
    const target=event.target.closest?.("button,a,.card,.support-card,.cf-access-card");
    if(!target||target.disabled)return;
    if(target.closest("#cfMotionGlow"))return;
    target.classList.remove("cf-motion-press");
    void target.offsetWidth;
    target.classList.add("cf-motion-press");
    setTimeout(()=>target.classList.remove("cf-motion-press"),210);
    if(target.matches("button,a")&&!target.closest("form"))playGlow(target);
  },true);

  const observer=new MutationObserver(mutations=>{
    let changed=false;
    for(const m of mutations){
      for(const n of m.addedNodes||[]){
        if(n.nodeType!==1)continue;
        if(n.id==="cfMotionGlow"||n.id==="cfVoiceBox")continue;
        if(n.matches?.("main.page,.page,.top,.modal,.modalcard")||n.querySelector?.("main.page,.page,.top,.modalcard")){changed=true;break;}
      }
      if(changed)break;
    }
    if(changed)requestAnimationFrame(animatePage);
  });
  observer.observe(document.body,{childList:true,subtree:true});
  requestAnimationFrame(animatePage);

  function reset(){
    stopTimer();release();recorder=null;chunks=[];startedAt=0;transcript="";discarded=false;
    const box=el("cfVoiceBox");if(box)box.classList.remove("recording");
    const b=el("cfVoiceStart");if(b){b.disabled=false;b.onclick=start;b.innerHTML='<span class="cf-voice-main"><span class="cf-voice-dot"></span><span>Start voice report</span></span>';}
    timerText(0);status("Auto-detects supported Indian languages.");
    el("cfVoicePreview")?.classList.remove("show");el("cfVoiceActions")?.classList.remove("show");
    if(el("cfVoiceText"))el("cfVoiceText").textContent="";
    if(el("cfVoiceLang"))el("cfVoiceLang").textContent="";
  }
  function discard(){discarded=true;if(recorder&&recorder.state!=="inactive"){try{recorder.stop()}catch(_e){}}reset();}
  async function start(){
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){status("Voice recording is not supported by this browser.","error");return;}
    if(recorder&&recorder.state!=="inactive")return;
    try{
      discarded=false;chunks=[];
      stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      const types=["audio/webm;codecs=opus","audio/webm","audio/mp4","audio/ogg;codecs=opus","audio/ogg"];
      const mime=types.find(t=>MediaRecorder.isTypeSupported(t))||"";
      recorder=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream);
      recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
      recorder.onerror=()=>{status("Recording failed. Please try again.","error");reset()};
      recorder.onstop=finish;
      recorder.start(250);
      el("cfVoiceBox")?.classList.add("recording");
      const b=el("cfVoiceStart");if(b){b.disabled=false;b.onclick=stop;b.innerHTML='<span class="cf-voice-main"><span class="cf-voice-dot"></span><span>Stop & transcribe</span></span>';}
      status("Listening… speak naturally about the issue.","live");
      startedAt=Date.now();
      timer=setInterval(()=>{const n=Math.floor((Date.now()-startedAt)/1000);timerText(n);if(n>=20)stop()},250);
    }catch(err){release();status(err?.name==="NotAllowedError"?"Microphone permission was denied. Allow microphone access and try again.":"Could not access the microphone. Please try again.","error");}
  }
  function stop(){
    if(!recorder||recorder.state==="inactive")return;
    stopTimer();const b=el("cfVoiceStart");if(b){b.disabled=true;b.textContent="Processing…";}
    status("Finishing your recording…");try{recorder.stop()}catch(_e){reset()}
  }
  async function finish(){
    stopTimer();release();const r=recorder;const parts=chunks.slice();
    if(discarded||!r)return;
    const blob=new Blob(parts,{type:r.mimeType||"audio/webm"});recorder=null;chunks=[];
    el("cfVoiceBox")?.classList.remove("recording");
    if(blob.size<1000){status("The recording was too short. Please try again.","error");return;}
    status("Transcribing… this may take a few seconds.");
    try{
      const response=await fetch("/api/voice-transcribe",{method:"POST",headers:{"Content-Type":blob.type||"audio/webm"},body:blob});
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.error||`Transcription failed (${response.status}).`);
      transcript=(data.transcript||"").trim();
      if(!transcript)throw new Error("No speech could be detected. Please speak a little louder and try again.");
      if(el("cfVoiceText"))el("cfVoiceText").textContent=transcript;
      if(el("cfVoiceLang"))el("cfVoiceLang").textContent=data.language_code?`Detected language: ${data.language_code}`:"Language detected automatically";
      el("cfVoicePreview")?.classList.add("show");el("cfVoiceActions")?.classList.add("show");
      const b=el("cfVoiceStart");if(b){b.disabled=false;b.textContent="Record again";b.onclick=start;}
      status("Transcript ready. Review it before submitting.","success");
    }catch(err){
      const b=el("cfVoiceStart");if(b){b.disabled=false;b.textContent="Try voice again";b.onclick=start;}
      status(err?.message||"Could not transcribe the recording. Please try again or type the complaint.","error");
    }
  }
  function useTranscript(){
    const desc=el("desc");if(!desc||!transcript)return;
    const current=desc.value.trim();desc.value=current?`${current}\n${transcript}`:transcript;
    desc.dispatchEvent(new Event("input",{bubbles:true}));
    status("Transcript added to the description. Please review it.","success");
    el("cfVoicePreview")?.classList.remove("show");el("cfVoiceActions")?.classList.remove("show");desc.focus();
  }

  const style=document.createElement("style");
  style.textContent=`
.cf-voice-box{margin:14px 0 16px;padding:15px;border-radius:20px;border:1px solid rgba(255,255,255,.78);background:linear-gradient(135deg,rgba(238,247,255,.68),rgba(255,255,255,.42));box-shadow:0 12px 30px rgba(31,91,176,.08),inset 0 1px rgba(255,255,255,.95);backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%)}
.cf-voice-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.cf-voice-kicker{font-size:10px;letter-spacing:1px;font-weight:950;color:#1769e0}.cf-voice-title{margin-top:3px;font-size:14px;font-weight:950}.cf-voice-sub{margin-top:3px;font-size:10px;color:#667085;line-height:1.45}.cf-voice-orb{width:38px;height:38px;flex:0 0 38px;border-radius:13px;display:grid;place-items:center;font-size:18px;background:rgba(255,255,255,.62);border:1px solid rgba(255,255,255,.88);box-shadow:0 7px 18px rgba(23,105,224,.10),inset 0 1px rgba(255,255,255,.95)}
.cf-voice-controls{display:flex;gap:8px;align-items:center;margin-top:12px}.cf-voice-controls button{flex:1}.cf-voice-main{display:flex;align-items:center;justify-content:center;gap:8px}.cf-voice-dot{width:8px;height:8px;border-radius:50%;background:currentColor;display:none}.cf-voice-box.recording .cf-voice-dot{display:block;animation:cfVoicePulse 1s ease-in-out infinite}.cf-voice-box.recording .cf-voice-main{color:#fff}.cf-voice-timer{min-width:44px;text-align:center;font-size:10px;font-weight:950;color:#667085}.cf-voice-status{margin-top:9px;font-size:10px;color:#667085;min-height:15px}.cf-voice-status.live{color:#b42318;font-weight:900}.cf-voice-status.success{color:#087a46;font-weight:900}.cf-voice-status.error{margin:9px 0 0;background:#fff0f0;color:#b42318}.cf-voice-preview{display:none;margin-top:10px;padding:10px 11px;border-radius:15px;background:rgba(255,255,255,.52);border:1px solid rgba(255,255,255,.75)}.cf-voice-preview.show{display:block}.cf-voice-preview-label{font-size:9px;letter-spacing:.7px;font-weight:950;color:#1769e0}.cf-voice-preview-text{margin-top:5px;font-size:12px;line-height:1.5;color:#26364d;white-space:pre-wrap}.cf-voice-actions{display:none;gap:7px;margin-top:9px}.cf-voice-actions.show{display:flex}.cf-voice-actions button{flex:1;min-height:38px}.cf-voice-lang{font-size:9px;color:#667085;margin-top:5px}@keyframes cfVoicePulse{50%{transform:scale(1.45);opacity:.45}}@media(max-width:800px){.cf-voice-controls{flex-direction:column;align-items:stretch}.cf-voice-controls button{width:100%}.cf-voice-actions{flex-direction:column}}
`;
  document.head.appendChild(style);

  function inject(){
    const modal=document.getElementById("reportModal");
    const form=document.getElementById("reportForm");
    if(!modal||!form||document.getElementById("cfVoiceBox"))return;
    const desc=document.getElementById("desc");if(!desc)return;
    const box=document.createElement("div");box.className="cf-voice-box";box.id="cfVoiceBox";
    box.innerHTML=`<div class="cf-voice-head"><div><div class="cf-voice-kicker">VOICE REPORTING</div><div class="cf-voice-title">Can't type? Just speak.</div><div class="cf-voice-sub">Speak naturally. CivicFix will transcribe your complaint and let you review it before submitting.</div></div><div class="cf-voice-orb" aria-hidden="true">🎙️</div></div><div class="cf-voice-controls"><button type="button" class="secondary" id="cfVoiceStart"><span class="cf-voice-main"><span class="cf-voice-dot"></span><span>Start voice report</span></span></button><div class="cf-voice-timer" id="cfVoiceTimer">00:00</div></div><div class="cf-voice-status" id="cfVoiceStatus">Auto-detects supported Indian languages.</div><div class="cf-voice-preview" id="cfVoicePreview"><div class="cf-voice-preview-label">TRANSCRIPT</div><div class="cf-voice-preview-text" id="cfVoiceText"></div><div class="cf-voice-lang" id="cfVoiceLang"></div></div><div class="cf-voice-actions" id="cfVoiceActions"><button type="button" class="secondary" id="cfVoiceAgain">Record again</button><button type="button" class="primary" id="cfVoiceUse">Use this transcript</button></div>`;
    desc.parentNode.insertBefore(box,desc.parentNode.firstChild);
    el("cfVoiceStart").onclick=start;el("cfVoiceAgain").onclick=discard;el("cfVoiceUse").onclick=useTranscript;
    requestAnimationFrame(()=>{const card=box.closest(".modalcard");if(card){card.classList.add("cf-motion-modal");setTimeout(()=>card.classList.remove("cf-motion-modal"),380)}});
  }

  const originalReport=window.report;
  if(typeof originalReport==="function")window.report=function(){originalReport.apply(this,arguments);requestAnimationFrame(()=>{inject();animatePage()})};
  const originalClose=window.closeReport;
  if(typeof originalClose==="function")window.closeReport=function(){discarded=true;stopTimer();release();if(recorder&&recorder.state!=="inactive"){try{recorder.stop()}catch(_e){}}originalClose.apply(this,arguments);reset()};
})();
