// PocketDevice 2.0.2, build 01 — static offline app. Bump CACHE_VERSION for every release.
const CACHE_VERSION = "2.0.2-build01";
const PREFIX = "pocketdevice-" + self.registration.scope + "-";
const CACHE_NAME = PREFIX + CACHE_VERSION;
const CORE = [
    "index.html","style.css","script.js","map-data.js","pwa.js","manifest.webmanifest",
    "icon-192.png","icon-512.png","apple-touch-icon.png","v2.css","v2.js","v2-library.js","goat.png","devil.png","medusa.png","goat-book.png","goat-coffee.png","goat-glasses.png","goat-meditate.png","devil-fire.png","devil-finger.png","devil-tail.png","devil-laugh.png","medusa-snakes.png","medusa-stone.png","medusa-hiss.png","medusa-mirror.png"
];
const SPRITES = [
    "chimp.png","chimp-blink.png","chimp-grab.png","chimp-pet.png","chimp-beer-hold.png",
    "chimp-beer-drink.png","chimp-smoke.png","chimp-smoke-exhale.png","chimp-walk-1.png",
    "chimp-walk-2.png","chimp-sit.png","chimp-sleep.png","chimp-yawn.png","chimp-scratch-butt.png",
    "chimp-scratch-groin.png","chimp-laugh.png","chimp-middle-finger.png","chimp-cap.png","chimp-pee.png"
];
const allFiles = [...CORE,...SPRITES];
const fileURL = name => new URL(name,self.registration.scope).href;
const knownURLs = new Set(allFiles.map(fileURL));
const rootURL = fileURL("./");
const indexURL = fileURL("index.html");
let lastUpdateCheck=0;
async function cacheMissingSprites(cache) {
    await Promise.all(SPRITES.map(async name=>{
        const url=fileURL(name);
        try{
            if(await cache.match(url))return;
            const response=await fetch(url,{cache:"no-cache"});
            // Do not store an HTML 404 page as an image.
            if(response.ok&&(response.headers.get("content-type")||"").startsWith("image/"))await cache.put(url,response);
        }catch{/* if missing or offline, the status will report it */}
    }));
}
async function getStatus(retry=false){
    const cache=await caches.open(CACHE_NAME);
    if(retry)await cacheMissingSprites(cache);
    const matches=await Promise.all(allFiles.map(name=>cache.match(fileURL(name))));
    const missing=allFiles.filter((_,i)=>!matches[i]);
    return {type:"PD_CACHE_STATUS",version:CACHE_VERSION,ready:missing.length===0,missing};
}
self.addEventListener("install",event=>{
    event.waitUntil((async()=>{
        const cache=await caches.open(CACHE_NAME);
        await cache.addAll(CORE.map(name=>new Request(fileURL(name),{cache:"reload"})));
        await cacheMissingSprites(cache);
        await self.skipWaiting();
    })());
});
self.addEventListener("activate",event=>{
    event.waitUntil((async()=>{
        const names=await caches.keys();
        await Promise.all(names.filter(name=>name.startsWith(PREFIX)&&name!==CACHE_NAME).map(name=>caches.delete(name)));
        await self.clients.claim();
        const status=await getStatus();
        for(const client of await self.clients.matchAll({type:"window",includeUncontrolled:false}))client.postMessage(status);
    })());
});
self.addEventListener("fetch",event=>{
    const req=event.request;
    if(req.method!=="GET")return;
    const url=new URL(req.url);
    if(url.origin!==self.location.origin)return;
    if(req.mode==="navigate"&&(url.href===rootURL||url.href===indexURL||url.pathname===new URL(rootURL).pathname||url.pathname===new URL(indexURL).pathname)){
        if(Date.now()-lastUpdateCheck>30000){lastUpdateCheck=Date.now();event.waitUntil(self.registration.update().catch(()=>{}));}
        event.respondWith((async()=>{
            const cache=await caches.open(CACHE_NAME);
            const saved=await cache.match(indexURL);
            return saved||fetch(req);
        })());return;
    }
    if(!knownURLs.has(url.href))return;
    event.respondWith((async()=>{
        const cache=await caches.open(CACHE_NAME);
        const saved=await cache.match(url.href);
        if(saved)return saved;
        const response=await fetch(req);
        if(response.ok&&(!SPRITES.some(name=>fileURL(name)===url.href)||(response.headers.get("content-type")||"").startsWith("image/")))await cache.put(url.href,response.clone());
        return response;
    })());
});
self.addEventListener("message",event=>{
    if(!["PD_CACHE_STATUS","PD_CACHE_RETRY"].includes(event.data?.type))return;
    event.waitUntil((async()=>{
        const status=await getStatus(event.data.type==="PD_CACHE_RETRY");
        event.source?.postMessage(status);
    })());
});
