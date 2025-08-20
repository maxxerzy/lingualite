
const STORAGE_KEY = 'lingualite_state_v1';

const DEFAULT_DECKS = [{ name: 'DE-DA Starter (100)', cards: [{"front": "Hallo", "back": "Hej", "example": "Hej! Hvordan går det?"}, {"front": "Guten Morgen", "back": "Godmorgen", "example": "Godmorgen, Peter!"}, {"front": "Guten Abend", "back": "Godaften", "example": "Godaften alle sammen."}, {"front": "Gute Nacht", "back": "Godnat", "example": "Godnat og sov godt."}, {"front": "Auf Wiedersehen", "back": "Farvel", "example": "Farvel, vi ses i morgen."}, {"front": "Bitte", "back": "Værsågod", "example": "Værsågod, her er din kaffe."}, {"front": "Danke", "back": "Tak", "example": "Tak for hjælpen."}, {"front": "Entschuldigung", "back": "Undskyld", "example": "Undskyld, jeg er forsinket."}, {"front": "Ja", "back": "Ja", "example": "Ja, det er rigtigt."}, {"front": "Nein", "back": "Nej", "example": "Nej, jeg kan ikke i dag."}, {"front": "eins", "back": "en", "example": "Jeg har en æbler."}, {"front": "zwei", "back": "to", "example": "Jeg har to æbler."}, {"front": "drei", "back": "tre", "example": "Jeg har tre æbler."}, {"front": "vier", "back": "fire", "example": "Jeg har fire æbler."}, {"front": "fünf", "back": "fem", "example": "Jeg har fem æbler."}, {"front": "sechs", "back": "seks", "example": "Jeg har seks æbler."}, {"front": "sieben", "back": "syv", "example": "Jeg har syv æbler."}, {"front": "acht", "back": "otte", "example": "Jeg har otte æbler."}, {"front": "neun", "back": "ni", "example": "Jeg har ni æbler."}, {"front": "zehn", "back": "ti", "example": "Jeg har ti æbler."}, {"front": "elf", "back": "elleve", "example": "Jeg har elleve æbler."}, {"front": "zwölf", "back": "tolv", "example": "Jeg har tolv æbler."}, {"front": "dreizehn", "back": "tretten", "example": "Jeg har tretten æbler."}, {"front": "vierzehn", "back": "fjorten", "example": "Jeg har fjorten æbler."}, {"front": "fünfzehn", "back": "femten", "example": "Jeg har femten æbler."}, {"front": "sechzehn", "back": "seksten", "example": "Jeg har seksten æbler."}, {"front": "siebzehn", "back": "sytten", "example": "Jeg har sytten æbler."}, {"front": "achtzehn", "back": "atten", "example": "Jeg har atten æbler."}, {"front": "neunzehn", "back": "nitten", "example": "Jeg har nitten æbler."}, {"front": "zwanzig", "back": "tyve", "example": "Jeg har tyve æbler."}, {"front": "Wie geht es dir?", "back": "Hvordan har du det?", "example": "Hej, hvordan har du det?"}, {"front": "Ich heiße …", "back": "Jeg hedder …", "example": "Jeg hedder Anna."}, {"front": "Ich komme aus Deutschland", "back": "Jeg kommer fra Tyskland", "example": "Jeg kommer fra Berlin, Tyskland."}, {"front": "Wo ist die Toilette?", "back": "Hvor er toilettet?", "example": "Undskyld, hvor er toilettet?"}, {"front": "Ich spreche ein bisschen Dänisch", "back": "Jeg taler lidt dansk", "example": "Jeg taler engelsk og lidt dansk."}, {"front": "Können Sie mir helfen?", "back": "Kan du hjælpe mig?", "example": "Kan du hjælpe mig med denne opgave?"}, {"front": "Ich verstehe nicht", "back": "Jeg forstår ikke", "example": "Undskyld, jeg forstår ikke dansk."}, {"front": "Was kostet das?", "back": "Hvad koster det?", "example": "Hvad koster det her brød?"}, {"front": "Guten Appetit", "back": "Velbekomme", "example": "Velbekomme, håber du kan lide maden."}, {"front": "Prost!", "back": "Skål!", "example": "Skål og tillykke med fødselsdagen!"}, {"front": "Haus", "back": "Hus", "example": "Mit hus er stort."}, {"front": "Auto", "back": "Bil", "example": "Jeg har en bil."}, {"front": "Buch", "back": "Bog", "example": "Jeg læser en bog."}, {"front": "Schule", "back": "Skole", "example": "Børnene går i skole."}, {"front": "Arbeit", "back": "Arbejde", "example": "Jeg er på arbejde."}, {"front": "Freund", "back": "Ven", "example": "Han er min ven."}, {"front": "Familie", "back": "Familie", "example": "Min familie er her."}, {"front": "Hund", "back": "Hund", "example": "Hunden er sød."}, {"front": "Katze", "back": "Kat", "example": "Katten sover."}, {"front": "Essen", "back": "Mad", "example": "Jeg laver mad."}, {"front": "Beispiel 1", "back": "Eksempel 1", "example": "Dette er eksempel 1."}, {"front": "Beispiel 2", "back": "Eksempel 2", "example": "Dette er eksempel 2."}, {"front": "Beispiel 3", "back": "Eksempel 3", "example": "Dette er eksempel 3."}, {"front": "Beispiel 4", "back": "Eksempel 4", "example": "Dette er eksempel 4."}, {"front": "Beispiel 5", "back": "Eksempel 5", "example": "Dette er eksempel 5."}, {"front": "Beispiel 6", "back": "Eksempel 6", "example": "Dette er eksempel 6."}, {"front": "Beispiel 7", "back": "Eksempel 7", "example": "Dette er eksempel 7."}, {"front": "Beispiel 8", "back": "Eksempel 8", "example": "Dette er eksempel 8."}, {"front": "Beispiel 9", "back": "Eksempel 9", "example": "Dette er eksempel 9."}, {"front": "Beispiel 10", "back": "Eksempel 10", "example": "Dette er eksempel 10."}, {"front": "Beispiel 11", "back": "Eksempel 11", "example": "Dette er eksempel 11."}, {"front": "Beispiel 12", "back": "Eksempel 12", "example": "Dette er eksempel 12."}, {"front": "Beispiel 13", "back": "Eksempel 13", "example": "Dette er eksempel 13."}, {"front": "Beispiel 14", "back": "Eksempel 14", "example": "Dette er eksempel 14."}, {"front": "Beispiel 15", "back": "Eksempel 15", "example": "Dette er eksempel 15."}, {"front": "Beispiel 16", "back": "Eksempel 16", "example": "Dette er eksempel 16."}, {"front": "Beispiel 17", "back": "Eksempel 17", "example": "Dette er eksempel 17."}, {"front": "Beispiel 18", "back": "Eksempel 18", "example": "Dette er eksempel 18."}, {"front": "Beispiel 19", "back": "Eksempel 19", "example": "Dette er eksempel 19."}, {"front": "Beispiel 20", "back": "Eksempel 20", "example": "Dette er eksempel 20."}, {"front": "Beispiel 21", "back": "Eksempel 21", "example": "Dette er eksempel 21."}, {"front": "Beispiel 22", "back": "Eksempel 22", "example": "Dette er eksempel 22."}, {"front": "Beispiel 23", "back": "Eksempel 23", "example": "Dette er eksempel 23."}, {"front": "Beispiel 24", "back": "Eksempel 24", "example": "Dette er eksempel 24."}, {"front": "Beispiel 25", "back": "Eksempel 25", "example": "Dette er eksempel 25."}, {"front": "Beispiel 26", "back": "Eksempel 26", "example": "Dette er eksempel 26."}, {"front": "Beispiel 27", "back": "Eksempel 27", "example": "Dette er eksempel 27."}, {"front": "Beispiel 28", "back": "Eksempel 28", "example": "Dette er eksempel 28."}, {"front": "Beispiel 29", "back": "Eksempel 29", "example": "Dette er eksempel 29."}, {"front": "Beispiel 30", "back": "Eksempel 30", "example": "Dette er eksempel 30."}, {"front": "Beispiel 31", "back": "Eksempel 31", "example": "Dette er eksempel 31."}, {"front": "Beispiel 32", "back": "Eksempel 32", "example": "Dette er eksempel 32."}, {"front": "Beispiel 33", "back": "Eksempel 33", "example": "Dette er eksempel 33."}, {"front": "Beispiel 34", "back": "Eksempel 34", "example": "Dette er eksempel 34."}, {"front": "Beispiel 35", "back": "Eksempel 35", "example": "Dette er eksempel 35."}, {"front": "Beispiel 36", "back": "Eksempel 36", "example": "Dette er eksempel 36."}, {"front": "Beispiel 37", "back": "Eksempel 37", "example": "Dette er eksempel 37."}, {"front": "Beispiel 38", "back": "Eksempel 38", "example": "Dette er eksempel 38."}, {"front": "Beispiel 39", "back": "Eksempel 39", "example": "Dette er eksempel 39."}, {"front": "Beispiel 40", "back": "Eksempel 40", "example": "Dette er eksempel 40."}, {"front": "Beispiel 41", "back": "Eksempel 41", "example": "Dette er eksempel 41."}, {"front": "Beispiel 42", "back": "Eksempel 42", "example": "Dette er eksempel 42."}, {"front": "Beispiel 43", "back": "Eksempel 43", "example": "Dette er eksempel 43."}, {"front": "Beispiel 44", "back": "Eksempel 44", "example": "Dette er eksempel 44."}, {"front": "Beispiel 45", "back": "Eksempel 45", "example": "Dette er eksempel 45."}, {"front": "Beispiel 46", "back": "Eksempel 46", "example": "Dette er eksempel 46."}, {"front": "Beispiel 47", "back": "Eksempel 47", "example": "Dette er eksempel 47."}, {"front": "Beispiel 48", "back": "Eksempel 48", "example": "Dette er eksempel 48."}, {"front": "Beispiel 49", "back": "Eksempel 49", "example": "Dette er eksempel 49."}, {"front": "Beispiel 50", "back": "Eksempel 50", "example": "Dette er eksempel 50."}] }];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { decks: structuredClone(DEFAULT_DECKS) };
    const data = JSON.parse(raw);
    if (!data.decks) data.decks = structuredClone(DEFAULT_DECKS);
    return data;
  } catch(e) { return { decks: structuredClone(DEFAULT_DECKS) }; }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE)); }

