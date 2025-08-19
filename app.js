// LinguaLite modular app
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const todayKey = () => new Date().toISOString().slice(0,10);
const normalize = (s, accentInsensitive=true) => { let r=(s||"").toLowerCase().trim(); return accentInsensitive ? r.normalize('NFD').replace(/\p{Diacritic}+/gu,'') : r; };
function lev(a,b){ a=a||""; b=b||""; const m=a.length,n=b.length; if(!m)return n; if(!n)return m; const dp=new Array(n+1); for(let j=0;j<=n;j++) dp[j]=j; for(let i=1;i<=m;i++){ let prev=dp[0]; dp[0]=i; for(let j=1;j<=n;j++){ const tmp=dp[j]; dp[j]=Math.min(dp[j]+1, dp[j-1]+1, prev + (a[i-1]===b[j-1]?0:1)); prev=tmp; } } return dp[n]; }
const shuffle = (arr)=>arr.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
function download(filename, dataStr){ const blob=new Blob([dataStr],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url); }

const STORAGE_KEY = 'lingualite_v2';
function term(front, back, example='', tags=''){ return { id: crypto.randomUUID(), front, back, example, tags, due: todayKey(), ease: 2.5, interval: 0, reps: 0, lapses: 0, lastGrade: null }; }

const defaultData = {
  settings: { newPerDay: 20, accentInsensitive: true, tts: false, voiceURI: '' },
  stats: { xp: 0, streak: 0, lastDay: todayKey(), learnedToday: 0 },
  decks: [
    { id: crypto.randomUUID(), name: 'DE → EN (Beispiel)', src: 'DE', tgt: 'EN', cards: [
      term('Haus','house','Das Haus ist groß.','alltag'),
      term('Baum','tree','Der Baum ist alt.','natur'),
      term('lernen','to learn','Ich lerne Deutsch.','verb')
    ]},
    (function(){
      const deck = { id: crypto.randomUUID(), name: 'DE → DA (Dänisch Startdeck)', src: 'DE', tgt: 'DA', cards: [] };
      const rows = [["Hallo", "hej", "Hej! Hvordan går det?", "begrüßung"], ["Guten Morgen", "godmorgen", "Godmorgen!", "begrüßung"], ["Guten Abend", "god aften", "God aften!", "begrüßung"], ["Gute Nacht", "godnat", "Godnat og sov godt.", "begrüßung"], ["Tschüss", "hej hej", "Vi ses, hej hej!", "begrüßung"], ["Wie geht es dir?", "Hvordan har du det?", "Hvordan har du det i dag?", "smalltalk"], ["Mir geht es gut", "Jeg har det godt", "Tak, jeg har det godt.", "smalltalk"], ["Ich heiße Maxim", "Jeg hedder Maxim", "Hej, jeg hedder Maxim.", "vorstellung"], ["Ich komme aus Deutschland", "Jeg kommer fra Tyskland", "Jeg kommer fra Tyskland.", "vorstellung"], ["Ich spreche ein bisschen Dänisch", "Jeg taler lidt dansk", "Jeg taler kun lidt dansk.", "sprache"], ["Ja", "ja", "Ja, tak.", "grundwort"], ["Nein", "nej", "Nej, tak.", "grundwort"], ["Vielleicht", "måske", "Måske senere.", "grundwort"], ["Danke", "tak", "Mange tak!", "höflichkeit"], ["Danke schön", "mange tak", "Tusind tak!", "höflichkeit"], ["Bitte schön (gern geschehen)", "velbekomme", "Tak! – Velbekomme.", "höflichkeit"], ["Entschuldigung", "undskyld", "Undskyld, jeg er forsinket.", "höflichkeit"], ["Hilfe!", "hjælp!", "Hjælp! Er der nogen?", "notfall"], ["Wo ist die Toilette?", "Hvor er toilettet?", "Undskyld, hvor er toilettet?", "reise"], ["Wie viel kostet das?", "Hvor meget koster det?", "Hvor meget koster det her?", "einkauf"], ["Zahlen bitte", "Jeg vil gerne betale", "Undskyld, jeg vil gerne betale.", "einkauf"], ["Ich hätte gern einen Kaffee", "Jeg vil gerne have en kaffe", "Jeg vil gerne have en kaffe, tak.", "cafe"], ["Wasser", "vand", "Et glas vand, tak.", "essen"], ["Brot", "brød", "Friskt brød smager godt.", "essen"], ["Zug", "tog", "Toget kommer om fem minutter.", "reise"], ["Bahnhof", "banegård", "Hvor er banegården?", "reise"], ["Krankenhaus", "hospital", "Hvor er det nærmeste hospital?", "reise"], ["links", "venstre", "Drej til venstre ved hjørnet.", "richtung"], ["rechts", "højre", "Drej til højre ved lyskrydset.", "richtung"], ["geradeaus", "lige ud", "Gå lige ud i to hundrede meter.", "richtung"]];
      rows.forEach(r=>deck.cards.push(term(r[0], r[1], r[2], r[3])));
      return deck;
    })()
  ]
};

