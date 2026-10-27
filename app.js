const $=s=>document.querySelector(s),app=$('#app');
const BOTS=[{n:'LogicLlama',r:1180,acc:.55,spd:70},{n:'FlawFinder',r:1320,acc:.68,spd:60},{n:'NecessaryNora',r:1450,acc:.78,spd:52},{n:'ContrapositiveKing',r:1580,acc:.86,spd:45},{n:'170Club',r:1720,acc:.93,spd:38},{n:'NewbieNate',r:1050,acc:.45,spd:85}];
const store={get:()=>JSON.parse(localStorage.getItem('arena')||'{"name":"You","rating":1200,"w":0,"l":0,"hist":[]}'),set:v=>localStorage.setItem('arena',JSON.stringify(v))};
let S=store.get(),duel=null,tick=null;
const PER=90; // seconds per question
function header(){$('#me').textContent=`${S.name} · ${Math.round(S.rating)} Elo · ${S.w}W-${S.l}L`}
function board(){const rows=[...BOTS.map(b=>({n:b.n,r:b.r})),{n:S.name+' (you)',r:S.rating,you:1}].sort((a,b)=>b.r-a.r);
 return '<table>'+rows.map((x,i)=>`<tr class="${x.you?'you':''}"><td>#${i+1}</td><td>${x.n}</td><td style="text-align:right">${Math.round(x.r)}</td></tr>`).join('')+'</table>'}
function home(){clearInterval(tick);header();app.innerHTML=`<div class="grid"><div class="card"><span class="tag">LOGICAL REASONING · RANKED</span><h1>Head-to-head LSAT duels.</h1><p class="muted">Same 5 LR questions, same clock. Beat your opponent on accuracy — speed breaks ties. Win to climb the ladder.</p><div class="stats"><div><div class="muted">Rating</div><div class="big" style="font-size:40px">${Math.round(S.rating)}</div></div><div><div class="muted">Record</div><div class="big" style="font-size:40px">${S.w}-${S.l}</div></div></div><br><button id="go">⚔️ Find Ranked Duel</button> <button class="ghost" id="nm">Change name</button></div><div class="card"><h2>🏆 Leaderboard</h2>${board()}</div></div>
<div class="card"><h2>Recent matches</h2>${S.hist.length?S.hist.slice(-5).reverse().map(h=>`<div class="muted">${h.res==='W'?'✅':h.res==='L'?'❌':'➖'} vs ${h.opp} · ${h.me}/5 vs ${h.op}/5 · ${h.d>0?'+':''}${h.d}</div>`).join(''):'<p class="muted">No matches yet.</p>'}</div>`;
 $('#go').onclick=matchmake;$('#nm').onclick=()=>{const n=prompt('Display name',S.name);if(n){S.name=n.slice(0,20);store.set(S);home()}}}
function matchmake(){app.innerHTML=`<div class="card" style="text-align:center"><h2>Searching for opponent…</h2><p class="muted">Matching near ${Math.round(S.rating)} Elo</p></div>`;
 const opp=[...BOTS].sort((a,b)=>Math.abs(a.r-S.rating)-Math.abs(b.r-S.rating))[Math.floor(Math.random()*2)];
 const qs=[...QUESTIONS].sort(()=>Math.random()-.5).slice(0,5);
 const bot=qs.map(()=>({ok:Math.random()<opp.acc,t:Math.max(12,opp.spd*(0.6+Math.random()*0.8))}));
 setTimeout(()=>start({opp,qs,bot}),1200)}
function start(d){duel={...d,i:0,ans:[],t0:Date.now(),qStart:Date.now(),botDone:0};render();tick=setInterval(update,250)}
function botProgress(){let el=(Date.now()-duel.t0)/1000,c=0,acc=0;for(const b of duel.bot){acc+=b.t;if(el>=acc)c++;else break}return c}
function update(){const left=PER-Math.floor((Date.now()-duel.qStart)/1000),t=$('#tm');if(t){t.textContent=`${Math.floor(Math.max(0,left)/60)}:${String(Math.max(0,left)%60).padStart(2,'0')}`;t.className='timer'+(left<=15?' low':'')}
 const bp=botProgress();$('#ob').style.width=bp*20+'%';$('#ot').textContent=`${bp}/5 answered`;if(left<=0)answer(-1)}
