// PocketDevice 2.1 — companion rooms, local memory and character interactions.
const v21Shared=[["beer","Пиво"],["cigarette","Сіга"],["book","Книга"],["coffee","Кава"],["ball","М'яч"],["mirror","Дзеркало"]];
const v21Cast={
 chimp:{title:"Хата кореша",greet:["Ну шо, здоров!","О, кого принесло!"],away:"О, згадав про мене нарешті!",pet:["Оце діло.","Ох бля, ше трохи."],tap:["Шо?","Ну чого тицяєш?"],grab:"Е, ти шо робиш?",drop:"Та бля, обережніше!",annoy:"Та заїбав ти вже, посиди спокійно.",shake:"Ох бля, штормить!",request:"Є шо пожувати? Або пива?",favorite:"beer",idle:["Капець, скучно стало.","Кароче...","Може, в теніс?"],
 actions:[["beer","Пиво","Ну заєбісь.","chimp-beer-hold.png","chimp-beer-drink.png"],["cigarette","Сіга","Опа, сіга.","chimp-smoke.png","chimp-smoke-exhale.png"],["pee","Відлити","Не стой над душею.","chimp-pee.png"],["scratch","Чухатись","Не твоє діло.","chimp-scratch-butt.png"],["groin","Почухатись","Ой бля...","chimp-scratch-groin.png"],["cap","Кепка","Стиль є стиль.","chimp-cap.png"],["laugh","Сміх","Я щас здохну.","chimp-laugh.png"],["finger","Жест","З любов'ю.","chimp-middle-finger.png"],["sit","Сісти","Так краще.","chimp-sit.png"],["sleep","Поспати","Всьо, відбій.","chimp-sleep.png"],["yawn","Позіхнути","Як мене рубить.","chimp-yawn.png"],["burp","Відригнути","О, аж легше стало.","chimp-burp.png"],["tv","Глянути ТБ","Шо там показують?","chimp-tv.png"],["chips","Чипси","Хрустить — значить топ.","chimp-chips.png"],["can","Кинути банку","Опа, прямо в ціль!","chimp-can.png"],["sofa","Диван","Я зайнятий. Лежу.","chimp-sofa.png"]],
 furniture:[["window","Вікно",7,7,24,36],["poster","Плакат",44,4,18,24],["tv","Телевізор",72,32,25,33],["sofa","Диван",3,54,40,37],["ash","Попільничка",49,77,17,13],["radio","Радіо",73,73,21,17],["lamp","Світло",38,2,13,13]], schedule:[["coffee","yawn","sofa"],["chips","cap","tv","beer"],["tv","beer","can"],["sleep","sofa","yawn"]]},
 goat:{title:"Кабінет",greet:v2Personal.goat.greet,away:"Довга пауза. Сподіваюся, ти провів її з користю.",pet:v2Personal.goat.pet,tap:v2Personal.goat.tap,grab:v2Personal.goat.grab[0],drop:v2Personal.goat.drop[0],annoy:"Твоя наполегливість перевищила межі розумного.",shake:"Невже закон інерції тебе не навчили?",request:"Книжка або чашка кави були б доречними.",favorite:"coffee",idle:v2Personal.goat.idle,
 actions:[["book","Книга","Нарешті щось варте уваги.","goat-book.png"],["coffee","Кава","О, тепер можна мислити.","goat-coffee.png"],["glasses","Окуляри","Треба дивитися на світ тверезо.","goat-glasses.png"],["meditate","Медитація","Тиша. Яка рідкість.","goat-meditate.png"],["write","Записувати","Цю думку варто занотувати.","goat-write.png"],["chess","Шахи","Ти вже програв, просто не знаєш.","goat-chess.png"],["clean","Протерти окуляри","Ось тепер світ різкіший.","goat-clean.png"],["beard","Борода","Хм. Цікава теза.","goat-beard.png"],["sleep","Заснути","Ще одну сторінку...","goat-sleep.png"]],
 furniture:[["bookshelf","Книжки",3,4,28,55],["window","Вікно",38,5,24,33],["desk","Письмовий стіл",64,45,34,40],["chair","Крісло",8,63,27,30],["chess","Шахи",44,75,21,17],["radio","Радіо",76,16,19,14],["lamp","Світло",40,2,13,12]],schedule:[["coffee","clean","write"],["book","chess","beard","write"],["book","meditate","coffee"],["sleep","meditate"]]},
 devil:{title:"Кімната хаосу",greet:v2Personal.devil.greet,away:"А я вже думала, ти мене кинув. Де пропадав?",pet:v2Personal.devil.pet,tap:v2Personal.devil.tap,grab:v2Personal.devil.grab[0],drop:v2Personal.devil.drop[0],annoy:"Ще раз тицьнеш — буде пекло!",shake:"Опа, землетрус? А мені норм.",request:"Дай щось цікаве. М'яч, сігу, що завгодно!",favorite:"ball",idle:v2Personal.devil.idle,
 actions:[["fire","Вогник","Ха! Красиво горить.","devil-fire.png"],["finger","Жест","Оце тобі, з любов'ю.","devil-finger.png"],["tail","Хвіст","Мій хвіст — мої правила.","devil-tail.png"],["laugh","Сміх","Бля, оце прикол!","devil-laugh.png"],["guitar","Гітара","Оце музика, а не писк!","devil-guitar.png"],["dance","Танцювати","Давай, не стій!","devil-dance.png"],["angry","Злитись","Та що за хуйня?!","devil-angry.png"],["fly","Летіти","Пішла трохи політати.","devil-fly.png"],["vase","Розбити вазу","Упс. Сама впала.","devil-vase.png"]],
 furniture:[["poster","Плакати",4,5,24,28],["window","Вікно",38,6,24,30],["guitar","Гітара",74,14,17,54],["sofa","Диван",1,62,39,29],["vase","Ваза",52,71,17,22],["radio","Радіо",76,77,20,15],["lamp","Світло",40,1,13,13]],schedule:[["tail","laugh","angry"],["dance","guitar","vase"],["guitar","fire","dance"],["fly","guitar","fire","laugh"]]},
 medusa:{title:"Кам'яний зал",greet:v2Personal.medusa.greet,away:"Навіть статуї почали нудьгувати без тебе.",pet:v2Personal.medusa.pet,tap:v2Personal.medusa.tap,grab:v2Personal.medusa.grab[0],drop:v2Personal.medusa.drop[0],annoy:"Ще один дотик, і я знайду тобі місце серед статуй.",shake:"Не труси мій зал, смертний.",request:"Дзеркало. Моє відображення кращий співрозмовник.",favorite:"mirror",idle:v2Personal.medusa.idle,
 actions:[["snakes","Змії","Тихо, мої хороші.","medusa-snakes.png"],["stone","Камінь","Тепер він точно не втече.","medusa-stone.png"],["hiss","Шипіння","Ссс...","medusa-hiss.png"],["mirror","Дзеркало","Бездоганно, як завжди.","medusa-mirror.png"],["feed","Годувати змій","Їжте, мої маленькі.","medusa-feed.png"],["brush","Розчесатись","Не заплутайтесь, любі.","medusa-brush.png"],["pose","Позувати","Є на що подивитися.","medusa-pose.png"],["statue","Статуя","Мистецтво потребує жертв.","medusa-statue.png"],["throne","Трон","Нарешті гідне місце.","medusa-throne.png"]],
 furniture:[["column","Колона",1,0,15,81],["column2","Колона",85,0,15,81],["statue","Статуя",17,22,20,55],["mirror","Дзеркало",61,6,22,54],["throne","Трон",39,47,29,45],["vase","Ваза",71,66,16,25],["radio","Радіо",10,78,20,14],["lamp","Світло",43,1,13,12]],schedule:[["feed","brush","mirror"],["stone","statue","pose"],["mirror","throne","snakes"],["throne","snakes"]]}
};
const v21Gift={
 chimp:{beer:["beer","О, єбать спасіба!"],cigarette:["cigarette","Дай закурить."],book:["sleep","Та я аж втомився читати."],coffee:["yawn","Гірка, бля. Дай краще пива."],ball:["can","Давай, лови!"],mirror:["laugh","Оце пика в мене!"]},
 goat:{beer:["beard","Помірність — основа мудрості."],cigarette:["clean","Не задимлюй мій кабінет."],book:["book","Нарешті щось варте уваги."],coffee:["coffee","Дякую. Розум знову працює."],ball:["beard","Я не займаюся такими дурницями."],mirror:["glasses","Окуляри, здається, рівно."]},
 devil:{beer:["laugh","О, за двіж!"],cigarette:["fire","Не треба запальнички."],book:["angry","Та ну нахуй, знову книжка?"],coffee:["dance","Опа! Енергії на цілу ніч!"],ball:["fire","Зараз він трошки засвітиться."],mirror:["dance","Яка я, бля, красуня!"]},
 medusa:{beer:["hiss","Ні. Не пропонуй мені цю рідину."],cigarette:["hiss","Мої змії не терплять диму."],book:["snakes","Цікаво. Змії теж послухають."],coffee:["throne","Спокій і тиша. Нарешті."],ball:["stone","Тепер це камінь."],mirror:["mirror","Ти знаєш, чим мені догодити."]}
};
const v21VisitLines={
 "chimp-goat":["Ти знову зі своїми книжками?","Читання ще нікому не зашкодило. Напевно."],
 "chimp-devil":["Тільки хату не спали, чуєш?","Та я акуратно. Майже."],
 "chimp-medusa":["Моє пиво не чіпай!","Запізно. Тепер воно кам'яне."],
 "goat-devil":["У твоїй кімнаті завжди такий гармидер?","А у твоїй завжди так нудно?"],
 "goat-medusa":["Цікава колекція статуй.","Нарешті хтось її оцінив."],
 "devil-medusa":["Глянь, я можу зробити вогонь!","А я можу зробити тишу."]
};
const v21MemKey="pocketdevice.companion.life.v1";
let v21Memory={};try{const m=JSON.parse(localStorage.getItem(v21MemKey));if(m&&typeof m==="object"&&!Array.isArray(m))v21Memory=m;}catch{}
function v21Record(id){const old=v21Memory[id];const m=old&&typeof old==="object"?old:{};return v21Memory[id]={lastVisit:Number(m.lastVisit)||0,visits:Number(m.visits)||0,wins:Number(m.wins)||0,losses:Number(m.losses)||0,touches:Number(m.touches)||0,gifts:m.gifts&&typeof m.gifts==="object"?m.gifts:{},lastGift:typeof m.lastGift==="string"?m.lastGift:"",positions:m.positions&&typeof m.positions==="object"?m.positions:{},light:m.light!==false,window:!!m.window,radio:!!m.radio};}
function v21Store(){try{localStorage.setItem(v21MemKey,JSON.stringify(v21Memory));}catch{}}
const v21Pick=a=>a[Math.floor(Math.random()*a.length)];
const v21Clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const v21Name=id=>characterSettings.names[id]||companionCharacters.find(c=>c.id===id)?.species||id;
function v21Time(){const h=new Date().getHours();return h>=6&&h<11?0:h>=11&&h<18?1:h>=18&&h<23?2:3;}
const v21Icons={
 window:'<rect x="2" y="2" width="28" height="28" fill="#102a26"/><path fill="#246253" d="M4 24L12 14L19 22L25 10L28 24Z"/><path stroke="#78b9a5" stroke-width="2" d="M16 3V29M3 16H29"/><path d="M1 1H31V31H1Z" fill="none" stroke="#468d7b" stroke-width="2"/>',
 poster:'<path fill="#163c35" stroke="#5b9f8e" d="M3 2H29V29H3Z"/><path fill="#82cebd" d="M7 6H25V9H7ZM10 13L15 9L24 15L18 24L9 21Z"/><path stroke="#488c7c" d="M7 26H25"/>',
 tv:'<path stroke="#61988b" stroke-width="2" d="M11 8L6 2M21 8L27 1"/><rect x="1" y="8" width="30" height="21" rx="2" fill="#214a40" stroke="#70b5a3"/><rect x="4" y="11" width="19" height="15" rx="2" fill="#071513" stroke="#478e7d"/><path fill="#65e8c8" d="M25 13H29V16H25ZM25 19H29V22H25Z"/><path stroke="#5b9f8e" d="M6 30H11M22 30H27"/>',
 sofa:'<path fill="#174136" stroke="#5fa18d" d="M4 8H28V18H31V27H1V18H4Z"/><path fill="#295d4d" d="M6 11H15V21H6ZM17 11H26V21H17ZM5 22H27V26H5Z"/><path stroke="#6da795" d="M5 28V31M27 28V31"/>',
 ash:'<ellipse cx="16" cy="19" rx="13" ry="7" fill="#27564a" stroke="#78b9a5"/><path stroke="#b5f0dd" stroke-width="2" d="M9 16L25 9"/><path stroke="#549485" d="M13 7L10 3"/>',
 radio:'<path d="M24 7L29 1" stroke="#88c8b5"/><rect x="1" y="7" width="30" height="23" rx="2" fill="#204a40" stroke="#6bb5a2"/><circle cx="10" cy="19" r="7" fill="#0a201b" stroke="#74bba7"/><path stroke="#538877" d="M4 17H16M4 20H16M5 23H15"/><path fill="#82cdb7" d="M20 11H28V14H20ZM21 18H27V21H21ZM21 24H27V27H21Z"/>',
 lamp:'<path fill="#8ae0c5" d="M6 4H26L30 20H2Z"/><path fill="#377763" d="M14 20H18V28H26V31H6V28H14Z"/>',
 bookshelf:'<path fill="#142c28" stroke="#72a996" stroke-width="2" d="M2 1H30V31H2Z"/><path stroke="#75ac99" d="M3 11H29M3 21H29"/><path fill="#407e6b" d="M5 3H9V10H5ZM11 2H14V10H11ZM16 4H21V10H16ZM23 3H27V10H23ZM5 13H8V20H5ZM10 14H16V20H10ZM18 12H22V20H18ZM24 13H28V20H24ZM5 23H11V30H5ZM13 22H17V30H13ZM19 24H27V30H19Z"/>',
 desk:'<path fill="#234f42" stroke="#689f8d" d="M1 8H31V14H1Z M3 14H7V31H3Z M25 14H29V31H25Z"/><path fill="#3a7560" d="M8 15H25V21H8Z"/><path stroke="#80bcaa" d="M14 18H19"/><path fill="#6dbea6" d="M18 2H28V7H18Z"/>',
 chair:'<path fill="#255345" stroke="#6fb3a0" d="M6 2H26V21H30V27H2V21H6Z"/><path fill="#3a7b64" d="M9 5H23V19H9Z M7 22H25V26H7Z"/><path stroke="#659f8d" d="M6 27V31M26 27V31"/>',
 chess:'<rect x="2" y="2" width="28" height="28" fill="#142e28" stroke="#86c9b4"/><path fill="#5eaa95" d="M3 3H10V10H3ZM17 3H24V10H17ZM10 10H17V17H10ZM24 10H29V17H24ZM3 17H10V24H3ZM17 17H24V24H17ZM10 24H17V29H10ZM24 24H29V29H24Z"/><path stroke="#d6f4e8" stroke-width="2" d="M9 8V15M6 15H12M23 16V24M20 24H26"/>',
 guitar:'<path fill="#3f8571" stroke="#87cdb9" d="M5 21L10 17L15 19L19 15L24 4L28 5L19 23L16 25L15 30H6L2 26Z"/><path stroke="#b5efdf" d="M9 25L25 6M11 26L27 7"/><circle cx="10" cy="23" r="2" fill="#071e18"/>',
 vase:'<path fill="#346c59" stroke="#81bfa8" d="M10 2H22L20 10L27 19L25 27L21 30H11L7 27L5 19L12 10Z"/><path stroke="#a1d9c4" d="M7 20H25M9 25H23M13 5H19"/>',
 column:'<path fill="#426e58" stroke="#7ea48f" d="M2 1H30V5H27V27H30V31H2V27H5V5H2Z"/><path stroke="#adc8af" d="M10 6V26M16 6V26M22 6V26"/>',
 statue:'<path fill="#649181" stroke="#aad0c0" d="M12 2H20V9H18V11L25 16L20 23V27H27V31H5V27H12V22L7 16L14 11V9H12Z"/><path stroke="#315a50" d="M13 15L19 20M12 25H20"/>',
 mirror:'<ellipse cx="16" cy="15" rx="13" ry="14" fill="#254a42" stroke="#90cfbb" stroke-width="3"/><path stroke="#8ad7bd" d="M8 20L20 7M12 23L24 11"/><path fill="#80b39d" d="M14 28H18V32H14Z"/>',
 throne:'<path fill="#355f4e" stroke="#9ac4ad" d="M8 2H24V17H29V26H25V31H7V26H3V17H8Z"/><path fill="#163c30" d="M11 6H21V19H11ZM8 22H24V27H8Z"/><path stroke="#a1c4ad" d="M16 6V18M11 12H21"/>',
 beer:'<path fill="#6ebca7" stroke="#b1f5db" d="M8 3H24V29H8Z"/><path fill="#143a2f" d="M10 8H22V22H10Z"/><path stroke="#c5f2df" d="M12 5H20M11 25H21"/>',
 cigarette:'<path fill="#b9eee0" d="M3 15H29V20H3Z"/><path fill="#538d76" d="M3 15H10V20H3Z"/><path stroke="#69c7b0" d="M26 12L23 8L27 4"/>',
 book:'<path fill="#7ebda8" stroke="#a1dec8" d="M2 7H13L16 11L19 7H30V27H19L16 30L13 27H2Z"/><path stroke="#1a4a3b" d="M16 12V28M5 12H12M5 17H12M20 12H27M20 17H27"/>',
 coffee:'<path fill="#6fa995" d="M5 11H24V26H5Z M24 13H29V22H24V20H27V15H24Z"/><path stroke="#aee1cd" d="M8 28H26M10 8L12 5L10 1M18 8L20 5L18 1"/>',
 ball:'<circle cx="16" cy="16" r="13" fill="#68b8a0" stroke="#b9ecd9"/><path fill="#173f34" d="M13 8H19L23 14L19 19H13L9 14Z"/><path stroke="#254f43" d="M5 7L9 14M23 14L28 8M19 19L24 26M13 19L8 27"/>'
};
function v21Icon(id){return '<svg viewBox="0 0 32 32" aria-hidden="true" shape-rendering="crispEdges">'+(v21Icons[id==="column2"?"column":id]||v21Icons.lamp)+'</svg>';}
let v21Session=null;
function v21Alive(s){return v21Session===s&&currentPage==="companion"&&s.room.isConnected&&!page.hidden;}
function v21Later(s,fn,ms){const t=setTimeout(()=>{s.timers.delete(t);if(v21Alive(s))fn();},ms);s.timers.add(t);return t;}
function v21Stop(){const s=v21Session;if(!s)return;for(const t of s.timers)clearTimeout(t);s.timers.clear();document.querySelectorAll(".v21-drag-gift").forEach(e=>e.remove());v21Session=null;}
function v21Speak(s,line){if(v21Alive(s))s.dialog.textContent=line;}
function v21Action(s,id,line,prop=null){
 if(!v21Alive(s)||s.held||s.edit)return false;
 const a=s.char.actions.find(q=>q[0]===id);if(!a)return false;
 s.epoch++;const epoch=s.epoch;s.busy=true;s.img.dataset.act=a[0];s.img.src=a[3];v21Speak(s,line||a[2]);
 s.prop.hidden=!prop;if(prop){s.prop.innerHTML=v21Icon(prop);s.prop.className="v21-gift-prop"+(s.id==="medusa"&&prop==="ball"?" v21-petrify":"");}
 pdSound("confirm");
 if(a[4])v21Later(s,()=>{if(s.epoch===epoch)s.img.src=a[4];},650);
 const duration=id==="sleep"?5000:2800;
 v21Later(s,()=>{if(s.epoch!==epoch)return;s.busy=false;s.img.src=s.base;delete s.img.dataset.act;s.prop.hidden=true;},duration);
 return true;
}
function v21CancelAction(s){s.epoch++;s.busy=false;s.img.src=s.base;delete s.img.dataset.act;s.prop.hidden=true;}
function v21GiftGive(s,id){
 if(!v21Alive(s)||!v21Gift[s.id]?.[id]||s.edit||s.held)return;
 const [action,line]=v21Gift[s.id][id];s.mem.gifts[id]=(Number(s.mem.gifts[id])||0)+1;s.mem.lastGift=id;s.mem.touches++;v21Store();s.lastInteraction=Date.now();
 v21Action(s,action,line,id);
}
function v21Furniture(s,id){
 if(s.edit)return;s.lastInteraction=Date.now();s.mem.touches++;v21Store();
 const b=s.room.querySelector('[data-furniture="'+id+'"]');
 if(id==="lamp"){s.mem.light=!s.mem.light;v21ApplyRoom(s);v21Store();v21Speak(s,s.mem.light?"Світло є.":"Тепер трохи темніше.");return;}
 if(id==="window"){s.mem.window=!s.mem.window;v21ApplyRoom(s);v21Store();v21Speak(s,s.mem.window?"Вікно відкрите.":"Вікно закрите.");return;}
 if(id==="radio"){s.mem.radio=!s.mem.radio;v21ApplyRoom(s);v21Store();v21Speak(s,s.mem.radio?"Радіо грає.":"Радіо вимкнене.");if(s.mem.radio)clockEnableSound();return;}
 if(id==="tv"){b?.classList.toggle("v21-on");v21Action(s,"tv");return;}
 const map={poster:["cap","glasses","dance","pose"],sofa:["sofa","sleep","laugh","throne"],ash:["cigarette","clean","fire","hiss"],bookshelf:["sleep","book","angry","snakes"],desk:["chips","write","guitar","mirror"],chair:["sit","meditate","tail","throne"],chess:["can","chess","angry","stone"],guitar:["laugh","book","guitar","hiss"],vase:["can","beard","vase","statue"],statue:["laugh","beard","fire","statue"],mirror:["laugh","glasses","tail","mirror"],throne:["sofa","meditate","fly","throne"],column:["cap","beard","tail","pose"],column2:["cap","beard","tail","pose"]};
 const a=map[id]?.[["chimp","goat","devil","medusa"].indexOf(s.id)];if(a)v21Action(s,a);
}
function v21ApplyRoom(s){s.room.classList.toggle("v21-dark",!s.mem.light);s.room.classList.toggle("v21-window-open",s.mem.window);s.room.querySelector('[data-furniture="lamp"]')?.classList.toggle("v21-on",s.mem.light);s.room.querySelector('[data-furniture="radio"]')?.classList.toggle("v21-on",s.mem.radio);s.room.querySelector('[data-furniture="window"]')?.classList.toggle("v21-on",s.mem.window);}
function v21BuildRoom(s){
 for(const [id,label,x,y,w,h] of s.char.furniture){
  const b=document.createElement("button");b.type="button";b.className="v21-furniture";b.dataset.furniture=id;b.title=label;b.setAttribute("aria-label",label);b.innerHTML=v21Icon(id);
  const saved=s.mem.positions[id],pos=Array.isArray(saved)&&saved.length===2?saved:[x,y];b.style.left=v21Clamp(Number(pos[0])||0,0,100-w)+"%";b.style.top=v21Clamp(Number(pos[1])||0,0,100-h)+"%";b.style.width=w+"%";b.style.height=h+"%";s.room.append(b);
  let drag=null;
  b.onpointerdown=e=>{if(!s.edit||e.button!==0)return;e.preventDefault();b.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,left:parseFloat(b.style.left),top:parseFloat(b.style.top)};};
  b.onpointermove=e=>{if(!drag)return;const r=s.room.getBoundingClientRect();b.style.left=v21Clamp(drag.left+(e.clientX-drag.x)*100/r.width,0,100-w)+"%";b.style.top=v21Clamp(drag.top+(e.clientY-drag.y)*100/r.height,0,100-h)+"%";};
  function finish(){if(!drag)return;drag=null;s.mem.positions[id]=[parseFloat(b.style.left),parseFloat(b.style.top)];v21Store();}
  b.onpointerup=finish;b.onpointercancel=finish;b.onlostpointercapture=finish;
  b.onclick=()=>v21Furniture(s,id);
 }
 v21ApplyRoom(s);
}
function v21Panel(s,tab){
 if(!v21Alive(s))return;s.tab=tab;s.cursor=0;s.nav=[...s.tabs.querySelectorAll("button")].findIndex(b=>b.dataset.tab===tab);s.panel.scrollTop=0;s.tabs.querySelectorAll("button").forEach(b=>b.classList.toggle("v21-active",b.dataset.tab===tab));s.panel.replaceChildren();
 const add=(label,action,icon)=>{const b=document.createElement("button");b.type="button";b.className="note-btn v21-action-button";if(icon)b.innerHTML=v21Icon(icon);const t=document.createElement("span");t.textContent=label;b.append(t);b.onclick=action;s.panel.append(b);return b;};
 if(tab==="actions")for(const a of s.char.actions)add(a[1],()=>{s.lastInteraction=Date.now();s.mem.touches++;v21Store();v21Action(s,a[0]);});
 if(tab==="items")for(const [id,label] of v21Shared){
  const b=add(label,()=>{if(Date.now()-s.lastGiftDrag>300)v21GiftGive(s,id);},id);
  let drag=null,ghost=null;b.onpointerdown=e=>{if(e.button!==0)return;b.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY};};
  b.onpointermove=e=>{if(!drag)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7||ghost){if(!ghost){ghost=document.createElement("span");ghost.className="v21-drag-gift";ghost.innerHTML=v21Icon(id);document.body.append(ghost);}ghost.style.left=e.clientX+"px";ghost.style.top=e.clientY+"px";}};
  function end(e){if(ghost){const r=s.img.getBoundingClientRect(),inside=e.type==="pointerup"&&e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;ghost.remove();ghost=null;s.lastGiftDrag=Date.now();if(inside)v21GiftGive(s,id);}drag=null;}
  b.onpointerup=end;b.onpointercancel=end;b.onlostpointercapture=end;
 }
 if(tab==="room"){
  add(s.edit?"Готово":"Переставити меблі",()=>{s.edit=!s.edit;v21CancelAction(s);s.room.classList.toggle("v21-edit",s.edit);v21Panel(s,"room");v21Speak(s,s.edit?"Тягни предмети пальцем.":"Готово, все на місці.");});
  add("Скинути меблі",()=>{s.mem.positions={};v21Store();s.room.querySelectorAll(".v21-furniture").forEach(e=>e.remove());v21BuildRoom(s);});
  add("Датчик руху",async()=>{if(!window.DeviceMotionEvent){v21Speak(s,"Датчик руху недоступний.");return;}try{if(typeof DeviceMotionEvent.requestPermission==="function"&&await DeviceMotionEvent.requestPermission()!=="granted"){v21Speak(s,"Доступ до руху не надано.");return;}if(!v21Alive(s))return;s.motion=!s.motion;v21Speak(s,s.motion?"Реакція на трясіння увімкнена.":"Реакція на рух вимкнена.");}catch{v21Speak(s,"Браузер не дозволив доступ до руху.");}});
  add("Запросити гостя",()=>v21Visit(s));
 }
 if(tab==="memory"){
  const top=Object.entries(s.mem.gifts).sort((a,b)=>Number(b[1])-Number(a[1]))[0];
  const stats=document.createElement("p");stats.className="v21-memory";stats.textContent="Зустрічей: "+s.mem.visits+" · Дотиків і дій: "+s.mem.touches+"\nПідношень: "+Object.values(s.mem.gifts).reduce((n,x)=>n+(Number(x)||0),0)+"\nНайчастіше даєш: "+(v21Shared.find(a=>a[0]===top?.[0])?.[1]||"ще нічого")+"\nТеніс: "+s.mem.wins+" перемог / "+s.mem.losses+" поразок\nНастрій: "+(s.mood>4?"роздратований":s.mood<0?"задоволений":"спокійний");s.panel.append(stats);
 }
}
function v21Visit(s){
 if(!v21Alive(s)||s.visitor||s.edit||s.held)return;
 const guest=v21Pick(Object.keys(v21Cast).filter(id=>id!==s.id)),order=["chimp","goat","devil","medusa"],sorted=[s.id,guest].sort((a,b)=>order.indexOf(a)-order.indexOf(b)),lines=v21VisitLines[sorted.join("-")];
 const el=document.createElement("img");el.className="v21-visitor";el.src=companionCharacters.find(c=>c.id===guest).image;el.alt=v21Name(guest);el.draggable=false;s.room.append(el);s.visitor=el;const first=sorted[0],second=sorted[1];v21Speak(s,v21Name(first)+": "+lines[0]);v21Later(s,()=>v21Speak(s,v21Name(second)+": "+lines[1]),2200);
 v21Later(s,()=>{el.remove();s.visitor=null;},6000);
}
function v21Companion(){
 v21Stop();const c=activeCharacter(),id=c.id,profile=v21Cast[id],mem=v21Record(id),oldVisit=mem.lastVisit;mem.lastVisit=Date.now();mem.visits++;v21Store();
 page.innerHTML='<div class="menu-header v21-title"></div><div class="companion-room v21-room"><div class="v21-floor"></div><img class="companion-sprite v21-character" draggable="false"><div class="v21-gift-prop" hidden></div></div><div class="companion-dialogue v21-dialogue" aria-live="polite"></div><div class="v21-tabs"><button data-tab="actions">Дії</button><button data-tab="items">Речі</button><button data-tab="room">Кімната</button><button data-tab="memory">Пам’ять</button></div><div class="v21-panel"></div><small class="v21-help">Тап — реакція. Проведи — погладь. Затисни й тягни — перенеси.</small>';
 page.querySelector(".v21-title").textContent=v21Name(id)+" · "+profile.title;
 const room=page.querySelector(".v21-room"),img=room.querySelector("img");
 const s={id,char:profile,mem,room,img,base:c.image,dialog:page.querySelector(".v21-dialogue"),prop:room.querySelector(".v21-gift-prop"),tabs:page.querySelector(".v21-tabs"),panel:page.querySelector(".v21-panel"),timers:new Set(),held:null,epoch:0,busy:false,edit:false,visitor:null,mood:0,lastInteraction:Date.now(),lastGiftDrag:0,motion:false,radioBeat:0,cursor:0};
 v21Session=s;room.dataset.room=id;img.src=c.image;img.alt=v21Name(id);v21BuildRoom(s);v21Panel(s,"actions");s.tabs.querySelectorAll("button").forEach(b=>b.onclick=()=>{if(s.edit&&b.dataset.tab!=="room"){s.edit=false;s.room.classList.remove("v21-edit");}v21Panel(s,b.dataset.tab);});
 const greeting=oldVisit&&Date.now()-oldVisit>4*3600000?profile.away:v21Pick(profile.greet);
 v21Speak(s,greeting);
 img.oncontextmenu=e=>e.preventDefault();
 img.onpointerdown=e=>{if(s.edit||e.button!==0||s.held)return;e.preventDefault();v21CancelAction(s);img.setPointerCapture(e.pointerId);s.held={id:e.pointerId,x:e.clientX,y:e.clientY,left:img.offsetLeft,top:img.offsetTop,t:Date.now(),drag:false,pet:false};s.lastInteraction=Date.now();};
 img.onpointermove=e=>{const h=s.held;if(!h||h.id!==e.pointerId)return;const dx=e.clientX-h.x,dy=e.clientY-h.y;if(Math.hypot(dx,dy)<5&&!h.drag)return;if(h.drag||(!h.pet&&Date.now()-h.t>420)){if(!h.drag){h.drag=true;img.classList.add("dragging");img.dataset.act="grab";if(id==="chimp")img.src="chimp-grab.png";v21Speak(s,profile.grab);s.mood++;}img.style.left=v21Clamp(h.left+dx,0,Math.max(0,room.clientWidth-img.offsetWidth))+"px";img.style.top=v21Clamp(h.top+dy,0,Math.max(0,room.clientHeight-img.offsetHeight-17))+"px";img.style.bottom="auto";}else if(!h.drag&&!h.pet){h.pet=true;s.mood=Math.max(-5,s.mood-1);img.dataset.act="pet";if(id==="chimp")img.src="chimp-pet.png";v21Speak(s,v21Pick(profile.pet));}};
 function end(e){const h=s.held;if(!h||h.id!==e.pointerId)return;s.held=null;img.classList.remove("dragging");img.src=s.base;delete img.dataset.act;mem.touches++;v21Store();if(h.drag){img.style.top="auto";img.style.bottom="17px";v21Speak(s,profile.drop);}else if(!h.pet){s.mood++;v21Speak(s,s.mood>4?profile.annoy:v21Pick(profile.tap));}}
 img.onpointerup=end;img.onpointercancel=end;img.onlostpointercapture=end;
 function loop(){
  if(!document.hidden&&!s.held&&!s.edit&&!s.busy&&!s.visitor){
   if(Date.now()-s.lastInteraction>18000&&Math.random()<.2){const top=Object.entries(mem.gifts).sort((a,b)=>Number(b[1])-Number(a[1]))[0];v21Speak(s,top&&Number(top[1])>=3?"Ти часто даєш мені "+(v21Shared.find(a=>a[0]===top[0])?.[1]||"це")+". "+profile.request:profile.request);}
   else if(Math.random()<.1&&mem.visits>1){v21Action(s,id==="chimp"?"finger":id==="goat"?"meditate":id==="devil"?"fly":"statue","Опа. Ти це бачив?");}
   else if(Math.random()<.65){const available=profile.schedule[v21Time()].filter(a=>profile.actions.some(q=>q[0]===a));v21Action(s,v21Pick(available.length?available:profile.actions.map(a=>a[0])));}
   else{img.style.top="auto";img.style.bottom="17px";img.style.left=Math.round(Math.random()*Math.max(0,room.clientWidth-img.offsetWidth))+"px";if(id==="chimp"){img.src="chimp-walk-1.png";v21Later(s,()=>{if(!s.busy&&!s.held)img.src="chimp-walk-2.png";},250);v21Later(s,()=>{if(!s.busy&&!s.held)img.src=s.base;},620);}v21Speak(s,v21Pick(profile.idle));}
   if(s.mood>0)s.mood--;else if(s.mood<0)s.mood++;
  }v21Later(s,loop,7500+Math.random()*6500);
 }
 function visitLoop(){if(!document.hidden&&Math.random()<.7&&!s.busy)v21Visit(s);v21Later(s,visitLoop,42000+Math.random()*40000);}
 function radioLoop(){if(!document.hidden&&mem.radio&&deviceSettings.volume&&clockAudio?.state==="running"&&!clockAlarm){const n=[392,523,587,523,440,392,330,0][s.radioBeat++%8];if(n){const a=clockAudio;try{const t=a.currentTime,o=a.createOscillator(),g=a.createGain();o.type="triangle";o.frequency.value=n;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.013*deviceSettings.volume/100+.0001,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+.18);o.connect(g);g.connect(a.destination);o.onended=()=>{o.disconnect();g.disconnect();};o.start(t);o.stop(t+.2);}catch{}}}v21Later(s,radioLoop,270);}
 function blink(){if(id==="chimp"&&!s.busy&&!s.held&&!s.edit&&!document.hidden){img.src="chimp-blink.png";v21Later(s,()=>{if(!s.busy&&!s.held)img.src=s.base;},160);}v21Later(s,blink,3500+Math.random()*3000);}
 if(id==="chimp")v21Later(s,blink,3000);v21Later(s,loop,6000);v21Later(s,visitLoop,30000+Math.random()*20000);v21Later(s,radioLoop,270);screen.scrollTop=0;
}
function v21Move(direction){const s=v21Session;if(!s)return;const controls=[...s.tabs.querySelectorAll("button"),...s.panel.querySelectorAll("button")];s.nav=v21Clamp((s.nav||0)+direction,0,Math.max(0,controls.length-1));controls.forEach((b,i)=>b.classList.toggle("v21-focus",i===s.nav));controls[s.nav]?.scrollIntoView({block:"nearest"});}
function v21Confirm(){const s=v21Session;if(!s)return;const controls=[...s.tabs.querySelectorAll("button"),...s.panel.querySelectorAll("button")];controls[s.nav||0]?.click();}
let v21LastShake=0;
window.addEventListener("devicemotion",e=>{const s=v21Session;if(!s||!s.motion||!v21Alive(s)||document.hidden||Date.now()-v21LastShake<1800)return;const a=e.accelerationIncludingGravity||e.acceleration;if(a&&Math.hypot(a.x||0,a.y||0,a.z||0)>23){v21LastShake=Date.now();v21Speak(s,s.char.shake);s.img.classList.add("v21-shake");v21Later(s,()=>s.img.classList.remove("v21-shake"),600);}});
const v21PreviousBack=goBack;
goBack=function(){const was=currentPage==="companion";v21PreviousBack();if(was&&currentPage!=="companion")v21Stop();};
document.getElementById("back").onclick=goBack;

function v21TennisResult(won){const m=v21Record(activeCharacter().id);if(won)m.wins++;else m.losses++;v21Store();}
function v21WanderPhrase(id,section){const phrases={chimp:{notes:"Шо пишеш?",library:"Є анекдоти?",profile:"Ну шо, вибирай.",settings:"Не зламай!",menu:"Кароче..."},goat:{notes:"Гарна думка.",library:"Нарешті читання.",profile:"Вибір за тобою.",settings:"Точність важлива.",menu:"Хм."},devil:{notes:"Запиши мій геніальний план!",library:"Є щось цікаве?",profile:"Обирай мене!",settings:"Додай вогню!",menu:"Нудно!"},medusa:{notes:"Не забудь про мене.",library:"Цікаві знання.",profile:"Вибір очевидний.",settings:"Більше тиші.",menu:"Ссс..."}};return phrases[id]?.[section]||"";}
