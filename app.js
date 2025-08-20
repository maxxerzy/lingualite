
const STORAGE_KEY = 'lingualite_state_v11';
const DISTRACTOR_POOL = ['og','ikke','lidt','meget','hvad','hvem','hvordan','hvor','her','der','i dag','i morgen','ven','bil','hus','bog','kaffe','brød','skole','arbejde','byen','taler','forstår','kommer','fra','jeg','du','han','hun','vi','de','er','har','kan','vil'];

let STATE = loadState();
let decks = STATE.decks; 
let currentDeck=null; let currentMode="flashcards"; let sessionQueue=[]; let currentCard=null;

function loadState(){ try{const raw=localStorage.getItem(STORAGE_KEY);return raw?JSON.parse(raw):{decks:null};}catch(e){return {decks:null};}
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE)); }

async function loadExternalDecks(){
  try{ const res=await fetch('decks.json?'+Date.now()); const data=await res.json(); return data.decks||[]; }catch(e){ return []; }
}
async function bootstrap(){ 
  if(!decks){ decks=await loadExternalDecks(); STATE.decks=decks; saveState(); } 
  renderDecks(); 
}
function showSection(id){ 
  if(id==='learn' && !currentDeck){ alert('Bitte zuerst ein Deck unter „Decks“ auswählen.'); return; }
  document.querySelectorAll('.section').forEach(s=>s.classList.add('hidden')); 
  document.getElementById(id).classList.remove('hidden'); 
}
function createDeck(){ const name=prompt('Name des neuen Decks:'); if(name){ decks.push({name, cards:[]}); saveState(); renderDecks(); } }

function renderDecks(){ 
  const cont=document.getElementById('deckList'); cont.innerHTML=''; 
  if(!decks || decks.length===0){ 
    const info=document.createElement('div'); info.className='card'; info.innerHTML='Keine Decks gefunden. Lege eine <code>decks.json</code> an oder importiere ein Deck.'; cont.appendChild(info);
  } else {
    decks.forEach(d=>{ 
      const el=document.createElement('div'); el.className='card'; el.textContent=d.name+' ('+d.cards.length+' Karten)'; 
      el.onclick=()=>{ currentDeck=d; document.getElementById('learnBtn').classList.remove('hidden'); alert(d.name+' ausgewählt'); };
      cont.appendChild(el); 
    });
  }
}

function startLearning(){ if(!currentDeck){alert('Bitte Deck wählen');return;} currentMode=document.getElementById('modeSelect').value; sessionQueue=[...currentDeck.cards]; nextCard(); }
function nextCard(){ if(sessionQueue.length===0){ document.getElementById('learningArea').innerHTML='<p>Fertig!</p>'; return; } currentCard=sessionQueue.shift(); if(currentMode==='flashcards') showFlashcard(); else if(currentMode==='multiple') showMultiple(); else showSentence(); }
function mkBtn(label,cls,cb){const b=document.createElement('button');b.textContent=label;if(cls)b.className=cls;b.onclick=cb;return b;}

function nextWithSpacing(ok){ // richtig -> mind. 6-7 nach hinten; falsch -> früh
  if(ok){ const offset = Math.min(7, Math.max(6, Math.floor(6 + Math.random()*2))); sessionQueue.splice(Math.min(offset,sessionQueue.length),0,currentCard); }
  else { sessionQueue.splice(1,0,currentCard); }
  nextCard();
}

/* Flashcards */
function showFlashcard(){ 
  const area=document.getElementById('learningArea'); 
  area.innerHTML='<div class=card>'+currentCard.front+'</div>'; 
  area.appendChild(mkBtn('Antwort zeigen','reveal',()=>{ 
    const fb=document.createElement('div'); fb.className='feedback'; fb.innerHTML='Richtig: <b>'+currentCard.back+'</b>'; area.appendChild(fb);
    area.appendChild(mkBtn('Richtig','',()=>nextWithSpacing(true)));
    area.appendChild(mkBtn('Falsch','',()=>nextWithSpacing(false)));
  }));
  area.appendChild(mkBtn('Skip','skip',()=>{ sessionQueue.push(currentCard); nextCard(); }));
}

