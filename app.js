
const STORAGE_KEY = 'lingualite_state_v1';

const DEFAULT_DECKS = [{ name: 'DE-DA Starter (100)', cards: [{'front': 'Hallo', 'back': 'Hej', 'example': 'Hej! Hvordan går det?'}, {'front': 'Guten Morgen', 'back': 'Godmorgen', 'example': 'Godmorgen, Peter!'}, {'front': 'Danke', 'back': 'Tak', 'example': 'Mange tak!'}, {'front': 'Ja', 'back': 'Ja', 'example': 'Ja, det er rigtigt.'}, {'front': 'Nein', 'back': 'Nej', 'example': 'Nej, jeg kan ikke.'}, {'front': 'Ich heiße Max', 'back': 'Jeg hedder Max', 'example': 'Hej, jeg hedder Max.'}, {'front': 'Wie geht es dir?', 'back': 'Hvordan går det?', 'example': 'Hvordan går det med dig?'}, {'front': 'Wo ist der Bahnhof?', 'back': 'Hvor er banegården?', 'example': 'Undskyld, hvor er banegården?'}, {'front': 'Eins', 'back': 'En', 'example': 'En, to, tre'}, {'front': 'Zwei', 'back': 'To', 'example': 'To æbler'}, {'front': 'Beispiel 11', 'back': 'Eksempel 11', 'example': 'Dette er eksempel 11.'}, {'front': 'Beispiel 12', 'back': 'Eksempel 12', 'example': 'Dette er eksempel 12.'}, {'front': 'Beispiel 13', 'back': 'Eksempel 13', 'example': 'Dette er eksempel 13.'}, {'front': 'Beispiel 14', 'back': 'Eksempel 14', 'example': 'Dette er eksempel 14.'}, {'front': 'Beispiel 15', 'back': 'Eksempel 15', 'example': 'Dette er eksempel 15.'}, {'front': 'Beispiel 16', 'back': 'Eksempel 16', 'example': 'Dette er eksempel 16.'}, {'front': 'Beispiel 17', 'back': 'Eksempel 17', 'example': 'Dette er eksempel 17.'}, {'front': 'Beispiel 18', 'back': 'Eksempel 18', 'example': 'Dette er eksempel 18.'}, {'front': 'Beispiel 19', 'back': 'Eksempel 19', 'example': 'Dette er eksempel 19.'}, {'front': 'Beispiel 20', 'back': 'Eksempel 20', 'example': 'Dette er eksempel 20.'}, {'front': 'Beispiel 21', 'back': 'Eksempel 21', 'example': 'Dette er eksempel 21.'}, {'front': 'Beispiel 22', 'back': 'Eksempel 22', 'example': 'Dette er eksempel 22.'}, {'front': 'Beispiel 23', 'back': 'Eksempel 23', 'example': 'Dette er eksempel 23.'}, {'front': 'Beispiel 24', 'back': 'Eksempel 24', 'example': 'Dette er eksempel 24.'}, {'front': 'Beispiel 25', 'back': 'Eksempel 25', 'example': 'Dette er eksempel 25.'}, {'front': 'Beispiel 26', 'back': 'Eksempel 26', 'example': 'Dette er eksempel 26.'}, {'front': 'Beispiel 27', 'back': 'Eksempel 27', 'example': 'Dette er eksempel 27.'}, {'front': 'Beispiel 28', 'back': 'Eksempel 28', 'example': 'Dette er eksempel 28.'}, {'front': 'Beispiel 29', 'back': 'Eksempel 29', 'example': 'Dette er eksempel 29.'}, {'front': 'Beispiel 30', 'back': 'Eksempel 30', 'example': 'Dette er eksempel 30.'}, {'front': 'Beispiel 31', 'back': 'Eksempel 31', 'example': 'Dette er eksempel 31.'}, {'front': 'Beispiel 32', 'back': 'Eksempel 32', 'example': 'Dette er eksempel 32.'}, {'front': 'Beispiel 33', 'back': 'Eksempel 33', 'example': 'Dette er eksempel 33.'}, {'front': 'Beispiel 34', 'back': 'Eksempel 34', 'example': 'Dette er eksempel 34.'}, {'front': 'Beispiel 35', 'back': 'Eksempel 35', 'example': 'Dette er eksempel 35.'}, {'front': 'Beispiel 36', 'back': 'Eksempel 36', 'example': 'Dette er eksempel 36.'}, {'front': 'Beispiel 37', 'back': 'Eksempel 37', 'example': 'Dette er eksempel 37.'}, {'front': 'Beispiel 38', 'back': 'Eksempel 38', 'example': 'Dette er eksempel 38.'}, {'front': 'Beispiel 39', 'back': 'Eksempel 39', 'example': 'Dette er eksempel 39.'}, {'front': 'Beispiel 40', 'back': 'Eksempel 40', 'example': 'Dette er eksempel 40.'}, {'front': 'Beispiel 41', 'back': 'Eksempel 41', 'example': 'Dette er eksempel 41.'}, {'front': 'Beispiel 42', 'back': 'Eksempel 42', 'example': 'Dette er eksempel 42.'}, {'front': 'Beispiel 43', 'back': 'Eksempel 43', 'example': 'Dette er eksempel 43.'}, {'front': 'Beispiel 44', 'back': 'Eksempel 44', 'example': 'Dette er eksempel 44.'}, {'front': 'Beispiel 45', 'back': 'Eksempel 45', 'example': 'Dette er eksempel 45.'}, {'front': 'Beispiel 46', 'back': 'Eksempel 46', 'example': 'Dette er eksempel 46.'}, {'front': 'Beispiel 47', 'back': 'Eksempel 47', 'example': 'Dette er eksempel 47.'}, {'front': 'Beispiel 48', 'back': 'Eksempel 48', 'example': 'Dette er eksempel 48.'}, {'front': 'Beispiel 49', 'back': 'Eksempel 49', 'example': 'Dette er eksempel 49.'}, {'front': 'Beispiel 50', 'back': 'Eksempel 50', 'example': 'Dette er eksempel 50.'}, {'front': 'Beispiel 51', 'back': 'Eksempel 51', 'example': 'Dette er eksempel 51.'}, {'front': 'Beispiel 52', 'back': 'Eksempel 52', 'example': 'Dette er eksempel 52.'}, {'front': 'Beispiel 53', 'back': 'Eksempel 53', 'example': 'Dette er eksempel 53.'}, {'front': 'Beispiel 54', 'back': 'Eksempel 54', 'example': 'Dette er eksempel 54.'}, {'front': 'Beispiel 55', 'back': 'Eksempel 55', 'example': 'Dette er eksempel 55.'}, {'front': 'Beispiel 56', 'back': 'Eksempel 56', 'example': 'Dette er eksempel 56.'}, {'front': 'Beispiel 57', 'back': 'Eksempel 57', 'example': 'Dette er eksempel 57.'}, {'front': 'Beispiel 58', 'back': 'Eksempel 58', 'example': 'Dette er eksempel 58.'}, {'front': 'Beispiel 59', 'back': 'Eksempel 59', 'example': 'Dette er eksempel 59.'}, {'front': 'Beispiel 60', 'back': 'Eksempel 60', 'example': 'Dette er eksempel 60.'}, {'front': 'Beispiel 61', 'back': 'Eksempel 61', 'example': 'Dette er eksempel 61.'}, {'front': 'Beispiel 62', 'back': 'Eksempel 62', 'example': 'Dette er eksempel 62.'}, {'front': 'Beispiel 63', 'back': 'Eksempel 63', 'example': 'Dette er eksempel 63.'}, {'front': 'Beispiel 64', 'back': 'Eksempel 64', 'example': 'Dette er eksempel 64.'}, {'front': 'Beispiel 65', 'back': 'Eksempel 65', 'example': 'Dette er eksempel 65.'}, {'front': 'Beispiel 66', 'back': 'Eksempel 66', 'example': 'Dette er eksempel 66.'}, {'front': 'Beispiel 67', 'back': 'Eksempel 67', 'example': 'Dette er eksempel 67.'}, {'front': 'Beispiel 68', 'back': 'Eksempel 68', 'example': 'Dette er eksempel 68.'}, {'front': 'Beispiel 69', 'back': 'Eksempel 69', 'example': 'Dette er eksempel 69.'}, {'front': 'Beispiel 70', 'back': 'Eksempel 70', 'example': 'Dette er eksempel 70.'}, {'front': 'Beispiel 71', 'back': 'Eksempel 71', 'example': 'Dette er eksempel 71.'}, {'front': 'Beispiel 72', 'back': 'Eksempel 72', 'example': 'Dette er eksempel 72.'}, {'front': 'Beispiel 73', 'back': 'Eksempel 73', 'example': 'Dette er eksempel 73.'}, {'front': 'Beispiel 74', 'back': 'Eksempel 74', 'example': 'Dette er eksempel 74.'}, {'front': 'Beispiel 75', 'back': 'Eksempel 75', 'example': 'Dette er eksempel 75.'}, {'front': 'Beispiel 76', 'back': 'Eksempel 76', 'example': 'Dette er eksempel 76.'}, {'front': 'Beispiel 77', 'back': 'Eksempel 77', 'example': 'Dette er eksempel 77.'}, {'front': 'Beispiel 78', 'back': 'Eksempel 78', 'example': 'Dette er eksempel 78.'}, {'front': 'Beispiel 79', 'back': 'Eksempel 79', 'example': 'Dette er eksempel 79.'}, {'front': 'Beispiel 80', 'back': 'Eksempel 80', 'example': 'Dette er eksempel 80.'}, {'front': 'Beispiel 81', 'back': 'Eksempel 81', 'example': 'Dette er eksempel 81.'}, {'front': 'Beispiel 82', 'back': 'Eksempel 82', 'example': 'Dette er eksempel 82.'}, {'front': 'Beispiel 83', 'back': 'Eksempel 83', 'example': 'Dette er eksempel 83.'}, {'front': 'Beispiel 84', 'back': 'Eksempel 84', 'example': 'Dette er eksempel 84.'}, {'front': 'Beispiel 85', 'back': 'Eksempel 85', 'example': 'Dette er eksempel 85.'}, {'front': 'Beispiel 86', 'back': 'Eksempel 86', 'example': 'Dette er eksempel 86.'}, {'front': 'Beispiel 87', 'back': 'Eksempel 87', 'example': 'Dette er eksempel 87.'}, {'front': 'Beispiel 88', 'back': 'Eksempel 88', 'example': 'Dette er eksempel 88.'}, {'front': 'Beispiel 89', 'back': 'Eksempel 89', 'example': 'Dette er eksempel 89.'}, {'front': 'Beispiel 90', 'back': 'Eksempel 90', 'example': 'Dette er eksempel 90.'}, {'front': 'Beispiel 91', 'back': 'Eksempel 91', 'example': 'Dette er eksempel 91.'}, {'front': 'Beispiel 92', 'back': 'Eksempel 92', 'example': 'Dette er eksempel 92.'}, {'front': 'Beispiel 93', 'back': 'Eksempel 93', 'example': 'Dette er eksempel 93.'}, {'front': 'Beispiel 94', 'back': 'Eksempel 94', 'example': 'Dette er eksempel 94.'}, {'front': 'Beispiel 95', 'back': 'Eksempel 95', 'example': 'Dette er eksempel 95.'}, {'front': 'Beispiel 96', 'back': 'Eksempel 96', 'example': 'Dette er eksempel 96.'}, {'front': 'Beispiel 97', 'back': 'Eksempel 97', 'example': 'Dette er eksempel 97.'}, {'front': 'Beispiel 98', 'back': 'Eksempel 98', 'example': 'Dette er eksempel 98.'}, {'front': 'Beispiel 99', 'back': 'Eksempel 99', 'example': 'Dette er eksempel 99.'}, {'front': 'Beispiel 100', 'back': 'Eksempel 100', 'example': 'Dette er eksempel 100.'}] }];

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

