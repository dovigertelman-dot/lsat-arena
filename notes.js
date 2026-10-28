function parseNotes(md){
 const lines=String(md).replace(/\r\n/g,'\n').split('\n');
 let title='';
 const subs=[];
 const sections=[];
 let cur=null;
 function closeList(){
  if(cur&&cur._items){cur.blocks.push({type:'ul',items:cur._items});cur._items=null;}
 }
 function section(heading){
  closeList();
  const id='n'+(sections.length+1);
  cur={id,title:heading,blocks:[],_items:null};
  sections.push(cur);
 }
 for(const line of lines){
  if(line.trim()===''){closeList();continue;}
  if(line.startsWith('# ')){title=line.slice(2);continue;}
  if(line.startsWith('## ')){section(line.slice(3));continue;}
  if(/^\*[^*].*\*$/.test(line)&&!cur){subs.push(line.slice(1,-1));continue;}
  if(line.startsWith('|')){
   closeList();
   const cells=splitRow(line);
   if(cells.every(c=>/^:?-+:?$/.test(c)))continue;
   let table=cur.blocks.length&&cur.blocks[cur.blocks.length-1].type==='table'?cur.blocks[cur.blocks.length-1]:null;
   if(!table){table={type:'table',headers:null,rows:[]};cur.blocks.push(table);}
   if(!table.headers)table.headers=cells;
   else table.rows.push(cells);
   continue;
  }
  if(line.startsWith('- ')){
   if(!cur._items)cur._items=[];
   cur._items.push(line.slice(2));
   continue;
  }
  closeList();
  cur.blocks.push({type:'p',text:line});
 }
 closeList();
 sections.forEach(s=>delete s._items);
 return {title,subs,sections};
}
function splitRow(line){
 let s=line.trim();
 if(s.startsWith('|'))s=s.slice(1);
 if(s.endsWith('|'))s=s.slice(0,-1);
 return s.split('|').map(c=>c.trim());
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function renderNotes(root,doc){
 const toc=doc.sections.map(s=>`<li><a href="#${s.id}">${esc(s.title)}</a></li>`).join('');
 const cards=doc.sections.map(s=>{
  const body=s.blocks.map(b=>{
   if(b.type==='ul')return '<ul>'+b.items.map(t=>`<li>${esc(t)}</li>`).join('')+'</ul>';
   if(b.type==='p')return `<p>${esc(b.text)}</p>`;
   const head='<tr>'+b.headers.map(c=>`<th>${esc(c)}</th>`).join('')+'</tr>';
   const rows=b.rows.map(r=>'<tr>'+r.map(c=>`<td>${esc(c)}</td>`).join('')+'</tr>').join('');
   return `<div class="table-wrap"><table><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;
  }).join('');
  return `<article class="card" id="${s.id}"><h2>${esc(s.title)}</h2>${body}</article>`;
 }).join('');
 const sub=doc.subs[0]?`<p class="sub">${esc(doc.subs[0])}</p>`:'';
 const revised=doc.subs[1]?`<p class="revised">${esc(doc.subs[1])}</p>`:'';
 root.innerHTML=`<a class="back" href="index.html">Back to the arena</a><h1>${esc(doc.title)}</h1>${sub}${revised}<nav class="card toc" aria-label="Sections"><ol>${toc}</ol></nav>${cards}`;
}

async function bootNotes(){
 try{
  const raw=JSON.parse(localStorage.getItem('arena')||'{}');
  if(raw&&raw.theme==='dark')document.documentElement.dataset.theme='dark';
 }catch(e){}
 const root=document.getElementById('notes');
 try{
  const res=await fetch('notes-source.md');
  if(!res.ok)throw new Error(String(res.status));
  renderNotes(root,parseNotes(await res.text()));
 }catch(e){
  root.innerHTML='<p class="sub">The notes could not be loaded.</p>';
 }
}
if(typeof document!=='undefined'){
 if(document.getElementById('notes'))bootNotes();
}
if(typeof module!=='undefined')module.exports={parseNotes,splitRow};