function load(){
  try{ const raw=localStorage.getItem(STORAGE_KEY); if(!raw) return structuredClone(defaultData); const data=JSON.parse(raw); data.settings ||= defaultData.settings; data.stats ||= defaultData.stats; data.decks ||= []; return data; }
  catch(e){ return structuredClone(defaultData); }
}
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(DB)); renderTopBar(); }

let DB = load();

function updateDay(){
  const today=todayKey(); const last=DB.stats.lastDay;
  if(last!==today){ const yesterday=new Date(last); const diff=Math.round((new Date(today)-yesterday)/86400000);
    if(diff===1 && DB.stats.learnedToday>0) DB.stats.streak+=1; else if(diff>1) DB.stats.streak=0;
    DB.stats.learnedToday=0; DB.stats.lastDay=today; save(); }
}
updateDay();

function schedule(card, grade){
  const q = [0,3,4,5][grade];
  card.reps = (card.reps||0)+1;
  let ef = card.ease || 2.5;
  ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if(ef<1.3) ef=1.3; if(ef>3.0) ef=3.0;
  card.ease=ef;
  if(q<3){ card.interval=0; card.lapses=(card.lapses||0)+1; }
  else { if(card.interval===0) card.interval=1; else if(card.interval===1) card.interval=6; else card.interval=Math.round(card.interval*ef); }
  const next=new Date(); next.setDate(next.getDate()+card.interval); card.due=next.toISOString().slice(0,10); card.lastGrade=grade;
}
const isDue = (card)=> card.due <= todayKey();

let SESSION = null; // { deckId, mode, queue, current, correctFirstTry }

function startSession(){
  const deckId = $('#deckSelect').value;
  const mode = $('#modeSelect').value;
  const deck = DB.decks.find(d=>d.id===deckId);
  if(!deck){ $('#cardArea').innerHTML='<p class="muted">Bitte ein Deck wählen.</p>'; return; }
  const due = deck.cards.filter(isDue);
  const newCards = deck.cards.filter(c=>c.reps===0).slice(0, DB.settings.newPerDay);
  let pool = [...due, ...newCards];
  if(mode==='puzzle') pool = pool.filter(c=> (c.example && c.example.trim().split(/\s+/).length>=3));
  if(pool.length===0){ $('#cardArea').innerHTML='<p class="muted">Keine passenden Karten (für diesen Modus). Bitte anderen Modus wählen oder Beispiele im Deck ergänzen.</p>'; return; }
  const queue = shuffle(pool).map(c=>c.id);
  SESSION = { deckId: deck.id, mode, queue, current: null, correctFirstTry: true };
  $('#sessionInfo').textContent = `${queue.length} Karten in Session · Modus: ${modeLabel(mode)}`;
  nextCard();
}
const modeLabel = (m)=> m==='flash'?'Flashcards':(m==='mc'?'Multiple Choice':(m==='write'?'Schreiben':'Satzpuzzle'));

function nextCard(){
  const area = $('#cardArea');
  if(!SESSION || SESSION.queue.length===0){ area.innerHTML='<p class="muted">Session beendet. Starte eine neue oder wechsle das Deck.</p>'; SESSION=null; renderTopBar(); return; }
  const deck = DB.decks.find(d=>d.id===SESSION.deckId);
  const id = SESSION.queue.shift();
  const card = deck.cards.find(c=>c.id===id);
  SESSION.current=card; SESSION.correctFirstTry=true;
  if(DB.settings.tts) speak(card.front);

  if(SESSION.mode==='flash') renderFlash(card);
  else if(SESSION.mode==='mc') renderMC(card, deck);
  else if(SESSION.mode==='write') renderWrite(card);
  else renderPuzzle(card);
}

function awardXP(correct, firstTry){ if(correct){ DB.stats.xp += firstTry ? 10 : 5; DB.stats.learnedToday += 1; } }

function renderFlash(card){
  const area=$('#cardArea');
  area.innerHTML = `
  <div class="w-full">
    <div class="card mb-3">
      <div class="text-xs muted mb-1">Frage</div>
      <div class="text-2xl font-semibold mb-4">${escapeHTML(card.front)}</div>
      <button id="reveal" class="btn-outline">Antwort zeigen</button>
    </div>
    <div id="answerBox" class="card mb-3 hidden">
      <div class="text-xs muted mb-1">Antwort</div>
      <div class="text-xl font-medium mb-1">${escapeHTML(card.back)}</div>
      ${card.example?`<div class="text-sm muted">${escapeHTML(card.example)}</div>`:''}
    </div>
    <div class="grid grid-cols-4 gap-2">
      <button class="grade btn-outline" data-grade="0">Wieder</button>
      <button class="grade btn-outline" data-grade="1">Schwer</button>
      <button class="grade btn-success" data-grade="2">Gut</button>
      <button class="grade btn-primary" data-grade="3">Leicht</button>
    </div>
  </div>`;
  $('#reveal').onclick=()=> $('#answerBox').classList.remove('hidden');
  $$('.grade').forEach(b=> b.onclick=()=> onGrade(parseInt(b.dataset.grade,10)));
}