/* Multiple Choice */
function showMultiple(){ 
  const pool = currentDeck.cards;
  const opts=[currentCard.back];
  while(opts.length<4 && pool.length>opts.length){ const c=pool[Math.floor(Math.random()*pool.length)].back; if(!opts.includes(c)) opts.push(c); }
  while(opts.length<4){ const c=DISTRACTOR_POOL[Math.floor(Math.random()*DISTRACTOR_POOL.length)]; if(!opts.includes(c)) opts.push(c); }
  opts.sort(()=>Math.random()-.5);
  const area=document.getElementById('learningArea'); area.innerHTML='<div class=card>'+currentCard.front+'</div>';
  opts.forEach(o=> area.appendChild(mkBtn(o,'',()=> nextWithSpacing(o===currentCard.back))));
  area.appendChild(mkBtn('Skip','skip',()=>{ sessionQueue.push(currentCard); nextCard(); }));
}

/* Satzpuzzle – immer einzelne Wörter der KORREKTEN Übersetzung (back), keine Beispiel-Strings */
function normalize(s){ return s.toLowerCase().replace(/[.,!?;:()\\[\\]\"“”„'«»]/g,'').replace(/\\s+/g,' ').trim(); }
function showSentence(){ 
  const target = String(currentCard.back||'').trim();
  const words = target.split(/\\s+/);
  // 60% Distraktoren, min 3, max 10
  const needed = Math.min(10, Math.max(3, Math.ceil(words.length*0.6)));
  const distractors = new Set();
  while(distractors.size<needed){
    const w = DISTRACTOR_POOL[Math.floor(Math.random()*DISTRACTOR_POOL.length)];
    if(!words.map(x=>x.toLowerCase()).includes(w.toLowerCase())) distractors.add(w);
  }
  const bank=[...words, ...distractors]; bank.sort(()=>Math.random()-.5);
  const area=document.getElementById('learningArea'); 
  area.innerHTML='<div class=card><div><b>Deutsch:</b> '+currentCard.front+'</div></div>';
  const wb=document.createElement('div'); wb.className='wordbank';
  const ab=document.createElement('div'); ab.className='answerbox';
  bank.forEach(w=>{ const b=mkBtn(w,'',()=>{ ab.textContent += (ab.textContent?' ':'')+w; b.disabled=true; }); wb.appendChild(b); });
  area.appendChild(wb); area.appendChild(ab);
  area.appendChild(mkBtn('Prüfen','',()=>{ const ok=normalize(ab.textContent)===normalize(target); nextWithSpacing(ok); }));
  area.appendChild(mkBtn('Skip','skip',()=>{ sessionQueue.push(currentCard); nextCard(); }));
}

/* Import/Export/Reset */
function handleFileImport(e){
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=(evt)=>{
    try{
      const imported=JSON.parse(evt.target.result);
      const newDecks = Array.isArray(imported) ? imported : (imported.decks || []);
      STATE.decks = (STATE.decks||[]).concat(newDecks);
      decks = STATE.decks; saveState(); renderDecks(); alert('Import erfolgreich!');
    }catch(err){ alert('Fehler beim Import: '+err.message); }
  };
  reader.readAsText(file);
}
function importFromText(){
  const text=document.getElementById('importText').value.trim();
  if(!currentDeck){ alert('Kein Deck ausgewählt.'); return; }
  const lines=text.split(/\\n/).map(l=>l.trim()).filter(Boolean);
  let added=0;
  lines.forEach(line=>{ const p=line.split(';'); if(p.length>=2){ currentDeck.cards.push({front:p[0], back:p[1], example:p[2]||''}); added++; } });
  saveState(); renderDecks(); alert(added+' Karten importiert.');
}
function exportDecks(){
  const blob=new Blob([JSON.stringify(STATE.decks || [],null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='decks.json'; a.click(); URL.revokeObjectURL(a.href);
}
function resetAll(){ localStorage.removeItem(STORAGE_KEY); location.reload(); }
async function reloadExternalDecks(){ if(!confirm('Externe decks.json neu laden und lokale Änderungen überschreiben?')) return; decks=await loadExternalDecks(); STATE.decks=decks; saveState(); renderDecks(); }

window.addEventListener('DOMContentLoaded',bootstrap);
