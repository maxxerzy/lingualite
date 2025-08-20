
const STORAGE_KEY = 'lingualite_state_v1';

/* Starterdeck kompakt – kann per Import erweitert werden */
const DEFAULT_DECKS = [{
  name: 'DE-DA Starter',
  cards: [
    {front:'Hallo', back:'Hej', example:'Hej! Hvordan går det?'},
    {front:'Guten Morgen', back:'Godmorgen', example:'Godmorgen, Peter!'},
    {front:'Danke', back:'Tak', example:'Mange tak!'},
    {front:'Ja', back:'Ja', example:'Ja, det er rigtigt.'},
    {front:'Nein', back:'Nej', example:'Nej, jeg kan ikke.'},
    {front:'Ich heiße Max', back:'Jeg hedder Max', example:'Hej, jeg hedder Max.'}
  ]
}];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { decks: structuredClone(DEFAULT_DECKS) };
    const data = JSON.parse(raw);
    if (!data.decks) data.decks = structuredClone(DEFAULT_DECKS);
    return data;
  } catch(e) { return { decks: structuredClone(DEFAULT_DECKS) }; }
}
function saveState() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE)); } catch(e){} }

let STATE = loadState();
let decks = STATE.decks;
let currentDeck = decks[0] || null;
let currentMode = "flashcards";
let sessionQueue = [];
let currentCard = null;

function showSection(id){ document.querySelectorAll('.section').forEach(s=>s.classList.add('hidden')); document.getElementById(id).classList.remove('hidden'); }
function createDeck(){ const name = prompt('Name des neuen Decks:'); if(name){ decks.push({name, cards:[]}); saveState(); renderDecks(); } }

function renderDecks(){
  const container = document.getElementById('deckList');
  container.innerHTML = '';
  decks.forEach(deck => {
    const wrap = document.createElement('div');
    wrap.className = 'card'; wrap.style.minHeight='auto';
    wrap.innerHTML = `<b>${deck.name}</b> (${deck.cards.length} Karten)`;
    wrap.addEventListener('click', () => { currentDeck = deck; alert(deck.name + ' ausgewählt'); });
    container.appendChild(wrap);
  });
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

/* Flashcards */
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

/* Multiple Choice */
function showMultipleChoice(){
  const opts=[currentCard.back];
  while(opts.length<4 && currentDeck.cards.length>opts.length){
    const cand=currentDeck.cards[Math.floor(Math.random()*currentDeck.cards.length)].back;
    if(!opts.includes(cand)) opts.push(cand);
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

/* Satzpuzzle – strikte Übersetzung (normalisiert) */
function normalizeSentence(s){
  return s.toLowerCase().replace(/[.,!?;:()\\[\\]"“”„'«»]/g,'').replace(/\\s+/g,' ').trim();
}
function showSentencePuzzle(){
  const target = (currentCard.example && currentCard.example.split(/\\s+/).length>=2) ? currentCard.example : currentCard.back;
  const words = target.split(/\\s+/);
  const shuffled = [...words].sort(()=>Math.random()-0.5);
  const area=document.getElementById('learningArea');
  area.innerHTML = `<div class="card"><div><b>Deutsch:</b> ${currentCard.front}</div><div style="margin-top:.5rem; font-size:.95rem;"><i>Ziel auf Dänisch bauen</i></div></div>`;
  const wordBank=document.createElement('div'); const answerBox=document.createElement('div');
  shuffled.forEach(w=>{ const b=mkBtn(w,'',()=>{ answerBox.textContent += (answerBox.textContent?' ':'')+w; b.disabled=true; }); wordBank.appendChild(b); });
  area.appendChild(wordBank); area.appendChild(answerBox);
  area.appendChild(mkBtn('Prüfen','',()=>{
    const given = answerBox.textContent.trim();
    const ok = normalizeSentence(given) === normalizeSentence(target);
    if(ok){ area.appendChild(Object.assign(document.createElement('div'),{className:'feedback',textContent:'✅ Richtig!'})); }
    else { sessionQueue.splice(1,0,currentCard); const d=document.createElement('div'); d.className='feedback'; d.innerHTML='❌ Falsch! Ziel war: <b>'+target+'</b>'; area.appendChild(d); }
    area.appendChild(mkBtn('Weiter','',nextCard));
  }));
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
      STATE.decks = STATE.decks.concat(newDecks);
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
  const blob=new Blob([JSON.stringify(STATE.decks,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='decks.json'; a.click(); URL.revokeObjectURL(a.href);
}
function resetAll(){
  if(!confirm('Wirklich alles zurücksetzen? Lokale Daten werden gelöscht.')) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

window.addEventListener('DOMContentLoaded',()=>{
  renderDecks();
  const rb=document.getElementById('resetApp'); if(rb) rb.addEventListener('click', resetAll);
});
window.addEventListener('error',(e)=>{
  const box=document.getElementById('errorBox'); if(!box) return;
  box.style.display='block'; box.textContent='Fehler: '+(e.message||e.toString());
});
