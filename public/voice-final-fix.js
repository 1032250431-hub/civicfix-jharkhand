/* CivicFix Voice Final — graceful fallback when Sarvam is not configured. */
(function(){
  "use strict";
  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  let serverReady=null,recognition=null,listening=false,transcript="";
  const $=id=>document.getElementById(id);
  const status=(text,type="")=>{const x=$("cfVoiceStatus");if(x){x.className="cf-voice-status"+(type?" "+type:"");x.textContent=text}};
  const timer=s=>{const x=$("cfVoiceTimer");if(x)x.textContent=`00:${String(Math.max(0,Math.floor(s))).padStart(2,"0")}`};
  function setButton(text,fn,disabled=false){const b=$("cfVoiceStart");if(!b)return;b.disabled=disabled;b.onclick=fn;b.innerHTML=`<span class="cf-voice-main"><span class="cf-voice-dot"></span><span>${text}</span></span>`}
  async function checkServer(){
    try{const r=await fetch("/api/voice-transcribe",{method:"POST",headers:{"Content-Type":"audio/webm"},body:new Blob([],{type:"audio/webm"}),cache:"no-store"});serverReady=r.status!==503}catch(_){serverReady=null}
    applyMode();
  }
  function applyMode(){
    if(serverReady!==false)return;
    if(!SpeechRecognition){status("Voice service needs server setup. You can type the complaint below.","error");return}
    const b=$("cfVoiceStart");if(!b)return;
    b.onclick=startBrowser;b.disabled=false;b.innerHTML='<span class="cf-voice-main"><span class="cf-voice-dot"></span><span>Start voice report</span></span>';
    status("Voice service is offline right now — using browser voice input instead.");
  }
  function startBrowser(){
    if(listening){stopBrowser();return}
    try{
      recognition=new SpeechRecognition();recognition.continuous=true;recognition.interimResults=true;recognition.maxAlternatives=1;
      recognition.lang=(navigator.language&&/^(hi|bn|en)/i.test(navigator.language))?navigator.language:"hi-IN";
      let finalText="";
      recognition.onstart=()=>{listening=true;$("cfVoiceBox")?.classList.add("recording");setButton("Stop & use transcript",stopBrowser);status("Listening… speak naturally about the issue.","live");let t=0;recognition.__timer=setInterval(()=>timer(++t),1000)};
      recognition.onresult=e=>{let interim="";for(let i=e.resultIndex;i<e.results.length;i++){const text=e.results[i][0].transcript;if(e.results[i].isFinal)finalText+=text+" ";else interim+=text}const p=$("cfVoiceText");if(p)p.textContent=(finalText+interim).trim()};
      recognition.onerror=e=>{if(e.error==="not-allowed"||e.error==="service-not-allowed")status("Microphone permission was denied. Allow microphone access and try again.","error");else status("Voice input could not be completed. Please try again or type the complaint.","error");finishBrowser(finalText)};
      recognition.onend=()=>{if(listening)finishBrowser(finalText)};recognition.start();
    }catch(_){status("Browser voice input is unavailable. Please type the complaint below.","error")}
  }
  function stopBrowser(){try{recognition?.stop()}catch(_){} }
  function finishBrowser(text){
    if(!listening&&text===undefined)return;
    listening=false;const r=recognition;if(r?.__timer)clearInterval(r.__timer);recognition=null;$("cfVoiceBox")?.classList.remove("recording");transcript=(text||$("cfVoiceText")?.textContent||"").trim();timer(0);
    if(!transcript){status("No speech was detected. Please try again.","error");setButton("Try voice again",startBrowser);return}
    if($("cfVoiceText"))$("cfVoiceText").textContent=transcript;if($("cfVoiceLang"))$("cfVoiceLang").textContent="Browser voice input · review before submitting";
    $("cfVoicePreview")?.classList.add("show");$("cfVoiceActions")?.classList.add("show");setButton("Record again",startBrowser);status("Transcript ready. Review it before submitting.","success");
  }
  function use(){const d=$("desc");if(!d||!transcript)return;d.value=d.value.trim()?`${d.value.trim()}\n${transcript}`:transcript;d.dispatchEvent(new Event("input",{bubbles:true}));$("cfVoicePreview")?.classList.remove("show");$("cfVoiceActions")?.classList.remove("show");status("Transcript added to the description. Please review it.","success");d.focus()}
  function wire(box){
    if(!box||box.dataset.voiceFinalFixWired==="1")return;
    box.dataset.voiceFinalFixWired="1";
    const useBtn=box.querySelector("#cfVoiceActions button");if(useBtn)useBtn.onclick=use;
    checkServer();
  }
  const obs=new MutationObserver(()=>{const box=$("cfVoiceBox");if(box)wire(box)});
  if(document.body)obs.observe(document.body,{childList:true,subtree:true});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>wire($("cfVoiceBox")));else wire($("cfVoiceBox"));
})();
