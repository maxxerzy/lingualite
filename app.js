
const STORAGE_KEY='lingualite_state_v20';
const DISTRACTOR_POOL=['og','ikke','lidt','meget','hvad','hvem','hvordan','hvor','her','der','i dag','i morgen','ven','bil','hus','bog','kaffe','brød','skole','arbejde','byen','taler','forstår','kommer','fra','jeg','du','han','hun','vi','de','er','har','kan','vil','med','uden','til','fra','på'];

let STATE=loadState(); let decks=STATE.decks; let currentDeck=null; let currentMode='flashcards'; let sessionQueue=[]; let currentCard=null;

function loadState(){try{const raw=localStorage.getItem(STORAGE_KEY);return raw?JSON.parse(raw):{decks:null};}catch(e){return {decks:null};}}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(STATE));}

async function loadExternalDecks(){try{const res=await fetch('decks.json?'+Date.now());const data=await res.json();return data.decks||[];}catch(e){return [];}}
async function bootstrap(){ if(!decks){decks=await loadExternalDecks(); STATE.decks=decks; saveState(); } renderDecks(); showSection('decks'); }
function showSection(id){ if(id==='learn'&&!currentDeck){alert('Bitte zuerst ein Deck unter „Decks“ auswählen.'); return;} document.querySelectorAll('.section').forEach(s=>s.classList.add('hidden')); document.getElementById(id).classList.remove('hidden'); }

function renderDecks(){
  const cont=document.getElementById('deckList'); cont.innerHTML='';
  const learnBtn=document.getElementById('learnBtn'); learnBtn.classList.add('hidden');
  if(!decks||decks.length===0){
    const info=document.createElement('div'); info.className='card'; info.innerHTML='Keine Decks gefunden. Lege eine <code>decks.json</code> in den Ordner oder importiere ein Deck unter „Import/Export“.'; cont.appendChild(info);
    return;
  }
  decks.forEach(d=>{
    const el=document.createElement('div'); el.className='card'; el.textContent=d.name+' ('+d.cards.length+' Karten)';
    el.onclick=()=>{ currentDeck=d; learnBtn.classList.remove('hidden'); el.classList.add('selected'); Array.from(cont.children).forEach(c=>{ if(c!==el) c.classList.remove('selected'); }); };
    cont.appendChild(el);
  });
}

function startLearning(){
  if(!currentDeck){alert('Bitte Deck wählen');return;}
  currentMode=document.getElementById('modeSelect').value;
  sessionQueue=[...currentDeck.cards];
  // zufällig mischen
  sessionQueue.sort(()=>Math.random()-.5);
  nextCard();
}

function nextCard(){
  if(sessionQueue.length===0){ document.getElementById('learningArea').innerHTML='<div class="card">Fertig! 🎉</div>'; return; }
  currentCard=sessionQueue.shift();
  if(currentMode==='flashcards') showFlashcard();
  else if(currentMode==='multiple') showMultiple();
  else showSentence();
}

function mkBtn(label,cls,cb){ const b=document.createElement('button'); b.textContent=label; if(cls)b.className=cls; b.onclick=cb; return b; }

