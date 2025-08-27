
/* === KEYS & CONFIG === */
const STORAGE_KEY='lingualite_state_v35';
const ELO_KEY='lingualite_elo_v35';
const DEFAULT_ELO=1200, K=16, MIN_ELO=800, MAX_ELO=1600;
const DISTRACTOR_POOL=['og','ikke','lidt','meget','hvad','hvem','hvordan','hvor','her','der','i dag','i morgen','ven','bil','hus','bog','kaffe','brød','skole','arbejde','byen','taler','forstår','kommer','fra','jeg','du','han','hun','vi','de','er','har','kan','vil','med','uden','til','fra','på'];
const DECK_PATHS=['decks.json','./decks.json','data/decks.json','./data/decks.json'];

/* === STATE === */
function loadJSON(key, fallback){ try{ const raw=localStorage.getItem(key); return raw?JSON.parse(raw):fallback; }catch(e){ return fallback; } }
function saveJSON(key, obj){ localStorage.setItem(key, JSON.stringify(obj)); }
let STATE=loadJSON(STORAGE_KEY,{decks:null});
let ELO=loadJSON(ELO_KEY,{decks:{}, cards:{}, user:DEFAULT_ELO});
let decks=STATE.decks;
let currentDeck=null;
let currentMode='multiple';
let mixedMode=false;
let toggleNext='sentence';
let sessionQueue=[];
let currentCard=null;
let score=0, wrongStreak=0;
let busy=false;

/* === FETCH === */
async function tryFetch(path){
  const controller=new AbortController();
  const id=setTimeout(()=>controller.abort(),6000);
  try{
    const res=await fetch(path+'?v='+(Date.now()),{cache:'no-store',signal:controller.signal});
    if(!res.ok) throw new Error('HTTP '+res.status);
    return await res.json();
  }finally{ clearTimeout(id); }
}
async function loadExternalDecks(){
  for(const p of DECK_PATHS){
    try{
      const data=await tryFetch(p);
      if(data && Array.isArray(data.decks)) return data.decks;
    }catch(e){}
  }
  const box=document.getElementById('deckError');
  if(box){ box.style.display='block'; box.textContent='Hinweis: Konnte decks.json nicht laden – nutze integrierte Decks (falls gebündelt).'; }
  return [];
}

