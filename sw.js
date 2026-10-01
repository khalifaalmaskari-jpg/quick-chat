const CACHE="quick-chat-v2.1.7";
const CORE=[
  "./index.html",
  "./assets/index.css?v=2.1.7",
  "./assets/index.js?v=2.1.7",
  "./manifest.webmanifest?v=2.1.7",
  "./icons/icon-192.png?v=2.1.7",
  "./icons/icon-512.png?v=2.1.7",
  "./icons/icon-maskable-512.png?v=2.1.7",
  "./icons/icon.svg?v=2.1.7",
  "./icons/icon-maskable.svg?v=2.1.7",
  "./icons/apple-touch-icon.png?v=2.1.7",
  "./vendor/react.min.js?v=2.1.7",
  "./vendor/react-dom.min.js?v=2.1.7",
  "./vendor/libphonenumber.min.js?v=2.1.7"
];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("message",e=>{if(e.data==="SKIP_WAITING")self.skipWaiting()});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const u=new URL(e.request.url);
  if(u.origin!==location.origin)return;
  const fallback=()=>caches.match(e.request).then(r=>r||caches.match("./index.html"));
  e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{
    if(r.ok)caches.open(CACHE).then(c=>c.put(e.request,r.clone()));
    return r;
  }).catch(fallback));
});