function pushResultAndAwaitNext(ok,msgOk='✅ Richtig!',msgFail='❌ Falsch!'){
  const area=document.getElementById('learningArea');
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
function showFlashcard(){
  const area=document.getElementById('learningArea');
  area.innerHTML='<div class="card">'+currentCard.front+'</div>';
  const bar=document.createElement('div'); bar.className='action-bar';
  bar.appendChild(mkBtn('Antwort zeigen','primary go reveal',()=>{
    const fb=document.createElement('div'); fb.className='feedback'; fb.innerHTML='Richtig: <b>'+currentCard.back+'</b>';
    area.appendChild(fb);
    const inner=document.createElement('div'); inner.className='action-bar';
    inner.appendChild(mkBtn('Richtig','primary go',()=>pushResultAndAwaitNext(true)));
    inner.appendChild(mkBtn('Falsch','primary go',()=>pushResultAndAwaitNext(false)));
    area.appendChild(inner);
  }));
  bar.appendChild(mkBtn('Skip','skip',()=>{ sessionQueue.push(currentCard); nextCard(); }));
  area.appendChild(bar);
}

/* Multiple Choice (≥4 Optionen) */
function showMultiple(){
  const pool=currentDeck.cards;
  const opts=[currentCard.back];
  const uniqBacks=new Set(opts);
  while(opts.length<4 && pool.length>opts.length){
    const c=pool[Math.floor(Math.random()*pool.length)].back;
    if(!uniqBacks.has(c)){ opts.push(c); uniqBacks.add(c); }
  }
  while(opts.length<4){
    const c=DISTRACTOR_POOL[Math.floor(Math.random()*DISTRACTOR_POOL.length)];
    if(!uniqBacks.has(c)){ opts.push(c); uniqBacks.add(c); }
  }
  opts.sort(()=>Math.random()-.5);
  const area=document.getElementById('learningArea');
  area.innerHTML='<div class="card">'+currentCard.front+'</div>';
  const grid=document.createElement('div'); grid.className='action-bar';
  opts.forEach(o=> grid.appendChild(mkBtn(o,'primary go',()=>{ const ok=(o===currentCard.back); pushResultAndAwaitNext(ok); })));
  area.appendChild(grid);
  const bar=document.createElement('div'); bar.className='action-bar'; bar.appendChild(mkBtn('Skip','skip',()=>{ sessionQueue.push(currentCard); nextCard(); })); area.appendChild(bar);
}

/* Helpers */
function levenshtein(a,b){const m=a.length,n=b.length;if(m===0)return n;if(n===0)return m;const dp=new Array((m+1)*(n+1));const I=(i,j)=>i*(n+1)+j;for(let i=0;i<=m;i++)dp[I(i,0)]=i;for(let j=0;j<=n;j++)dp[I(0,j)]=j;for(let i=1;i<=m;i++){for(let j=1;j<=n;j++){const cost=a[i-1]===b[j-1]?0:1;dp[I(i,j)]=Math.min(dp[I(i-1,j)]+1,dp[I(i,j-1)]+1,dp[I(i-1,j-1)]+cost);} }return dp[I(m,n)];}
function normalize(s){ return s.toLowerCase().replace(/[.,!?;:()\[\]\\"“”„'«»]/g,'').replace(/\s+/g,' ').trim(); }

/* Satzpuzzle – Wort-für-Wort; Source-Wörter als Distraktoren; Prüfen -> Weiter; leer => Skip-Hinweis; Ein-Wort-Ziel => MC */
function showSentence(){
  const target=String(currentCard.back||'').trim();
  const source=String(currentCard.front||'').trim();
  const tWords=target.split(/\s+/);
  if(tWords.length<=1){ showMultiple(); return; }

  const baseTarget=tWords.map(w=>w.toLowerCase());
  const sourceWords=source.split(/\s+/).map(w=>w.replace(/[.,!?;:()\[\]\\"“”„'«»]/g,'')).filter(Boolean);
  const srcPool=sourceWords.filter(w=>!baseTarget.includes(w.toLowerCase()));

  const needed=Math.min(12,Math.max(6,Math.ceil(tWords.length*0.6)));
  const distractors=new Set();

  // erst aus dem Quell-Satz
  while(distractors.size<needed && srcPool.length){
    const w=srcPool[Math.floor(Math.random()*srcPool.length)];
    if(!baseTarget.includes(w.toLowerCase())) distractors.add(w);
  }
  // dann allgemeiner Pool
  while(distractors.size<needed){
    const w=DISTRACTOR_POOL[Math.floor(Math.random()*DISTRACTOR_POOL.length)];
    if(!baseTarget.includes(w.toLowerCase())) distractors.add(w);
  }

  const bank=[...tWords, ...distractors]; bank.sort(()=>Math.random()-.5);

  const area=document.getElementById('learningArea');
  area.innerHTML='<div class="card"><div><b>Deutsch:</b> '+currentCard.front+'</div></div>';
  const wb=document.createElement('div'); wb.className='wordbank';
  const ab=document.createElement('div'); ab.className='answerbox';
  bank.forEach(w=>{ const b=mkBtn(w,'',()=>{ ab.textContent += (ab.textContent?' ':'')+w; b.disabled=true; }); wb.appendChild(b); });
  area.appendChild(wb); area.appendChild(ab);

  const bar=document.createElement('div'); bar.className='action-bar';
  const btnPruefen=mkBtn('Prüfen','primary go',()=>{
    const val=ab.textContent.trim();
    if(!val){ const skipBtn=bar.querySelector('.skip'); if(skipBtn){ skipBtn.classList.add('hint'); setTimeout(()=>skipBtn.classList.remove('hint'),900);} return; }
    const normTarget=normalize(target), normVal=normalize(val);
    const dist=levenshtein(normVal,normTarget);
    const tolerance=Math.max(1, Math.floor(normTarget.length*0.05)); // ~5% Toleranz
    const ok=(dist<=tolerance);
    const fb=document.createElement('div'); fb.className='feedback'; fb.innerHTML= ok? '✅ Richtig!' : '❌ Falsch! Richtige Lösung: <b>'+target+'</b>';
    area.appendChild(fb);
    const btnWeiter=mkBtn('Weiter','primary next',()=>{
      if(ok){ const offset=6+Math.floor(Math.random()*2); sessionQueue.splice(Math.min(offset,sessionQueue.length),0,currentCard); }
      else { sessionQueue.splice(1,0,currentCard); }
      nextCard();
    });
    bar.replaceChild(btnWeiter, btnPruefen); // gleicher Platz
  });
  bar.appendChild(btnPruefen);
  const btnSkip=mkBtn('Skip','skip',()=>{ sessionQueue.push(currentCard); nextCard(); });
  bar.appendChild(btnSkip);
  area.appendChild(bar);
}

/* Import/Export/Reset */
function handleFileImport(e){
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=(evt)=>{
    try{
      const imported=JSON.parse(evt.target.result);
      const newDecks=Array.isArray(imported)?imported:(imported.decks||[]);
      STATE.decks=(STATE.decks||[]).concat(newDecks);
      decks=STATE.decks; saveState(); renderDecks(); alert('Import erfolgreich!');
    }catch(err){ alert('Fehler beim Import: '+err.message); }
  };
  reader.readAsText(file);
}
function importFromText(){
  const text=document.getElementById('importText').value.trim();
  if(!text){ alert('Kein Text. Format: front;back;example (eine Karte pro Zeile)'); return; }
  let targetDeck=currentDeck;
  if(!targetDeck){
    // auto-Deck anlegen (ohne Benutzer-Interaktion)
    const autoName='Import (Auto)';
    const existing=(decks||[]).find(d=>d.name===autoName);
    if(existing){ targetDeck=existing; }
    else{ targetDeck={name:autoName, cards:[]}; (decks||[]).push(targetDeck); STATE.decks=decks; saveState(); renderDecks(); }
  }
  const lines=text.split(/\n/).map(l=>l.trim()).filter(Boolean);
  let added=0;
  lines.forEach(line=>{ const p=line.split(';'); if(p.length>=2){ targetDeck.cards.push({front:p[0],back:p[1],example:p[2]||''}); added++; } });
  saveState(); renderDecks();
  alert(added+' Karten importiert in: '+targetDeck.name);
}
function exportDecks(){
  const blob=new Blob([JSON.stringify(STATE.decks||[],null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='decks.json'; a.click(); URL.revokeObjectURL(a.href);
}
function resetAll(){ localStorage.removeItem(STORAGE_KEY); location.reload(); }
async function reloadExternalDecks(){ if(!confirm('Externe decks.json neu laden und lokale Änderungen überschreiben?')) return; decks=await loadExternalDecks(); STATE.decks=decks; saveState(); renderDecks(); }

window.addEventListener('DOMContentLoaded',bootstrap);
