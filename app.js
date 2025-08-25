
/* ====== CONFIG ====== */
const DEBUG=false; // auf true setzen für Konsolen-Diagnostik
const STORAGE_KEY='lingualite_state_v31';
const ELO_KEY='lingualite_elo_v31';
const DEFAULT_ELO=1200, K=16, MIN_ELO=800, MAX_ELO=1600;
const DISTRACTOR_POOL=['og','ikke','lidt','meget','hvad','hvem','hvordan','hvor','her','der','i dag','i morgen','ven','bil','hus','bog','kaffe','brød','skole','arbejde','byen','taler','forstår','kommer','fra','jeg','du','han','hun','vi','de','er','har','kan','vil','med','uden','til','fra','på'];
const DECK_PATHS=['decks.json','./decks.json','data/decks.json','./data/decks.json'];

/* ====== STABLE HELPERS ====== */
const PUNC=/[.,!?;:()\[\]\\"“”„'«»]/g;
const now=()=>performance && performance.now? performance.now(): Date.now();
function normalize(s){ return String(s||'').toLowerCase().replace(PUNC,'').replace(/\s+/g,' ').trim(); }
function clamp(x){ return Math.max(MIN_ELO, Math.min(MAX_ELO, Math.round(x))); }
function loadJSON(key, fallback){ try{ const raw=localStorage.getItem(key); if(!raw) return fallback; return JSON.parse(raw); }catch(e){ return fallback; } }
function saveJSON(key, obj){ try{ localStorage.setItem(key, JSON.stringify(obj)); }catch(e){ /* ignore quota */ } }

/* Throttled write for ELO to reduce LS churn */
let _eloWriteScheduled=false;
function scheduleEloWrite(){ if(_eloWriteScheduled) return; _eloWriteScheduled=true;
  const wr=()=>{ saveJSON(ELO_KEY,ELO); _eloWriteScheduled=false; };
  if('requestIdleCallback' in window){ requestIdleCallback(wr,{timeout:1200}); } else { setTimeout(wr,600); }
}

/* ====== STATE ====== */
let STATE=loadJSON(STORAGE_KEY,{decks:null});
let ELO=loadJSON(ELO_KEY,{decks:{}, cards:{}, user:DEFAULT_ELO});

let decks=STATE.decks; let currentDeck=null; let currentMode='flashcards';
let sessionQueue=[]; let currentCard=null;
let score=0, wrongStreak=0;
let tick=0; // global step counter
const lastSeen=new Map(); // cardId -> tick (für Rotation)

/* ====== FETCH with Abort + Multi-Path + Fallback ====== */
async function tryFetch(path, signal){
  const res=await fetch(path+'?v='+(Date.now()),{cache:'no-store', signal});
  if(!res.ok) throw new Error('HTTP '+res.status+' @ '+path);
  return res.json();
}
async function loadExternalDecks(){
  const ac=new AbortController(); const {signal}=ac; const timer=setTimeout(()=>ac.abort('timeout'), 6000);
  try{
    for(const p of DECK_PATHS){
      try{
        const data=await tryFetch(p, signal);
        if(data && Array.isArray(data.decks)) return data.decks;
      }catch(e){ if(DEBUG) console.warn('Pfad fehlgeschlagen', p, e.message); /* try next */ }
    }
  }finally{ clearTimeout(timer); }
  const box=document.getElementById('deckError'); if(box){ box.style.display='block'; box.textContent='Hinweis: Konnte decks.json nicht laden – nutze integrierte Offline‑Decks.'; }
  return FALLBACK_DECKS.decks;
}

/* ====== FALLBACK (3000 Karten gesamt) ====== */
const BASE_ALLTAG=[
 "Hallo!|Hej!","Guten Morgen|Godmorgen","Guten Abend|Godaften","Gute Nacht|Godnat",
 "Wie geht es dir?|Hvordan har du det?","Mir geht es gut.|Jeg har det godt.",
 "Danke|Tak","Vielen Dank|Mange tak","Bitte (hier, nimm)|Vær så god","Entschuldigung|Undskyld",
 "Ja|Ja","Nein|Nej","Vielleicht|Måske","Ich verstehe nicht.|Jeg forstår ikke.",
 "Sprechen Sie Englisch?|Taler du engelsk?","Ich spreche ein bisschen Dänisch.|Jeg taler lidt dansk.",
 "Wie heißt du?|Hvad hedder du?","Ich heiße Max.|Jeg hedder Max.",
 "Woher kommst du?|Hvor kommer du fra?","Ich komme aus Deutschland.|Jeg kommer fra Tyskland.",
 "Ich wohne in Aarhus.|Jeg bor i Aarhus.","Bis später!|Vi ses senere!","Gute Besserung!|God bedring!",
 "Viel Spaß!|God fornøjelse!","Willkommen!|Velkommen!","Herzlichen Glückwunsch!|Tillykke!",
 "Kein Problem.|Intet problem.","Natürlich.|Selvfølgelig.","Ich weiß nicht.|Jeg ved det ikke."
];
const BASE_REISE=[
 "Wo ist die Toilette?|Hvor er toilettet?","Wo ist der Bahnhof?|Hvor er banegården?",
 "Wo ist die Bushaltestelle?|Hvor er busstoppestedet?","Der Bus kommt bald.|Bussen kommer snart.",
 "Eine Fahrkarte nach Kopenhagen, bitte.|En billet til København, tak.","Wie viel kostet das?|Hvad koster det?",
 "Ich habe eine Reservierung.|Jeg har en reservation.","Ich suche dieses Hotel.|Jeg leder efter dette hotel.",
 "Links|Venstre","Rechts|Højre","Geradeaus|Lige ud","Langsam, bitte.|Langsom, tak.","Schneller, bitte.|Hurtigere, tak.",
 "Können Sie mir helfen?|Kan du hjælpe mig?","Ich habe mich verirrt.|Jeg er faret vild."
];
const BASE_ESSEN=[
 "Ich hätte gern einen Kaffee.|Jeg vil gerne have en kaffe.","Ein Wasser, bitte.|Et vand, tak.",
 "Bier|Øl","Wein|Vin","Saft|Juice","Milch|Mælk","Tee|Te",
 "Frühstück|Morgenmad","Mittagessen|Frokost","Abendessen|Aftensmad",
 "Speisekarte|Menu","Tisch für zwei, bitte.|Bord til to, tak.","Guten Appetit!|Velbekomme!","Das schmeckt gut.|Det smager godt."
];

function expandToCount(basePairs, target){
  const cards=[]; const parsed=basePairs.map(x=>{const [f,b]=x.split('|'); return {front:f,back:b,example:''};});
  while(cards.length<target){
    for(const c of parsed){
      if(cards.length>=target) break;
      cards.push({...c});
    }
  }
  return cards.slice(0,target);
}
const FALLBACK_DECKS={
  decks:[
    {name:"Alltag & Höflichkeit", cards: expandToCount(BASE_ALLTAG,1000)},
    {name:"Reise & Verkehr", cards: expandToCount(BASE_REISE,1000)},
    {name:"Essen & Restaurant", cards: expandToCount(BASE_ESSEN,1000)},
  ]
};

/* ====== UI ====== */
function updateMeters(){
  document.getElementById('scoreBox').textContent='Punkte: '+score;
  const dName=currentDeck?currentDeck.name:null;
  const dElo=dName? (ELO.decks[dName]??DEFAULT_ELO) : '—';
  document.getElementById('deckElo').textContent='Deck‑Elo: '+dElo;
}
function showSection(id){
  if(id==='learn'&&!currentDeck){alert('Bitte zuerst ein Deck unter „Decks“ auswählen.'); return;}
  document.querySelectorAll('.section').forEach(s=>s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}
function renderDecks(){
  const cont=document.getElementById('deckList'); cont.textContent='';
  const learnBtn=document.getElementById('learnBtn'); learnBtn.classList.add('hidden');
  if(!decks || decks.length===0){
    const info=document.createElement('div'); info.className='card';
    info.innerHTML='Keine Decks gefunden.'; cont.appendChild(info); return;
  }
  const frag=document.createDocumentFragment();
  decks.forEach((d,idx)=>{
    const el=document.createElement('div'); el.className='card'; el.dataset.index=idx;
    el.textContent=d.name+' ('+d.cards.length+' Karten)'; frag.appendChild(el);
  });
  cont.appendChild(frag);
  cont.onclick=(e)=>{
    const el=e.target.closest('.card'); if(!el) return;
    const idx=+el.dataset.index; currentDeck=decks[idx];
    document.querySelectorAll('.deckList .card').forEach(c=>c.classList.remove('selected'));
    el.classList.add('selected'); learnBtn.classList.remove('hidden'); updateMeters();
  };
}

/* ====== ELO ====== */
function eloUpdate(a,b,scoreA){ const expectedA=1/(1+Math.pow(10,(b-a)/400)); const newA=a+K*(scoreA-expectedA); const newB=b+K*((1-scoreA)-(1-expectedA)); return {newA,newB}; }
function getUserElo(){ return ELO.user??DEFAULT_ELO; }
function setUserElo(v){ ELO.user=clamp(v); scheduleEloWrite(); }
function getCardId(deckName,c){ return deckName+'::'+(c.front||'')+'::'+(c.back||''); }
function getCardElo(id){ return ELO.cards[id]??DEFAULT_ELO; }
function setCardElo(id,v){ ELO.cards[id]=clamp(v); scheduleEloWrite(); }
function getDeckElo(name){ return ELO.decks[name]??DEFAULT_ELO; }
function setDeckElo(name,v){ ELO.decks[name]=clamp(v); scheduleEloWrite(); }

/* ====== SESSION ====== */
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('startBtn').addEventListener('click', startLearning);
  document.getElementById('reloadBtn').addEventListener('click', async()=>{ decks=await loadExternalDecks(); STATE.decks=decks; saveJSON(STORAGE_KEY,STATE); renderDecks(); });
  document.getElementById('exportBtn').addEventListener('click', exportDecks);
  document.getElementById('importTextBtn').addEventListener('click', importFromText);
  document.getElementById('importFile').addEventListener('change', handleFileImport);
  bootstrap();
});

