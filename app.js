// LinguaLite – Pastell Theme, modular JS
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const todayKey = () => new Date().toISOString().slice(0,10);
const normalize = (s, accentInsensitive=true) => { let r=(s||"").toLowerCase().trim(); return accentInsensitive ? r.normalize('NFD').replace(/\p{Diacritic}+/gu,'') : r; };
function lev(a,b){ a=a||""; b=b||""; const m=a.length,n=b.length; if(!m)return n; if(!n)return m; const dp=new Array(n+1); for(let j=0;j<=n;j++) dp[j]=j; for(let i=1;i<=m;i++){ let prev=dp[0]; dp[0]=i; for(let j=1;j<=n;j++){ const tmp=dp[j]; dp[j]=Math.min(dp[j]+1, dp[j-1]+1, prev + (a[i-1]===b[j-1]?0:1)); prev=tmp; } } return dp[n]; }
const shuffle = (arr)=>arr.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
function download(filename, dataStr){ const blob=new Blob([dataStr],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url); }

const STORAGE_KEY = 'lingualite_pastell_v1';
function term(front, back, example='', tags=''){ return { id: crypto.randomUUID(), front, back, example, tags, due: todayKey(), ease: 2.5, interval: 0, reps: 0, lapses: 0, lastGrade: null, learnedOnce: false }; }