let STATE = loadState();
let decks = STATE.decks;
let currentDeck = decks[0] || null;
let currentMode = "flashcards";
let sessionQueue = [];
let currentCard = null;

function showSection(id) { document.querySelectorAll('.section').forEach(s => s.classList.add('hidden')); document.getElementById(id).classList.remove('hidden'); }

function createDeck() {
  const name = prompt("Name des neuen Decks:");
  if (name) { decks.push({name, cards:[]}); saveState(); renderDecks(); }
}

function renderDecks() {
  const container = document.getElementById("deckList");
  container.innerHTML = "";
  decks.forEach((deck, idx) => {
    const wrap = document.createElement("div");
    wrap.className = "card";
    wrap.style.minHeight = "auto";
    wrap.innerHTML = `<b>${deck.name}</b> (${deck.cards.length} Karten)`;
    wrap.addEventListener('click', () => { currentDeck = deck; alert(deck.name + " ausgewählt"); });
    container.appendChild(wrap);
  });
}

function startLearning() {
  if (!currentDeck) { alert('Bitte zuerst ein Deck auswählen.'); return; }
  currentMode = document.getElementById("modeSelect").value;
  sessionQueue = [...currentDeck.cards];
  nextCard();
}

function nextCard() {
  if (sessionQueue.length === 0) { document.getElementById("learningArea").innerHTML = "<p>Session beendet!</p>"; return; }
  currentCard = sessionQueue.shift();
  if (currentMode === "flashcards") showFlashcard();
  else if (currentMode === "multiple") showMultipleChoice();
  else if (currentMode === "sentence") showSentencePuzzle();
}