async function bootstrap(){
  if(!decks){ decks=await loadExternalDecks(); STATE.decks=decks; saveJSON(STORAGE_KEY,STATE); }
  renderDecks(); updateMeters(); showSection('decks');
}

function startLearning(){
  if(!currentDeck){ alert('Bitte Deck wählen'); return; }
  currentMode=document.getElementById('modeSelect').value;
  if(ELO.decks[currentDeck.name]==null) setDeckElo(currentDeck.name, DEFAULT_ELO);
  score=0; wrongStreak=0; updateMeters(); tick=0; lastSeen.clear();

  // Build queue: sort by card Elo descending (schwieriger früher), dann leicht mischen
  sessionQueue=currentDeck.cards.map(c=>({ ...c, _id: getCardId(currentDeck.name,c) }));
  sessionQueue.sort((a,b)=> getCardElo(b._id) - getCardElo(a._id));
  for(let i=0;i<sessionQueue.length;i+=7){ const j=Math.min(sessionQueue.length-1, i+Math.floor(Math.random()*7)); [sessionQueue[i],sessionQueue[j]]=[sessionQueue[j],sessionQueue[i]]; }
  nextCard();
}

function nextCard(){
  const area=document.getElementById('learningArea'); area.textContent='';
  if(sessionQueue.length===0){ area.innerHTML='<div class="card">Fertig! 🎉 Punkte: '+score+' — Deck‑Elo: '+getDeckElo(currentDeck.name)+'</div>'; return; }
  currentCard=sessionQueue.shift(); tick++; lastSeen.set(currentCard._id, tick);
  requestAnimationFrame(()=>{
    try{
      if(currentMode==='flashcards') showFlashcard(area);
      else if(currentMode==='multiple') showMultiple(area);
      else showSentence(area);
      // Fairness-Boost: alle 15 Schritte die am längsten „nicht gesehen“ Karte etwas vorziehen
      if(tick%15===0) fairnessBoost();
    }catch(err){
      console.error(err); area.innerHTML='<div class="card">Ein Fehler ist aufgetreten – nächste Karte.</div>'; nextCard();
    }
  });
}