// Startdata (DE->DA >= 60)
const START_DE_DA = [["Hallo", "hej", "Hej! Hvordan går det?", "begrüßung"], ["Guten Morgen", "godmorgen", "Godmorgen!", "begrüßung"], ["Guten Abend", "god aften", "God aften!", "begrüßung"], ["Gute Nacht", "godnat", "Godnat og sov godt.", "begrüßung"], ["Tschüss", "hej hej", "Vi ses, hej hej!", "begrüßung"], ["Wie geht es dir?", "Hvordan har du det?", "Hvordan har du det i dag?", "smalltalk"], ["Mir geht es gut", "Jeg har det godt", "Tak, jeg har det godt.", "smalltalk"], ["Ich heiße Maxim", "Jeg hedder Maxim", "Hej, jeg hedder Maxim.", "vorstellung"], ["Ich komme aus Deutschland", "Jeg kommer fra Tyskland", "Jeg kommer fra Tyskland.", "vorstellung"], ["Ich spreche ein bisschen Dänisch", "Jeg taler lidt dansk", "Jeg taler kun lidt dansk.", "sprache"], ["Ja", "ja", "Ja, tak.", "grundwort"], ["Nein", "nej", "Nej, tak.", "grundwort"], ["Vielleicht", "måske", "Måske senere.", "grundwort"], ["Danke", "tak", "Mange tak!", "höflichkeit"], ["Danke schön", "mange tak", "Tusind tak!", "höflichkeit"], ["Bitte (gerne)", "velbekomme", "Tak! – Velbekomme.", "höflichkeit"], ["Entschuldigung", "undskyld", "Undskyld, jeg er forsinket.", "höflichkeit"], ["Hilfe!", "hjælp!", "Hjælp! Er der nogen?", "notfall"], ["Wo ist die Toilette?", "Hvor er toilettet?", "Undskyld, hvor er toilettet?", "reise"], ["Wie viel kostet das?", "Hvor meget koster det?", "Hvor meget koster det her?", "einkauf"], ["Zahlen bitte", "Jeg vil gerne betale", "Undskyld, jeg vil gerne betale.", "einkauf"], ["Ich hätte gern einen Kaffee", "Jeg vil gerne have en kaffe", "Jeg vil gerne have en kaffe, tak.", "cafe"], ["Wasser", "vand", "Et glas vand, tak.", "essen"], ["Brot", "brød", "Friskt brød smager godt.", "essen"], ["Zug", "tog", "Toget kommer om fem minutter.", "reise"], ["Bahnhof", "banegård", "Hvor er banegården?", "reise"], ["Krankenhaus", "hospital", "Hvor er det nærmeste hospital?", "reise"], ["links", "venstre", "Drej til venstre ved hjørnet.", "richtung"], ["rechts", "højre", "Drej til højre ved lyskrydset.", "richtung"], ["geradeaus", "lige ud", "Gå lige ud i to hundrede meter.", "richtung"], ["Ich verstehe nicht", "Jeg forstår ikke", "Undskyld, jeg forstår ikke.", "kommunikation"], ["Können Sie langsamer sprechen?", "Kan De tale langsommere?", "Kan du tale lidt langsommere?", "kommunikation"], ["Ich lerne Dänisch", "Jeg lærer dansk", "Jeg lærer dansk hver dag.", "sprache"], ["Woher kommst du?", "Hvor kommer du fra?", "Hvor kommer du fra?", "smalltalk"], ["Ich bin Schüler/Student", "Jeg er studerende", "Jeg er studerende i København.", "bildung"], ["Arzt", "læge", "Jeg skal tale med en læge.", "gesundheit"], ["Apotheke", "apotek", "Hvor er det nærmeste apotek?", "gesundheit"], ["Ich brauche Hilfe", "Jeg har brug for hjælp", "Jeg har brug for hjælp med dette.", "notfall"], ["Heute", "i dag", "Vi ses i dag.", "zeit"], ["Gestern", "i går", "I går var det koldt.", "zeit"], ["Morgen", "i morgen", "Vi mødes i morgen.", "zeit"], ["Montag", "mandag", "På mandag starter kurset.", "zeit"], ["Dienstag", "tirsdag", "Tirsdag passer godt.", "zeit"], ["Mittwoch", "onsdag", "Onsdag arbejder jeg hjemme.", "zeit"], ["Donnerstag", "torsdag", "Torsdag har jeg fri.", "zeit"], ["Freitag", "fredag", "Fredag aften spiser vi pizza.", "zeit"], ["Samstag", "lørdag", "Lørdag tager vi i byen.", "zeit"], ["Sonntag", "søndag", "Søndag slapper vi af.", "zeit"], ["eins", "en", "Jeg har kun en billet.", "zahlen"], ["zwei", "to", "To kaffe, tak.", "zahlen"], ["drei", "tre", "Jeg køber tre æbler.", "zahlen"], ["vier", "fire", "Fire personer venter.", "zahlen"], ["fünf", "fem", "Den koster fem kroner.", "zahlen"], ["gut", "god", "Det er en god idé.", "adjektiv"], ["schlecht", "dårlig", "Det er en dårlig plan.", "adjektiv"], ["groß", "stor", "Huset er stort.", "adjektiv"], ["klein", "lille", "Lejligheden er lille.", "adjektiv"], ["schnell", "hurtig", "Toget er hurtigt.", "adjektiv"], ["langsam", "langsom", "Han er lidt langsom i dag.", "adjektiv"], ["essen", "spise", "Vi skal spise nu.", "verb"], ["trinken", "drikke", "Jeg vil drikke vand.", "verb"], ["gehen", "gå", "Vi går hjem nu.", "verb"], ["fahren", "køre", "Vi kører til byen.", "verb"], ["können", "kunne", "Kan du hjælpe mig?", "verb"], ["mögen", "kunne lide", "Jeg kan lide kaffe.", "verb"], ["Ich bin hungrig", "Jeg er sulten", "Jeg er meget sulten.", "alltag"], ["Ich bin durstig", "Jeg er tørstig", "Jeg er lidt tørstig.", "alltag"], ["Ich bin müde", "Jeg er træt", "Jeg er meget træt i dag.", "alltag"], ["Wie spät ist es?", "Hvad er klokken?", "Undskyld, hvad er klokken?", "zeit"], ["Wo wohnt ihr?", "Hvor bor I?", "Hvor bor I i København?", "smalltalk"], ["Ich wohne in Berlin", "Jeg bor i Berlin", "Jeg bor i Berlin med min familie.", "smalltalk"], ["Kann ich mit Karte zahlen?", "Kan jeg betale med kort?", "Kan jeg betale med kort her?", "einkauf"], ["Rechnung bitte", "Kan jeg få regningen?", "Kan jeg få regningen, tak?", "einkauf"], ["Wo ist der Supermarkt?", "Hvor er supermarkedet?", "Hvor er det nærmeste supermarked?", "stadt"], ["Das schmeckt gut", "Det smager godt", "Maden smager virkelig godt.", "essen"], ["Ich habe eine Reservierung", "Jeg har en reservation", "Jeg har en reservation klokken syv.", "reise"], ["Ich suche die Adresse", "Jeg leder efter adressen", "Jeg leder efter adressen på skolen.", "stadt"], ["Ich brauche einen Termin", "Jeg har brug for en tid", "Jeg har brug for en tid hos lægen.", "gesundheit"], ["Ich verstehe", "Jeg forstår", "Jeg forstår nu.", "kommunikation"], ["Ich weiß es nicht", "Jeg ved det ikke", "Jeg ved det ikke endnu.", "kommunikation"], ["Kein Problem", "Intet problem", "Det er intet problem.", "kommunikation"], ["Gern geschehen", "Det var så lidt", "Tak! – Det var så lidt.", "höflichkeit"], ["Herzlichen Glückwunsch", "Tillykke", "Tillykke med fødselsdagen!", "anlass"], ["Gute Besserung", "God bedring", "God bedring!", "gesundheit"]];