function showFlashcard(){
  const area=document.getElementById('learningArea');
  area.innerHTML = `<div class="card">${currentCard.front}</div>`;
  area.appendChild(mkBtn('Antwort zeigen','reveal',revealAnswer));
  area.appendChild(mkBtn('Skip','skip',skipCard));
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
function skipCard(){
  sessionQueue.push(currentCard);
  const area=document.getElementById('learningArea');
  area.appendChild(Object.assign(document.createElement('div'),{className:'feedback',textContent:'⏭️ Übersprungen'}));
  area.appendChild(mkBtn('Weiter','',nextCard));
}

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
  area.appendChild(mkBtn('Skip','skip',skipCard));
}

function showSentencePuzzle(){
  const source = (currentCard.example && currentCard.example.split(/\s+/).length>=2) ? currentCard.example : currentCard.back;
  const words = source.split(/\s+/);
  const shuffled = [...words].sort(()=>Math.random()-0.5);
  const area=document.getElementById('learningArea');
  area.innerHTML = `<div class="card">${currentCard.front}</div>`;
  const wordBank=document.createElement('div');
  const answerBox=document.createElement('div');
  shuffled.forEach(w=>{
    const b=mkBtn(w,'',()=>{ answerBox.textContent += (answerBox.textContent?' ':'')+w; b.disabled=true; });
    wordBank.appendChild(b);
  });
  area.appendChild(wordBank); area.appendChild(answerBox);
  area.appendChild(mkBtn('Prüfen','',()=>{
    if(answerBox.textContent.trim()===source){
      area.appendChild(Object.assign(document.createElement('div'),{className:'feedback',textContent:'✅ Richtig!'}));
    }else{
      sessionQueue.splice(1,0,currentCard);
      const d=document.createElement('div'); d.className='feedback'; d.innerHTML='❌ Falsch! Lösung: <b>'+source+'</b>'; area.appendChild(d);
    }
    area.appendChild(mkBtn('Weiter','',nextCard));
  }));
  area.appendChild(mkBtn('Skip','skip',skipCard));
}

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
  const lines=text.split(/\n/).map(l=>l.trim()).filter(Boolean);
  let added=0;
  lines.forEach(line=>{
    const p=line.split(';');
    if(p.length>=2){ currentDeck.cards.push({front:p[0], back:p[1], example:p[2]||''}); added++; }
  });
  saveState(); renderDecks(); alert(added+' Karten importiert.');
}

function exportDecks(){
  const blob=new Blob([JSON.stringify(STATE.decks,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='decks.json'; a.click(); URL.revokeObjectURL(a.href);
}

function resetAll(){
  if(!confirm('Wirklich alles zurücksetzen? Deine lokalen Daten gehen verloren.')) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

window.addEventListener('DOMContentLoaded',()=>{
  renderDecks();
  const rb=document.getElementById('resetApp');
  if(rb) rb.addEventListener('click', resetAll);
});

window.addEventListener('error', (e)=>{
  const box = document.getElementById('errorBox');
  if(!box) return;
  box.style.display='block';
  box.textContent = 'Fehler: ' + (e.message || e.toString());
});