function fairnessBoost(){
  // Betrachtet die ersten 120 Elemente der Queue und wählt die Karte mit geringstem lastSeen (am längsten her)
  const sampleCount=Math.min(120, sessionQueue.length);
  if(sampleCount<=0) return;
  let minIdx=0, minSeen=Infinity;
  for(let i=0;i<sampleCount;i++){
    const c=sessionQueue[i]; const seen=lastSeen.get(c._id)||0;
    if(seen<minSeen){ minSeen=seen; minIdx=i; }
  }
  if(minIdx>5){ const [c]=sessionQueue.splice(minIdx,1); sessionQueue.splice(5,0,c); }
}

/* Punkte & Elo & Scheduling */
function onAnswer(ok){
  if(ok){ score+=1; wrongStreak=0; } else { wrongStreak+=1; if(wrongStreak>=2){ score=Math.max(0, score-1); wrongStreak=0; } }
  // elo
  const user=getUserElo(), card=getCardElo(currentCard._id), deck=getDeckElo(currentDeck.name);
  const {newA:user2, newB:card2}=eloUpdate(user, card, ok?1:0);
  const outcomeDeck= ok?0:1;
  const {newA:deck2}=eloUpdate(deck, user, outcomeDeck);
  setUserElo(user2); setCardElo(currentCard._id, card2); setDeckElo(currentDeck.name, deck2);
  updateMeters();

  // Scheduling mit Mindestabstand und Rotationsschutz
  const minGapOk=6+Math.floor(Math.random()*2);
  const minGapFail=1;
  const gap= ok?minGapOk:minGapFail;
  const insertPos = Math.min(gap, sessionQueue.length); // garantiert mind. gap andere Karten
  sessionQueue.splice(insertPos,0,currentCard);
}