const defaultData = {
  settings: { newPerDay: 25, accentInsensitive: true, tts: false, voiceURI: '' },
  stats: { xp: 0, streak: 0, lastDay: todayKey(), learnedToday: 0 },
  decks: [
    { id: crypto.randomUUID(), name: 'DE → EN (Beispiel)', src: 'DE', tgt: 'EN', cards: [
      term('Haus','house','Das Haus ist groß.','alltag'),
      term('lernen','to learn','Ich lerne Deutsch.','verb')
    ]},
    (function(){
      const d = { id: crypto.randomUUID(), name: 'DE → DA (Startdeck)', src: 'DE', tgt: 'DA', cards: [] };
      START_DE_DA.forEach(x=> d.cards.push(term(x[0],x[1],x[2],x[3])));
      return d;
    })()
  ]
};

function load(){
  try{ const raw=localStorage.getItem(STORAGE_KEY); if(!raw) return structuredClone(defaultData);
    const data=JSON.parse(raw);
    data.settings ||= defaultData.settings;
    data.stats ||= defaultData.stats;
    data.decks ||= [];
    data.decks.forEach(d=> d.cards.forEach(c=> { if(c.learnedOnce===undefined) c.learnedOnce=false; }));
    return data;
  }catch(e){ return structuredClone(defaultData); }
}
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(DB)); renderTopBar(); }

let DB = load();

function updateDay(){
  const today=todayKey(); const last=DB.stats.lastDay;
  if(last!==today){
    const yesterday=new Date(last);
    const diff=Math.round((new Date(today)-yesterday)/86400000);
    if(diff===1 && DB.stats.learnedToday>0) DB.stats.streak+=1; else if(diff>1) DB.stats.streak=0;
    DB.stats.learnedToday=0; DB.stats.lastDay=today; save();
  }
}
updateDay();

// Scheduler: SM-2-ish; wrong => immediate requeue; skip => neutral (no schedule/XP), requeue to end once
function schedule(card, grade){
  // grade: 0=Again(Falsch), 1=Hard, 2=Good, 3=Easy
  const q = [0,3,4,5][grade]; // map to SM2 quality
  if(grade===-1){ // skip: do nothing on scheduling
    return;
  }
  card.reps = (card.reps||0)+1;
  let ef = card.ease || 2.5;
  ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if(ef<1.3) ef=1.3; if(ef>3.0) ef=3.0;
  card.ease=ef;
  if(q<3){ card.interval=0; card.lapses=(card.lapses||0)+1; card.learnedOnce=false; }
  else {
    if(card.interval===0) card.interval=1;
    else if(card.interval===1) card.interval=6;
    else card.interval=Math.round(card.interval*ef);
    card.learnedOnce=true;
  }
  const next=new Date(); next.setDate(next.getDate()+card.interval); card.due=next.toISOString().slice(0,10); card.lastGrade=grade;
}

const isDue = (c)=> c.due <= todayKey();

let SESSION = null; // { deckId, mode, queue, current, correctFirstTry, skipSet:Set }

function startSession(){
  const deckId = $('#deckSelect').value;
  const mode = $('#modeSelect').value;
  const deck = DB.decks.find(d=>d.id===deckId);
  if(!deck){ $('#cardArea').innerHTML='<p class="muted">Bitte ein Deck wählen.</p>'; return; }
  const due = deck.cards.filter(isDue);
  const newCards = deck.cards.filter(c=>c.reps===0).slice(0, DB.settings.newPerDay);
  let pool = [...due, ...newCards];
  if(mode==='puzzle') pool = pool.filter(c=> (c.example && c.example.trim().split(/\s+/).length>=3));
  if(pool.length===0){ $('#cardArea').innerHTML='<p class="muted">Keine passenden Karten. Anderen Modus wählen oder Beispiele ergänzen.</p>'; return; }
  const queue = shuffle(pool).map(c=>c.id);
  SESSION = { deckId: deck.id, mode, queue, current: null, correctFirstTry: true, skipSet: new Set() };
  $('#sessionInfo').textContent = `${queue.length} Karten · Modus: ${modeLabel(mode)}`;
  nextCard();
}
const modeLabel = (m)=> m==='flash'?'Flashcards':(m==='mc'?'Multiple Choice':(m==='write'?'Schreiben':'Satzpuzzle'));

