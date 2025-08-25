
const STORAGE_KEY='lingualite_state_v23';
const DISTRACTOR_POOL=['og','ikke','lidt','meget','hvad','hvem','hvordan','hvor','her','der','i dag','i morgen','ven','bil','hus','bog','kaffe','brød','skole','arbejde','byen','taler','forstår','kommer','fra','jeg','du','han','hun','vi','de','er','har','kan','vil','med','uden','til','fra','på'];

let STATE=loadState(); let decks=STATE.decks; let currentDeck=null; let currentMode='flashcards'; let sessionQueue=[]; let currentCard=null;

function loadState(){try{const raw=localStorage.getItem(STORAGE_KEY);return raw?JSON.parse(raw):{decks:null};}catch(e){return {decks:null};}}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(STATE));}

async function loadExternalDecks(){ try{ const res=await fetch('decks.json?'+Date.now(),{cache:'no-store'}); const data=await res.json(); return data.decks||[]; }catch(e){ console.error(e); return []; } }
async function bootstrap(){ if(!decks){ decks=await loadExternalDecks(); STATE.decks=decks; saveState(); } renderDecks(); showSection('decks'); }
function showSection(id){ if(id==='learn'&&!currentDeck){alert('Bitte zuerst ein Deck unter „Decks“ auswählen.'); return;} document.querySelectorAll('.section').forEach(s=>s.classList.add('hidden')); document.getElementById(id).classList.remove('hidden'); }

function renderDecks(){
  const cont=document.getElementById('deckList'); cont.textContent='';
  const learnBtn=document.getElementById('learnBtn'); learnBtn.classList.add('hidden');
  if(!decks||decks.length===0){ const info=document.createElement('div'); info.className='card'; info.innerHTML='Keine Decks gefunden. Lege eine <code>decks.json</code> ins Repo oder importiere ein Deck unter „Import/Export“.'; cont.appendChild(info); return; }
  const frag=document.createDocumentFragment();
  decks.forEach((d,idx)=>{ const el=document.createElement('div'); el.className='card'; el.dataset.index=idx; el.textContent=d.name+' ('+d.cards.length+' Karten)'; frag.appendChild(el); });
  cont.appendChild(frag);
  cont.onclick=(e)=>{ const el=e.target.closest('.card'); if(!el) return; const idx=+el.dataset.index; currentDeck=decks[idx]; document.querySelectorAll('.deckList .card').forEach(c=>c.classList.remove('selected')); el.classList.add('selected'); learnBtn.classList.remove('hidden'); };
}

/* Controls */
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('startBtn').addEventListener('click', startLearning);
  document.getElementById('reloadBtn').addEventListener('click', reloadExternalDecks);
  document.getElementById('exportBtn').addEventListener('click', exportDecks);
  document.getElementById('importTextBtn').addEventListener('click', importFromText);
  document.getElementById('importFile').addEventListener('change', handleFileImport);
});

function startLearning(){
  try{
    if(!currentDeck){alert('Bitte Deck wählen');return;}
    currentMode=document.getElementById('modeSelect').value;
    sessionQueue=currentDeck.cards.slice();
    if(sessionQueue.length===0){ alert('Dieses Deck ist leer.'); return; }
    for(let i=sessionQueue.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [sessionQueue[i],sessionQueue[j]]=[sessionQueue[j],sessionQueue[i]]; }
    nextCard();
  }catch(err){
    console.error('startLearning error', err);
    alert('Fehler beim Starten der Session: '+err.message);
  }
}

function nextCard(){
  const area=document.getElementById('learningArea');
  area.textContent='';
  if(sessionQueue.length===0){ area.innerHTML='<div class="card">Fertig! 🎉</div>'; return; }
  currentCard=sessionQueue.shift();
  requestAnimationFrame(()=>{
    try{
      if(currentMode==='flashcards') showFlashcard(area);
      else if(currentMode==='multiple') showMultiple(area);
      else showSentence(area);
    }catch(err){
      console.error('render error', err);
      area.innerHTML='<div class="card">Ein Fehler ist aufgetreten. Die Karte wird übersprungen.</div>';
      nextCard();
    }
  });
}