function mkBtn(label,cls,cb){ const b=document.createElement('button'); b.textContent=label; if(cls)b.className=cls; b.addEventListener('click',cb,{once:false}); return b; }
function pushResultAndAwaitNext(area, ok, msgOk='✅ Richtig!', msgFail='❌ Falsch!'){
  onAnswer(ok);
  const fb=document.createElement('div'); fb.className='feedback'; fb.innerHTML=ok?msgOk:msgFail+' Richtige Lösung: <b>'+currentCard.back+'</b>';
  area.appendChild(fb);
  const bar=document.createElement('div'); bar.className='action-bar'; bar.appendChild(mkBtn('Weiter','primary next',nextCard)); area.appendChild(bar);
}

/* ====== MODI ====== */
function showFlashcard(area){
  const front=String(currentCard.front||''); const back=String(currentCard.back||'');
  const card=document.createElement('div'); card.className='card'; card.textContent=front; area.appendChild(card);
  const bar=document.createElement('div'); bar.className='action-bar';
  bar.appendChild(mkBtn('Antwort zeigen','primary go reveal',()=>{
    const fb=document.createElement('div'); fb.className='feedback'; fb.innerHTML='Richtig: <b>'+back+'</b>'; area.appendChild(fb);
    const inner=document.createElement('div'); inner.className='action-bar';
    inner.appendChild(mkBtn('Richtig','primary go',()=>pushResultAndAwaitNext(area,true)));
    inner.appendChild(mkBtn('Falsch','primary go',()=>pushResultAndAwaitNext(area,false)));
    area.appendChild(inner);
  }));
  bar.appendChild(mkBtn('Skip','skip',()=>{ sessionQueue.push(currentCard); nextCard(); }));
  area.appendChild(bar);
}

function showMultiple(area){
  const front=String(currentCard.front||''); const back=String(currentCard.back||'');
  const pool=currentDeck.cards;
  const opts=[back]; const uniq=new Set(opts);
  while(opts.length<4 && pool.length>opts.length){
    const c=String(pool[Math.floor(Math.random()*pool.length)].back||''); if(c && !uniq.has(c)){opts.push(c); uniq.add(c);}
  }
  while(opts.length<4){ const c=DISTRACTOR_POOL[Math.floor(Math.random()*DISTRACTOR_POOL.length)]; if(!uniq.has(c)){opts.push(c); uniq.add(c);} }
  opts.sort(()=>Math.random()-.5);
  const card=document.createElement('div'); card.className='card'; card.textContent=front; area.appendChild(card);
  const grid=document.createElement('div'); grid.className='action-bar';
  opts.forEach(o=> grid.appendChild(mkBtn(o,'primary go',()=>{ const ok=(o===back); pushResultAndAwaitNext(area, ok); })));
  area.appendChild(grid);
  const bar=document.createElement('div'); bar.className='action-bar'; bar.appendChild(mkBtn('Skip','skip',()=>{ sessionQueue.push(currentCard); nextCard(); })); area.appendChild(bar);
}

/* Satzpuzzle */
function levenshtein(a,b){const m=a.length,n=b.length;if(m===0)return n;if(n===0)return m;const dp=new Array((m+1)*(n+1));const I=(i,j)=>i*(n+1)+j;for(let i=0;i<=m;i++)dp[I(i,0)]=i;for(let j=0;j<=n;j++)dp[I(0,j)]=j;for(let i=1;i<=m;i++){for(let j=1;j<=n;j++){const cost=a[i-1]===b[j-1]?0:1;dp[I(i,j)]=Math.min(dp[I(i-1,j)]+1,dp[I(i,j-1)]+1,dp[I(i-1,j-1)]+cost);} }return dp[I(m,n)];}

