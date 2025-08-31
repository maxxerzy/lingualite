
/* v38: Backend-only harder shuffle + stronger Distraktoren + externe Vokabelbasis. Frontend unverändert. */
const STORAGE_KEY='lingualite_state_v38';
const ELO_KEY='lingualite_elo_v38';
const DEFAULT_ELO=1200, K=16, MIN_ELO=800, MAX_ELO=1600;
const FALLBACK_DISTRACTORS=['og','ikke','lidt','meget','hvad','hvem','hvordan','hvor','her','der','i dag','i morgen','ven','bil','hus','bog','kaffe','brød','skole','arbejde','byen','taler','forstår','kommer','fra','jeg','du','han','hun','vi','de','er','har','kan','vil','med','uden','til','fra','på'];
const DECK_PATHS=['decks.json','./decks.json','data/decks.json','./data/decks.json'];

/* ====== Storage ====== */
function loadJSON(key, fallback){ try{ const raw=localStorage.getItem(key); return raw?JSON.parse(raw):fallback; }catch(e){ return fallback; } }
let STATE=loadJSON(STORAGE_KEY,{decks:null, vocab:[]});
let ELO=loadJSON(ELO_KEY,{decks:{}, cards:{}, user:DEFAULT_ELO});

/* ====== State ====== */
let decks=STATE.decks;
let globalVocab=new Set(STATE.vocab||[]);
let currentDeck=null;
let currentMode='multiple';
let pendingMode=null;
let mixedMode=false;
let toggleNext='sentence';
let sessionQueue=[];
let pool=[];
let currentCard=null;
let score=0, wrongStreak=0;
let busy=false;
let renderToken=0;
let recentIds=[]; const RECENT_BLOCK=12; // verhindert Wiederholung innerhalb der letzten N Karten

/* ====== Utils ====== */
const PUNC=/[.,!?;:()\[\]\\"“”„'«»]/g;
function tokens(s){ return (s||'').toLowerCase().replace(PUNC,'').split(/\s+/).filter(Boolean); }
function clamp(x){ return Math.max(MIN_ELO, Math.min(MAX_ELO, Math.round(x))); }
function hashId(deckName, front, back){ let s=deckName+'::'+(front||'')+'::'+(back||''); let h=5381; for(let i=0;i<s.length;i++){ h=((h<<5)+h)+s.charCodeAt(i); h|=0; } return (h>>>0).toString(16); }
function saveSTATE(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify({decks, vocab:[...globalVocab]})); }catch(e){} }
let _eloTimer=null; function saveELO(){ if(_eloTimer) clearTimeout(_eloTimer); _eloTimer=setTimeout(()=>{ try{ localStorage.setItem(ELO_KEY, JSON.stringify(ELO)); }catch(e){} },200); }

/* ====== Fetch & Load ====== */
async function tryFetch(path){
  const controller=new AbortController(); const id=setTimeout(()=>controller.abort(),6000);
  try{
    const res=await fetch(path+'?v='+(Date.now()),{cache:'no-store',signal:controller.signal});
    if(!res.ok) throw new Error('HTTP '+res.status);
    return await res.json();
  }finally{ clearTimeout(id); }
}
function validateDecks(obj){
  const arr = Array.isArray(obj?.decks)? obj.decks : (Array.isArray(obj)? obj : null);
  if(!arr) return false;
  for(const d of arr){ if(typeof d!=='object' || typeof d.name!=='string' || !Array.isArray(d.cards)) return false; }
  return true;
}
async function loadExternalDecks(){
  for(const p of DECK_PATHS){
    try{ const data=await tryFetch(p); if(validateDecks(data)) return data.decks||data; }catch(e){}
  }
  const box=document.getElementById('deckError'); if(box){ box.style.display='block'; box.textContent='Hinweis: Konnte decks.json nicht laden.'; }
  return [];
}
function rebuildGlobalVocab(srcDecks){
  globalVocab=new Set();
  srcDecks.forEach(d=> (d.cards||[]).forEach(c=> tokens(c.back).forEach(w=> globalVocab.add(w)) ) );
  if(globalVocab.size<50){ FALLBACK_DISTRACTORS.forEach(w=>globalVocab.add(w)); }
  STATE.vocab=[...globalVocab]; saveSTATE();
}