function renderMC(card, deck){
  const area=$('#cardArea');
  const others = shuffle(deck.cards.filter(c=>c.id!==card.id)).slice(0,3).map(c=>c.back);
  const opts = shuffle([card.back, ...others]);
  area.innerHTML = `
  <div class="w-full">
    <div class="card mb-3">
      <div class="text-xs muted mb-1">Wähle die richtige Übersetzung</div>
      <div class="text-2xl font-semibold mb-4">${escapeHTML(card.front)}</div>
      <div class="grid sm:grid-cols-2 gap-2" id="mcOpts"></div>
    </div>
    <div id="feedback" class="text-sm"></div>
  </div>`;
  const box = $('#mcOpts');
  opts.forEach(opt=>{
    const btn=document.createElement('button');
    btn.className='btn-outline text-left';
    btn.textContent=opt;
    btn.onclick=()=>{
      const correct = normalize(opt, DB.settings.accentInsensitive)===normalize(card.back, DB.settings.accentInsensitive);
      if(correct){ $('#feedback').innerHTML='<div class="text-emerald-600 mb-2">Richtig ✓</div>'; onGrade(2, true);}
      else { SESSION.correctFirstTry=false; $('#feedback').innerHTML=`<div class="text-red-600 mb-2">Falsch ✗ – richtig: <span class="font-medium">${escapeHTML(card.back)}</span></div>`; onGrade(0, false);}
    };
    box.appendChild(btn);
  });
}

function renderWrite(card){
  const area=$('#cardArea');
  area.innerHTML = `
  <div class="w-full">
    <div class="card mb-3">
      <div class="text-xs muted mb-1">Schreibe die Übersetzung</div>
      <div class="text-2xl font-semibold mb-4">${escapeHTML(card.front)}</div>
      <input id="answerInput" class="input w-full" placeholder="Antwort eingeben" />
      <div class="flex gap-2 mt-3">
        <button id="checkAnswer" class="btn-success">Prüfen</button>
        <button id="showAnswer" class="btn-outline">Zeigen</button>
      </div>
    </div>
    <div id="feedback" class="text-sm"></div>
  </div>`;
  $('#answerInput').focus();
  $('#checkAnswer').onclick = ()=>{
    const user=$('#answerInput').value;
    const a=normalize(user, DB.settings.accentInsensitive);
    const b=normalize(card.back, DB.settings.accentInsensitive);
    const distance=lev(a,b);
    const correct=(a===b)||(distance<=1 && b.length>4);
    if(correct){ $('#feedback').innerHTML='<div class="text-emerald-600 mb-2">Richtig ✓</div>'; onGrade(2, true);}
    else { SESSION.correctFirstTry=false; $('#feedback').innerHTML=`<div class="text-red-600 mb-2">Falsch ✗ – richtig: <span class="font-medium">${escapeHTML(card.back)}</span></div>`; onGrade(0,false);}
  };
  $('#showAnswer').onclick = ()=>{ SESSION.correctFirstTry=false; $('#feedback').innerHTML = `<div class="mb-2">Antwort: <span class="font-medium">${escapeHTML(card.back)}</span></div>`; };
}