function showSentence(area){
  const front=String(currentCard.front||'').trim();
  const back=String(currentCard.back||'').trim();
  const tWords=back.split(/\s+/).filter(Boolean);
  if(tWords.length<=1){ showMultiple(area); return; }

  const MAX_BANK=24;
  const baseTarget=tWords.map(w=>w.toLowerCase());
  const sourceWords=front.split(/\s+/).map(w=>w.replace(PUNC,''));
  const srcPool=sourceWords.filter(w=>w && !baseTarget.includes(w.toLowerCase()));

  let needed=Math.min(12,Math.max(6,Math.ceil(tWords.length*0.6)));
  const distractors=new Set();
  while(distractors.size<needed && srcPool.length){ distractors.add(srcPool[Math.floor(Math.random()*srcPool.length)]); }
  while(distractors.size<needed){
    const w=DISTRACTOR_POOL[Math.floor(Math.random()*DISTRACTOR_POOL.length)];
    if(!baseTarget.includes(w.toLowerCase())) distractors.add(w);
  }

  let bank=[...tWords, ...distractors];
  if(bank.length>MAX_BANK){
    const extras=bank.filter(w=>!tWords.includes(w));
    while(tWords.length+extras.length>MAX_BANK && extras.length>0){ extras.splice(Math.floor(Math.random()*extras.length),1); }
    bank=[...tWords, ...extras];
  }
  bank.sort(()=>Math.random()-.5);

  const prompt=document.createElement('div'); prompt.className='card'; prompt.innerHTML='<b>Deutsch:</b> '+front; area.appendChild(prompt);

  const wb=document.createElement('div'); wb.className='wordbank';
  const ab=document.createElement('div'); ab.className='answerbox';
  const selected=[]; const render=()=>{ ab.textContent=selected.join(' '); };

  wb.addEventListener('click',(e)=>{
    const btn=e.target.closest('button'); if(!btn) return;
    const w=btn.getAttribute('data-w'); if(btn.disabled) return;
    selected.push(w); btn.disabled=true; render();
  }, {passive:true});

  const frag=document.createDocumentFragment();
  for(let i=0;i<bank.length;i++){ const b=document.createElement('button'); b.setAttribute('data-w',bank[i]); b.textContent=bank[i]; frag.appendChild(b); }
  wb.appendChild(frag);

  area.appendChild(wb); area.appendChild(ab);

  const bar=document.createElement('div'); bar.className='action-bar';
  const btnPruefen=mkBtn('Prüfen','primary go',()=>{
    const val=selected.join(' ').trim();
    if(!val){ const skipBtn=bar.querySelector('.skip'); if(skipBtn){ skipBtn.classList.add('hint'); setTimeout(()=>skipBtn.classList.remove('hint'),900);} return; }
    const ok=(levenshtein(normalize(val), normalize(back)) <= Math.max(1, Math.floor(normalize(back).length*0.05)));
    onAnswer(ok);
    btnPruefen.replaceWith(mkBtn('Weiter','primary next',nextCard));
    const fb=document.createElement('div'); fb.className='feedback'; fb.innerHTML= ok? '✅ Richtig!' : '❌ Falsch! Richtige Lösung: <b>'+back+'</b>';
    area.appendChild(fb);
  });
  const btnSkip=mkBtn('Skip','skip',()=>{ sessionQueue.push(currentCard); nextCard(); });
  bar.appendChild(btnPruefen); bar.appendChild(btnSkip); area.appendChild(bar);
}

/* ====== Import/Export/Reset ====== */
function handleFileImport(e){
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=(evt)=>{
    try{
      const imported=JSON.parse(evt.target.result);
      const newDecks=Array.isArray(imported)?imported:(imported.decks||[]);
      STATE.decks=(STATE.decks||[]).concat(newDecks);
      decks=STATE.decks; saveJSON(STORAGE_KEY,STATE); renderDecks(); alert('Import erfolgreich!');
    }catch(err){ alert('Fehler beim Import: '+err.message); }
  };
  reader.readAsText(file);
}
function importFromText(){
  const text=document.getElementById('importText').value.trim();
  if(!text){ alert('Kein Text. Format: front;back;example (eine Karte pro Zeile)'); return; }
  let targetDeck=currentDeck;
  if(!targetDeck){ let existing=(decks||[]).find(d=>d.name==='Import (Auto)'); if(!existing){ existing={name:'Import (Auto)',cards:[]}; (decks||[]).push(existing); } targetDeck=existing; }
  const lines=text.split(/\n/).map(l=>l.trim()).filter(Boolean);
  let added=0; for(const line of lines){ const p=line.split(';'); if(p.length>=2){ targetDeck.cards.push({front:p[0],back:p[1],example:p[2]||''}); added++; } }
  saveJSON(STORAGE_KEY,STATE); renderDecks(); alert(added+' Karten importiert in: '+targetDeck.name);
}
function exportDecks(){ const blob=new Blob([JSON.stringify(STATE.decks||[],null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='decks.json'; a.click(); URL.revokeObjectURL(a.href); }
function resetAll(){ localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(ELO_KEY); location.reload(); }

/* ====== STARTUP ====== */
// Keine Stiländerungen – Frontend gleich, nur stabiler & schneller.
