
const STORAGE_KEY = 'lingualite_state_v10';
const DISTRACTOR_POOL = ['og','ikke','lidt','meget','hvad','hvem','hvordan','hvor','her','der','i dag','i morgen','ven','bil','hus','bog','kaffe','brød','skole','arbejde','byen','taler','forstår','kommer','fra','jeg','du','han','hun','vi','de','er','har','kan','vil'];

let STATE = loadState();
let decks = STATE.decks; 
let currentDeck=null; let currentMode="flashcards"; let sessionQueue=[]; let currentCard=null;

function loadState(){ try{const raw=localStorage.getItem(STORAGE_KEY);return raw?JSON.parse(raw):{decks:null};}catch(e){return {decks:null};}}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE)); }

async function loadExternalDecks(){
  try{const res=await fetch('decks.json?'+Date.now()); const data=await res.json(); return data.decks||[];}catch(e){return [];}}
async function bootstrap(){ if(!decks){ decks=await loadExternalDecks(); STATE.decks=decks; saveState(); } renderDecks(); }

function showSection(id){ document.querySelectorAll('.section').forEach(s=>s.classList.add('hidden')); document.getElementById(id).classList.remove('hidden'); }

function renderDecks(){ const cont=document.getElementById('deckList'); cont.innerHTML=''; decks.forEach(d=>{ const el=document.createElement('div'); el.className='card'; el.textContent=d.name+' ('+d.cards.length+' Karten)'; el.onclick=()=>{currentDeck=d; alert(d.name+' ausgewählt');}; cont.appendChild(el); }); }

function startLearning(){ if(!currentDeck){alert('Bitte Deck wählen');return;} currentMode=document.getElementById('modeSelect').value; sessionQueue=[...currentDeck.cards]; nextCard(); }
function nextCard(){ if(sessionQueue.length===0){ document.getElementById('learningArea').innerHTML='<p>Fertig!</p>'; return; } currentCard=sessionQueue.shift(); if(currentMode==='flashcards') showFlashcard(); else if(currentMode==='multiple') showMultiple(); else showSentence(); }
function mkBtn(label,cls,cb){const b=document.createElement('button');b.textContent=label;if(cls)b.className=cls;b.onclick=cb;return b;}

function showFlashcard(){ const area=document.getElementById('learningArea'); area.innerHTML='<div class=card>'+currentCard.front+'</div>'; area.appendChild(mkBtn('Antwort zeigen','reveal',()=>{ area.appendChild(document.createElement('div')).innerHTML='Richtig: '+currentCard.back; area.appendChild(mkBtn('Richtig','',()=>{nextWithSpacing(true);})); area.appendChild(mkBtn('Falsch','',()=>{nextWithSpacing(false);})); })); area.appendChild(mkBtn('Skip','skip',()=>{sessionQueue.push(currentCard);nextCard();})); }
function showMultiple(){ const opts=[currentCard.back]; while(opts.length<4){ const c=decks[0].cards[Math.floor(Math.random()*decks[0].cards.length)].back; if(!opts.includes(c)) opts.push(c);} opts.sort(()=>Math.random()-.5); const area=document.getElementById('learningArea'); area.innerHTML='<div class=card>'+currentCard.front+'</div>'; opts.forEach(o=>{area.appendChild(mkBtn(o,'',()=>{ if(o===currentCard.back) nextWithSpacing(true); else nextWithSpacing(false);}));}); area.appendChild(mkBtn('Skip','skip',()=>{sessionQueue.push(currentCard);nextCard();})); }
function normalize(s){return s.toLowerCase().replace(/[.,!?;:()\\[\\]\"“”„'«»]/g,'').replace(/\\s+/g,' ').trim();}
function showSentence(){ const target=currentCard.back; const words=target.split(/\\s+/); const needed=Math.min(10,Math.max(3,Math.ceil(words.length*0.6))); const distractors=new Set(); while(distractors.size<needed){ const w=DISTRACTOR_POOL[Math.floor(Math.random()*DISTRACTOR_POOL.length)]; if(!words.includes(w)) distractors.add(w);} const bank=[...words,...distractors]; bank.sort(()=>Math.random()-.5); const area=document.getElementById('learningArea'); area.innerHTML='<div class=card>'+currentCard.front+'</div>'; const wb=document.createElement('div');wb.className='wordbank';const ab=document.createElement('div');ab.className='answerbox'; bank.forEach(w=>{const b=mkBtn(w,'',()=>{ab.textContent+=(ab.textContent?' ':'')+w;b.disabled=true;});wb.appendChild(b);}); area.appendChild(wb);area.appendChild(ab); area.appendChild(mkBtn('Prüfen','',()=>{ const ok=normalize(ab.textContent)===normalize(target); nextWithSpacing(ok);})); area.appendChild(mkBtn('Skip','skip',()=>{sessionQueue.push(currentCard);nextCard();})); }

function nextWithSpacing(ok){ if(ok){ sessionQueue.splice(Math.min(6,sessionQueue.length),0,currentCard);} else { sessionQueue.splice(1,0,currentCard);} nextCard(); }
function resetAll(){ localStorage.removeItem(STORAGE_KEY); location.reload(); }
async function reloadExternalDecks(){ decks=await loadExternalDecks(); STATE.decks=decks; saveState(); renderDecks(); }

window.addEventListener('DOMContentLoaded',bootstrap);