// New Mode: Sentence Puzzle (build target sentence by tapping words)
function renderPuzzle(card){
  const area=$('#cardArea');
  const target = (card.example && card.example.trim().split(/\s+/).length>=3) ? card.example.trim() : card.back.trim();
  const tokens = target.split(/\s+/);
  const bank = shuffle(tokens.map((t,i)=>({t,i})));
  area.innerHTML = `
  <div class="w-full">
    <div class="card mb-3">
      <div class="text-xs muted mb-1">Baue den Satz in ${DB.decks.find(d=>d.id===SESSION.deckId)?.tgt || 'Zielsprache'}</div>
      <div class="text-xl font-semibold mb-2">${escapeHTML(card.front)}</div>
      <div class="sentence" id="assembled"></div>
      <div class="wordbank" id="wordbank"></div>
      <div class="flex gap-2 mt-3">
        <button id="checkPuzzle" class="btn-success">Prüfen</button>
        <button id="clearPuzzle" class="btn-outline">Zurücksetzen</button>
        <button id="showPuzzle" class="btn-outline">Zeigen</button>
      </div>
    </div>
    <div id="pFeedback" class="text-sm"></div>
  </div>`;
  const assembled = $('#assembled');
  const wb = $('#wordbank');
  bank.forEach((obj,idx)=>{
    const pill=document.createElement('span');
    pill.className='pill';
    pill.dataset.idx=idx;
    const btn=document.createElement('button'); btn.textContent=obj.t;
    btn.onclick=()=>{ assembled.appendChild(pill); btn.remove(); pill.appendChild(btn); };
    pill.appendChild(btn);
    wb.appendChild(pill);
  });
  $('#clearPuzzle').onclick=()=>{
    assembled.innerHTML=''; wb.innerHTML='';
    bank.forEach((o,i)=>{ const pill=document.createElement('span'); pill.className='pill'; const btn=document.createElement('button'); btn.textContent=o.t; btn.onclick=()=>{ assembled.appendChild(pill); btn.remove(); pill.appendChild(btn); }; pill.appendChild(btn); wb.appendChild(pill); });
  };
  $('#showPuzzle').onclick=()=>{ SESSION.correctFirstTry=false; $('#pFeedback').innerHTML = `<div class="mb-2">Lösung: <span class="font-medium">${escapeHTML(target)}</span></div>`; };
  $('#checkPuzzle').onclick=()=>{
    const guess = Array.from(assembled.querySelectorAll('button')).map(b=>b.textContent).join(' ').trim();
    const correct = normalize(guess)===normalize(target);
    if(correct){ $('#pFeedback').innerHTML='<div class="text-emerald-600 mb-2">Richtig ✓</div>'; onGrade(2,true); } 
    else { SESSION.correctFirstTry=false; $('#pFeedback').innerHTML=`<div class="text-red-600 mb-2">Falsch ✗ – richtig: <span class="font-medium">${escapeHTML(target)}</span></div>`; onGrade(0,false); }
  };
}

function onGrade(grade, wasCorrect){ const card=SESSION?.current; if(!card) return; awardXP(wasCorrect??(grade>=2), SESSION.correctFirstTry); schedule(card, grade); save(); setTimeout(nextCard, 200); }

function renderDecks(){
  const list=$('#deckList'); list.innerHTML='';
  DB.decks.forEach(deck=>{
    const tpl=$('#deckItemTpl'); const node=tpl.content.cloneNode(true);
    $('.deck-title', node).textContent = `${deck.name} · ${deck.src} → ${deck.tgt}`;
    $('.deck-meta', node).textContent = `${deck.cards.length} Karten`;
    const tbody=$('.deck-cards', node);
    deck.cards.forEach(c=>{
      const tr=document.createElement('tr');
      tr.innerHTML = `<td class="py-1 pr-2">${escapeHTML(c.front)}</td><td class="pr-2">${escapeHTML(c.back)}</td><td class="pr-2 muted">${escapeHTML(c.example||'')}</td><td class="pr-2 muted">${escapeHTML(c.tags||'')}</td><td class="text-right"><button class="text-red-600 hover:underline" data-id="${c.id}">Löschen</button></td>`;
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
  const deckId=$('#deckSelect')?.value;
  const deck = DB.decks.find(d=>d.id===deckId) || DB.decks[0];
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
      <li>Deck: <span class="font-medium">${escapeHTML(deck.name)}</span></li>
      <li>Karten: ${deck.cards.length}</li>
      <li>Fällig heute: ${dueCount}</li>
      <li>Neu verfügbar: ${newCards}</li>
      <li>Gefestigt (≥21 Tage): ${mature}</li>`;
  } else { list.innerHTML = '<li>Kein Deck gefunden.</li>'; }
  $('#newPerDay').value = DB.settings.newPerDay;
  $('#accentToggle').checked = DB.settings.accentInsensitive;
  $('#ttsToggle').checked = DB.settings.tts;
}

function toggleDark(){ const html=document.documentElement; const dark=html.classList.toggle('dark'); try{ localStorage.setItem('ll_dark', dark? '1':'0'); }catch(e){} }
function initDark(){ const pref=localStorage.getItem('ll_dark'); if(pref==='1') document.documentElement.classList.add('dark'); if(pref==='0') document.documentElement.classList.remove('dark'); }
function escapeHTML(str){ return (str||'').replace(/[&<>\"']/g, s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s])); }

function init(){
  initDark();
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

  $('#darkToggle').onclick = toggleDark;
  $('#resetApp').onclick = ()=>{ if(confirm('Wirklich alle Daten löschen und zurücksetzen?')){ localStorage.removeItem(STORAGE_KEY); location.reload(); } };

  if('speechSynthesis' in window){ loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; $('#voiceSelect').onchange = (e)=>{ DB.settings.voiceURI = e.target.value; save(); }; } else { $('#ttsToggle').disabled = true; $('#voiceSelect').disabled = true; }
}

document.addEventListener('DOMContentLoaded', init);