/* === UI HELPERS === */
function updateMeters(){
  document.getElementById('scoreBox').textContent='Punkte: '+score;
  const dName=currentDeck?currentDeck.name:null;
  const dElo=dName? (ELO.decks[dName]??DEFAULT_ELO) : '—';
  document.getElementById('deckElo').textContent='Deck‑Elo: '+dElo;
}
function showSection(id){
  if(id==='learn'&&!currentDeck){alert('Bitte zuerst ein Deck unter „Decks“ auswählen.'); return;}
  document.querySelectorAll('.section').forEach(s=>s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}
function renderDecks(){
  const cont=document.getElementById('deckList'); cont.textContent='';
  const learnBtn=document.getElementById('learnBtn'); learnBtn.classList.add('hidden');
  if(!decks || decks.length===0){ const info=document.createElement('div'); info.className='card'; info.innerHTML='Keine Decks gefunden.'; cont.appendChild(info); return; }
  const frag=document.createDocumentFragment();
  decks.forEach((d,idx)=>{ const el=document.createElement('div'); el.className='card'; el.dataset.index=idx; el.textContent=(d.name||'Deck')+' ('+(d.cards?d.cards.length:0)+' Karten)'; frag.appendChild(el); });
  cont.appendChild(frag);
  cont.onclick=(e)=>{ const el=e.target.closest('.card'); if(!el) return; const idx=+el.dataset.index; currentDeck=decks[idx]; document.querySelectorAll('.deckList .card').forEach(c=>c.classList.remove('selected')); el.classList.add('selected'); learnBtn.classList.remove('hidden'); updateMeters(); };
}

/* === ELO & SCORE === */
function getUserElo(){ return ELO.user??DEFAULT_ELO; }
function setUserElo(v){ ELO.user=clamp(v); }
function getCardElo(id){ return ELO.cards[id]??DEFAULT_ELO; }
function setCardElo(id,v){ ELO.cards[id]=clamp(v); }
function clamp(x){ return Math.max(MIN_ELO, Math.min(MAX_ELO, Math.round(x))); }
function eloUpdate(a,b,scoreA){ const expectedA=1/(1+Math.pow(10,(b-a)/400)); const newA=a+K*(scoreA-expectedA); const newB=b+K*((1-scoreA)-(1-expectedA)); return {newA,newB}; }
function hashId(deckName, front, back){ // fast djb2
  let str=deckName+'::'+(front||'')+'::'+(back||''), h=5381;
  for(let i=0;i<str.length;i++){ h=((h<<5)+h)+str.charCodeAt(i); h|=0; }
  return (h>>>0).toString(16);
}

/* === SESSION === */
function startLearning(){
  if(busy) return;
  if(!currentDeck){ alert('Bitte Deck wählen'); return; }
  busy=true;
  currentMode=document.getElementById('modeSelect').value;
  mixedMode=!!currentDeck.autoMixed;
  toggleNext='sentence';
  score=0; wrongStreak=0; updateMeters();
  if(ELO.decks[currentDeck.name]==null) ELO.decks[currentDeck.name]=DEFAULT_ELO;

  const cards=currentDeck.cards||[];
  const chunk=500;
  sessionQueue=[];
  let i=0;
  function step(){
    const end=Math.min(i+chunk,cards.length);
    for(let k=i;k<end;k++){
      const c=cards[k];
      const id=hashId(currentDeck.name,c.front,c.back);
      sessionQueue.push({...c,_id:id});
    }
    i=end;
    if(i<cards.length){ setTimeout(step,0); return; }
    // sort by card elo desc; light shuffle windows
    sessionQueue.sort((a,b)=> (getCardElo(b._id)-getCardElo(a._id)));
    for(let t=0;t<sessionQueue.length;t+=25){
      const slice=sessionQueue.slice(t,t+25);
      slice.sort(()=>Math.random()-.5);
      sessionQueue.splice(t,slice.length,...slice);
    }
    busy=false;
    nextCard();
  }
  step();
}

function nextCard(){
  const area=document.getElementById('learningArea');
  area.textContent='';
  if(sessionQueue.length===0){
    area.innerHTML='<div class="card">Fertig! 🎉 Punkte: '+score+' — Deck‑Elo: '+ELO.decks[currentDeck.name]+'</div>';
    saveJSON(ELO_KEY,ELO); return;
  }
  currentCard=sessionQueue.shift();

  let mode=currentMode;
  if(mixedMode){
    const words=(String(currentCard.back||'').trim().split(/\s+/)).length;
    if(toggleNext==='sentence' && words>1) mode='sentence'; else mode='multiple';
    toggleNext=(toggleNext==='sentence'?'multiple':'sentence');
  }

  requestAnimationFrame(()=>{
    if(mode==='flashcards') showFlashcard(area);
    else if(mode==='sentence') showSentence(area);
    else showMultiple(area);
  });
}

function onAnswer(ok){
  if(ok){ score+=1; wrongStreak=0; } else { wrongStreak+=1; if(wrongStreak>=2){ score=Math.max(0,score-1); wrongStreak=0; } }
  const user=getUserElo(); const card=getCardElo(currentCard._id); const deck=ELO.decks[currentDeck.name];
  const {newA:user2,newB:card2}=eloUpdate(user,card, ok?1:0);
  const {newA:deck2}=eloUpdate(deck,user, ok?0:1);
  setUserElo(user2); setCardElo(currentCard._id, card2); ELO.decks[currentDeck.name]=deck2;
  updateMeters();
  if(ok){ const offset=6+Math.floor(Math.random()*2); sessionQueue.splice(Math.min(offset,sessionQueue.length),0,currentCard); } else { sessionQueue.splice(1,0,currentCard); }
  saveJSON(ELO_KEY,ELO);
}

/* === UI helpers for modes === */
function mkBtn(label,cls,cb){ const b=document.createElement('button'); b.textContent=label; if(cls)b.className=cls; b.addEventListener('click',cb); return b; }
function pushResultAndAwaitNext(area, ok, msgOk='✅ Richtig!', msgFail='❌ Falsch!'){
  onAnswer(ok);
  const fb=document.createElement('div'); fb.className='feedback'; fb.innerHTML=ok?msgOk:msgFail+' Richtige Lösung: <b>'+currentCard.back+'</b>'; area.appendChild(fb);
  const bar=document.createElement('div'); bar.className='action-bar'; bar.appendChild(mkBtn('Weiter','primary next',nextCard)); area.appendChild(bar);
}

/* Flashcards */
function showFlashcard(area){
  const front=(currentCard.front||'').toString(); const back=(currentCard.back||'').toString();
  const card=document.createElement('div'); card.className='card'; card.textContent=front; area.appendChild(card);
  const bar=document.createElement('div'); bar.className='action-bar';
  bar.appendChild(mkBtn('Antwort zeigen','primary go reveal',()=>{
    const fb=document.createElement('div'); fb.className='feedback'; fb.innerHTML='Richtig: <b>'+back+'</b>'; area.appendChild(fb);
    const inner=document.createElement('div'); inner.className='action-bar';
    inner.appendChild(mkBtn('Richtig','primary go',()=>pushResultAndAwaitNext(area,true)));
    inner.appendChild(mkBtn('Falsch','primary go',()=>pushResultAndAwaitNext(area,false)));
    area.appendChild(inner);
  }));
  bar.appendChild(mkBtn('Skip','skip',()=>{ sessionQueue.push(currentCard); nextCard(); }));
  area.appendChild(bar);
}

/* Multiple Choice */
function showMultiple(area){
  const front=(currentCard.front||'').toString(); const back=(currentCard.back||'').toString();
  const pool=currentDeck.cards||[];
  const opts=[back]; const seen=new Set(opts);
  while(opts.length<4 && pool.length>opts.length){
    const c=(pool[Math.floor(Math.random()*pool.length)].back||'').toString();
    if(c && !seen.has(c)){ opts.push(c); seen.add(c); }
  }
  while(opts.length<4){
    const c=DISTRACTOR_POOL[Math.floor(Math.random()*DISTRACTOR_POOL.length)];
    if(!seen.has(c)){ opts.push(c); seen.add(c); }
  }
  opts.sort(()=>Math.random()-.5);
  const card=document.createElement('div'); card.className='card'; card.textContent=front; area.appendChild(card);
  const grid=document.createElement('div'); grid.className='action-bar';
  opts.forEach(o=> grid.appendChild(mkBtn(o,'primary go',()=>{ const ok=(o===back); pushResultAndAwaitNext(area, ok); })));
  area.appendChild(grid);
  const bar=document.createElement('div'); bar.className='action-bar'; bar.appendChild(mkBtn('Skip','skip',()=>{ sessionQueue.push(currentCard); nextCard(); })); area.appendChild(bar);
}

/* Sentence Puzzle */
const PUNC=/[.,!?;:()\[\]\\"“”„'«»]/g;
function normalize(s){ return s.toLowerCase().replace(PUNC,'').replace(/\s+/g,' ').trim(); }
function levenshtein(a,b){const m=a.length,n=b.length;if(m===0)return n;if(n===0)return m;const dp=new Array((m+1)*(n+1));const I=(i,j)=>i*(n+1)+j;for(let i=0;i<=m;i++)dp[I(i,0)]=i;for(let j=0;j<=n;j++)dp[I(0,j)]=j;for(let i=1;i<=m;i++){for(let j=1;j<=n;j++){const cost=a[i-1]===b[j-1]?0:1;dp[I(i,j)]=Math.min(dp[I(i-1,j)]+1,dp[I(i,j-1)]+1,dp[I(i-1,j-1)]+cost);} }return dp[I(m,n)];}

function showSentence(area){
  const front=(currentCard.front||'').toString().trim();
  const back=(currentCard.back||'').toString().trim();
  const words=back.split(/\s+/).filter(Boolean);
  if(words.length<=1){ showMultiple(area); return; }

  const MAX_BANK=24;
  const baseTarget=words.map(w=>w.toLowerCase());
  const srcWords=front.split(/\s+/).map(w=>w.replace(PUNC,''));
  const srcPool=srcWords.filter(w=>w && !baseTarget.includes(w.toLowerCase()));

  let needed=Math.min(12,Math.max(6,Math.ceil(words.length*0.6)));
  const distractors=new Set();
  while(distractors.size<needed && srcPool.length){ distractors.add(srcPool[Math.floor(Math.random()*srcPool.length)]); }
  while(distractors.size<needed){
    const w=DISTRACTOR_POOL[Math.floor(Math.random()*DISTRACTOR_POOL.length)];
    if(!baseTarget.includes(w.toLowerCase())) distractors.add(w);
  }

  let bank=[...words, ...distractors];
  if(bank.length>MAX_BANK){
    const extras=bank.filter(w=>!words.includes(w));
    while(words.length+extras.length>MAX_BANK && extras.length>0){ extras.splice(Math.floor(Math.random()*extras.length),1); }
    bank=[...words, ...extras];
  }
  bank.sort(()=>Math.random()-.5);

  const prompt=document.createElement('div'); prompt.className='card'; prompt.innerHTML='<b>Deutsch:</b> '+front; area.appendChild(prompt);
  const wb=document.createElement('div'); wb.className='wordbank';
  const ab=document.createElement('div'); ab.className='answerbox';
  const selected=[]; function renderAns(){ ab.textContent=selected.join(' '); }

  wb.addEventListener('click',(e)=>{
    const btn=e.target.closest('button'); if(!btn) return;
    const w=btn.getAttribute('data-w'); if(btn.disabled) return;
    selected.push(w); btn.disabled=true; renderAns();
  });

  const frag=document.createDocumentFragment();
  bank.forEach(w=>{ const b=document.createElement('button'); b.setAttribute('data-w',w); b.textContent=w; frag.appendChild(b); });
  wb.appendChild(frag);

  area.appendChild(wb); area.appendChild(ab);

  const bar=document.createElement('div'); bar.className='action-bar';
  const btnPruefen=mkBtn('Prüfen','primary go',()=>{
    const val=selected.join(' ').trim();
    if(!val){ const skipBtn=bar.querySelector('.skip'); if(skipBtn){ skipBtn.classList.add('hint'); setTimeout(()=>skipBtn.classList.remove('hint'),900);} return; }
    const ok=(levenshtein(normalize(val), normalize(back)) <= Math.max(1, Math.floor(normalize(back).length*0.05)));
    onAnswer(ok);
    btnPruefen.replaceWith(mkBtn('Weiter','primary next',nextCard));
    const fb=document.createElement('div'); fb.className='feedback'; fb.innerHTML= ok? '✅ Richtig!' : '❌ Falsch! Richtige Lösung: <b>'+back+'</b>';
    area.appendChild(fb);
  });
  const btnSkip=mkBtn('Skip','skip',()=>{ sessionQueue.push(currentCard); nextCard(); });
  bar.appendChild(btnPruefen); bar.appendChild(btnSkip); area.appendChild(bar);
}

/* === Import/Export/Reset === */
function handleFileImport(e){
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=(evt)=>{ try{ const imported=JSON.parse(evt.target.result); const newDecks=Array.isArray(imported)?imported:(imported.decks||[]); STATE.decks=(STATE.decks||[]).concat(newDecks); decks=STATE.decks; saveJSON(STORAGE_KEY,STATE); renderDecks(); alert('Import erfolgreich!'); }catch(err){ alert('Fehler beim Import: '+err.message); } };
  reader.readAsText(file);
}
function importFromText(){
  const text=document.getElementById('importText').value.trim();
  if(!text){ alert('Kein Text. Format: front;back;example (eine Karte pro Zeile)'); return; }
  let targetDeck=currentDeck;
  if(!targetDeck){ let existing=(decks||[]).find(d=>d.name==='Import (Auto)'); if(!existing){ existing={name:'Import (Auto)',cards:[]}; (decks||[]).push(existing); } targetDeck=existing; }
  const lines=text.split(/\n/).map(l=>l.trim()).filter(Boolean);
  let added=0; for(const line of lines){ const p=line.split(';'); if(p.length>=2){ targetDeck.cards.push({front:p[0],back:p[1],example:p[2]||''}); added++; } }
  saveJSON(STORAGE_KEY,STATE); renderDecks(); alert(added+' Karten importiert in: '+targetDeck.name);
}
function exportDecks(){ const blob=new Blob([JSON.stringify({decks:STATE.decks||[]},null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='decks.json'; a.click(); URL.revokeObjectURL(a.href); }
function resetAll(){ localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(ELO_KEY); location.reload(); }

/* === INIT === */
async function bootstrap(){
  if(!decks){ decks=await loadExternalDecks(); if(!decks || !decks.length){ try{ const res=await fetch('decks.json?v='+(Date.now())); const data=await res.json(); decks=data.decks; }catch(e){ decks=[]; } } STATE.decks=decks; saveJSON(STORAGE_KEY,STATE); }
  renderDecks(); updateMeters(); showSection('decks');
}
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('startBtn').addEventListener('click', startLearning);
  document.getElementById('reloadBtn').addEventListener('click', async()=>{ decks=await loadExternalDecks(); STATE.decks=decks; saveJSON(STORAGE_KEY,STATE); renderDecks(); });
  document.getElementById('exportBtn').addEventListener('click', exportDecks);
  document.getElementById('importTextBtn').addEventListener('click', importFromText);
  document.getElementById('importFile').addEventListener('change', handleFileImport);
  bootstrap();
});