function nextCard(){
  const area = $('#cardArea');
  if(!SESSION || SESSION.queue.length===0){
    area.innerHTML='<p class="muted">Session beendet. Starte eine neue oder wechsle das Deck.</p>';
    SESSION=null; renderTopBar(); return;
  }
  const deck = DB.decks.find(d=>d.id===SESSION.deckId);
  const id = SESSION.queue.shift();
  const card = deck.cards.find(c=>c.id===id);
  SESSION.current=card; SESSION.correctFirstTry=true;

  if(SESSION.mode==='flash') renderFlash(card);
  else if(SESSION.mode==='mc') renderMC(card, deck);
  else if(SESSION.mode==='write') renderWrite(card);
  else renderPuzzle(card);
}

function awardXP(kind){
  // kind: 'correct'|'wrong'|'skip'
  if(kind==='correct'){
    DB.stats.xp += 10;
    DB.stats.learnedToday += 1;
  } else if(kind==='wrong'){
    // no XP
  } else if(kind==='skip'){
    // no XP
  }
}

function makeBottomControls(){
  const bar = document.createElement('div');
  bar.className = 'row';
  const skip = document.createElement('button'); skip.className='btn'; skip.textContent='Skip';
  skip.onclick = onSkip;
  const again = document.createElement('button'); again.className='btn'; again.textContent='Wieder';
  again.onclick = ()=> onGrade(0);
  const hard = document.createElement('button'); hard.className='btn'; hard.textContent='Schwer';
  hard.onclick = ()=> onGrade(1);
  const good = document.createElement('button'); good.className='btn success'; good.textContent='Gut';
  good.onclick = ()=> onGrade(2);
  const easy = document.createElement('button'); easy.className='btn primary'; easy.textContent='Leicht';
  easy.onclick = ()=> onGrade(3);
  bar.append(skip, again, hard, good, easy);
  return bar;
}

function renderFlash(card){
  const area=$('#cardArea');
  area.innerHTML = `
    <div class="qbox">
      <div class="hint">Frage</div>
      <div class="qtext">${escapeHTML(card.front)}</div>
      <button id="reveal" class="btn">Antwort zeigen</button>
      <div id="answerBox" class="abox hidden">
        <div class="hint">Antwort</div>
        <div class="atext">${escapeHTML(card.back)}</div>
        ${card.example?`<div class="muted">${escapeHTML(card.example)}</div>`:''}
      </div>
      <div id="feedback" class="fb"></div>
    </div>`;
  $('#reveal').onclick=()=> $('#answerBox').classList.remove('hidden');
  area.appendChild(makeBottomControls());
}

function renderMC(card, deck){
  const area=$('#cardArea');
  const others = shuffle(deck.cards.filter(c=>c.id!==card.id)).slice(0,3).map(c=>c.back);
  const opts = shuffle([card.back, ...others]);
  area.innerHTML = `
    <div class="qbox">
      <div class="hint">Wähle die richtige Übersetzung</div>
      <div class="qtext">${escapeHTML(card.front)}</div>
      <div id="mcOpts" class="grid4"></div>
      <div id="feedback" class="fb"></div>
    </div>`;
  const box = $('#mcOpts');
  opts.forEach(opt=>{
    const btn=document.createElement('button');
    btn.className='btn opt';
    btn.textContent=opt;
    btn.onclick=()=>{
      const correct = normalize(opt, DB.settings.accentInsensitive)===normalize(card.back, DB.settings.accentInsensitive);
      if(correct){ $('#feedback').innerHTML='<div class="ok">Richtig ✓</div>'; awardXP('correct'); onGrade(2, true); }
      else { SESSION.correctFirstTry=false; $('#feedback').innerHTML=`<div class="bad">Falsch ✗ – richtig: <b>${escapeHTML(card.back)}</b></div>`; onGrade(0,false); }
    };
    box.appendChild(btn);
  });
  area.appendChild(makeBottomControls());
}

