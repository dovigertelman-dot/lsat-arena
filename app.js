const $=s=>document.querySelector(s),app=$('#app');
const BOTS=[{n:'LogicLlama',r:1180,acc:.55,spd:70},{n:'FlawFinder',r:1320,acc:.68,spd:60},{n:'NecessaryNora',r:1450,acc:.78,spd:52},{n:'ContrapositiveKing',r:1580,acc:.86,spd:45},{n:'170Club',r:1720,acc:.93,spd:38},{n:'NewbieNate',r:1050,acc:.45,spd:85}];
const BADGES=[
 {id:'first',name:'First win',desc:'Win a ranked duel'},
 {id:'streak5',name:'5-streak',desc:'Win 5 ranked duels in a row'},
 {id:'perfect',name:'Perfect 5/5',desc:'Get every question right in a set'},
 {id:'daily7',name:'7-day streak',desc:'Finish the daily challenge 7 days running'}
];
const PER=90,COUNT_FRAMES=['3','2','1','Go'];
let S=load(),duel=null,tick=null,wait=null,gen=0;

function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function blank(){return {name:'You',rating:1200,w:0,l:0,hist:[],attempts:[],streak:0,badges:[],dailyLast:'',dailyStreak:0,dailyBest:null};}
function load(){
 let raw={};
 try{raw=JSON.parse(localStorage.getItem('arena')||'{}')||{};}catch(e){raw={};}
 const s=Object.assign(blank(),raw);
 if(!Array.isArray(s.hist))s.hist=[];
 if(!Array.isArray(s.attempts))s.attempts=[];
 if(!Array.isArray(s.badges))s.badges=[];
 if(typeof s.name!=='string'||!s.name.trim())s.name='You';
 s.name=s.name.trim().slice(0,20);
 return s;
}
function save(){try{localStorage.setItem('arena',JSON.stringify(S));}catch(e){}}
function tierName(r){r=Math.round(Number(r)||0);if(r>=1900)return 'Diamond';if(r>=1700)return 'Platinum';if(r>=1500)return 'Gold';if(r>=1300)return 'Silver';return 'Bronze';}
function tierHTML(r){const t=tierName(r);return `<span class="tier ${t.toLowerCase()}">${t}</span>`;}
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
function cancel(){gen++;clearInterval(tick);tick=null;clearTimeout(wait);wait=null;}
function header(){$('#me').innerHTML=`${esc(S.name)} · ${tierHTML(S.rating)} · ${Math.round(S.rating)} Elo · ${S.w}W-${S.l}L`;}
function board(){
 const rows=[...BOTS.map(b=>({n:b.n,r:b.r})),{n:S.name+' (you)',r:S.rating,you:1}].sort((a,b)=>b.r-a.r);
 return '<table>'+rows.map((x,i)=>`<tr class="${x.you?'you':''}"><td>#${i+1}</td><td>${esc(x.n)}</td><td>${tierHTML(x.r)}</td><td style="text-align:right">${Math.round(x.r)}</td></tr>`).join('')+'</table>';
}
function badgesHTML(){return `<div class="badges">${BADGES.map(b=>`<div class="badge ${S.badges.includes(b.id)?'on':''}"><b>${esc(b.name)}</b><span class="muted">${esc(b.desc)}</span></div>`).join('')}</div>`;}
function goHome(){if(location.search)history.replaceState(null,'',location.pathname);home();}
function home(){
 cancel();duel=null;header();
 const best=S.dailyBest&&S.dailyBest.day===today()?` · today ${S.dailyBest.me}/5`:'';
 app.innerHTML=`<div class="grid"><div class="card"><span class="tag">LOGICAL REASONING · RANKED</span><h1>Head-to-head LSAT duels.</h1><p class="muted">Same 5 LR questions, same clock. Beat your opponent on accuracy — speed breaks ties. Win to climb the ladder.</p><div class="stats"><div><div class="muted">Rating</div><div class="big" style="font-size:40px">${Math.round(S.rating)}</div><div class="muted">${tierHTML(S.rating)}</div></div><div><div class="muted">Record</div><div class="big" style="font-size:40px">${S.w}-${S.l}</div></div></div><p class="muted">${esc('Daily streak: '+shownStreak()+best)}</p><div class="actions"><button id="go">⚔️ Find Ranked Duel</button><button id="daily" class="ghost">📅 Daily challenge</button><button id="stats" class="ghost">Pattern stats</button><button id="nm" class="ghost">Change name</button></div></div><div class="card"><h2>🏆 Leaderboard</h2>${board()}</div></div>
<div class="card"><h2>Badges</h2>${badgesHTML()}</div>
<div class="card"><h2>Recent matches</h2>${S.hist.length?S.hist.slice(-5).reverse().map(h=>`<div class="muted">${h.res==='W'?'✅':h.res==='L'?'❌':'➖'} vs ${esc(h.opp)} · ${h.me}/5 vs ${h.op}/5 · ${h.d>0?'+':''}${h.d}</div>`).join(''):'<p class="muted">No matches yet.</p>'}</div>`;
 $('#go').onclick=matchmake;$('#daily').onclick=startDaily;$('#stats').onclick=statsPage;
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
function trainQuestions(){
 const rows=patternRows().filter(r=>r.n>0).sort((a,b)=>a.acc-b.acc||b.avg-a.avg);
 const pool=[];
 for(const r of rows){for(const q of QUESTIONS)if(q.pattern===r.p)pool.push(q);if(pool.length>=5)break;}
 const src=[];
 for(const q of pool)if(!src.includes(q))src.push(q);
 if(src.length<5){for(const q of shuffle(QUESTIONS))if(!src.includes(q)){src.push(q);if(src.length>=5)break;}}
 return shuffle(src).slice(0,5);
}
function statsPage(){
 cancel();duel=null;header();
 const rows=patternRows().sort((a,b)=>((a.n===0)-(b.n===0))||((a.acc??1)-(b.acc??1))||((b.avg||0)-(a.avg||0)));
 const weak=weakSet(rows),played=rows.some(r=>r.n>0);
 const body=rows.map(r=>`<tr class="${weak.has(r.p)?'weak':''}"><td>${esc(r.p)}${weak.has(r.p)?' · weak spot':''}</td><td>${r.n}</td><td>${r.n?Math.round(r.acc*100)+'%':'—'}</td><td>${r.n?r.avg.toFixed(1)+'s':'—'}</td></tr>`).join('');
 app.innerHTML=`<div class="card"><h1>Pattern stats</h1><p class="muted">Accuracy and average time from answers saved in this browser. Weak spots are your lowest patterns.</p><table><tr><td>Pattern</td><td>Tries</td><td>Accuracy</td><td>Avg time</td></tr>${body}</table><div class="actions"><button id="train"${played?'':' disabled'}>Train weak spots</button><button class="ghost" id="hm">Home</button></div></div>`;
 if(played)$('#train').onclick=startTrain;
 $('#hm').onclick=goHome;
}
function pickOpp(){return [...BOTS].sort((a,b)=>Math.abs(a.r-S.rating)-Math.abs(b.r-S.rating))[Math.floor(Math.random()*2)];}
function makeBot(qs,opp){return qs.map(()=>({ok:Math.random()<opp.acc,t:Math.max(12,opp.spd*(0.6+Math.random()*0.8))}));}
function matchmake(){
 cancel();
 app.innerHTML=`<div class="card" style="text-align:center"><h2>Searching for opponent…</h2><p class="muted">Matching near ${Math.round(S.rating)} Elo</p></div>`;
 const g=gen;
 wait=setTimeout(()=>{if(g!==gen)return;const opp=pickOpp(),qs=shuffle(QUESTIONS).slice(0,5);begin({mode:'ranked',label:'Ranked duel',opp,qs,bot:makeBot(qs,opp)});},1200);
}
function startTrain(){const qs=trainQuestions(),opp=pickOpp();begin({mode:'train',label:'Weak-spot duel',opp,qs,bot:makeBot(qs,opp)});}
function startDaily(){const qs=dailyIds(today()).map(i=>QUESTIONS[i]);begin({mode:'daily',label:'Daily challenge · '+today()+' UTC',qs});}
function countdown(label,done){
 const g=++gen;clearInterval(tick);tick=null;let i=0;
 const step=()=>{
  if(g!==gen)return;
  if(i>=COUNT_FRAMES.length){done();return;}
  const word=COUNT_FRAMES[i++];
  app.innerHTML=`<div class="card count"><div class="big">${word}</div><p class="muted">${esc(label)}</p></div>`;
  wait=setTimeout(step,word==='Go'?650:1000);
 };
 step();
}
function begin(opts){countdown(opts.label,()=>start(opts));}
function start(opts){
 duel={mode:opts.mode,label:opts.label,opp:opts.opp||null,qs:opts.qs,bot:opts.bot||null,friend:opts.friend||null,i:0,ans:[],t0:Date.now(),qStart:Date.now(),sel:null,busy:false};
 render();tick=setInterval(update,250);
}
function playersHTML(){
 const mine=`<div class="pl"><b>${esc(S.name)}</b> <span class="muted">${Math.round(S.rating)} ${tierHTML(S.rating)}</span><div class="bar"><i style="width:${duel.i*20}%"></i></div><span class="muted">${duel.i}/5 answered</span></div>`;
 let other;
 if(duel.bot)other=`<div class="pl"><b>${esc(duel.opp.n)}</b> <span class="muted">${duel.opp.r} ${tierHTML(duel.opp.r)}</span><div class="bar opp"><i id="ob" style="width:0"></i></div><span class="muted" id="ot">0/5 answered</span></div>`;
 else if(duel.friend)other=`<div class="pl"><b>${esc(duel.friend.name)}</b> <span class="muted">to beat</span><div class="bar opp"><i style="width:${duel.friend.me*20}%"></i></div><span class="muted">${duel.friend.me}/5 · ${duel.friend.sec.toFixed(1)}s</span></div>`;
 else other=`<div class="pl"><b>Daily</b> <span class="muted">${esc(today())} UTC</span><div class="bar opp"><i style="width:100%"></i></div><span class="muted">Streak ${shownStreak()}</span></div>`;
 return `<div class="card"><div class="players">${mine}${other}</div></div>`;
}
function render(){
 duel.busy=false;duel.sel=null;
 const q=duel.qs[duel.i];
 app.innerHTML=playersHTML()+`<div class="card"><span class="tag">Q${duel.i+1}/5 · ${esc(q.t)}</span><span class="timer" id="tm">1:30</span><div class="stim">${esc(q.s)}</div><div class="stem">${esc(q.q)}</div><p class="muted hint">Tap an answer to select it, then tap it again to submit.</p>${q.c.map((c,k)=>`<div class="ans" data-k="${k}"><button type="button" class="ch" data-k="${k}"><b>(${'ABCDE'[k]})</b> ${esc(c)}</button><button type="button" class="xx" hidden aria-label="Deselect">×</button></div>`).join('')}</div>`;
 document.querySelectorAll('.ans').forEach(row=>{
  const k=+row.dataset.k;
  row.querySelector('.ch').onclick=()=>{if(!duel||duel.busy)return;if(duel.sel===k)answer(k);else{duel.sel=k;paintSel();}};
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
function update(){
 if(!duel)return;
 const left=PER-Math.floor((Date.now()-duel.qStart)/1000),t=$('#tm');
 if(t){t.textContent=fmt(left);t.className='timer'+(left<=15?' low':'');}
 if(duel.bot){const bp=botProgress(),ob=$('#ob'),ot=$('#ot');if(ob)ob.style.width=bp*20+'%';if(ot)ot.textContent=`${bp}/5 answered`;}
 if(left<=0)answer(-1);
}
function answer(k){
 if(!duel||duel.busy)return;
 duel.busy=true;
 const q=duel.qs[duel.i],t=(Date.now()-duel.qStart)/1000,ok=k===q.a;
 duel.ans.push({k,ok,t});
 S.attempts.push({p:q.pattern,ok:ok?1:0,t});
 if(S.attempts.length>400)S.attempts.splice(0,S.attempts.length-400);
 save();
 duel.i++;duel.qStart=Date.now();duel.sel=null;
 if(duel.i<5)render();else finish();
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
 if(ids.length!==5||ids.some(n=>!Number.isInteger(n)||n<0||n>=QUESTIONS.length)||new Set(ids).size!==5)return null;
 const me=Number(params.get('me')),sec=Number(params.get('sec'));
 if(!Number.isInteger(me)||me<0||me>5||!Number.isFinite(sec)||sec<0)return null;
 let name=(params.get('name')||'Friend').replace(/\s+/g,' ').trim().slice(0,20);
 if(!name)name='Friend';
 return {qs:ids.map(i=>QUESTIONS[i]),me,sec,name};
}
function finish(){
 clearInterval(tick);tick=null;
 const me=duel.ans.filter(a=>a.ok).length,mt=duel.ans.reduce((s,a)=>s+a.t,0);
 let score=null,op=0,ot=0,d=0,headline,sub,cards='';
 if(duel.bot){
  op=duel.bot.filter(b=>b.ok).length;ot=duel.bot.reduce((s,b)=>s+b.t,0);
  score=me>op?1:me<op?0:(mt<ot?1:mt>ot?0:.5);
  if(duel.mode==='ranked'){
   const exp=1/(1+10**((duel.opp.r-S.rating)/400)),K=S.w+S.l<10?48:32;
   d=Math.round(K*(score-exp));S.rating+=d;if(score===1)S.w++;else if(score===0)S.l++;
   S.hist.push({opp:duel.opp.n,me,op,d,res:score===1?'W':score===0?'L':'D'});
   S.streak=score===1?(S.streak||0)+1:0;
   headline=score===1?'VICTORY':score===0?'DEFEAT':'DRAW';
   sub=`Rating ${Math.round(S.rating)} (<b>${d>0?'+':''}${d}</b>) · ${tierHTML(S.rating)}`;
  }else{headline=score===1?'VICTORY':score===0?'DEFEAT':'DRAW';sub='Practice duel · rating unchanged';}
  cards=`<div class="players" style="text-align:left"><div class="card"><h2>${esc(S.name)}</h2><div class="big" style="font-size:36px">${me}/5</div><div class="muted">${mt.toFixed(1)}s total · ${(mt/5).toFixed(1)}s avg</div></div><div class="card"><h2>${esc(duel.opp.n)}</h2><div class="big" style="font-size:36px">${op}/5</div><div class="muted">${ot.toFixed(1)}s total · ${(ot/5).toFixed(1)}s avg</div></div></div>`;
 }else if(duel.friend){
  op=duel.friend.me;ot=duel.friend.sec;
  score=me>op?1:me<op?0:(mt<ot?1:mt>ot?0:.5);
  headline=score===1?'YOU WIN':score===0?'YOU LOSE':'DRAW';
  sub=`Head to head with ${esc(duel.friend.name)}`;
  cards=`<div class="players" style="text-align:left"><div class="card"><h2>${esc(S.name)}</h2><div class="big" style="font-size:36px">${me}/5</div><div class="muted">${mt.toFixed(1)}s total</div></div><div class="card"><h2>${esc(duel.friend.name)}</h2><div class="big" style="font-size:36px">${op}/5</div><div class="muted">${ot.toFixed(1)}s total</div></div></div>`;
 }else{
  recordDaily(me,mt);
  headline=`${me}/5`;
  sub=`Daily result · ${mt.toFixed(1)}s · streak ${S.dailyStreak}`;
 }
 const before=new Set(S.badges);
 if(duel.mode==='ranked'&&score===1)give('first');
 if((S.streak||0)>=5)give('streak5');
 if(me===5)give('perfect');
 if((S.dailyStreak||0)>=7&&S.dailyLast===today())give('daily7');
 const fresh=S.badges.filter(id=>!before.has(id));
 save();header();
 const klass=score===1?'win':score===0?'loss':'';
 const again=duel.mode==='ranked'?'⚔️ Rematch queue':duel.mode==='train'?'Train again':duel.mode==='daily'?'Play daily again':'Replay challenge';
 const url=challengeURL(duel.qs,me,mt);
 const review=duel.qs.map((q,i)=>{const a=duel.ans[i];const yours=a.ok?'Correct':'You: '+(a.k<0?'timed out':'('+'ABCDE'[a.k]+')');const oppBit=duel.bot?` · opp ${duel.bot[i].ok?'✓':'✗'}`:'';return `<div class="rev ${a.ok?'':'x'}"><b>Q${i+1} · ${esc(q.t)}</b> — ${esc(yours)} · Answer (${'ABCDE'[q.a]}) · ${a.t.toFixed(1)}s${oppBit}<br><b class="pat">Pattern: ${esc(q.pattern)}</b><br><span class="muted">${esc(q.e)}</span></div>`;}).join('');
 app.innerHTML=`<div class="card" style="text-align:center"><div class="big ${klass}">${headline}</div><p>${sub}</p>${fresh.length?`<p>Badge unlocked: ${fresh.map(id=>esc(BADGES.find(b=>b.id===id).name)).join(', ')}</p>`:''}${cards}<div class="actions" style="justify-content:center"><button id="again">${again}</button><button class="ghost" id="hm">Home</button></div></div>
<div class="card"><h2>Challenge a friend</h2><p class="muted">Same five questions. They'll see your score and time.</p><input id="link" class="link" readonly value="${esc(url)}"><div class="actions"><button id="copy" class="ghost">Copy link</button></div></div>
<div class="card"><h2>Review</h2>${review}</div>`;
 $('#again').onclick=()=>{if(duel.mode==='ranked')matchmake();else if(duel.mode==='train')startTrain();else if(duel.mode==='daily')startDaily();else begin({mode:'friend',label:'Friend challenge',qs:duel.qs,friend:duel.friend});};
 $('#hm').onclick=goHome;
 $('#copy').onclick=async()=>{const el=$('#link');try{await navigator.clipboard.writeText(el.value);$('#copy').textContent='Copied';}catch(e){el.focus();el.select();$('#copy').textContent='Select the link to copy';}};
}
function friendIntro(params){
 cancel();header();
 const ch=friendFromParams(params);
 if(!ch){goHome();return;}
 app.innerHTML=`<div class="card"><span class="tag">FRIEND CHALLENGE</span><h1>${esc(ch.name)} challenged you.</h1><p class="muted">Same 5 questions. ${esc(ch.name)} scored ${ch.me}/5 in ${ch.sec.toFixed(1)}s. Accuracy wins; time breaks ties.</p><div class="actions"><button id="accept">Accept challenge</button><button class="ghost" id="hm">Not now</button></div></div>`;
 $('#accept').onclick=()=>begin({mode:'friend',label:'Friend challenge',qs:ch.qs,friend:{name:ch.name,me:ch.me,sec:ch.sec}});
 $('#hm').onclick=goHome;
}
function boot(){const params=new URLSearchParams(location.search);if(params.get('duel'))friendIntro(params);else home();}
$('#logo').onclick=()=>goHome();
boot();