function mkBtn(label,cls,cb){ const b=document.createElement('button'); b.textContent=label; if(cls)b.className=cls; b.addEventListener('click',cb); return b; }
function pushResultAndAwaitNext(area, ok, msgOk='✅ Richtig!', msgFail='❌ Falsch!'){
  const fb=document.createElement('div'); fb.className='feedback'; fb.innerHTML=ok?msgOk:msgFail+' Richtige Lösung: <b>'+currentCard.back+'</b>';
  area.appendChild(fb);
  const bar=document.createElement('div'); bar.className='action-bar';
  bar.appendChild(mkBtn('Weiter','primary next',()=>{
    if(ok){ const offset=6+Math.floor(Math.random()*2); sessionQueue.splice(Math.min(offset,sessionQueue.length),0,currentCard); }
    else { sessionQueue.splice(1,0,currentCard); }
    nextCard();
  }));
  area.appendChild(bar);
}

/* Flashcards */
function showFlashcard(area){
  const front = (currentCard.front||'').toString();
  const back  = (currentCard.back||'').toString();
  const card=document.createElement('div'); card.className='card'; card.textContent=front; area.appendChild(card);
  const bar=document.createElement('div'); bar.className='action-bar';
  bar.appendChild(mkBtn('Antwort zeigen','primary go reveal',()=>{
    const fb=document.createElement('div'); fb.className='feedback'; fb.innerHTML='Richtig: <b>'+back+'</b>';
    area.appendChild(fb);
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
  const front = (currentCard.front||'').toString();
  const back  = (currentCard.back||'').toString();
  const pool=currentDeck.cards;
  const opts=[back]; const uniq=new Set(opts);
  while(opts.length<4 && pool.length>opts.length){ const c=(pool[Math.floor(Math.random()*pool.length)].back||'').toString(); if(c && !uniq.has(c)){opts.push(c);uniq.add(c);} }
  while(opts.length<4){ const c=DISTRACTOR_POOL[Math.floor(Math.random()*DISTRACTOR_POOL.length)]; if(!uniq.has(c)){opts.push(c);uniq.add(c);} }
  opts.sort(()=>Math.random()-.5);
  const card=document.createElement('div'); card.className='card'; card.textContent=front; area.appendChild(card);
  const grid=document.createElement('div'); grid.className='action-bar';
  opts.forEach(o=> grid.appendChild(mkBtn(o,'primary go',()=>{ const ok=(o===back); pushResultAndAwaitNext(area, ok); })));
  area.appendChild(grid);
  const bar=document.createElement('div'); bar.className='action-bar'; bar.appendChild(mkBtn('Skip','skip',()=>{ sessionQueue.push(currentCard); nextCard(); })); area.appendChild(bar);
}

/* Utils */
function levenshtein(a,b){const m=a.length,n=b.length;if(m===0)return n;if(n===0)return m;const dp=new Array((m+1)*(n+1));const I=(i,j)=>i*(n+1)+j;for(let i=0;i<=m;i++)dp[I(i,0)]=i;for(let j=0;j<=n;j++)dp[I(0,j)]=j;for(let i=1;i<=m;i++){for(let j=1;j<=n;j++){const cost=a[i-1]===b[j-1]?0:1;dp[I(i,j)]=Math.min(dp[I(i-1,j)]+1,dp[I(i,j-1)]+1,dp[I(i-1,j-1)]+cost);} }return dp[I(m,n)];}
const PUNC=/[.,!?;:()\\[\\]\\"“”„'«»]/g;
function normalize(s){ return s.toLowerCase().replace(PUNC,'').replace(/\\s+/g,' ').trim(); }

/* Sentence puzzle (robust + capped sizes) */
function showSentence(area){
  const front = (currentCard.front||'').toString().trim();
  const back  = (currentCard.back||'').toString().trim();
  if(!back){ pushResultAndAwaitNext(area,false,'','❌ Falsche Karte (keine Rückseite)'); return; }

  const tWords = back.split(/\\s+/).filter(Boolean);
  if(tWords.length<=1){ showMultiple(area); return; }

  // Cap bank size for performance
  const MAX_BANK = 24; // max words incl. distractors
  const baseTarget=tWords.map(w=>w.toLowerCase());
  const sourceWords=front.split(/\\s+/).map(w=>w.replace(PUNC,''));
  const srcPool=sourceWords.filter(w=>w && !baseTarget.includes(w.toLowerCase()));

  let needed=Math.min(12,Math.max(6,Math.ceil(tWords.length*0.6)));
  const distractors=new Set();
  while(distractors.size<needed && srcPool.length){ distractors.add(srcPool[Math.floor(Math.random()*srcPool.length)]); }
  while(distractors.size<needed){
    const w=DISTRACTOR_POOL[Math.floor(Math.random()*DISTRACTOR_POOL.length)];
    if(!baseTarget.includes(w.toLowerCase())) distractors.add(w);
  }

  let bank=[...tWords, ...distractors];
  // If too big, trim random extras (keep all target words)
  if(bank.length>MAX_BANK){
    const extras=bank.filter(w=>!tWords.includes(w));
    while(tWords.length + extras.length > MAX_BANK && extras.length>0){ extras.splice(Math.floor(Math.random()*extras.length),1); }
    bank=[...tWords, ...extras];
  }
  bank.sort(()=>Math.random()-.5);

  const prompt=document.createElement('div'); prompt.className='card'; prompt.innerHTML='<b>Deutsch:</b> '+front; area.appendChild(prompt);

  const wb=document.createElement('div'); wb.className='wordbank';
  const ab=document.createElement('div'); ab.className='answerbox';
  const selected=[];
  function renderAnswer(){ ab.textContent=selected.join(' '); }

  wb.addEventListener('click', (e)=>{
    const btn=e.target.closest('button'); if(!btn) return;
    const w=btn.getAttribute('data-w'); if(btn.disabled) return;
    selected.push(w); btn.disabled=true; renderAnswer();
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
    // Ersetze Prüfen durch Weiter an gleicher Position
    btnPruefen.replaceWith(mkBtn('Weiter','primary next',()=>{
      if(ok){ const offset=6+Math.floor(Math.random()*2); sessionQueue.splice(Math.min(offset,sessionQueue.length),0,currentCard); }
      else { sessionQueue.splice(1,0,currentCard); }
      nextCard();
    }));
    // Feedback anhängen
    const fb=document.createElement('div'); fb.className='feedback'; fb.innerHTML= ok? '✅ Richtig!' : '❌ Falsch! Richtige Lösung: <b>'+back+'</b>';
    area.appendChild(fb);
  });
  const btnSkip=mkBtn('Skip','skip',()=>{ sessionQueue.push(currentCard); nextCard(); });

  bar.appendChild(btnPruefen); bar.appendChild(btnSkip); area.appendChild(bar);
}

/* Import/Export/Reset */
function handleFileImport(e){
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=(evt)=>{ try{ const imported=JSON.parse(evt.target.result); const newDecks=Array.isArray(imported)?imported:(imported.decks||[]); STATE.decks=(STATE.decks||[]).concat(newDecks); decks=STATE.decks; saveState(); renderDecks(); alert('Import erfolgreich!'); }catch(err){ alert('Fehler beim Import: '+err.message); } };
  reader.readAsText(file);
}
function importFromText(){
  const text=document.getElementById('importText').value.trim();
  if(!text){ alert('Kein Text. Format: front;back;example (eine Karte pro Zeile)'); return; }
  let targetDeck=currentDeck;
  if(!targetDeck){ let existing=(decks||[]).find(d=>d.name==='Import (Auto)'); if(!existing){ existing={name:'Import (Auto)',cards:[]}; (decks||[]).push(existing); } targetDeck=existing; }
  const lines=text.split(/\\n/).map(l=>l.trim()).filter(Boolean);
  let added=0; for(const line of lines){ const p=line.split(';'); if(p.length>=2){ targetDeck.cards.push({front:p[0],back:p[1],example:p[2]||''}); added++; } }
  saveState(); renderDecks(); alert(added+' Karten importiert in: '+targetDeck.name);
}
function exportDecks(){ const blob=new Blob([JSON.stringify(STATE.decks||[],null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='decks.json'; a.click(); URL.revokeObjectURL(a.href); }
function resetAll(){ localStorage.removeItem(STORAGE_KEY); location.reload(); }
async function reloadExternalDecks(){ if(!confirm('Externe decks.json neu laden und lokale Änderungen überschreiben?')) return; decks=await loadExternalDecks(); STATE.decks=decks; saveState(); renderDecks(); }

window.addEventListener('DOMContentLoaded',bootstrap);