function renderWrite(card){
  const area=$('#cardArea');
  area.innerHTML = `
    <div class="qbox">
      <div class="hint">Schreibe die Übersetzung</div>
      <div class="qtext">${escapeHTML(card.front)}</div>
      <input id="answerInput" class="input" placeholder="Antwort eingeben" />
      <div class="row">
        <button id="checkAnswer" class="btn success">Prüfen</button>
        <button id="showAnswer" class="btn">Zeigen</button>
      </div>
      <div id="feedback" class="fb"></div>
    </div>`;
  $('#answerInput').focus();
  $('#checkAnswer').onclick = ()=>{
    const user=$('#answerInput').value;
    const a=normalize(user, DB.settings.accentInsensitive);
    const b=normalize(card.back, DB.settings.accentInsensitive);
    const distance=lev(a,b);
    const correct=(a===b)||(distance<=1 && b.length>4);
    if(correct){ $('#feedback').innerHTML='<div class="ok">Richtig ✓</div>'; awardXP('correct'); onGrade(2, true);}
    else { SESSION.correctFirstTry=false; $('#feedback').innerHTML=`<div class="bad">Falsch ✗ – richtig: <b>${escapeHTML(card.back)}</b></div>`; onGrade(0,false);}
  };
  $('#showAnswer').onclick = ()=>{ SESSION.correctFirstTry=false; $('#feedback').innerHTML = `<div>Antwort: <b>${escapeHTML(card.back)}</b></div>`; };
  area.appendChild(makeBottomControls());
}

function renderPuzzle(card){
  const area=$('#cardArea');
  const target = (card.example && card.example.trim().split(/\s+/).length>=3) ? card.example.trim() : card.back.trim();
  const tokens = target.split(/\s+/);
  const bank = shuffle(tokens.map((t,i)=>({t,i})));
  area.innerHTML = `
    <div class="qbox">
      <div class="hint">Baue den Satz in ${currentDeck()?.tgt || 'Zielsprache'}</div>
      <div class="qtext">${escapeHTML(card.front)}</div>
      <div class="sentence" id="assembled"></div>
      <div class="wordbank" id="wordbank"></div>
      <div class="row">
        <button id="checkPuzzle" class="btn success">Prüfen</button>
        <button id="clearPuzzle" class="btn">Zurücksetzen</button>
        <button id="showPuzzle" class="btn">Zeigen</button>
      </div>
      <div id="feedback" class="fb"></div>
    </div>`;
  const assembled = $('#assembled');
  const wb = $('#wordbank');
  bank.forEach((obj)=>{
    const pill=document.createElement('span'); pill.className='pill';
    const btn=document.createElement('button'); btn.className='btn chip'; btn.textContent=obj.t;
    btn.onclick=()=>{ assembled.appendChild(btn); };
    pill.appendChild(btn); wb.appendChild(pill);
  });
  $('#clearPuzzle').onclick=()=>{ assembled.innerHTML=''; wb.innerHTML=''; bank.forEach(o=>{ const pill=document.createElement('span'); pill.className='pill'; const btn=document.createElement('button'); btn.className='btn chip'; btn.textContent=o.t; btn.onclick=()=>{ assembled.appendChild(btn); }; pill.appendChild(btn); wb.appendChild(pill); }); };
  $('#showPuzzle').onclick=()=>{ SESSION.correctFirstTry=false; $('#feedback').innerHTML = `<div>Lösung: <b>${escapeHTML(target)}</b></div>`; };
  $('#checkPuzzle').onclick=()=>{
    const guess = Array.from(assembled.querySelectorAll('button')).map(b=>b.textContent).join(' ').trim();
    const correct = normalize(guess)===normalize(target);
    if(correct){ $('#feedback').innerHTML='<div class="ok">Richtig ✓</div>'; awardXP('correct'); onGrade(2,true); } 
    else { SESSION.correctFirstTry=false; $('#feedback').innerHTML=`<div class="bad">Falsch ✗ – richtig: <b>${escapeHTML(target)}</b></div>`; onGrade(0,false); }
  };
  area.appendChild(makeBottomControls());
}

