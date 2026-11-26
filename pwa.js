// PocketDevice 2.0.2 — check app updates on launch and return, without losing local data.
(function(){
    const BUILD="2.0.2-build01";
    let status="Перевіряю офлайн-кеш…",registration=null,checking=null,lastCheck=0,remoteBuild="",ready=false,manual=false,reloading=false;
    const supported=window.isSecureContext&&"serviceWorker" in navigator;
    const buttonText=()=>remoteBuild&&remoteBuild!==BUILD&&ready?"Встановити оновлення":checking?"Перевіряю…":"Перевірити оновлення";
    function render(){
        const el=document.querySelector(".pwa-status");if(el)el.textContent=status;
        const b=document.querySelector(".pwa-update");if(b){b.textContent=buttonText();b.disabled=!!checking||!supported;b.onclick=()=>check(true);}
    }
    function setStatus(message){status=message;render();}
    window.pdPwaUpdateStatus=render;
    function ask(retry=false){
        const worker=navigator.serviceWorker?.controller||registration?.active;
        if(worker)worker.postMessage({type:retry?"PD_CACHE_RETRY":"PD_CACHE_STATUS"});
    }
    function reloadIfSafe(force=false){
        if(reloading||!ready||!remoteBuild||remoteBuild===BUILD)return;
        // Only restart automatically on the menu; never interrupt editing or gameplay.
        const atMenu=typeof currentPage!=="undefined"&&currentPage==="menu";
        if(!force&&(!atMenu||document.hidden))return;
        reloading=true;setStatus("Встановлюю оновлення…");location.reload();
    }
    if(location.protocol==="file:"){setStatus("Локальний файл: для оновлень потрібен сайт HTTPS.");return;}
    if(!supported){setStatus("Офлайн-кеш недоступний: потрібен HTTPS та service worker.");return;}
    function waitForWorker(worker){
        return new Promise(resolve=>{
            if(!worker||["activated","redundant"].includes(worker.state)){resolve();return;}
            let timeout=setTimeout(done,20000);
            function done(){clearTimeout(timeout);worker.removeEventListener("statechange",onState);resolve();}
            function onState(){if(["activated","redundant"].includes(worker.state))done();}
            worker.addEventListener("statechange",onState);
        });
    }
    async function check(force=false){
        if(force&&remoteBuild&&remoteBuild!==BUILD&&ready){reloadIfSafe(true);return;}
        if(checking){if(force)manual=true;return checking;}
        if(!registration)return;
        if(!force&&Date.now()-lastCheck<30000){ask();return;}
        if(!navigator.onLine){if(force)setStatus("Немає мережі. Оновлення перевіримо, коли з’явиться інтернет.");ask();return;}
        lastCheck=Date.now();manual=force;
        checking=(async()=>{
            if(force)setStatus("Шукаю нову версію…");
            try{
                await registration.update();
                await waitForWorker(registration.installing||registration.waiting);
                ask(true);
            }catch{
                if(force)setStatus("Не вдалося перевірити оновлення. Спробуй ще раз із мережею.");
            }finally{checking=null;render();}
        })();render();return checking;
    }
    navigator.serviceWorker.addEventListener("message",event=>{
        const data=event.data;if(data?.type!=="PD_CACHE_STATUS")return;
        // Ignore delayed responses from a worker that is no longer controlling this page.
        if(event.source&&navigator.serviceWorker.controller&&event.source!==navigator.serviceWorker.controller)return;
        remoteBuild=String(data.version||"");ready=!!data.ready;
        if(remoteBuild!==BUILD&&ready){
            setStatus("Нова версія готова. Повернися в меню або натисни «Встановити оновлення».");
            if(manual&&typeof currentPage!=="undefined"&&currentPage==="settings"){manual=false;reloadIfSafe(true);}
            else reloadIfSafe();
        }else if(ready){
            setStatus(manual?"У тебе найновіша доступна версія. Офлайн: готово.":"Офлайн: готово. Усі файли та анімації збережено.");
            manual=false;
        }else setStatus("Офлайн: не всі файли збережені ("+(data.missing?.length||0)+"). Перевір мережу й оновлення.");
    });
    navigator.serviceWorker.addEventListener("controllerchange",()=>{ask(true);});
    window.addEventListener("online",()=>check());
    window.addEventListener("pageshow",()=>{check();reloadIfSafe();});
    document.addEventListener("visibilitychange",()=>{if(!document.hidden){check();reloadIfSafe();}});
    // Check when returning to menu even if the download finished while in a different section.
    document.addEventListener("click",()=>setTimeout(()=>reloadIfSafe(),0),true);
    setInterval(()=>{if(!document.hidden){check();reloadIfSafe();}},120000);
    navigator.serviceWorker.register("./sw.js",{scope:"./",updateViaCache:"none"})
        .then(reg=>{registration=reg;ask(true);return navigator.serviceWorker.ready;})
        .then(reg=>{registration=reg;ask(true);check();})
        .catch(()=>setStatus("Офлайн-кеш не встановлено. Перевір, що всі файли завантажені на сайт."));
})();
