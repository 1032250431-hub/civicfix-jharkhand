const CACHE="civicfix-shell-v3";
const CORE=["/","/index.html","/manifest.json","/resilient.js","/final-polish.js","/voice.js","/smooth-motion.js","/master-final.js"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",event=>{const r=event.request;const u=new URL(r.url);if(r.method!=="GET"||u.origin!==self.location.origin)return;event.respondWith(fetch(r).then(res=>{const copy=res.clone();if(res.ok)caches.open(CACHE).then(c=>c.put(r,copy));return res}).catch(()=>caches.match(r).then(c=>c||caches.match("/index.html"))))});
self.addEventListener("message",event=>{if(event.data?.type==="SKIP_WAITING")self.skipWaiting()});