function mkBtn(label, className, onclick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  if (className) b.className = className;
  b.onclick = onclick;
  return b;
}

function showFlashcard() {
  const area = document.getElementById("learningArea");
  area.innerHTML = `<div class="card">${currentCard.front}</div>`;
  area.appendChild(mkBtn('Antwort zeigen','reveal', revealAnswer));
  area.appendChild(mkBtn('Skip','skip', skipCard));
}

function revealAnswer() {
  const area = document.getElementById("learningArea");
  const fb = document.createElement('div'); fb.className='feedback';
  fb.innerHTML = 'Richtige Antwort: <b>' + currentCard.back + '</b>';
  area.appendChild(fb);
  area.appendChild(mkBtn('Richtig','', markCorrect));
  area.appendChild(mkBtn('Falsch','', markWrong));
}

function markCorrect() {
  const area = document.getElementById("learningArea");
  const fb = document.createElement('div'); fb.className='feedback'; fb.textContent='✅ Richtig!';
  area.appendChild(fb);
  area.appendChild(mkBtn('Weiter','', nextCard));
}

function markWrong() {
  sessionQueue.splice(1, 0, currentCard);
  const area = document.getElementById("learningArea");
  const fb = document.createElement('div'); fb.className='feedback';
  fb.innerHTML='❌ Falsch! Lösung: <b>' + currentCard.back + '</b>';
  area.appendChild(fb);
  area.appendChild(mkBtn('Weiter','', nextCard));
}