function render(){const q=duel.qs[duel.i];app.innerHTML=`<div class="card"><div class="players"><div class="pl"><b>${S.name}</b> <span class="muted">${Math.round(S.rating)}</span><div class="bar"><i style="width:${duel.i*20}%"></i></div><span class="muted">${duel.i}/5 answered</span></div><div class="pl"><b>${duel.opp.n}</b> <span class="muted">${duel.opp.r}</span><div class="bar opp"><i id="ob" style="width:0"></i></div><span class="muted" id="ot">0/5</span></div></div></div>
<div class="card"><span class="tag">Q${duel.i+1}/5 · ${q.t}</span><span class="timer" id="tm">1:30</span><div class="stim">${q.s}</div><div class="stem">${q.q}</div>${q.c.map((c,k)=>`<button class="ch" data-k="${k}"><b>(${'ABCDE'[k]})</b> ${c}</button>`).join('')}</div>`;
 document.querySelectorAll('.ch').forEach(b=>b.onclick=()=>answer(+b.dataset.k));update()}
function answer(k){const q=duel.qs[duel.i];duel.ans.push({k,ok:k===q.a,t:(Date.now()-duel.qStart)/1000});duel.i++;duel.qStart=Date.now();if(duel.i<5)render();else finish()}
function finish(){clearInterval(tick);const me=duel.ans.filter(a=>a.ok).length,mt=duel.ans.reduce((s,a)=>s+a.t,0),op=duel.bot.filter(b=>b.ok).length,ot=duel.bot.reduce((s,b)=>s+b.t,0);
 const score=me>op?1:me<op?0:(mt<ot?1:mt>ot?0:.5);const exp=1/(1+10**((duel.opp.r-S.rating)/400)),K=S.w+S.l<10?48:32,d=Math.round(K*(score-exp));
 S.rating+=d;score===1?S.w++:score===0?S.l++:0;S.hist.push({opp:duel.opp.n,me,op,d,res:score===1?'W':score===0?'L':'D'});store.set(S);header();
 app.innerHTML=`<div class="card" style="text-align:center"><div class="big ${score===1?'win':score===0?'loss':''}">${score===1?'VICTORY':score===0?'DEFEAT':'DRAW'}</div><p>Rating ${Math.round(S.rating)} (<b>${d>0?'+':''}${d}</b>)</p>
<div class="players" style="text-align:left"><div class="card"><h2>${S.name}</h2><div class="big" style="font-size:36px">${me}/5</div><div class="muted">${mt.toFixed(1)}s total · ${(mt/5).toFixed(1)}s avg</div></div><div class="card"><h2>${duel.opp.n}</h2><div class="big" style="font-size:36px">${op}/5</div><div class="muted">${ot.toFixed(1)}s total · ${(ot/5).toFixed(1)}s avg</div></div></div>
<button id="again">⚔️ Rematch queue</button> <button class="ghost" id="hm">Home</button></div>
<div class="card"><h2>Review</h2>${duel.qs.map((q,i)=>{const a=duel.ans[i];return `<div class="rev ${a.ok?'':'x'}"><b>Q${i+1} · ${q.t}</b> — ${a.ok?'Correct':'You: '+(a.k<0?'timed out':'('+'ABCDE'[a.k]+')')} · Answer (${'ABCDE'[q.a]}) · ${a.t.toFixed(1)}s · opp ${duel.bot[i].ok?'✓':'✗'}<br><span class="muted">${q.e}</span></div>`}).join('')}</div>`;
 $('#again').onclick=matchmake;$('#hm').onclick=home}
home();
