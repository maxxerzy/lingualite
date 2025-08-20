let decks = [{
  name: "DE-DA Starter",
  cards: [
    {front: "Hallo", back: "Hej"},
    {front: "Danke", back: "Tak"},
    {front: "Wie geht's?", back: "Hvordan går det?"},
    {front: "Ich heiße...", back: "Jeg hedder..."},
    {front: "Guten Morgen", back: "Godmorgen"},
    {front: "Guten Abend", back: "Godaften"},
    {front: "Entschuldigung", back: "Undskyld"},
    {front: "Bitte", back: "Vær så venlig"},
    {front: "Auf Wiedersehen", back: "Farvel"},
    {front: "Ja", back: "Ja"},
    {front: "Nein", back: "Nej"},
    {front: "Ich verstehe nicht", back: "Jeg forstår ikke"},
    {front: "Wo ist der Bahnhof?", back: "Hvor er stationen?"},
    {front: "Ein Bier bitte", back: "En øl, tak"},
    {front: "Eine Fahrkarte", back: "En billet"}
  ]
}];

let currentDeck = null;
let currentMode = "flashcards";
let sessionQueue = [];
let currentCard = null;

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

function createDeck() {
  let name = prompt("Name des neuen Decks:");
  if (name) {
    decks.push({name: name, cards: []});
    renderDecks();
  }
}

function renderDecks() {
  let container = document.getElementById("deckList");
  container.innerHTML = "";
  decks.forEach((deck, idx) => {
    let div = document.createElement("div");
    div.textContent = deck.name + " (" + deck.cards.length + " Karten)";
    div.onclick = () => { currentDeck = deck; alert(deck.name + " ausgewählt"); };
    container.appendChild(div);
  });
}

function startLearning() {
  if (!currentDeck) { alert("Bitte ein Deck auswählen"); return; }
  currentMode = document.getElementById("modeSelect").value;
  sessionQueue = [...currentDeck.cards];
  nextCard();
}

function nextCard() {
  if (sessionQueue.length === 0) {
    document.getElementById("learningArea").innerHTML = "<p>Session beendet!</p>";
    return;
  }
  currentCard = sessionQueue.shift();
  if (currentMode === "flashcards") showFlashcard();
  else if (currentMode === "multiple") showMultipleChoice();
  else if (currentMode === "sentence") showSentencePuzzle();
}

function showFlashcard() {
  let area = document.getElementById("learningArea");
  area.innerHTML = `
    <div class="card">${currentCard.front}</div>
    <button onclick="revealAnswer()">Antwort zeigen</button>
    <button onclick="skipCard()">Skip</button>
  `;
}

function revealAnswer() {
  let area = document.getElementById("learningArea");
  area.innerHTML += `
    <div class="feedback">Richtige Antwort: ${currentCard.back}</div>
    <button onclick="markCorrect()">Richtig</button>
    <button onclick="markWrong()">Falsch</button>
  `;
}

function markCorrect() {
  document.getElementById("learningArea").innerHTML += `<div class="feedback">✅ Richtig!</div>
    <button onclick="nextCard()">Weiter</button>`;
}

function markWrong() {
  sessionQueue.splice(1, 0, currentCard);
  document.getElementById("learningArea").innerHTML += `<div class="feedback">❌ Falsch! Richtige Lösung: ${currentCard.back}</div>
    <button onclick="nextCard()">Weiter</button>`;
}

function skipCard() {
  sessionQueue.push(currentCard);
  document.getElementById("learningArea").innerHTML += `<div class="feedback">⏭️ Übersprungen</div>
    <button onclick="nextCard()">Weiter</button>`;
}

function showMultipleChoice() {
  let options = [currentCard.back];
  while (options.length < 4 && currentDeck.cards.length > options.length) {
    let candidate = currentDeck.cards[Math.floor(Math.random() * currentDeck.cards.length)].back;
    if (!options.includes(candidate)) options.push(candidate);
  }
  options.sort(() => Math.random() - 0.5);
  let area = document.getElementById("learningArea");
  area.innerHTML = `<div class="card">${currentCard.front}</div>`;
  options.forEach(opt => {
    let btn = document.createElement("button");
    btn.textContent = opt;
    btn.onclick = () => {
      if (opt === currentCard.back) {
        area.innerHTML += `<div class="feedback">✅ Richtig!</div><button onclick="nextCard()">Weiter</button>`;
      } else {
        sessionQueue.splice(1, 0, currentCard);
        area.innerHTML += `<div class="feedback">❌ Falsch! Lösung: ${currentCard.back}</div><button onclick="nextCard()">Weiter</button>`;
      }
    };
    area.appendChild(btn);
  });
  let skipBtn = document.createElement("button");
  skipBtn.textContent = "Skip";
  skipBtn.onclick = skipCard;
  area.appendChild(skipBtn);
}

function showSentencePuzzle() {
  let words = currentCard.back.split(" ");
  let shuffled = [...words].sort(() => Math.random() - 0.5);
  let area = document.getElementById("learningArea");
  area.innerHTML = `<div class="card">${currentCard.front}</div>`;
  let wordBank = document.createElement("div");
  let answerBox = document.createElement("div");
  shuffled.forEach(w => {
    let b = document.createElement("button");
    b.textContent = w;
    b.onclick = () => {
      answerBox.textContent += (answerBox.textContent ? " " : "") + w;
      b.disabled = true;
    };
    wordBank.appendChild(b);
  });
  area.appendChild(wordBank);
  area.appendChild(answerBox);
  let checkBtn = document.createElement("button");
  checkBtn.textContent = "Prüfen";
  checkBtn.onclick = () => {
    if (answerBox.textContent.trim() === currentCard.back) {
      area.innerHTML += `<div class="feedback">✅ Richtig!</div><button onclick="nextCard()">Weiter</button>`;
    } else {
      sessionQueue.splice(1, 0, currentCard);
      area.innerHTML += `<div class="feedback">❌ Falsch! Lösung: ${currentCard.back}</div><button onclick="nextCard()">Weiter</button>`;
    }
  };
  area.appendChild(checkBtn);
  let skipBtn = document.createElement("button");
  skipBtn.textContent = "Skip";
  skipBtn.onclick = skipCard;
  area.appendChild(skipBtn);
}

function handleFileImport(e) {
  let file = e.target.files[0];
  let reader = new FileReader();
  reader.onload = function(evt) {
    try {
      let imported = JSON.parse(evt.target.result);
      decks = decks.concat(imported);
      renderDecks();
      alert("Import erfolgreich!");
    } catch (err) { alert("Fehler beim Import"); }
  };
  reader.readAsText(file);
}

function importFromText() {
  let text = document.getElementById("importText").value.trim();
  if (!currentDeck) { alert("Bitte ein Deck auswählen"); return; }
  let lines = text.split("\n");
  lines.forEach(line => {
    let parts = line.split(";");
    if (parts.length >= 2) {
      currentDeck.cards.push({front: parts[0], back: parts[1], example: parts[2] || ""});
    }
  });
  renderDecks();
}

function exportDecks() {
  let blob = new Blob([JSON.stringify(decks)], {type: "application/json"});
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "decks.json";
  a.click();
}

renderDecks();
