document.addEventListener('DOMContentLoaded', async ()=>{
  $$('.nav button').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view))); showView('learn');
  await Decks.loadBuiltins();
  fillLanguageFilter();
  $('#langFilter').addEventListener('change', fillDeckSelect);
  fillDeckSelect();
  setSchemaBox?.();

  // Import/Export
  const importBtn = document.getElementById('importBtn'); if(importBtn){ importBtn.onclick = async ()=>{
    const file = document.getElementById('importFile').files[0]; if(!file) return alert('Bitte JSON wählen.');
    const text = await file.text(); try{ const obj=JSON.parse(text); Decks.importFromObject(obj); fillLanguageFilter(); fillDeckSelect(); alert('Import OK.'); } catch(e){ alert('Ungültiges JSON.'); }
  };}
  const exportBtn = document.getElementById('exportBtn'); if(exportBtn){ exportBtn.onclick = ()=>{
    const data=Decks.exportAll(); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([data],{type:'application/json'})); a.download='decks_export.json'; a.click();
  };}

  document.getElementById('startBtn').onclick = startSession;
});

let session=null;

function startSession(){
  const deck = getSelectedDeck();
  if(!deck) return alert('Kein Deck gefunden (prüfe Sprachfilter/Import).');
  const mode = document.getElementById('modeSelect').value;
  session = { deck, mode, queue: deck.cards.slice(), current:null };
  nextCard();
}

function nextCard(){
  const area = document.getElementById('learnArea');
  if(!session || session.queue.length===0){ area.innerHTML='<p>Session beendet.</p>'; return; }
  session.current = session.queue.shift();
  const c = session.current;
  if(session.mode==='flashcards') renderFlash(c);
  else if(session.mode==='multiple') renderMC(c, session.deck);
  else renderPuzzle(c);
}

function renderFlash(card){
  const a=document.getElementById('learnArea');
  a.innerHTML = `<div class="q">${escapeHTML(card.front)}</div>
  <div class="actions">
    <button type="button" class="reveal" onclick="reveal()">Antwort zeigen</button>
    <button type="button" class="skip" onclick="skip()">Skip</button>
  </div>
  <div id="fb"></div>`;
  window.reveal=()=>{
    document.getElementById('fb').innerHTML = `<div>Antwort: <b>${escapeHTML(card.back)}</b></div>
    <div class="actions"><button type="button" onclick="nextCard()">Weiter</button></div>`;
  };
}

function renderMC(card, deck){
  const others = shuffle(deck.cards.filter(x=>x!==card)).slice(0,3).map(x=>x.back);
  const opts = shuffle([card.back, ...others]);
  const a=document.getElementById('learnArea');
  a.innerHTML = `<div class="q">${escapeHTML(card.front)}</div><div class="actions" id="opts"></div><div id="fb"></div>`;
  const box=document.getElementById('opts');
  opts.forEach(opt=>{
    const b=document.createElement('button'); b.type='button'; b.textContent=opt;
    b.onclick = ()=>{
      if(normalize(opt)===normalize(card.back)){ document.getElementById('fb').innerHTML = '<div>✅ Richtig</div><div class="actions"><button type="button" onclick="nextCard()">Weiter</button></div>'; }
      else { document.getElementById('fb').innerHTML = '<div>❌ Falsch – Lösung: <b>'+escapeHTML(card.back)+'</b></div><div class="actions"><button type="button" onclick="nextCard()">Weiter</button></div>'; }
    };
    box.appendChild(b);
  });
  const skipBtn=document.createElement('button'); skipBtn.type='button'; skipBtn.className='skip'; skipBtn.textContent='Skip'; skipBtn.onclick=skip; box.appendChild(skipBtn);
}

function renderPuzzle(card){
  const target = card.example || card.back;
  const tokens = shuffle((target||'').split(/\s+/).filter(Boolean));
  const a=document.getElementById('learnArea');
  a.innerHTML = `<div class="q">${escapeHTML(card.front)}</div><div class="actions" id="bank"></div><div id="assembled" class="q"></div>
  <div class="actions"><button type="button" onclick="checkPuzzle()">Prüfen</button><button type="button" class="skip" onclick="skip()">Skip</button></div><div id="fb"></div>`;
  const bank=document.getElementById('bank');
  tokens.forEach(t=>{ const b=document.createElement('button'); b.type='button'; b.textContent=t; b.onclick=()=>{ document.getElementById('assembled').textContent = (document.getElementById('assembled').textContent?document.getElementById('assembled').textContent+' ':'') + t; b.disabled=true; }; bank.appendChild(b); });
  window.checkPuzzle=()=>{
    const guess=document.getElementById('assembled').textContent.trim();
    if(normalize(guess)===normalize(target)){ document.getElementById('fb').innerHTML = '<div>✅ Richtig</div><div class="actions"><button type="button" onclick="nextCard()">Weiter</button></div>'; }
    else { document.getElementById('fb').innerHTML = '<div>❌ Falsch – Lösung: <b>'+escapeHTML(target)+'</b></div><div class="actions"><button type="button" onclick="nextCard()">Weiter</button></div>'; }
  };
}

function skip(){ document.getElementById('learnArea').innerHTML += '<div class="actions"><button type="button" onclick="nextCard()">Weiter</button></div>'; }

function normalize(s){ return (s||'').toLowerCase().normalize('NFD').replace(/\p{Diacritic}+/gu,'').trim(); }
function shuffle(a){ return a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(x=>x[1]); }
function escapeHTML(str){ return (str||'').replace(/[&<>"']/g, s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s])); }
