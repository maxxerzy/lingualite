document.addEventListener('DOMContentLoaded', async ()=>{
  $$('.nav button').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view))); showView('learn');
  await Decks.loadBuiltins(); fillDeckSelect(); setSchemaBox();

  // Settings init
  $('#maxNew').value = Store.state.settings.maxNewPerSession;
  $('#onlyDue').checked = Store.state.settings.onlyDue;
  $('#saveSettings').onclick = () => {
    const m = parseInt($('#maxNew').value || '0', 10);
    Store.state.settings.maxNewPerSession = Math.max(0, Math.min(200, isNaN(m) ? 0 : m));
    Store.state.settings.onlyDue = !!$('#onlyDue').checked;
    Store.save();
    alert('Einstellungen gespeichert.');
  };

  // Import/Export
  $('#exportBtn').onclick=()=>{ const data = Decks.exportAll(); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([data],{type:'application/json'})); a.download='decks_export.json'; a.click(); };
  $('#importBtn').onclick=async()=>{ const f=$('#importFile').files[0]; if(!f) return alert('Bitte JSON wählen.'); const text=await f.text(); try{ const obj=JSON.parse(text); Decks.importFromObject(obj); fillDeckSelect(); alert('Import OK.'); }catch(e){ alert('Ungültiges JSON.'); } };

  // Reset
  $('#resetProgress').onclick=()=>{ if(confirm('Nur Fortschritt wirklich löschen?')){ Store.resetProgressOnly(); alert('Fortschritt gelöscht.'); } };
  $('#resetAll').onclick=()=>{ if(confirm('Wirklich ALLES löschen?')) Store.resetAll(); };

  $('#startBtn').onclick = startSession;
});

let session = null;

function startSession(){
  const deck = getSelectedDeck();
  const now = Date.now();
  const onlyDue = Store.state.settings.onlyDue;
  const maxNew = Store.state.settings.maxNewPerSession;

  // Build key list
  const all = deck.cards.map((c,idx)=>({c, idx, key: Store.key(deck.id, idx)}));

  // Partition
  const due = [];
  const fresh = [];
  const later = [];

  for (const item of all){
    const p = Store.state.progress[item.key];
    if (!p){ fresh.push(item); continue; }
    if ((p.due||0) <= now) due.push(item); else later.push(item);
  }

  // New introduction
  const newNow = onlyDue ? [] : fresh.slice(0, maxNew);

  // Queue: interleave due and new
  let queue = [];
  const maxlen = Math.max(due.length, newNow.length);
  for (let i=0;i<maxlen;i++){
    if (i < due.length) queue.push(due[i]);
    if (i < newNow.length) queue.push(newNow[i]);
  }
  // If only due or no due/new, fall back to some 'later' to keep session going
  if (queue.length === 0 && !onlyDue){
    queue = later.slice(0, Math.max(20, maxNew || 0));
  }
  if (queue.length === 0){
    $('#learnArea').innerHTML = '<p>Keine fälligen Karten. Anpassungen in den Einstellungen möglich.</p>';
    return;
  }

  session = { deck, queue, current: null, mode: $('#modeSelect').value };
  nextCard();
}

function nextCard(){
  const area=$('#learnArea');
  if (!session || session.queue.length===0){ area.innerHTML='<p>Session beendet.</p>'; return; }
  const item = session.queue.shift();
  session.current = item;
  const card = item.c;
  if (session.mode==='flashcards') renderFlash(card);
  else if (session.mode==='multiple') renderMC(card, session.deck);
  else renderPuzzle(card);
}

function renderFlash(card){
  const area=$('#learnArea');
  area.innerHTML = `<div class="q">${escapeHTML(card.front)}</div>
    <div class="actions">
      <button type="button" class="reveal" onclick="reveal()">Antwort zeigen</button>
      <button type="button" class="skip" onclick="skip()">Skip</button>
    </div>
    <div id="fb"></div>`;
  window.reveal = () => {
    $('#fb').innerHTML = `<div>Antwort: <b>${escapeHTML(card.back)}</b>${card.example?'<div class="muted">'+escapeHTML(card.example)+'</div>':''}</div>
      <div class="actions">
        <button type="button" onclick="grade(true)">Richtig</button>
        <button type="button" onclick="grade(false)">Falsch</button>
      </div>`;
  };
}

function renderMC(card, deck){
  const others = shuffle(deck.cards.filter(c=>c!==card)).slice(0,3).map(c=>c.back);
  const opts = shuffle([card.back, ...others]);
  const area=$('#learnArea');
  area.innerHTML = `<div class="q">${escapeHTML(card.front)}</div><div class="actions" id="opts"></div><div id="fb"></div>`;
  const box=$('#opts');
  opts.forEach(opt=>{
    const b=document.createElement('button'); b.type='button'; b.textContent=opt;
    b.onclick=()=>{
      if (normalize(opt)===normalize(card.back)){
        grade(true, true);
      } else {
        session.queue.splice(1,0,session.current);
        $('#fb').innerHTML = '<div>❌ Falsch – Lösung: <b>'+escapeHTML(card.back)+'</b></div><div class="actions"><button type="button" onclick="nextCard()">Weiter</button></div>';
      }
    };
    box.appendChild(b);
  });
  const skipBtn=document.createElement('button'); skipBtn.type='button'; skipBtn.className='skip'; skipBtn.textContent='Skip'; skipBtn.onclick=()=>skip(); box.appendChild(skipBtn);
}

function renderPuzzle(card){
  const target = (card.example && card.example.split(/\s+/).length>=3) ? card.example : card.back;
  const tokens = shuffle(target.split(/\s+/));
  const area=$('#learnArea');
  area.innerHTML = `<div class="q">${escapeHTML(card.front)}</div><div class="actions" id="bank"></div><div id="assembled" class="q"></div>
                    <div class="actions"><button type="button" onclick="checkPuzzle()">Prüfen</button><button type="button" class="skip" onclick="skip()">Skip</button></div><div id="fb"></div>`;
  const bank=$('#bank');
  tokens.forEach(t=>{
    const b=document.createElement('button'); b.type='button'; b.textContent=t;
    b.onclick=()=>{ $('#assembled').textContent = ($('#assembled').textContent?$('#assembled').textContent+' ':'') + t; b.disabled=true; };
    bank.appendChild(b);
  });
  window.checkPuzzle = () => {
    const guess = $('#assembled').textContent.trim();
    if (normalize(guess)===normalize(target)){
      grade(true, true);
    } else {
      session.queue.splice(1,0,session.current);
      $('#fb').innerHTML = '<div>❌ Falsch – Lösung: <b>'+escapeHTML(target)+'</b></div><div class="actions"><button type="button" onclick="nextCard()">Weiter</button></div>';
    }
  };
}

function grade(ok, autoNext=false){
  const item = session.current;
  Store.grade(Store.key(session.deck.id, item.idx), !!ok);
  const fb = ok ? '✅ Richtig' : '❌ Falsch';
  $('#learnArea').innerHTML += '<div class="actions"><span>'+fb+'</span> <button type="button" onclick="nextCard()">Weiter</button></div>';
  if (autoNext) { /* keep explicit Weiter button */ }
}
function skip(){
  session.queue.push(session.current);
  $('#learnArea').innerHTML += '<div class="actions"><button type="button" onclick="nextCard()">Weiter</button></div>';
}

// utils
function normalize(s){ return (s||'').toLowerCase().normalize('NFD').replace(/\p{{Diacritic}}+/gu,'').trim(); }
function shuffle(a){ return a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(x=>x[1]); }
function escapeHTML(str){ return (str||'').replace(/[&<>"']/g, s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s])); }