/* ====== UI ====== */
function updateMeters(){
  document.getElementById('scoreBox').textContent='Punkte: '+score;
  const dName=currentDeck?currentDeck.name:null;
  const dElo=dName? (ELO.decks[dName]??DEFAULT_ELO) : '—';
  document.getElementById('deckElo').textContent='Deck‑Elo: '+dElo;
}
function showSection(id){
  if(id==='learn'&&!currentDeck){ alert('Bitte zuerst ein Deck unter „Decks“ auswählen.'); return; }
  document.querySelectorAll('.section').forEach(s=>s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}
function renderDecks(){
  const cont=document.getElementById('deckList'); cont.textContent='';
  const learnBtn=document.getElementById('learnBtn'); learnBtn.classList.add('hidden');
  if(!decks || decks.length===0){ const info=document.createElement('div'); info.className='card'; info.innerHTML='Keine Decks gefunden.'; cont.appendChild(info); return; }
  const frag=document.createDocumentFragment();
  decks.forEach((d,idx)=>{ const el=document.createElement('div'); el.className='card'; el.dataset.index=idx; el.textContent=(d.name||'Deck')+' ('+((d.cards&&d.cards.length)||0)+' Karten)'; frag.appendChild(el); });
  cont.appendChild(frag);
  cont.onclick=(e)=>{ const el=e.target.closest('.card'); if(!el) return; const idx=+el.dataset.index; currentDeck=decks[idx]; document.querySelectorAll('.deckList .card').forEach(c=>c.classList.remove('selected')); el.classList.add('selected'); document.getElementById('learnBtn').classList.remove('hidden'); updateMeters(); };
}

/* ====== Elo & Score ====== */
function getUserElo(){ return ELO.user??DEFAULT_ELO; }
function setUserElo(v){ ELO.user=clamp(v); }
function getCardElo(id){ return ELO.cards[id]??DEFAULT_ELO; }
function setCardElo(id,v){ ELO.cards[id]=clamp(v); }
function eloStep(a,b,scoreA){ const expectedA=1/(1+Math.pow(10,(b-a)/400)); return {A: clamp(a+K*(scoreA-expectedA)), B: clamp(b+K*((1-scoreA)-(1-expectedA)))}; }

/* ====== Build (harder shuffle + anti-repeat) ====== */
const BUILD_CHUNK=500, MAX_INITIAL=1800, REFILL_AT=350, REFILL_CHUNK=800;
function fisherYates(a){ for(let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; } }
function buildQueues(cards){
  const arr = cards.map(c=>({ ...c, _id: hashId(currentDeck.name,c.front,c.back) }));
  // 1) sort by card elo desc (harder items nach vorne)
  arr.sort((a,b)=> (getCardElo(b._id)-getCardElo(a._id)));
  // 2) globale Shuffle (fisher-yates)
  fisherYates(arr);
  // 3) Anti-repeat: Rearrange so that gleiche _id in den letzten RECENT_BLOCK vermieden wird
  const out=[]; const recent=new Set();
  for(const c of arr){
    let placed=false;
    for(let offset=0; offset<=Math.min(8, out.length); offset++){
      const pos = out.length - offset;
      if(!recent.has(c._id)){
        out.push(c); placed=true;
        break;
      }
    }
    if(!placed) out.push(c);
    // maintain recent set for preview
    recent.add(c._id);
    if(recent.size>RECENT_BLOCK){ const first=out[out.length-RECENT_BLOCK-1]; if(first) recent.delete(first._id); }
  }
  sessionQueue=out.slice(0, Math.min(MAX_INITIAL, out.length));
  pool=out.slice(sessionQueue.length);
  recentIds=[];
}
function refillIfNeeded(){
  if(sessionQueue.length<REFILL_AT && pool.length){
    const add=pool.splice(0, Math.min(REFILL_CHUNK, pool.length));
    fisherYates(add);
    sessionQueue.push(...add);
  }
}

/* ====== Session ====== */
function startLearning(){
  if(busy) return;
  if(!currentDeck){ alert('Bitte Deck wählen'); return; }
  busy=true;
  score=0; wrongStreak=0; updateMeters();
  currentMode=document.getElementById('modeSelect').value; pendingMode=null;
  mixedMode=!!currentDeck.autoMixed; toggleNext='sentence';
  if(ELO.decks[currentDeck.name]==null) ELO.decks[currentDeck.name]=DEFAULT_ELO;
  const cards=currentDeck.cards||[];

  // Rebuild global vocab for distractors from ALL decks (auch importierte)
  rebuildGlobalVocab(decks||[]);

  sessionQueue=[]; pool=[];
  let i=0;
  function step(){
    const end=Math.min(i+BUILD_CHUNK, cards.length);
    i=end;
    if(i<cards.length){ setTimeout(step,0); return; }
    buildQueues(cards);
    busy=false;
    nextCard();
  }
  step();
}

function nextCard(){
  const area=document.getElementById('learningArea');
  area.textContent='';
  if(sessionQueue.length===0 && pool.length===0){
    area.innerHTML='<div class="card">Fertig! 🎉 Punkte: '+score+' — Deck‑Elo: '+(ELO.decks[currentDeck.name])+'</div>'; saveELO(); return;
  }
  refillIfNeeded();

  // pick next avoiding recent repeats
  let tries=0;
  do{
    currentCard=sessionQueue.shift();
    tries++;
  }while(currentCard && recentIds.includes(currentCard._id) && tries<8 && sessionQueue.length>0);
  recentIds.push(currentCard._id); if(recentIds.length>RECENT_BLOCK) recentIds.shift();

  const token=++renderToken;
  if(pendingMode){ currentMode=pendingMode; pendingMode=null; }
  let mode=currentMode;
  if(mixedMode){
    const words=(String(currentCard.back||'').trim().split(/\s+/)).length;
    if(toggleNext==='sentence' && words>1) mode='sentence'; else mode='multiple';
    toggleNext=(toggleNext==='sentence'?'multiple':'sentence');
  }
  requestAnimationFrame(()=>{ if(token!==renderToken) return; if(mode==='flashcards') showFlashcard(area); else if(mode==='sentence') showSentence(area); else showMultiple(area); });
}

function onAnswer(ok){
  if(ok){ score+=1; wrongStreak=0; } else { wrongStreak+=1; if(wrongStreak>=2){ score=Math.max(0,score-1); wrongStreak=0; } }
  const user=getUserElo(), card=getCardElo(currentCard._id), deck=ELO.decks[currentDeck.name];
  const u=1/(1+Math.pow(10,(card-user)/400)), d=1/(1+Math.pow(10,(user-deck)/400));
  setUserElo(user + K*((ok?1:0)-u));
  setCardElo(currentCard._id, card + K*(((ok?0:1))-(1-u)));
  ELO.decks[currentDeck.name]=clamp(deck + K*((ok?0:1)-d));
  updateMeters(); saveELO();

  // Spaced scheduling (weniger Wiederholung bei richtig)
  if(ok){
    const offset=10+Math.floor(Math.random()*5); // 10–14
    sessionQueue.splice(Math.min(offset,sessionQueue.length),0,currentCard);
  }else{
    sessionQueue.splice(1,0,currentCard); // falsche früh wiederholen
  }
}

/* ====== Modes ====== */
function mkBtn(label,cls,cb){ const b=document.createElement('button'); b.textContent=label; if(cls)b.className=cls; b.addEventListener('click',cb); return b; }
function pushResultAndAwaitNext(area, ok, msgOk='✅ Richtig!', msgFail='❌ Falsch!'){
  onAnswer(ok);
  const fb=document.createElement('div'); fb.className='feedback';
  fb.innerHTML= ok? msgOk : (msgFail+' Richtige Lösung: <b>'+ (currentCard.back||'') +'</b>');
  area.appendChild(fb);
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

/* Multiple Choice (Distraktoren aus globaler Vokabelbasis) */
function getRandomFromSet(setArr, exclude, need){
  const pool=setArr.filter(w=>!exclude.has(w));
  const out=[]; let guard=0;
  while(out.length<need && pool.length>0 && guard<need*10){
    const w=pool[(Math.random()*pool.length)|0];
    if(!exclude.has(w)){ out.push(w); exclude.add(w); }
    guard++;
  }
  return out;
}
function showMultiple(area){
  const front=(currentCard.front||'').toString(); const back=(currentCard.back||'').toString();
  const must=[back];
  const exclude=new Set(must);
  const vocabArr=[...globalVocab]; if(vocabArr.length<50){ vocabArr.push(...FALLBACK_DISTRACTORS); }
  const distract=getRandomFromSet(vocabArr, exclude, 3);
  const opts=[...must, ...distract]; for(let i=opts.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [opts[i],opts[j]]=[opts[j],opts[i]]; }
  const card=document.createElement('div'); card.className='card'; card.textContent=front; area.appendChild(card);
  const grid=document.createElement('div'); grid.className='action-bar';
  opts.forEach(o=> grid.appendChild(mkBtn(o,'primary go',()=>{ const ok=(o===back); pushResultAndAwaitNext(area, ok); })));
  area.appendChild(grid);
  const bar=document.createElement('div'); bar.className='action-bar'; bar.appendChild(mkBtn('Skip','skip',()=>{ sessionQueue.push(currentCard); nextCard(); })); area.appendChild(bar);
}

/* Sentence Puzzle (mehr Distraktoren + Bank bis 28) */
function normalize(s){ return s.toLowerCase().replace(PUNC,'').replace(/\s+/g,' ').trim(); }
function levenshtein(a,b){const m=a.length,n=b.length;if(m===0)return n;if(n===0)return m;const dp=new Array((m+1)*(n+1));const I=(i,j)=>i*(n+1)+j;for(let i=0;i<=m;i++)dp[I(i,0)]=i;for(let j=0;j<=n;j++)dp[I(0,j)]=j;for(let i=1;i<=m;i++){for(let j=1;j<=n;j++){const cost=a[i-1]===b[j-1]?0:1;dp[I(i,j)]=Math.min(dp[I(i-1,j)]+1,dp[I(i,j-1)]+1,dp[I(i-1,j-1)]+cost);} }return dp[I(m,n)];}
function showSentence(area){
  const front=(currentCard.front||'').toString().trim();
  const back=(currentCard.back||'').toString().trim();
  const words=back.split(/\s+/).filter(Boolean);
  if(words.length<=1){ showMultiple(area); return; }

  const MAX_BANK=28;
  const baseTarget=words.map(w=>w.toLowerCase());

  // Ziel-ferne Distraktoren: erst aus globalVocab, dann Fallback
  const exclude=new Set(baseTarget);
  const vocabArr=[...globalVocab]; if(vocabArr.length<50){ vocabArr.push(...FALLBACK_DISTRACTORS); }
  // härteres Mischen: 40–70% zusätzliche Wörter, min 8, max 16
  const extraCount=Math.max(8, Math.min(16, Math.ceil(words.length * (0.4 + Math.random()*0.3)) ));
  const distract=getRandomFromSet(vocabArr, exclude, extraCount);

  let bank=[...words, ...distract];
  if(bank.length>MAX_BANK){
    const keepWords=[...words];
    const extras=bank.filter(w=>!keepWords.includes(w));
    while(keepWords.length+extras.length>MAX_BANK && extras.length>0){ extras.splice((Math.random()*extras.length)|0,1); }
    bank=[...keepWords, ...extras];
  }
  for(let i=bank.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [bank[i],bank[j]]=[bank[j],bank[i]]; }

  const prompt=document.createElement('div'); prompt.className='card'; prompt.innerHTML='<b>Deutsch:</b> '+front; area.appendChild(prompt);
  const wb=document.createElement('div'); wb.className='wordbank';
  const ab=document.createElement('div'); ab.className='answerbox';
  const selected=[]; function renderAns(){ ab.textContent=selected.join(' '); }

  wb.addEventListener('click',(e)=>{ const btn=e.target.closest('button'); if(!btn) return; const w=btn.getAttribute('data-w'); if(btn.disabled) return; selected.push(w); btn.disabled=true; renderAns(); });

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

/* ====== Import/Export/Reset ====== */
async function reloadExternalDecks(){
  const d=await loadExternalDecks();
  if(!d || !d.length){ alert('Konnte keine Decks laden.'); return; }
  decks=d; rebuildGlobalVocab(decks); saveSTATE(); renderDecks();
}
function handleFileImport(e){
  const file=e.target.files[0]; if(!file) return; const reader=new FileReader();
  reader.onload=(evt)=>{
    try{
      const imported=JSON.parse(evt.target.result);
      const newDecks=Array.isArray(imported)?imported:(imported.decks||[]);
      if(!Array.isArray(newDecks)){ throw new Error('Formatfehler: erwartet Array oder {decks:[...]}.'); }
      // Merge
      decks=(decks||[]).concat(newDecks);
      rebuildGlobalVocab(decks);
      saveSTATE(); renderDecks();
      alert('Import erfolgreich!');
    }catch(err){ alert('Fehler beim Import: '+err.message); }
  };
  reader.readAsText(file);
}
function importFromText(){
  const text=document.getElementById('importText').value.trim();
  if(!text){ alert('Kein Text. Format: front;back;example (eine Karte pro Zeile)'); return; }
  let targetDeck=currentDeck;
  if(!targetDeck){ let existing=(decks||[]).find(d=>d.name==='Import (Auto)'); if(!existing){ existing={name:'Import (Auto)',cards:[]}; (decks||[]).push(existing); } targetDeck=existing; }
  const lines=text.split(/\n/).map(l=>l.trim()).filter(Boolean);
  let added=0; for(const line of lines){ const p=line.split(';'); if(p.length>=2){ targetDeck.cards.push({front:p[0],back:p[1],example:p[2]||''}); added++; } }
  rebuildGlobalVocab(decks); saveSTATE(); renderDecks(); alert(added+' Karten importiert in: '+targetDeck.name);
}
function exportDecks(){ const blob=new Blob([JSON.stringify({decks:decks||[]},null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='decks.json'; a.click(); URL.revokeObjectURL(a.href); }
function resetAll(){ localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(ELO_KEY); location.reload(); }

/* ====== Bootstrap ====== */
async function bootstrap(){
  if(!decks){
    const ext=await loadExternalDecks();
    if(ext && ext.length){ decks=ext; } else {
      try{ const res=await fetch('decks.json?v='+(Date.now())); const data=await res.json(); decks=data.decks; }catch(e){ decks=[]; }
    }
  }
  rebuildGlobalVocab(decks); renderDecks(); updateMeters(); showSection('decks');
}
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('startBtn').addEventListener('click', startLearning);
  document.getElementById('reloadBtn').addEventListener('click', reloadExternalDecks);
  document.getElementById('exportBtn').addEventListener('click', exportDecks);
  document.getElementById('importTextBtn').addEventListener('click', importFromText);
  document.getElementById('importFile').addEventListener('change', handleFileImport);
  document.getElementById('modeSelect').addEventListener('change', e=>{ pendingMode=e.target.value; });
  bootstrap();
});
