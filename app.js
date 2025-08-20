
const STORAGE_KEY = 'lingualite_state_v2';

const FALLBACK_DECKS = []; // wenn decks.json fehlt
const DISTRACTOR_POOL = [
  'og','ikke','lidt','meget','hvad','hvem','hvordan','hvor','her','der','i dag','i morgen',
  'ven','bil','hus','bog','kaffe','brød','skole','arbejde','byen','taler','forstår','kommer','fra',
  'jeg','du','han','hun','vi','de','er','har','kan','vil'
];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { decks: null }; // zuerst extern laden
    return JSON.parse(raw);
  } catch(e) { return { decks: null }; }
}
function saveState() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE)); } catch(e){} }

let STATE = loadState();
let decks = STATE.decks; // kann null sein
let currentDeck = null;
let currentMode = "flashcards";
let sessionQueue = [];
let currentCard = null;

async function loadExternalDecks() {
  try {
    const res = await fetch('decks.json?ts=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (data.decks && Array.isArray(data.decks)) return data.decks;
    throw new Error('Unbekanntes Format');
  } catch (e) {
    console.warn('Externe Decks konnten nicht geladen werden:', e);
    return FALLBACK_DECKS;
  }
}

async function bootstrap() {
  if (!decks) {
    decks = await loadExternalDecks();
    STATE.decks = decks;
    saveState();
  }
  renderDecks();
}

function showSection(id){ document.querySelectorAll('.section').forEach(s=>s.classList.add('hidden')); document.getElementById(id).classList.remove('hidden'); }
function createDeck(){ const name = prompt('Name des neuen Decks:'); if(name){ decks.push({name, cards:[]}); saveState(); renderDecks(); } }

function renderDecks(){
  const container = document.getElementById('deckList');
  container.innerHTML = '';
  if (!decks || decks.length === 0) {
    const info = document.createElement('div');
    info.className = 'card';
    info.innerHTML = 'Keine Decks gefunden. Lege ein Deck an, importiere Dateien oder lege eine <code>decks.json</code> im gleichen Ordner ab.';
    container.appendChild(info);
  } else {
    decks.forEach(deck => {
      const wrap = document.createElement('div');
      wrap.className = 'card'; wrap.style.minHeight='auto';
      wrap.innerHTML = `<b>${deck.name}</b> (${deck.cards.length} Karten)`;
      wrap.addEventListener('click', () => { currentDeck = deck; alert(deck.name + ' ausgewählt'); });
      container.appendChild(wrap);
    });
  }
}

function startLearning(){
  if(!currentDeck){ alert('Bitte zuerst ein Deck auswählen.'); return; }
  currentMode = document.getElementById('modeSelect').value;
  sessionQueue = [...currentDeck.cards];
  nextCard();
}

function nextCard(){
  if(sessionQueue.length===0){ document.getElementById('learningArea').innerHTML='<p>Session beendet!</p>'; return; }
  currentCard = sessionQueue.shift();
  if(currentMode==='flashcards') showFlashcard();
  else if(currentMode==='multiple') showMultipleChoice();
  else if(currentMode==='sentence') showSentencePuzzle();
}

function mkBtn(label, className, onclick){
  const b=document.createElement('button');
  b.type='button'; b.textContent=label;
  if(className) b.className=className;
  b.onclick=onclick;
  return b;
}

/* ---------- Flashcards ---------- */
function showFlashcard(){
  const area=document.getElementById('learningArea');
  area.innerHTML = `<div class="card">${currentCard.front}</div>`;
  area.appendChild(mkBtn('Antwort zeigen','reveal',revealAnswer));
  area.appendChild(mkBtn('Skip','skip',()=>{ sessionQueue.push(currentCard); nextCard(); }));
}
function revealAnswer(){
  const area=document.getElementById('learningArea');
  const fb=document.createElement('div'); fb.className='feedback';
  fb.innerHTML='Richtige Antwort: <b>'+currentCard.back+'</b>';
  area.appendChild(fb);
  area.appendChild(mkBtn('Richtig','',markCorrect));
  area.appendChild(mkBtn('Falsch','',markWrong));
}
function markCorrect(){
  const area=document.getElementById('learningArea');
  area.appendChild(Object.assign(document.createElement('div'),{className:'feedback',textContent:'✅ Richtig!'}));
  area.appendChild(mkBtn('Weiter','',nextCard));
}
function markWrong(){
  sessionQueue.splice(1,0,currentCard);
  const area=document.getElementById('learningArea');
  const d=document.createElement('div'); d.className='feedback'; d.innerHTML='❌ Falsch! Lösung: <b>'+currentCard.back+'</b>';
  area.appendChild(d); area.appendChild(mkBtn('Weiter','',nextCard));
}

/* ---------- Multiple Choice ---------- */
function showMultipleChoice(){
  const opts=[currentCard.back];
  while(opts.length<4 && currentDeck.cards.length>opts.length){
    const cand=currentDeck.cards[Math.floor(Math.random()*currentDeck.cards.length)].back;
    if(!opts.includes(cand)) opts.push(cand);
  }
  while (opts.length < 4) {
    const cand = DISTRACTOR_POOL[Math.floor(Math.random()*DISTRACTOR_POOL.length)];
    if (!opts.includes(cand)) opts.push(cand);
  }
  opts.sort(()=>Math.random()-0.5);
  const area=document.getElementById('learningArea');
  area.innerHTML = `<div class="card">${currentCard.front}</div>`;
  opts.forEach(opt => {
    const b=mkBtn(opt,'',()=>{
      if(opt===currentCard.back){
        area.appendChild(Object.assign(document.createElement('div'),{className:'feedback',textContent:'✅ Richtig!'}));
      }else{
        sessionQueue.splice(1,0,currentCard);
        const d=document.createElement('div'); d.className='feedback'; d.innerHTML='❌ Falsch! Lösung: <b>'+currentCard.back+'</b>'; area.appendChild(d);
      }
      area.appendChild(mkBtn('Weiter','',nextCard));
    });
    area.appendChild(b);
  });
  area.appendChild(mkBtn('Skip','skip',()=>{ sessionQueue.push(currentCard); nextCard(); }));
}

/* ---------- Satzpuzzle (Distraktoren 40%) ---------- */
function normalizeSentence(s){
  return s.toLowerCase()
    .replace(/[.,!?;:()\\[\\]"“”„'«»]/g,'')
    .replace(/\\s+/g,' ')
    .trim();
}
function collectDeckWords(deck){
  const bag = new Set();
  deck.cards.forEach(c => {
    if (c.back) c.back.split(/\\s+/).forEach(w => bag.add(w.toLowerCase()));
    if (c.example) c.example.split(/\\s+/).forEach(w => bag.add(w.toLowerCase()));
  });
  return Array.from(bag);
}
function showSentencePuzzle(){
  const target = (currentCard.example && currentCard.example.split(/\\s+/).length>=2) ? currentCard.example : currentCard.back;
  const words = target.split(/\\s+/);

  // 40% zusätzliche Wörter (min 2, max +8)
  const deckBag = currentDeck ? collectDeckWords(currentDeck) : [];
  const distractors = new Set();
  const needed = Math.min(8, Math.max(2, Math.ceil(words.length * 0.4)));
  while (distractors.size < needed) {
    const useDeck = Math.random() < 0.6 && deckBag.length > 0;
    const pool = useDeck ? deckBag : DISTRACTOR_POOL;
    const w = pool[Math.floor(Math.random()*pool.length)];
    if (!words.map(s=>s.toLowerCase()).includes(w.toLowerCase())) distractors.add(w);
  }

  const bankWords = [...words, ...Array.from(distractors)].sort(()=>Math.random()-0.5);

  const area=document.getElementById('learningArea');
  area.innerHTML = `<div class="card"><div><b>Deutsch:</b> ${currentCard.front}</div></div>`; /* Kein Hinweistext */

  const wordBank=document.createElement('div'); wordBank.className='wordbank';
  const answerBox=document.createElement('div'); answerBox.className='answerbox';
  bankWords.forEach(w=>{
    const b=mkBtn(w,'',()=>{ answerBox.textContent += (answerBox.textContent?' ':'')+w; b.disabled=true; });
    wordBank.appendChild(b);
  });
  area.appendChild(wordBank); area.appendChild(answerBox);

  area.appendChild(mkBtn('Prüfen','',()=>{
    const given = answerBox.textContent.trim();
    const ok = normalizeSentence(given) === normalizeSentence(target);
    if(ok){
      area.appendChild(Object.assign(document.createElement('div'),{className:'feedback',textContent:'✅ Richtig!'}));
    }else{
      sessionQueue.splice(1,0,currentCard);
      const d=document.createElement('div'); d.className='feedback';
      d.innerHTML='❌ Falsch! Ziel war: <b>'+target+'</b>';
      area.appendChild(d);
    }
    area.appendChild(mkBtn('Weiter','',nextCard));
  }));

  area.appendChild(mkBtn('Skip','skip',()=>{ sessionQueue.push(currentCard); nextCard(); }));
}

/* ---------- Import/Export/Reset ---------- */
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
  lines.forEach(line=>{
    const p=line.split(';');
    if(p.length>=2){ currentDeck.cards.push({front:p[0], back:p[1], example:p[2]||''}); added++; }
  });
  saveState(); renderDecks(); alert(added+' Karten importiert.');
}
function exportDecks(){
  const blob=new Blob([JSON.stringify(STATE.decks || [],null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='decks.json'; a.click(); URL.revokeObjectURL(a.href);
}
function resetAll(){
  if(!confirm('Wirklich alles zurücksetzen? Lokale Daten werden gelöscht.')) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}
async function reloadExternalDecks(){
  if(!confirm('Externe decks.json neu laden und lokale Änderungen überschreiben?')) return;
  const newDecks = await loadExternalDecks();
  STATE.decks = newDecks;
  decks = STATE.decks;
  saveState();
  renderDecks();
  alert('Externe Decks neu geladen.');
}

window.addEventListener('DOMContentLoaded', bootstrap);
window.addEventListener('error',(e)=>{
  const box=document.getElementById('errorBox'); if(!box) return;
  box.style.display='block'; box.textContent='Fehler: '+(e.message||e.toString());
});