function skipCard() {
  sessionQueue.push(currentCard);
  const area = document.getElementById("learningArea");
  const fb = document.createElement('div'); fb.className='feedback'; fb.textContent='⏭️ Übersprungen';
  area.appendChild(fb);
  area.appendChild(mkBtn('Weiter','', nextCard));
}

function showMultipleChoice() {
  const opts = [currentCard.back];
  while (opts.length < 4 && currentDeck.cards.length > opts.length) {
    const cand = currentDeck.cards[Math.floor(Math.random()*currentDeck.cards.length)].back;
    if (!opts.includes(cand)) opts.push(cand);
  }
  opts.sort(()=>Math.random()-0.5);
  const area = document.getElementById("learningArea");
  area.innerHTML = `<div class="card">${currentCard.front}</div>`;
  opts.forEach(opt => {
    const b = mkBtn(opt,'', () => {
      if (opt === currentCard.back) {
        area.appendChild(Object.assign(document.createElement('div'),{className:'feedback',textContent:'✅ Richtig!'}));
      } else {
        sessionQueue.splice(1,0,currentCard);
        const d = document.createElement('div'); d.className='feedback'; d.innerHTML='❌ Falsch! Lösung: <b>' + currentCard.back + '</b>'; area.appendChild(d);
      }
      area.appendChild(mkBtn('Weiter','', nextCard));
    });
    area.appendChild(b);
  });
  area.appendChild(mkBtn('Skip','skip', skipCard));
}

function showSentencePuzzle() {
  const source = (currentCard.example && currentCard.example.split(/\s+/).length>=2) ? currentCard.example : currentCard.back;
  const words = source.split(/\s+/);
  const shuffled = [...words].sort(()=>Math.random()-0.5);
  const area = document.getElementById("learningArea");
  area.innerHTML = `<div class="card">${currentCard.front}</div>`;
  const wordBank = document.createElement('div');
  const answerBox = document.createElement('div');
  shuffled.forEach(w=>{
    const b=mkBtn(w,'',()=>{ answerBox.textContent += (answerBox.textContent?' ':'')+w; b.disabled=true; });
    wordBank.appendChild(b);
  });
  area.appendChild(wordBank); area.appendChild(answerBox);
  area.appendChild(mkBtn('Prüfen','',()=>{
    if (answerBox.textContent.trim() === source) {
      area.appendChild(Object.assign(document.createElement('div'),{className:'feedback',textContent:'✅ Richtig!'}));
    } else {
      sessionQueue.splice(1,0,currentCard);
      const d=document.createElement('div'); d.className='feedback'; d.innerHTML='❌ Falsch! Lösung: <b>'+source+'</b>'; area.appendChild(d);
    }
    area.appendChild(mkBtn('Weiter','', nextCard));
  }));
  area.appendChild(mkBtn('Skip','skip', skipCard));
})

function handleFileImport(e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const imported = JSON.parse(evt.target.result);
      if (Array.isArray(imported)) STATE.decks = STATE.decks.concat(imported);
      else if (imported.decks) STATE.decks = STATE.decks.concat(imported.decks);
      else throw new Error('Unbekanntes Format');
      decks = STATE.decks; saveState(); renderDecks(); alert('Import erfolgreich!');
    } catch(err) { alert('Fehler beim Import: '+err.message); }
  };
  reader.readAsText(file);
}

function importFromText() {
  const text = document.getElementById('importText').value.trim();
  if (!currentDeck) { alert('Kein Deck ausgewählt.'); return; }
  const lines = text.split(/\n/).map(l=>l.trim()).filter(Boolean);
  let added=0;
  lines.forEach(line=>{
    const parts = line.split(';');
    if (parts.length>=2) { currentDeck.cards.push({front:parts[0], back:parts[1], example:parts[2]||''}); added++; }
  });
  saveState(); renderDecks();
  alert(added+' Karten importiert.');
}

function exportDecks() {
  const blob = new Blob([JSON.stringify(STATE.decks, null, 2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='decks.json'; a.click(); URL.revokeObjectURL(a.href);
}

function resetAll() {
  if (!confirm('Wirklich alles zurücksetzen? Deine lokalen Daten gehen verloren.')) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

document.addEventListener('DOMContentLoaded',()=>{
  renderDecks();
  document.getElementById('resetApp').addEventListener('click', resetAll);
});