function onSkip(){
  if(!SESSION?.current) return;
  // Requeue card ONCE to the end (no XP, no schedule). Prevent repeated requeues via skipSet.
  const id = SESSION.current.id;
  if(!SESSION.skipSet.has(id)){ SESSION.queue.push(id); SESSION.skipSet.add(id); }
  schedule(SESSION.current, -1); // no scheduling change
  save();
  nextCard();
}

function onGrade(grade, wasCorrect){
  const card=SESSION?.current; if(!card) return;
  // Wrong: show again sooner → push near front
  if(grade===0){
    schedule(card, 0);
    // push after 2 cards
    const pos = Math.min(2, SESSION.queue.length);
    SESSION.queue.splice(pos, 0, card.id);
    save(); nextCard();
    return;
  }
  // Hard/Good/Easy
  schedule(card, grade);
  save(); setTimeout(nextCard, 150);
}

function currentDeck(){ const deckId = $('#deckSelect')?.value; return DB.decks.find(d=>d.id===deckId) || DB.decks[0]; }

function renderDecks(){
  const list=$('#deckList'); list.innerHTML='';
  DB.decks.forEach(deck=>{
    const tpl=$('#deckItemTpl'); const node=tpl.content.cloneNode(true);
    $('.deck-title', node).textContent = `${deck.name} · ${deck.src} → ${deck.tgt}`;
    $('.deck-meta', node).textContent = `${deck.cards.length} Karten`;
    const tbody=$('.deck-cards', node);
    deck.cards.forEach(c=>{
      const tr=document.createElement('tr');
      tr.innerHTML = `<td>${escapeHTML(c.front)}</td><td>${escapeHTML(c.back)}</td><td class="muted">${escapeHTML(c.example||'')}</td><td class="muted">${escapeHTML(c.tags||'')}</td><td class="right"><button class="btn danger" data-id="${c.id}">Löschen</button></td>`;
      $('button', tr).onclick = ()=>{ deck.cards = deck.cards.filter(x=>x.id!==c.id); save(); renderDecks(); populateDeckSelect(); };
      tbody.appendChild(tr);
    });
    const front=$('.card-front', node), back=$('.card-back', node), example=$('.card-example', node), tags=$('.card-tags', node);
    $('.add-card', node).onclick=()=>{ if(!front.value.trim()||!back.value.trim()) return; deck.cards.push(term(front.value.trim(), back.value.trim(), example.value.trim(), tags.value.trim())); front.value=back.value=example.value=tags.value=''; save(); renderDecks(); populateDeckSelect(); };
    list.appendChild(node);
  });
}

function populateDeckSelect(){
  const sel=$('#deckSelect'); const impSel=$('#importTextDeck');
  sel.innerHTML = DB.decks.map(d=>`<option value="${d.id}">${escapeHTML(d.name)}</option>`).join('');
  impSel.innerHTML = DB.decks.map(d=>`<option value="${d.id}">${escapeHTML(d.name)}</option>`).join('');
  renderTopBar();
}

function doExport(){ download(`lingualite_${todayKey()}.json`, JSON.stringify(DB, null, 2)); }

async function doImport(file, mode){
  if(!file) return alert('Bitte eine JSON-Datei auswählen.');
  const text = await file.text();
  const data = JSON.parse(text);
  if(mode==='replace'){ DB = data; }
  else {
    data.decks.forEach(inDeck=>{
      const exist = DB.decks.find(d=>d.name===inDeck.name) || null;
      if(!exist){ DB.decks.push(inDeck); return; }
      inDeck.cards.forEach(c=>{ const dup = exist.cards.find(x=>normalize(x.front)===normalize(c.front) && normalize(x.back)===normalize(c.back)); if(!dup) exist.cards.push(c); });
    });
    DB.settings = Object.assign({}, DB.settings, data.settings||{});
  }
  save(); populateDeckSelect(); renderDecks(); alert('Import abgeschlossen.');
}

function doImportText(){
  const deckId = $('#importTextDeck').value;
  const deck = DB.decks.find(d=>d.id===deckId);
  const raw = $('#importTextArea').value;
  if(!deck || !raw.trim()) return;
  const lines = raw.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  let added=0;
  lines.forEach(line=>{
    const parts = line.split(';');
    const front = (parts[0]||'').trim();
    const back = (parts[1]||'').trim();
    const example = (parts[2]||'').trim();
    const tags = (parts[3]||'').trim();
    if(front && back){ deck.cards.push(term(front, back, example, tags)); added++; }
  });
  save(); renderDecks(); populateDeckSelect();
  alert(`${added} Karten importiert.`);
}

