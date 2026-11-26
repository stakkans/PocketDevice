// PocketDevice 2.0 — локальні доповнення, без зовнішніх залежностей.
function v2MapPoint(svg,x,y){
 const r=svg.getBoundingClientRect(),f=mapFrame(),scale=Math.min(r.width/f.w,r.height/f.h)||1;
 return {x:f.x+(x-r.left-(r.width-f.w*scale)/2)/scale,y:f.y+(y-r.top-(r.height-f.h*scale)/2)/scale};
}
const v2Defaults={shell:"#355648",plastic:90,light:"#66e8c6",glow:35,music:0,roam:true};
let v2Settings={...v2Defaults};
try{const a=JSON.parse(localStorage.getItem("pocketdevice.v2.settings"));if(a){for(const k of ["shell","light"])if(/^#[0-9a-f]{6}$/i.test(a[k]))v2Settings[k]=a[k];for(const k of ["plastic","glow","music"])if(Number.isFinite(a[k]))v2Settings[k]=Math.max(0,Math.min(100,a[k]));if(typeof a.roam==="boolean")v2Settings.roam=a.roam;}}catch{}
const v2Colors=[["Графіт","#34383b"],["Болотний","#355648"],["Фіолетовий","#67488e"],["Бордовий","#853d4c"],["Синій","#385e99"],["Бурштиновий","#aa7534"],["Прозорий","#a1b5b3"],["Димчастий","#626b76"],["Рожевий","#bd6899"]];
function v2Apply(){
 const s=document.documentElement.style;
 s.setProperty("--v2-shell",v2Settings.shell);s.setProperty("--v2-plastic",v2Settings.plastic/100);s.setProperty("--v2-light",v2Settings.light);s.setProperty("--v2-glow",v2Settings.glow/100);const hex=v2Settings.light.slice(1);const rgb=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)).join(",");s.setProperty("--v2-glow-color","rgba("+rgb+","+v2Settings.glow/140+")");
 if(!v2Settings.roam)document.querySelector(".v2-wander")?.remove();
}
function v2Save(){try{localStorage.setItem("pocketdevice.v2.settings",JSON.stringify(v2Settings));}catch{}v2Apply();}
v2Apply();
const v2OriginalSettings=openDeviceSettings;
openDeviceSettings=function(){
 v2OriginalSettings();
 const root=page.querySelector(".settings-panel"),before=root.querySelector('[data-setting="test"]');
 const extra=document.createElement("section");extra.className="v2-shell-settings";
 extra.innerHTML='<h3>Корпус та звук</h3><label>Колір корпусу<select class="v2-presets"></select></label><label>Свій колір <input type="color" data-v2="shell"></label><label>Видимість плати <input type="range" min="0" max="100" data-v2="plastic"></label><label>Колір підсвітки <input type="color" data-v2="light"></label><label>Підсвітка <input type="range" min="0" max="100" data-v2="glow"></label><label>Фонова музика <input type="range" min="0" max="100" data-v2="music"></label><label>Кореш гуляє по меню <input type="checkbox" data-v2="roam"></label><button type="button" class="note-btn v2-reset">Скинути корпус і музику</button>';
 before.before(extra);
 const sel=extra.querySelector("select");for(const [n,c] of v2Colors){const o=document.createElement("option");o.value=c;o.textContent=n;sel.append(o);}const opt=document.createElement("option");opt.value="custom";opt.textContent="Свій колір";sel.append(opt);
 function sync(){sel.value=v2Colors.some(x=>x[1]===v2Settings.shell)?v2Settings.shell:"custom";for(const e of extra.querySelectorAll("[data-v2]"))if(e.type==="checkbox")e.checked=v2Settings[e.dataset.v2];else e.value=v2Settings[e.dataset.v2];}
 sel.onchange=()=>{if(sel.value!=="custom"){v2Settings.shell=sel.value;v2Save();sync();}};
 for(const e of extra.querySelectorAll("[data-v2]"))e.oninput=()=>{v2Settings[e.dataset.v2]=e.type==="checkbox"?e.checked:e.type==="range"?Number(e.value):e.value;v2Save();if(e.dataset.v2==="shell")sel.value="custom";};
 extra.querySelector(".v2-reset").onclick=()=>{v2Settings={...v2Defaults};v2Save();sync();};sync();
};
const v2OldReset=deviceResetSettings;
deviceResetSettings=function(){v2OldReset();v2Settings={...v2Defaults};v2Save();openDeviceSettings();};
pdTones.boot=[[262,0,.12,"triangle",.5],[392,.13,.11,"square",.38],[523,.26,.12,"square",.4],[659,.39,.15,"triangle",.5],[587,.57,.12,"triangle",.4],[784,.7,.28,"triangle",.55],[262,.7,.28,"sine",.3]];
pdTones.friend=[[392,0,.06,"triangle",.4],[523,.08,.1,"triangle",.5]];
let v2MusicBeat=0;
const v2Tune=[64,67,71,74,72,71,67,0,62,65,69,72,71,69,65,0,60,64,67,71,69,67,64,0,59,62,67,69,67,62,60,0];
setInterval(()=>{
 if(document.hidden||!v2Settings.music||!clockAudio||clockAudio.state!=="running"||clockAlarm)return;
 const a=clockAudio,t=a.currentTime+.015,n=v2Tune[v2MusicBeat++%v2Tune.length];if(!n)return;
 try{const o=a.createOscillator(),g=a.createGain();o.type="triangle";o.frequency.value=440*2**((n-69)/12);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.022*v2Settings.music/100+.0001,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+.19);o.connect(g);g.connect(a.destination);o.onended=()=>{try{o.disconnect();g.disconnect();}catch{}};o.start(t);o.stop(t+.2);}catch{}
},230);
document.addEventListener("pointerdown",()=>{if(v2Settings.music)clockEnableSound();},{passive:true});
const v2Personal={
 goat:{greet:["Ну, вітаю. Що нового?","Я тут читаю. Не заважай."],tap:["Ти вважаєш це інтелектуальним заняттям?","Так, я тут."],pet:["Гм. Приємно, хоча недоречно."],grab:["Прошу, постав мене на землю."],drop:["Гравітація. Яка несподіванка."],acts:[["book","Книга","Нарешті щось варте уваги."],["coffee","Кава","О, тепер можна мислити."],["glasses","Окуляри","Треба дивитися на світ тверезо."],["meditate","Медитація","Тиша. Яка рідкість."]],idle:["Світ дивний, а люди ще дивніші.","Ти читав сьогодні щось, крім меню?"]},
 devil:{greet:["Опа, кого принесло!","Ну шо, влаштуємо двіж?"],tap:["Не тицяй, бля!","Що, скучив?"],pet:["Тільки роги не чіпай.","О, нормально."],grab:["Ей! Я тобі не іграшка!"],drop:["Ще раз — і підпалю шкарпетки."],acts:[["fire","Вогник","Ха! Красиво горить."],["finger","Жест","Оце тобі, з любов'ю."],["tail","Хвіст","Мій хвіст — мої правила."],["laugh","Сміх","Бля, оце прикол!"]],idle:["Дай мені щось спалити. Віртуально.","Нудно. Треба щось утнути."]},
 medusa:{greet:["Не дивись мені в очі. Жартую.","Ти знову тут."],tap:["Обережно. Змії нервують."],pet:["Їм подобається. Мені — байдуже."],grab:["Прибери руки, смертний."],drop:["Неймовірна незграбність."],acts:[["snakes","Змії","Тихо, мої хороші."],["stone","Камінь","Тепер він точно не втече."],["hiss","Шипіння","Ссс..."],["mirror","Дзеркало","Бездоганно, як завжди."]],idle:["Чому всі такі галасливі?","Камені — ідеальні співрозмовники."]}
};
function v2DecorateRoom(){const r=page.querySelector(".companion-room");if(!r)return;r.insertAdjacentHTML("afterbegin",'<div class="v2-room-deco" aria-hidden="true"><i class="v2-window"></i><i class="v2-shelf"></i><i class="v2-chair"></i><i class="v2-plant"></i><i class="v2-rug"></i></div>');}
function v2Companion(){
 const c=activeCharacter(),p=v2Personal[c.id];page.innerHTML='<div class="menu-header"></div><div class="companion-room"><div class="companion-floor"></div><img class="companion-sprite v2-sprite" draggable="false"><span class="v2-prop" hidden></span></div><div class="companion-dialogue"></div><div class="v2-actions"></div>';
 page.querySelector(".menu-header").textContent="Кореш: "+(characterSettings.names[c.id]||c.species);
 const room=page.querySelector(".companion-room"),img=room.querySelector("img"),dialog=page.querySelector(".companion-dialogue"),prop=room.querySelector(".v2-prop");
 img.src=c.image;img.alt=c.species;v2DecorateRoom();let busy=false,timer,held=null,lastTap=0;
 const speak=k=>{let a=p[k]||p.idle;dialog.textContent=a[Math.floor(Math.random()*a.length)];};
 speak("greet");
 function action(a){if(busy)return;busy=true;img.dataset.act=a[0];img.src=c.id+"-"+a[0]+".svg";dialog.textContent=a[2];prop.hidden=false;prop.textContent=({book:"▤",coffee:"▣",glasses:"◎ ◎",meditate:"· · ·",fire:"♨",finger:"!",tail:"~",laugh:"ХА!",snakes:"≈",stone:"◆",hiss:"ССС",mirror:"▧"})[a[0]];pdSound("friend",true);clearTimeout(timer);timer=setTimeout(()=>{delete img.dataset.act;img.src=c.image;prop.hidden=true;busy=false;},1900);}
 for(const a of p.acts){let b=document.createElement("button");b.className="note-btn";b.textContent=a[1];b.onclick=()=>action(a);page.querySelector(".v2-actions").append(b);}
 img.onpointerdown=e=>{if(e.button!==0||busy)return;img.setPointerCapture(e.pointerId);held={id:e.pointerId,x:e.clientX,y:e.clientY,left:img.offsetLeft,top:img.offsetTop,t:Date.now(),drag:false,pet:false};};
 img.onpointermove=e=>{if(!held||held.id!==e.pointerId)return;let dx=e.clientX-held.x,dy=e.clientY-held.y;if(Date.now()-held.t>450&&!held.pet&&Math.hypot(dx,dy)>5){if(!held.drag){held.drag=true;speak("grab");img.dataset.act="grab";}img.style.left=Math.max(0,Math.min(room.clientWidth-img.offsetWidth,held.left+dx))+"px";img.style.top=Math.max(0,Math.min(room.clientHeight-img.offsetHeight-17,held.top+dy))+"px";img.style.bottom="auto";}else if(!held.drag&&Math.hypot(dx,dy)>5&&!held.pet){held.pet=true;speak("pet");img.dataset.act="pet";}};
 function end(e){if(!held||held.id!==e.pointerId)return;if(held.drag){img.style.top="auto";img.style.bottom="17px";speak("drop");}else if(!held.pet){speak("tap");lastTap=Date.now();}delete img.dataset.act;held=null;}
 img.onpointerup=end;img.onpointercancel=end;img.onlostpointercapture=end;
 function idle(){if(currentPage!=="companion"||!img.isConnected||page.hidden)return;if(!held&&!busy){if(Math.random()<.45)action(p.acts[Math.floor(Math.random()*p.acts.length)]);else{img.style.left=Math.round(Math.random()*Math.max(0,room.clientWidth-img.offsetWidth))+"px";speak("idle");}}setTimeout(idle,6000+Math.random()*5500);}
 setTimeout(idle,7000);
}
function v2Wander(){
 if(document.hidden||!v2Settings.roam||currentPage==="companion" || clockAlarm||document.querySelector(".v2-wander")||document.activeElement?.matches("input,textarea,select"))return;
 const c=activeCharacter(),el=document.createElement("div");el.className="v2-wander"+(["games","map","calculator","timer"].includes(currentPage)?" v2-wander-small":"");el.setAttribute("aria-hidden","true");const i=new Image();i.src=c.image;el.append(i);if(c.id==="chimp"){let step=0;const t=setInterval(()=>{if(!el.isConnected){clearInterval(t);return;}i.src="chimp-walk-"+(1+step++%2)+".png";},250);}document.querySelector(".display").append(el);setTimeout(()=>el.remove(),6500);
}
setInterval(v2Wander,28000);
const v2OldPage=openPage,v2OldBack=goBack;
openPage=function(){document.querySelector(".v2-wander")?.remove();v2OldPage();};
goBack=function(){document.querySelector(".v2-wander")?.remove();v2OldBack();if(currentPage==="menu")screen.scrollTop=0;};
document.getElementById("confirm").onclick=openPage;document.getElementById("back").onclick=goBack;
// Ігровий зал: 4 ігри; керування корпусом, клавіатурою та пальцями.
const v2Games=[["tennis","Теніс","Поєдинок до 5 очок"],["snake","Змійка","Збирай їжу, не врізайся"],["blocks","Блоки","Складай повні ряди"],["xo","Хрестики-нулики","Зіграй з корешем"]];
let v2Game="",v2GameCursor=0,v2GameTimer=0,v2State=null,v2Canvas=null,v2Ctx=null;
let v2Scores={};try{v2Scores=JSON.parse(localStorage.getItem("pocketdevice.games.v2"))||{};}catch{}
function v2Best(n){if(n>(v2Scores[v2Game]||0)){v2Scores[v2Game]=n;try{localStorage.setItem("pocketdevice.games.v2",JSON.stringify(v2Scores));}catch{}}}
function v2StopGame(){clearInterval(v2GameTimer);v2GameTimer=0;closeTennis();v2State=null;v2Canvas=null;v2Ctx=null;}
function v2GamesHub(){v2StopGame();v2Game="";page.innerHTML='<div class="menu-header">Ігри</div><div class="v2-game-list"></div><p class="v2-hint">Вибери гру пальцем або стрілками й ОК.</p>';const list=page.querySelector(".v2-game-list");v2Games.forEach(([id,title,desc],i)=>{const b=document.createElement("button");b.className="note-btn v2-game-card";b.innerHTML="<strong>"+title+"</strong><small>"+desc+"</small>";b.onclick=()=>{v2GameCursor=i;v2Launch(id);};list.append(b);});v2GameHighlight();screen.scrollTop=0;}
function v2GameHighlight(){page.querySelectorAll(".v2-game-card").forEach((b,i)=>b.classList.toggle("note-cursor",i===v2GameCursor));}
function v2GameBack(){if(!v2Game)return false;v2GamesHub();return true;}
function v2Launch(id){v2StopGame();v2Game=id;if(id==="tennis"){openTennis();return;}if(id==="xo"){v2XOStart();return;}v2BoardStart(id);}
function v2GameMove(d){if(!v2Game){v2GameCursor=Math.max(0,Math.min(v2Games.length-1,v2GameCursor+Math.sign(d)));v2GameHighlight();return;}if(v2Game==="tennis"){moveTennis(d);return;}if(v2Game==="xo"){if(v2State){v2State.cursor=Math.max(0,Math.min(8,v2State.cursor+d));v2XODraw();}return;}if(v2Game==="snake"){v2SnakeDir(d);return;}if(v2Game==="blocks")v2BlockMove(d);}
function v2GameConfirm(){if(!v2Game){v2Launch(v2Games[v2GameCursor][0]);return;}if(v2Game==="tennis"){tennisConfirm();return;}if(v2Game==="xo"){if(v2State.over)v2XOStart();else v2XOPlace(v2State.cursor);return;}if(!v2State)return;if(v2State.over){v2BoardStart(v2Game);return;}v2State.pause=!v2State.pause;v2BoardDraw();}
function v2BoardStart(id){
 const isSnake=id==="snake";page.innerHTML='<div class="menu-header">'+(isSnake?"Змійка":"Блоки")+'</div><div class="v2-score"></div><canvas class="v2-board" width="'+(isSnake?240:160)+'" height="'+(isSnake?240:256)+'"></canvas><div class="v2-game-controls"><button data-dir="-1">◀︎</button><button data-dir="-3">▲</button><button data-dir="3">▼</button><button data-dir="1">▶︎</button></div><button class="note-btn v2-game-toggle">Пауза</button><small class="v2-hint">'+(isSnake?"Проведи пальцем по полю, щоб повернути.":"Свайп ліворуч/праворуч — рух, вгору або тап — поворот, униз — швидше.")+'</small>';
 v2Canvas=page.querySelector("canvas");v2Ctx=v2Canvas.getContext("2d");
 page.querySelector(".v2-game-toggle").onclick=v2GameConfirm;page.querySelectorAll("[data-dir]").forEach(b=>b.onclick=()=>v2GameMove(Number(b.dataset.dir)));
 let start=null;v2Canvas.onpointerdown=e=>{start=[e.clientX,e.clientY];v2Canvas.setPointerCapture(e.pointerId);};v2Canvas.onpointerup=e=>{if(!start)return;let dx=e.clientX-start[0],dy=e.clientY-start[1];start=null;if(Math.max(Math.abs(dx),Math.abs(dy))<10){if(!isSnake)v2BlockMove(-3);return;}v2GameMove(Math.abs(dx)>Math.abs(dy)?Math.sign(dx):3*Math.sign(dy));};v2Canvas.onpointercancel=()=>start=null;
 if(isSnake){v2State={body:[[7,7],[6,7],[5,7]],dx:1,dy:0,next:[1,0],food:[13,9],score:0,over:false,pause:false};v2GameTimer=setInterval(v2SnakeTick,150);}
 else{v2State={grid:Array.from({length:16},()=>Array(10).fill(0)),piece:null,score:0,over:false,pause:false};v2Spawn();v2GameTimer=setInterval(v2BlockTick,550);}
 v2BoardDraw();screen.scrollTop=0;
}
function v2SnakeDir(d){const s=v2State;if(!s||s.over)return;const v=Math.abs(d)===3?[0,Math.sign(d)]:[Math.sign(d),0];if(v[0]!==-s.dx||v[1]!==-s.dy)s.next=v;}
function v2SnakeTick(){const s=v2State;if(!s||s.pause||s.over||document.hidden)return;[s.dx,s.dy]=s.next;const [x,y]=[s.body[0][0]+s.dx,s.body[0][1]+s.dy],eat=x===s.food[0]&&y===s.food[1];if(x<0||x>=15||y<0||y>=15||s.body.slice(0,eat?s.body.length:-1).some(p=>p[0]===x&&p[1]===y)){s.over=true;pdSound("lose");}else{s.body.unshift([x,y]);if(eat){s.score++;v2Best(s.score);pdSound("point");const free=[];for(let yy=0;yy<15;yy++)for(let xx=0;xx<15;xx++)if(!s.body.some(p=>p[0]===xx&&p[1]===yy))free.push([xx,yy]);if(!free.length){s.over=true;pdSound("win");}else s.food=free[Math.floor(Math.random()*free.length)];}else s.body.pop();}v2BoardDraw();}
const v2Shapes=[[[0,0],[1,0],[2,0],[2,1]],[[0,0],[1,0],[0,1],[1,1]],[[0,0],[1,0],[2,0],[1,1]],[[0,0],[0,1],[1,1]],[[0,0],[1,0],[2,0]],[[0,0],[1,0],[1,1],[2,1]]];
function v2Fits(p){return p.cells.every(([x,y])=>p.x+x>=0&&p.x+x<10&&p.y+y>=0&&p.y+y<16&&!v2State.grid[p.y+y][p.x+x]);}
function v2Spawn(){const s=v2State;s.piece={x:3,y:0,cells:v2Shapes[Math.floor(Math.random()*v2Shapes.length)].map(a=>a.slice())};if(!v2Fits(s.piece)){s.over=true;pdSound("lose");}}
function v2BlockTick(){const s=v2State;if(!s||s.pause||s.over||document.hidden)return;const p=s.piece;if(v2Fits({...p,y:p.y+1}))p.y++;else{for(const [x,y] of p.cells)s.grid[p.y+y][p.x+x]=1;const old=s.grid.length;s.grid=s.grid.filter(r=>!r.every(Boolean));const n=old-s.grid.length;while(s.grid.length<16)s.grid.unshift(Array(10).fill(0));if(n){s.score+=n*n*10;v2Best(s.score);pdSound("point");}v2Spawn();}v2BoardDraw();}
function v2BlockMove(d){const s=v2State;if(!s||s.pause||s.over)return;const p=s.piece;if(d===3){v2BlockTick();return;}if(d===-3){let cells=p.cells.map(([x,y])=>[-y,x]);const minX=Math.min(...cells.map(c=>c[0])),minY=Math.min(...cells.map(c=>c[1]));cells=cells.map(([x,y])=>[x-minX,y-minY]);for(const shift of [0,-1,1,-2,2])if(v2Fits({...p,cells,x:p.x+shift})){p.cells=cells;p.x+=shift;break;}}else if(v2Fits({...p,x:p.x+d}))p.x+=d;v2BoardDraw();}
function v2BoardDraw(){if(!v2Ctx||!v2State)return;const c=v2Ctx,s=v2State,snake=v2Game==="snake",w=snake?15:10,h=snake?15:16;const rect=(x,y,color)=>{c.fillStyle=color;c.fillRect(x*16+1,y*16+1,14,14);};c.fillStyle="#071310";c.fillRect(0,0,w*16,h*16);for(let y=0;y<h;y++)for(let x=0;x<w;x++)rect(x,y,"#102923");if(snake){rect(...s.food,"#e5efd1");s.body.forEach(([x,y],i)=>rect(x,y,i?"#419d85":"#afffe5"));}else{s.grid.forEach((r,y)=>r.forEach((v,x)=>{if(v)rect(x,y,"#489d8c");}));if(s.piece&&!s.over)s.piece.cells.forEach(([x,y])=>rect(s.piece.x+x,s.piece.y+y,"#afffe5"));}if(s.pause||s.over){c.fillStyle="#06100fe8";c.fillRect(0,h*8-18,w*16,36);c.fillStyle="#aaffdf";c.font="bold 13px monospace";c.textAlign="center";c.fillText(s.over?"КІНЕЦЬ ГРИ":"ПАУЗА",w*8,h*8+5);}page.querySelector(".v2-score").textContent="Рахунок: "+s.score+" · Рекорд: "+(v2Scores[v2Game]||0);page.querySelector(".v2-game-toggle").textContent=s.over?"Ще раз":s.pause?"Продовжити":"Пауза";}
function v2XOStart(){v2State={board:Array(9).fill(""),cursor:0,over:false,waiting:false};page.innerHTML='<div class="menu-header">Хрестики-нулики</div><div class="v2-score"></div><div class="v2-xo"></div><button class="note-btn v2-xo-restart">Нова гра</button><small class="v2-hint">Ти — X. Кореш — O.</small>';for(let i=0;i<9;i++){const b=document.createElement("button");b.onclick=()=>v2XOPlace(i);page.querySelector(".v2-xo").append(b);}page.querySelector(".v2-xo-restart").onclick=v2XOStart;v2XODraw();}
function v2Winner(b){for(const [a,c,d] of [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]])if(b[a]&&b[a]===b[c]&&b[a]===b[d])return b[a];return b.every(Boolean)?"draw":"";}
function v2XODraw(){let s=v2State;if(!s)return;page.querySelectorAll(".v2-xo button").forEach((b,i)=>{b.textContent=s.board[i];b.classList.toggle("note-cursor",i===s.cursor);});let w=v2Winner(s.board);page.querySelector(".v2-score").textContent=w==="X"?"Ти виграв!":w==="O"?"Кореш виграв.":w==="draw"?"Нічия.":s.waiting?"Кореш думає…":"Твій хід";}
function v2XOPlace(i){const s=v2State;if(!s||s.over||s.waiting||s.board[i])return;s.board[i]="X";s.cursor=i;let w=v2Winner(s.board);if(w){s.over=true;if(w==="X"){v2Scores.xo=(v2Scores.xo||0)+1;try{localStorage.setItem("pocketdevice.games.v2",JSON.stringify(v2Scores));}catch{}pdSound("win");}v2XODraw();return;}s.waiting=true;v2XODraw();setTimeout(()=>{if(v2State!==s||currentPage!=="games"||v2Game!=="xo")return;const free=s.board.map((x,i)=>x?-1:i).filter(i=>i>=0);let spot;for(const mark of ["O","X"]){spot=free.find(i=>{const b=s.board.slice();b[i]=mark;return v2Winner(b)===mark;});if(spot!==undefined)break;}if(spot===undefined)spot=free.includes(4)?4:free[Math.floor(Math.random()*free.length)];s.board[spot]="O";s.waiting=false;if(v2Winner(s.board)){s.over=true;pdSound("lose");}v2XODraw();},390);}
document.addEventListener("keydown",e=>{if(currentPage!=="games"||v2Game==="tennis"||e.target.matches?.("input,textarea,select"))return;const keys={ArrowLeft:-1,ArrowRight:1,ArrowUp:-3,ArrowDown:3};if(keys[e.key]){e.preventDefault();v2GameMove(keys[e.key]);}else if((e.key==="Enter"||e.key===" ")&&!e.repeat&&e.target.tagName!=="BUTTON"){e.preventDefault();v2GameConfirm();}else if(e.key==="Escape"){e.preventDefault();goBack();}});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&v2State&&["snake","blocks"].includes(v2Game)&&!v2State.over){v2State.pause=true;v2BoardDraw();}});
