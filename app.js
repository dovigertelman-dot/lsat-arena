const $=s=>document.querySelector(s),app=$('#app');
const BOTS=[{n:'LogicLlama',r:1180,acc:.55,spd:70},{n:'FlawFinder',r:1320,acc:.68,spd:60},{n:'NecessaryNora',r:1450,acc:.78,spd:52},{n:'ContrapositiveKing',r:1580,acc:.86,spd:45},{n:'170Club',r:1720,acc:.93,spd:38},{n:'NewbieNate',r:1050,acc:.45,spd:85}];
const BADGES=[
 {id:'first',name:'First win',desc:'Win a ranked duel',icon:'trophy'},
 {id:'streak5',name:'5-streak',desc:'Win 5 ranked duels in a row',icon:'flame'},
 {id:'perfect',name:'Perfect 5/5',desc:'Get every question right in a set',icon:'spark'},
 {id:'daily7',name:'7-day streak',desc:'Finish the daily challenge 7 days running',icon:'cal'}
];
const PER=90,PACE=85,LENGTHS=[5,15,30,50],COUNT_FRAMES=['3','2','1','Go'];
let S=load(),duel=null,tick=null,wait=null,fxTimer=null,gen=0,audioCtx=null;

function svg(path){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;}
const ICONS={
 trophy:svg('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3"/>'),
 flame:svg('<path d="M12 3s6 5 6 10a6 6 0 0 1-12 0c0-2 1-3 2-4 0 2 2 2 2 0 0-2 2-4 2-6z"/>'),
 spark:svg('<path d="M12 2l1.6 6.2L20 10l-6.4 1.8L12 18l-1.6-6.2L4 10l6.4-1.8L12 2z"/>'),
 cal:svg('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>'),
 sword:svg('<path d="M14.5 4.5l5 5M13 6l5 5-8 8H5v-5l8-8z"/>'),
 target:svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/>'),
 users:svg('<path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="3"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 4.13a3 3 0 0 1 0 5.74"/>'),
 vol:svg('<path d="M4 10h4l5-4v12l-5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a7 7 0 0 1 0 11"/>'),
 mute:svg('<path d="M4 10h4l5-4v12l-5-4H4zM19 9l-6 6M13 9l6 6"/>'),
 brain:svg('<path d="M9 5a3 3 0 0 0-3 3 3 3 0 0 0-2 3c0 2 1.4 3 3 3v2h4M15 5a3 3 0 0 1 3 3 3 3 0 0 1 2 3c0 2-1.4 3-3 3v2h-4M9 5c0 3.2 6 3.2 6 0M12 11v6"/>'),
  ghost:svg('<path d="M12 3a6 6 0 0 0-6 6v10l2.2-1.6L12 19l3.8-1.6L18 19V9a6 6 0 0 0-6-6z"/><path d="M9.5 10h.01M14.5 10h.01"/>'),
  book:svg('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v16H6.5A2.5 2.5 0 0 0 4 21.5zM20 5.5A2.5 2.5 0 0 0 17.5 3H12v16h5.5a2.5 2.5 0 0 1 2.5 2.5z"/>'),
 globe:svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.4 2.6 3.6 5.6 3.6 9s-1.2 6.4-3.6 9c-2.4-2.6-3.6-5.6-3.6-9S9.6 5.6 12 3z"/>'),
 sun:svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
 moon:svg('<path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z"/>')
};
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function blank(){return {name:'You',rating:1200,w:0,l:0,hist:[],attempts:[],streak:0,badges:[],dailyLast:'',dailyStreak:0,dailyBest:null,mute:true,theme:'light',len:5,section:false,runs:[],ai:'medium'};}
function load(){
 let raw={};
 try{raw=JSON.parse(localStorage.getItem('arena')||'{}')||{};}catch(e){raw={};}
 const hadTheme=raw.theme==='light'||raw.theme==='dark';
 const s=Object.assign(blank(),raw);
 if(!Array.isArray(s.hist))s.hist=[];
 if(!Array.isArray(s.attempts))s.attempts=[];
 if(!Array.isArray(s.badges))s.badges=[];
 if(typeof s.name!=='string'||!s.name.trim())s.name='You';
 s.name=s.name.trim().slice(0,20);
 s.theme=hadTheme?raw.theme:'light';
 s.mute=hadTheme?!!s.mute:true;
 if(!LENGTHS.includes(s.len))s.len=5;
 s.section=!!s.section;
 s.runs=Array.isArray(raw.runs)?raw.runs.map(cleanRun).filter(Boolean).slice(-40):[];
 if(s.ai!=='easy'&&s.ai!=='medium'&&s.ai!=='hard')s.ai='medium';
 return s;
}
function cleanRun(r){
 if(!r||typeof r!=='object')return null;
 const len=Number(r.len);
 if(!LENGTHS.includes(len))return null;
 if(!Array.isArray(r.ids)||r.ids.length!==len)return null;
 if(!Array.isArray(r.ok)||r.ok.length!==len)return null;
 if(!Array.isArray(r.ts)||r.ts.length!==len)return null;
 if(r.ids.some(n=>!Number.isInteger(n)||n<0||n>=QUESTIONS.length))return null;
 if(new Set(r.ids).size!==len)return null;
 const scope=typeof r.scope==='string'&&r.scope.trim()?r.scope.trim().slice(0,40):'Mixed';
 const ts=r.ts.map(t=>Math.max(0.1,Math.round((Number(t)||0.1)*100)/100));
 const ok=r.ok.map(x=>x?1:0);
 return {id:String(r.id||Date.now()),at:Number(r.at)||Date.now(),mode:String(r.mode||'practice').slice(0,20),len,scope,me:ok.reduce((s,x)=>s+x,0),sec:Math.round(ts.reduce((s,t)=>s+t,0)*100)/100,ids:r.ids.slice(),ok,ts};
}
function save(){try{localStorage.setItem('arena',JSON.stringify(S));}catch(e){}}
function tierName(r){r=Math.round(Number(r)||0);if(r>=1900)return 'Diamond';if(r>=1700)return 'Platinum';if(r>=1500)return 'Gold';if(r>=1300)return 'Silver';return 'Bronze';}
function emblem(r,lg){
 const t=tierName(r).toLowerCase();
 return `<span class="emblem ${t}${lg?' lg':''}" aria-hidden="true"><svg viewBox="0 0 64 72"><path fill="currentColor" d="M32 2 58 14v22c0 16-10 28-26 34C16 64 6 52 6 36V14Z"/></svg><b>${t[0].toUpperCase()}</b></span>`;
}
function tierHTML(r){const t=tierName(r);return `<span class="tier ${t.toLowerCase()}">${emblem(r)} ${t}</span>`;}
function initial(n){return esc(String(n||'?').trim().charAt(0).toUpperCase()||'?');}
function today(){return new Date().toISOString().slice(0,10);}
function prevDay(day){const d=new Date(day+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10);}
function shownStreak(){const t=today();if(S.dailyLast===t||S.dailyLast===prevDay(t))return S.dailyStreak||0;return 0;}
function give(id){if(!S.badges.includes(id))S.badges.push(id);}
function shuffle(list){const b=list.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function hashDay(str){let h=2166136261;for(let i=0;i<str.length;i++)h=Math.imul(h^str.charCodeAt(i),16777619);return h>>>0;}
function dailyIds(day){
 const rng=mulberry32(hashDay(day)),idx=QUESTIONS.map((_,i)=>i);
 for(let i=idx.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[idx[i],idx[j]]=[idx[j],idx[i]];}
 return idx.slice(0,5);
}
function cancel(){gen++;clearInterval(tick);tick=null;clearTimeout(wait);wait=null;clearTimeout(fxTimer);fxTimer=null;}
function show(html){app.innerHTML=html;app.classList.remove('in');void app.offsetWidth;app.classList.add('in');}
function beep(freq,dur,type,gain){
 if(S.mute)return;
 try{
  audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
  if(audioCtx.state==='suspended')audioCtx.resume();
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.type=type||'sine';o.frequency.value=freq;g.gain.value=gain||0.03;
  o.connect(g);g.connect(audioCtx.destination);o.start();
  g.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+dur);
  o.stop(audioCtx.currentTime+dur);
 }catch(e){}
}
function soundOk(){beep(660,.08,'sine',.035);setTimeout(()=>beep(880,.12,'sine',.03),70);}
function soundBad(){beep(180,.16,'triangle',.03);}
function soundTick(){beep(540,.05,'sine',.025);}
function applyTheme(){
 document.documentElement.dataset.theme=S.theme;
 document.documentElement.style.colorScheme=S.theme;
}
function renderTheme(){
 const b=$('#theme');if(!b)return;
 const dark=S.theme==='dark';
 b.setAttribute('aria-pressed',dark?'true':'false');
 b.setAttribute('aria-label',dark?'Switch to light':'Switch to dark');
 b.innerHTML=dark?ICONS.sun:ICONS.moon;
}
function renderMute(){
 const b=$('#mute');if(!b)return;
 b.setAttribute('aria-pressed',S.mute?'true':'false');
 b.setAttribute('aria-label',S.mute?'Unmute sound effects':'Mute sound effects');
 b.innerHTML=S.mute?ICONS.mute:ICONS.vol;
}
function header(){$('#me').innerHTML=`<span class="who">${esc(S.name)}</span> ${tierHTML(S.rating)} <span>${Math.round(S.rating)} Elo</span> <span class="muted">${S.w}W-${S.l}L</span>`;}
function burst(el){
 const fx=$('#fx');if(!fx||!el)return;
 const r=el.getBoundingClientRect();
 for(let i=0;i<8;i++){
  const s=document.createElement('i');s.className='bit';
  s.style.left=(r.left+r.width/2)+'px';s.style.top=(r.top+12)+'px';
  s.style.background=i%2?'var(--ok)':'var(--accent)';
  s.style.setProperty('--x',(Math.random()*64-32)+'px');
  s.style.setProperty('--y',(-12-Math.random()*28)+'px');
  fx.appendChild(s);setTimeout(()=>s.remove(),700);
 }
}
function board(){
 const rows=[...BOTS.map(b=>({n:b.n,r:b.r})),{n:S.name+' (you)',r:S.rating,you:1}].sort((a,b)=>b.r-a.r);
 return '<table>'+rows.map((x,i)=>`<tr class="${x.you?'you':''}"><td>#${i+1}</td><td><span class="who">${emblem(x.r)} ${esc(x.n)}</span></td><td style="text-align:right">${tierHTML(x.r)} ${Math.round(x.r)}</td></tr>`).join('')+'</table>';
}
function badgesHTML(){return `<div class="badges">${BADGES.map(b=>`<div class="badge ${S.badges.includes(b.id)?'on':''}"><span class="bico">${ICONS[b.icon]}</span><div><b>${esc(b.name)}</b><span class="muted">${esc(b.desc)}</span></div></div>`).join('')}</div>`;}
function goHome(){if(location.search)history.replaceState(null,'',location.pathname);home();}
function setSize(){return LENGTHS.includes(S.len)?S.len:5;}
function lenHTML(){
 const lens=LENGTHS.map(n=>`<button type="button" class="len${S.len===n?' on':''}" id="len${n}" data-n="${n}">${n===5?'Quick 5':n}</button>`).join('');
 return `<div class="lenrow"><span class="quiet">Practice length</span><div class="lens" role="group" aria-label="Practice length">${lens}</div><label class="sect"><input type="checkbox" id="sect"${S.section?' checked':''}> Section timer</label><p class="quiet lennote">Ranked and daily stay at five. Length and the section timer apply to weak spots, friend challenges, Play vs AI, and Beat your best. Section time is 1:25 per question.</p></div>`;
}
function bindLen(after){
 document.querySelectorAll('.len[data-n]').forEach(b=>{b.onclick=()=>{S.len=+b.dataset.n;save();(after||home)();};});
 const sect=$('#sect'); if(sect)sect.onchange=()=>{S.section=sect.checked;save();};
}
const AI_LEVELS={
 easy:{id:'easy',name:'Easy',acc:.50,spd:64,tilt:-.16},
 medium:{id:'medium',name:'Medium',acc:.70,spd:42,tilt:-.06},
 hard:{id:'hard',name:'Hard',acc:.88,spd:22,tilt:.08}
};
function aiProb(level,d){
 const L=AI_LEVELS[level]||AI_LEVELS.medium;
 return Math.min(.97,Math.max(.08,L.acc+((Number(d)||2)-2)*L.tilt));
}
function makeAI(qs,level){
 const L=AI_LEVELS[level]||AI_LEVELS.medium;
 return qs.map(q=>{
  const d=Number(q.d)||2,p=aiProb(level,d);
  const pace=L.spd*(L.tilt<0?1+(d-2)*.18:1-(d-2)*.15);
  return {ok:Math.random()<p,t:Math.max(8,pace*(.7+Math.random()*.6)),p};
 });
}
function betterRun(a,b){
 if(a.me!==b.me)return a.me>b.me?a:b;
 if(a.sec!==b.sec)return a.sec<b.sec?a:b;
 return a.at>=b.at?a:b;
}
function bestBlurb(){
 const runs=S.runs.filter(r=>r.len===setSize());
 if(!runs.length)return 'Race a saved run at this length';
 const best=runs.reduce(betterRun);
 return `Best ${best.me}/${best.len} · ${best.sec.toFixed(1)}s`;
}
function rememberRun(me,mt){
 if(!duel||!duel.qs)return;
 const ids=duel.qs.map(q=>QUESTIONS.indexOf(q));
 if(ids.length!==duel.qs.length||ids.some(n=>n<0)||new Set(ids).size!==ids.length)return;
 const types=[...new Set(duel.qs.map(q=>q.t||'Other'))];
 const ts=duel.ans.map(a=>Math.max(0.1,Math.round((((a&&a.t)||0.1))*100)/100));
 const ok=duel.ans.map(a=>a&&a.ok?1:0);
 if(ts.length!==ids.length)return;
 const sec=Math.round(ts.reduce((s,t)=>s+t,0)*100)/100;
 S.runs.push({id:Date.now().toString(36)+Math.floor(Math.random()*1296).toString(36),at:Date.now(),mode:duel.mode,len:ids.length,scope:types.length===1?types[0]:'Mixed',me,sec,ids,ok,ts});
 if(S.runs.length>40)S.runs.splice(0,S.runs.length-40);
}
let ghostScope='all';
function nQ(){return duel&&duel.qs?duel.qs.length:5;}
function matchLine(h){return `${h.res==='W'?'Win':h.res==='L'?'Loss':'Draw'} vs ${esc(h.opp)} · ${h.me}/5 vs ${h.op}/5 · ${h.d>0?'+':''}${h.d}`;}
function home(){
 cancel();duel=null;header();
 const best=S.dailyBest&&S.dailyBest.day===today()?` · today ${S.dailyBest.me}/5`:'';
 const streak=shownStreak();
 const last=S.hist.length?S.hist[S.hist.length-1]:null;
 const streakLabel=esc('Daily streak: '+streak+best);
 show(`<div class="home"><div class="home-main"><section class="card welcome"><div class="mark" aria-hidden="true"></div><div><h1>Five questions.</h1><p class="lede">Accuracy wins. Time breaks a tie.</p></div></section><div class="chips"><div class="chip">${emblem(S.rating,true)}<span><b>${esc(tierName(S.rating))}</b><span>${Math.round(S.rating)} Elo</span></span></div><div class="chip"><b>${S.w}-${S.l}</b><span>Record</span></div><div class="chip warm"><b>${streak}</b><span>${streakLabel}</span></div></div><button type="button" class="primary play" id="go"><span class="ico on">${ICONS.sword}</span><span>Play ranked</span></button>${lenHTML()}<div class="card mode-card"><div class="modelist"><button type="button" id="daily"><span class="ico">${ICONS.cal}</span><span class="mlabel"><b>Daily</b><small>Same set for everyone</small></span></button><button type="button" id="stats"><span class="ico">${ICONS.target}</span><span class="mlabel"><b>Weak spots</b><small>Your lowest patterns</small></span></button><button type="button" id="share"><span class="ico">${ICONS.users}</span><span class="mlabel"><b>Challenge a friend</b><small>Play a set, then share the link</small></span></button><button type="button" id="ai"><span class="ico">${ICONS.brain}</span><span class="mlabel"><b>Play vs AI</b><small>Easy, medium, or hard · any length</small></span></button><button type="button" id="ghost"><span class="ico">${ICONS.ghost}</span><span class="mlabel"><b>Beat your best</b><small>${esc(bestBlurb())}</small></span></button><a href="notes.html"><span class="ico">${ICONS.book}</span><span class="mlabel"><b>Study Notes</b><small>the tricks, in plain English</small></span></a></div></div><section class="card soon-card"><button type="button" class="soon" id="online" disabled><span class="ico">${ICONS.globe}</span><span class="mlabel"><b>Online (coming soon)</b><small>Live matches with other players aren't open yet. Your drills stay on this device.</small></span></button></section>${last?`<p class="quiet">Last match: ${matchLine(last)}</p>`:''}</div><aside class="card"><h2>Leaderboard</h2>${board()}</aside></div><details class="more card"><summary>Badges and history</summary><h2>Badges</h2>${badgesHTML()}<h2>Recent matches</h2>${S.hist.length?S.hist.slice(-5).reverse().map(h=>`<div class="match">${matchLine(h)}</div>`).join(''):'<p class="muted">No matches yet.</p>'}<div class="actions"><button type="button" class="text" id="nm">Change name</button></div></details>`);
 $('#go').onclick=matchmake;$('#daily').onclick=startDaily;$('#stats').onclick=statsPage;$('#share').onclick=startShare;
 $('#ai').onclick=aiSetup;$('#ghost').onclick=ghostPage;
 bindLen(home);
 $('#nm').onclick=()=>{const n=prompt('Display name',S.name);if(n&&n.trim()){S.name=n.trim().slice(0,20);save();home();}};
}
function patternRows(){
 const map={};
 for(const q of QUESTIONS)map[q.pattern]={p:q.pattern,n:0,ok:0,t:0};
 for(const a of S.attempts){if(!a||!a.p)continue;if(!map[a.p])map[a.p]={p:a.p,n:0,ok:0,t:0};map[a.p].n++;map[a.p].ok+=a.ok?1:0;map[a.p].t+=Number(a.t)||0;}
 return Object.values(map).map(r=>({...r,acc:r.n?r.ok/r.n:null,avg:r.n?r.t/r.n:null}));
}
function weakSet(rows){
 const played=rows.filter(r=>r.n>0&&r.acc<1);
 if(!played.length)return new Set();
 const min=Math.min(...played.map(r=>r.acc));
 return new Set(played.filter(r=>r.acc===min).map(r=>r.p));
}
function practiceQuestions(n){
 n=LENGTHS.includes(n)?n:5;
 const src=[],seen=new Set();
 for(const q of shuffle(QUESTIONS)){if(seen.has(q))continue;seen.add(q);src.push(q);if(src.length>=n)break;}
 return src;
}
function trainQuestions(){
 const n=setSize();
 const rows=patternRows().filter(r=>r.n>0).sort((a,b)=>a.acc-b.acc||b.avg-a.avg);
 const pool=[];
 for(const r of rows){for(const q of QUESTIONS)if(q.pattern===r.p&&!pool.includes(q))pool.push(q);if(pool.length>=n)break;}
 const src=[];
 for(const q of pool)if(!src.includes(q))src.push(q);
 if(src.length<n){for(const q of shuffle(QUESTIONS))if(!src.includes(q)){src.push(q);if(src.length>=n)break;}}
 return shuffle(src).slice(0,n);
}
function statsPage(){
 cancel();duel=null;header();
 const rows=patternRows().sort((a,b)=>((a.n===0)-(b.n===0))||((a.acc??1)-(b.acc??1))||((b.avg||0)-(a.avg||0)));
 const weak=weakSet(rows),played=rows.some(r=>r.n>0);
 const body=rows.map(r=>{
  const pct=r.n?Math.round(r.acc*100):0;
  const fill=r.n?Math.max(pct,8):0;
  return `<div class="chart-row${weak.has(r.p)?' weak':''}"><div class="chart-top"><span class="chart-name">${esc(r.p)}${weak.has(r.p)?' · weak spot':''}</span><span class="muted">${r.n?pct+'% · '+r.avg.toFixed(1)+'s · '+r.n+' tries':'—'}</span></div><div class="chart-bar"><i data-w="${fill}%"></i></div></div>`;
 }).join('');
 const types={};
 for(const a of S.attempts){if(!a||!a.ty)continue;if(!types[a.ty])types[a.ty]={n:0,ok:0};types[a.ty].n++;types[a.ty].ok+=a.ok?1:0;}
 const typeLine=Object.keys(types).sort().map(k=>{const r=types[k];return `${esc(k)} ${Math.round(r.ok/r.n*100)}% · ${r.n}`;}).join(' · ');
 show(`<div class="stage card"><h1>Pattern stats</h1><p class="lede">Accuracy and average time from answers saved in this browser. Weak spots are your lowest patterns. Drills use your practice length.</p>${typeLine?`<p class="quiet">${typeLine}</p>`:''}<div class="chart">${body}</div><div class="actions"><button type="button" class="primary" id="train"${played?'':' disabled'}>Train weak spots · ${setSize()}</button><button type="button" class="text" id="hm">Home</button></div></div>`);
 requestAnimationFrame(()=>document.querySelectorAll('.chart-bar i').forEach(el=>{el.style.width=el.dataset.w;}));
 if(played)$('#train').onclick=startTrain;
 $('#hm').onclick=goHome;
}
function pickOpp(){return [...BOTS].sort((a,b)=>Math.abs(a.r-S.rating)-Math.abs(b.r-S.rating))[Math.floor(Math.random()*2)];}
function makeBot(qs,opp){return qs.map(()=>({ok:Math.random()<opp.acc,t:Math.max(12,opp.spd*(0.6+Math.random()*0.8))}));}
function matchmake(){
 cancel();
 show(`<div class="count card stage"><p class="kicker">Ranked</p><h1>Finding an opponent</h1><p class="quiet">Near ${Math.round(S.rating)} Elo</p></div>`);
 const g=gen;
 wait=setTimeout(()=>{if(g!==gen)return;const opp=pickOpp(),qs=shuffle(QUESTIONS).slice(0,5);begin({mode:'ranked',label:'Ranked duel',opp,qs,bot:makeBot(qs,opp)});},1200);
}
function useSection(mode){return !!S.section&&mode!=='ranked'&&mode!=='daily';}
function startTrain(){const qs=trainQuestions(),opp=pickOpp();begin({mode:'train',label:'Weak-spot drill · '+qs.length,opp,qs,bot:makeBot(qs,opp),section:useSection('train')});}
function startShare(){const qs=practiceQuestions(setSize()),opp=pickOpp();begin({mode:'share',label:'Challenge set · '+qs.length,opp,qs,bot:makeBot(qs,opp),section:useSection('share')});}
function aiSetup(){
 cancel();duel=null;header();
 if(!AI_LEVELS[S.ai])S.ai='medium';
 const diffs=['easy','medium','hard'].map(id=>{
  const L=AI_LEVELS[id];
  const note=id==='easy'?'About half right, and slower on harder questions':id==='medium'?'About 70% right, a little shakier on harder questions':'About 88% right, faster, and sharper on harder questions';
  return `<button type="button" class="diff${S.ai===id?' on':''}" data-ai="${id}"><b>${L.name}</b><small>${note}</small></button>`;
 }).join('');
 show(`<div class="stage card"><p class="kicker">Play vs AI</p><h1>Pick a difficulty.</h1><p class="lede">The AI plays the same ${setSize()} questions. Accuracy wins, and time breaks a tie. Rating stays put.</p><div class="diffgrid" role="group" aria-label="AI difficulty">${diffs}</div>${lenHTML()}<div class="actions"><button type="button" class="primary" id="start-ai">Start vs ${esc(AI_LEVELS[S.ai].name)}</button><button type="button" class="text" id="hm">Home</button></div></div>`);
 document.querySelectorAll('.diff').forEach(b=>{b.onclick=()=>{S.ai=b.dataset.ai;save();aiSetup();};});
 bindLen(aiSetup);
 $('#start-ai').onclick=startAI;
 $('#hm').onclick=goHome;
}
function startAI(){
 const level=AI_LEVELS[S.ai]?S.ai:'medium';
 const qs=practiceQuestions(setSize());
 begin({mode:'ai',label:'Vs '+AI_LEVELS[level].name+' · '+qs.length,opp:{n:AI_LEVELS[level].name,r:S.rating},qs,bot:makeAI(qs,level),level,section:useSection('ai')});
}
function ghostMatches(){
 const len=setSize();
 return S.runs.filter(r=>r.len===len&&(ghostScope==='all'||r.scope===ghostScope));
}
function ghostPage(){
 cancel();duel=null;header();
 const len=setSize();
 const scopes=[...new Set(S.runs.filter(r=>r.len===len).map(r=>r.scope))];
 if(ghostScope!=='all'&&!scopes.includes(ghostScope))ghostScope='all';
 const chips=['all',...scopes].map(s=>`<button type="button" class="len scope${ghostScope===s?' on':''}" data-scope="${esc(s)}">${s==='all'?'Any type':esc(s)}</button>`).join('');
 const runs=ghostMatches().slice().sort((a,b)=>b.at-a.at);
 const best=runs.length?runs.reduce(betterRun):null;
 const list=runs.length?`<div class="runlist">${runs.map(r=>{
  const when=new Date(r.at).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
  const mark=best&&r.id===best.id?'<span class="pill">Best</span>':'';
  return `<button type="button" class="run${best&&r.id===best.id?' best':''}" data-run="${esc(r.id)}"><span><b>${r.me}/${r.len} · ${r.sec.toFixed(1)}s</b><small>${esc(r.scope)} · ${esc(when)}</small></span>${mark}</button>`;
 }).join('')}</div>`:'<p class="lede">No saved run at this length and type yet. Finish a set and it is kept in this browser.</p>';
 show(`<div class="stage card"><p class="kicker">Beat your best</p><h1>Race a past you.</h1><p class="lede">Same questions, same order. Your earlier pace fills the opponent bar. Pick your best, or any saved run of this length and type.</p>${lenHTML()}<div class="lens" role="group" aria-label="Run type">${chips}</div>${list}<div class="actions">${best?`<button type="button" class="primary" id="race">Race your best</button>`:''}<button type="button" class="text" id="hm">Home</button></div></div>`);
 bindLen(ghostPage);
 document.querySelectorAll('[data-scope]').forEach(b=>{b.onclick=()=>{ghostScope=b.dataset.scope;ghostPage();};});
 document.querySelectorAll('[data-run]').forEach(b=>{b.onclick=()=>{const run=S.runs.find(r=>r.id===b.dataset.run);if(run)startGhost(run);};});
 if(best){$('#race').onclick=()=>startGhost(best);}
 $('#hm').onclick=goHome;
}
function startGhost(run){
 if(!run)return;
 const qs=run.ids.map(i=>QUESTIONS[i]);
 const bot=run.ts.map((t,i)=>({ok:!!run.ok[i],t}));
 begin({mode:'ghost',label:'Beat your best · '+run.len+' · '+run.scope,opp:{n:'Past you',r:S.rating},qs,bot,ghostId:run.id,section:useSection('ghost')});
}
function startDaily(){const qs=dailyIds(today()).map(i=>QUESTIONS[i]);begin({mode:'daily',label:'Daily challenge · '+today()+' UTC',qs,section:false});}
function countdown(label,done){
 const g=++gen;clearInterval(tick);tick=null;let i=0;
 const step=()=>{
  if(g!==gen)return;
  if(i>=COUNT_FRAMES.length){done();return;}
  const word=COUNT_FRAMES[i++];
  show(`<div class="count card stage"><div class="big">${word}</div><p class="quiet">${esc(label)}</p></div>`);
  if(word==='Go')beep(880,.14,'sine',.04);else soundTick();
  wait=setTimeout(step,word==='Go'?650:1000);
 };
 step();
}
function begin(opts){countdown(opts.label,()=>start(opts));}
function start(opts){
 const ranked=opts.mode==='ranked'||opts.mode==='daily';
 const per=ranked?PER:PACE;
 duel={mode:opts.mode,label:opts.label,opp:opts.opp||null,qs:opts.qs,bot:opts.bot||null,friend:opts.friend||null,level:opts.level||null,ghostId:opts.ghostId||null,i:0,ans:[],t0:Date.now(),qStart:Date.now(),sel:null,busy:false,section:!!opts.section&&!ranked,per,budget:opts.qs.length*per,closing:false};
 render();tick=setInterval(update,250);
}
function playersHTML(){
 let other;
 const n=nQ();
 if(duel.bot)other=`<span>${esc(duel.opp.n)} · <span id="ot">0/${n} answered</span></span>`;
 else if(duel.friend)other=`<span>${esc(duel.friend.name)} · ${duel.friend.me}/${n} · ${duel.friend.sec.toFixed(1)}s</span>`;
 else other=`<span>Daily · streak ${shownStreak()}</span>`;
 const oppBar=duel.bot?`<div class="track opp"><i id="ob" style="width:0"></i></div>`:duel.friend?`<div class="track opp"><i style="width:${n?duel.friend.me/n*100:0}%"></i></div>`:`<div class="track opp"><i style="width:100%"></i></div>`;
 return `<div class="progress"><div class="progress-labels"><span>You ${duel.i}/${n}</span>${other}</div><div class="track"><i style="width:${n?duel.i/n*100:0}%"></i></div>${oppBar}</div>`;
}
function render(){
 duel.busy=false;duel.sel=null;
 const q=duel.qs[duel.i];
 const clock=fmt(duel.section?duel.budget:duel.per);
 show(`<article class="read card stage">${playersHTML()}<div class="qtop"><span class="tag">Q${duel.i+1}/${nQ()} · ${esc(q.t)}${q.d?' · D'+q.d:''}</span><span class="timer" id="tm">${clock}</span>${duel.section?'<span class="quiet">section</span>':''}</div><div class="stim">${esc(q.s)}</div><div class="stem">${esc(q.q)}</div><p class="muted hint">Tap an answer to select it, then tap it again to submit.</p>${q.c.map((c,k)=>`<div class="ans" data-k="${k}"><button type="button" class="ch" data-k="${k}"><span class="letter">${'ABCDE'[k]}</span><span>${esc(c)}</span></button><button type="button" class="xx" hidden aria-label="Deselect">×</button></div>`).join('')}</article>`);
 document.querySelectorAll('.ans').forEach(row=>{
  const k=+row.dataset.k;
  row.querySelector('.ch').onclick=()=>{if(!duel||duel.busy)return;if(duel.sel===k)answer(k);else{duel.sel=k;paintSel();beep(420,.04,'sine',.02);}};
  row.querySelector('.xx').onclick=e=>{e.preventDefault();e.stopPropagation();if(!duel||duel.busy)return;duel.sel=null;paintSel();};
 });
 update();
}
function paintSel(){
 document.querySelectorAll('.ans').forEach(row=>{
  const on=duel&&duel.sel===+row.dataset.k;
  row.querySelector('.ch').classList.toggle('sel',on);
  row.querySelector('.xx').hidden=!on;
 });
}
function botProgress(){let el=(Date.now()-duel.t0)/1000,c=0,acc=0;for(const b of duel.bot){acc+=b.t;if(el>=acc)c++;else break;}return c;}
function fmt(left){const s=Math.max(0,left);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}
function trimAttempts(){if(S.attempts.length>2000)S.attempts.splice(0,S.attempts.length-2000);}
function logAttempt(q,ok,t){S.attempts.push({p:q.pattern,ty:q.t,ok:ok?1:0,t});trimAttempts();}
function expireSection(){
 if(!duel||duel.closing)return;
 while(duel.i<duel.qs.length){
  const q=duel.qs[duel.i],t=Math.max(0,(Date.now()-duel.qStart)/1000);
  duel.ans.push({k:-1,ok:false,t});
  logAttempt(q,0,t);
  duel.i++;duel.qStart=Date.now();
 }
 save();finish();
}
function update(){
 if(!duel||duel.busy||duel.closing)return;
 const left=duel.section?duel.budget-Math.floor((Date.now()-duel.t0)/1000):duel.per-Math.floor((Date.now()-duel.qStart)/1000);
 const t=$('#tm');
 if(t){t.textContent=fmt(left);t.className='timer'+((duel.section?left<=60:left<=15)?' low':'');}
 if(duel.bot){
  const bp=botProgress(),n=nQ(),ob=$('#ob'),ot=$('#ot'),next=`${bp}/${n} answered`;
  if(ob)ob.style.width=(n?bp/n*100:0)+'%';
  if(ot&&ot.textContent!==next){ot.textContent=next;ot.classList.remove('pop');void ot.offsetWidth;ot.classList.add('pop');}
 }
 if(left<=0){if(duel.section)expireSection();else answer(-1);}
}
function advance(){
 if(!duel)return;
 duel.i++;duel.qStart=Date.now();duel.sel=null;
 if(duel.i<duel.qs.length)render();else finish();
}
function answer(k){
 if(!duel||duel.busy||duel.closing)return;
 duel.busy=true;
 const q=duel.qs[duel.i],t=(Date.now()-duel.qStart)/1000,ok=k===q.a;
 duel.ans.push({k,ok,t});
 logAttempt(q,ok,t);
 save();
 const g=gen;
 const go=()=>{if(g!==gen||!duel)return;advance();};
 if(k<0){go();return;}
 const row=document.querySelector(`.ans[data-k="${k}"] .ch`);
 if(ok){if(row)row.classList.add('pulse-ok');soundOk();}
 else{if(row)row.classList.add('shake');soundBad();}
 const delay=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches?80:420;
 fxTimer=setTimeout(go,delay);
}
function recordDaily(me,mt){
 const day=today(),first=S.dailyLast!==day;
 if(first){S.dailyStreak=(S.dailyLast===prevDay(day))?(S.dailyStreak||0)+1:1;S.dailyLast=day;S.dailyBest={day,me,t:mt};}
 else if(!S.dailyBest||S.dailyBest.day!==day||me>S.dailyBest.me||(me===S.dailyBest.me&&mt<S.dailyBest.t))S.dailyBest={day,me,t:mt};
}
function challengeURL(qs,me,mt){
 const u=new URL(location.href);u.hash='';u.search='';
 u.searchParams.set('duel',qs.map(q=>QUESTIONS.indexOf(q)).join('.'));
 u.searchParams.set('me',String(me));
 u.searchParams.set('sec',mt.toFixed(1));
 u.searchParams.set('name',S.name.slice(0,20));
 return u.toString();
}
function friendFromParams(params){
 const ids=String(params.get('duel')||'').split('.').map(Number);
 if(!LENGTHS.includes(ids.length)||ids.some(n=>!Number.isInteger(n)||n<0||n>=QUESTIONS.length)||new Set(ids).size!==ids.length)return null;
 const me=Number(params.get('me')),sec=Number(params.get('sec'));
 if(!Number.isInteger(me)||me<0||me>ids.length||!Number.isFinite(sec)||sec<0)return null;
 let name=(params.get('name')||'Friend').replace(/\s+/g,' ').trim().slice(0,20);
 if(!name)name='Friend';
 return {qs:ids.map(i=>QUESTIONS[i]),me,sec,name};
}
function animateNum(el,from,to){
 const t0=performance.now(),dur=700;
 const step=now=>{
  if(!el.isConnected)return;
  const p=Math.min(1,(now-t0)/dur),eased=1-Math.pow(1-p,3);
  el.textContent=String(Math.round(from+(to-from)*eased));
  if(p<1)requestAnimationFrame(step);
 };
 requestAnimationFrame(step);
}
function finish(){
 if(!duel||duel.closing)return;
 duel.closing=true;
 clearInterval(tick);tick=null;
 const me=duel.ans.filter(a=>a.ok).length,mt=duel.ans.reduce((s,a)=>s+a.t,0);
 let score=null,op=0,ot=0,d=0,headline,sub,cards='',prevRating=S.rating;
 rememberRun(me,mt);
 if(duel.bot){
  op=duel.bot.filter(b=>b.ok).length;ot=duel.bot.reduce((s,b)=>s+b.t,0);
  score=me>op?1:me<op?0:(mt<ot?1:mt>ot?0:.5);
  if(duel.mode==='ranked'){
   const exp=1/(1+10**((duel.opp.r-S.rating)/400)),K=S.w+S.l<10?48:32;
   d=Math.round(K*(score-exp));S.rating+=d;if(score===1)S.w++;else if(score===0)S.l++;
   S.hist.push({opp:duel.opp.n,me,op,d,res:score===1?'W':score===0?'L':'D'});
   S.streak=score===1?(S.streak||0)+1:0;
   headline=score===1?'VICTORY':score===0?'DEFEAT':'DRAW';
   sub=`Rating <b id="elo" class="elo-num">${prevRating}</b> <b class="delta ${d>0?'up':d<0?'down':''}">${d>0?'+':''}${d}</b> · ${tierHTML(S.rating)}`;
  }else if(duel.mode==='share'){headline=score===1?'VICTORY':score===0?'DEFEAT':'DRAW';sub='Share the link. Rating unchanged.';}
  else if(duel.mode==='ai'){headline=score===1?'VICTORY':score===0?'DEFEAT':'DRAW';sub='Vs '+esc(duel.opp.n)+' · rating unchanged';}
  else if(duel.mode==='ghost'){
   headline=score===1?'YOU WIN':score===0?'YOU LOSE':'DRAW';
   const gap=me===op?(mt<ot?`Same score. You were ${(ot-mt).toFixed(1)}s faster.`:mt>ot?`Same score. Past you was ${(mt-ot).toFixed(1)}s faster.`:'Same score and the same time.'):(me>op?'You got more right.':'Past you got more right.');
   sub=`Against your past run · ${gap} Rating unchanged.`;
  }
  else{headline=score===1?'VICTORY':score===0?'DEFEAT':'DRAW';sub='Practice duel · rating unchanged';}
  cards=`<p class="scoreline"><b>${esc(S.name)}</b> ${me}/${nQ()} · ${mt.toFixed(1)}s<br><b>${esc(duel.opp.n)}</b> ${op}/${nQ()} · ${ot.toFixed(1)}s</p>`;
 }else if(duel.friend){
  op=duel.friend.me;ot=duel.friend.sec;
  score=me>op?1:me<op?0:(mt<ot?1:mt>ot?0:.5);
  headline=score===1?'YOU WIN':score===0?'YOU LOSE':'DRAW';
  sub=`Head to head with ${esc(duel.friend.name)}`;
  cards=`<p class="scoreline"><b>${esc(S.name)}</b> ${me}/${nQ()} · ${mt.toFixed(1)}s<br><b>${esc(duel.friend.name)}</b> ${op}/${nQ()} · ${ot.toFixed(1)}s</p>`;
 }else{
  recordDaily(me,mt);
  headline=`${me}/${nQ()}`;
  sub=`Daily result · ${mt.toFixed(1)}s · streak ${S.dailyStreak}`;
 }
 const before=new Set(S.badges);
 if(duel.mode==='ranked'&&score===1)give('first');
 if((S.streak||0)>=5)give('streak5');
 if(me===nQ()&&nQ()>0)give('perfect');
 if((S.dailyStreak||0)>=7&&S.dailyLast===today())give('daily7');
 const fresh=S.badges.filter(id=>!before.has(id));
 save();header();
 if(score===1)soundOk();else if(score===0)soundBad();
 const klass=score===1?'win':score===0?'loss':'';
 const again=duel.mode==='ranked'?'Rematch queue':duel.mode==='train'?'Train again':duel.mode==='daily'?'Play daily again':duel.mode==='share'?'New challenge set':duel.mode==='ai'?'Duel the AI again':duel.mode==='ghost'?'Race this run again':'Replay challenge';
 const url=challengeURL(duel.qs,me,mt);
 const groups=new Map();
 duel.qs.forEach((q,i)=>{const k=q.t||'Other';if(!groups.has(k))groups.set(k,[]);groups.get(k).push(i);});
 const review=[...groups].map(([type,idxs])=>{
  const body=idxs.map(i=>{const q=duel.qs[i],a=duel.ans[i]||{ok:false,k:-1,t:0};const yours=a.ok?'Correct':'You: '+(a.k<0?'timed out':'('+'ABCDE'[a.k]+')');const oppBit=duel.bot?` · opp ${duel.bot[i].ok?'✓':'✗'}`:'';return `<div class="rev ${a.ok?'':'x'}"><b>Q${i+1} · ${esc(q.t)}${q.d?' · D'+q.d:''}</b> — ${esc(yours)} · Answer (${'ABCDE'[q.a]}) · ${a.t.toFixed(1)}s${oppBit}<br><b class="pat">Pattern: ${esc(q.pattern)}</b><br><span class="muted">${esc(q.e)}</span></div>`;}).join('');
  return `<section class="revgroup"><h3>${esc(type)} · ${idxs.length}</h3>${body}</section>`;
 }).join('');
 show(`<div class="stage"><article class="result card"><p class="kicker">${esc(duel.label||'Result')}</p><h1 class="big ${klass}">${headline}</h1><p>${sub}</p>${fresh.length?`<p>Badge unlocked: ${fresh.map(id=>esc(BADGES.find(b=>b.id===id).name)).join(', ')}</p>`:''}${cards}<div class="actions"><button type="button" class="primary" id="again">${again}</button><button type="button" class="text" id="hm">Home</button></div></article><div class="card"><h2>Challenge a friend</h2><p class="muted">Same ${nQ()} questions, in the same order. They'll see your score and time.</p><input id="link" class="link" readonly value="${esc(url)}"><div class="actions"><button type="button" class="text" id="copy">Copy link</button></div></div><div class="card"><h2>Review</h2><div class="review-scroll">${review}</div></div></div>`);
 const elo=$('#elo');if(elo)animateNum(elo,prevRating,S.rating);
 if(me===nQ()&&nQ()>0)burst($('.result h1'));
 $('#again').onclick=()=>{const mode=duel.mode,qs=duel.qs,friend=duel.friend,ghostId=duel.ghostId;if(mode==='ranked')matchmake();else if(mode==='train')startTrain();else if(mode==='daily')startDaily();else if(mode==='share')startShare();else if(mode==='ai')startAI();else if(mode==='ghost'){const run=S.runs.find(r=>r.id===ghostId);if(run)startGhost(run);else ghostPage();}else begin({mode:'friend',label:'Friend challenge',qs,friend,section:useSection('friend')});};
 $('#hm').onclick=goHome;
 $('#copy').onclick=async()=>{const el=$('#link');try{await navigator.clipboard.writeText(el.value);$('#copy').textContent='Copied';}catch(e){el.focus();el.select();$('#copy').textContent='Select the link to copy';}};
}
function friendIntro(params){
 cancel();header();
 const ch=friendFromParams(params);
 if(!ch){goHome();return;}
 show(`<div class="stage card"><p class="kicker">Friend challenge</p><h1>${esc(ch.name)} challenged you.</h1><p class="lede">Same ${ch.qs.length} questions. ${esc(ch.name)} scored ${ch.me}/${ch.qs.length} in ${ch.sec.toFixed(1)}s. Accuracy wins; time breaks ties.</p><div class="actions"><button type="button" class="primary" id="accept">Accept challenge</button><button type="button" class="text" id="hm">Not now</button></div></div>`);
 $('#accept').onclick=()=>begin({mode:'friend',label:'Friend challenge',qs:ch.qs,friend:{name:ch.name,me:ch.me,sec:ch.sec},section:useSection('friend')});
 $('#hm').onclick=goHome;
}
function boot(){applyTheme();renderTheme();renderMute();save();const params=new URLSearchParams(location.search);if(params.get('duel'))friendIntro(params);else home();}
$('#logo').onclick=()=>goHome();
$('#theme').onclick=()=>{S.theme=S.theme==='dark'?'light':'dark';save();applyTheme();renderTheme();};
$('#mute').onclick=()=>{S.mute=!S.mute;save();renderMute();if(!S.mute)beep(660,.08,'sine',.03);};
boot();