function speak(text){
  try{ const u=new SpeechSynthesisUtterance(text); const voiceURI=DB.settings.voiceURI; if(voiceURI){ const v=speechSynthesis.getVoices().find(v=>v.voiceURI===voiceURI); if(v) u.voice=v; } speechSynthesis.speak(u);} catch(e){}
}
function loadVoices(){
  const sel=$('#voiceSelect'); const voices=speechSynthesis.getVoices();
  sel.innerHTML = '<option value=\"\">System</option>' + voices.map(v=>`<option value="${v.voiceURI}">${v.name} (${v.lang})</option>`).join('');
  sel.value = DB.settings.voiceURI || '';
}

function renderTopBar(){
  const deck = currentDeck();
  const dueCount = deck ? deck.cards.filter(isDue).length : 0;
  $('#xp').textContent = DB.stats.xp;
  $('#streak').textContent = `${DB.stats.streak} 🔥`;
  $('#dueCount').textContent = dueCount;
  $('#learnedToday').textContent = DB.stats.learnedToday;
  const list=$('#statsList');
  if(deck){
    const newCards = deck.cards.filter(c=>c.reps===0).length;
    const mature = deck.cards.filter(c=>c.interval>=21).length;
    list.innerHTML = `
      <li>Deck: <b>${escapeHTML(deck.name)}</b></li>
      <li>Karten: ${deck.cards.length}</li>
      <li>Fällig heute: ${dueCount}</li>
      <li>Neu verfügbar: ${newCards}</li>
      <li>Gefestigt (≥21 Tage): ${mature}</li>`;
  } else { list.innerHTML = '<li>Kein Deck gefunden.</li>'; }
  $('#newPerDay').value = DB.settings.newPerDay;
  $('#accentToggle').checked = DB.settings.accentInsensitive;
  $('#ttsToggle').checked = DB.settings.tts;
}

function escapeHTML(str){ return (str||'').replace(/[&<>\"']/g, s=>({"&":"&amp;","<":"&lt;","&gt;":"&gt;","\"":"&quot;","'":"&#39;"}[s])); }

function init(){
  populateDeckSelect();
  renderDecks();
  renderTopBar();

  // Tabs
  $$('.tab').forEach(btn=> btn.onclick = ()=>{ $$('.tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); const tab=btn.dataset.tab; ['learn','decks','import','settings'].forEach(id=>{ const v=$('#view-'+id); v.classList.toggle('hidden', id!==tab); }); });

  $('#startSession').onclick = startSession;
  $('#deckSelect').onchange = ()=> renderTopBar();
  $('#modeSelect').onchange = ()=>{ if(SESSION){ SESSION.mode=$('#modeSelect').value; nextCard(); } };

  $('#addDeck').onclick = ()=>{ const name=$('#newDeckName').value.trim(); const src=$('#newDeckSrc').value.trim()||'SRC'; const tgt=$('#newDeckTgt').value.trim()||'TGT'; if(!name) return; DB.decks.push({ id: crypto.randomUUID(), name, src, tgt, cards: [] }); $('#newDeckName').value=$('#newDeckSrc').value=$('#newDeckTgt').value=''; save(); renderDecks(); populateDeckSelect(); };

  $('#exportJson').onclick = doExport;
  $('#importJson').onclick = ()=>{ const file=$('#importFile').files[0]; const mode=$('#importMode').value; doImport(file, mode); };
  $('#importTextBtn').onclick = doImportText;

  $('#newPerDay').oninput = (e)=>{ DB.settings.newPerDay = Math.max(0, Math.min(200, parseInt(e.target.value||'0',10))); save(); };
  $('#accentToggle').onchange = (e)=>{ DB.settings.accentInsensitive = !!e.target.checked; save(); };
  $('#ttsToggle').onchange = (e)=>{ DB.settings.tts = !!e.target.checked; save(); };

  $('#resetApp').onclick = ()=>{ if(confirm('Wirklich alle Daten löschen und zurücksetzen?')){ localStorage.removeItem(STORAGE_KEY); location.reload(); } };

  if('speechSynthesis' in window){ loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; $('#voiceSelect').onchange = (e)=>{ DB.settings.voiceURI = e.target.value; save(); }; } else { $('#ttsToggle').disabled = true; $('#voiceSelect').disabled = true; }
}

document.addEventListener('DOMContentLoaded', init);
