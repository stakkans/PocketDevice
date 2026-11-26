// PocketDevice 1.0 — installability and offline status, no remote user accounts.
(function(){
    let status="Перевіряю офлайн-кеш…",registration=null;
    function render(){
        const element=document.querySelector(".pwa-status");
        if(element)element.textContent=status;
    }
    function setStatus(message){status=message;render();}
    window.pdPwaUpdateStatus=render;
    function ask(retry=false){
        const worker=navigator.serviceWorker?.controller||registration?.active;
        if(worker)worker.postMessage({type:retry?"PD_CACHE_RETRY":"PD_CACHE_STATUS"});
    }
    if(location.protocol==="file:"){
        setStatus("Локальний файл: працює без мережі. Для встановлення потрібна HTTPS-адреса.");
        return;
    }
    if(!window.isSecureContext||!("serviceWorker" in navigator)){
        setStatus("Офлайн-кеш недоступний: потрібен HTTPS і підтримка service worker.");
        return;
    }
    navigator.serviceWorker.addEventListener("message",event=>{
        const data=event.data;
        if(data?.type!=="PD_CACHE_STATUS")return;
        if(data.ready)setStatus("Офлайн: готово. Усі файли та анімації збережено.");
        else setStatus("Офлайн: не всі файли збережені ("+(data.missing?.length||0)+"). Перевір PNG та відкрий із мережею.");
    });
    navigator.serviceWorker.addEventListener("controllerchange",()=>ask(true));
    window.addEventListener("online",()=>ask(true));
    navigator.serviceWorker.register("./sw.js",{scope:"./",updateViaCache:"none"})
        .then(reg=>{
            registration=reg;
            if(reg.active)ask(true);
            return navigator.serviceWorker.ready;
        })
        .then(reg=>{registration=reg;ask(true);})
        .catch(()=>setStatus("Офлайн-кеш не встановлено. Перевір, що всі файли завантажені на сайт."));
})();
