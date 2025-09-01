const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
function showView(id){ $$('.view').forEach(v=>v.classList.add('hidden')); $('#view-'+id).classList.remove('hidden'); }

function languagesAvailable(){
  // Prefer manifest keys (fast, stabil); fallback auf Decks.list
  const m = (window.DeckLoader && DeckLoader.manifest) ? DeckLoader.manifest : null;
  let langs = [];
  if (m){ langs = Object.keys(m); }
  else { langs = Array.from(new Set((Decks.list||[]).flatMap(d => String(d.src||'').split('/')))); }
  // Ensure unique and non-empty
  langs = langs.filter(Boolean);
  // Sort with DA first if present
  langs.sort((a,b)=> (a==='DA') ? -1 : (b==='DA') ? 1 : a.localeCompare(b));
  return ['ALLE', ...langs];
}

function fillLanguageFilter(){
  const sel = $('#langFilter'); if (!sel) return;
  const langs = languagesAvailable();
  sel.innerHTML = langs.map(v=>`<option value="${v}">${v}</option>`).join('');
  if (!sel.value) sel.value = 'ALLE';
}

function filteredDecks(){
  const lf = $('#langFilter')?.value || 'ALLE';
  return (Decks.list||[]).filter(d => {
    const src = String(d.src||''); // may be "DA" or "DA/DE"
    if (lf==='ALLE') return true;
    return src.split('/').includes(lf);
  });
}

function fillDeckSelect(){
  const sel = $('#deckSelect'); if (!sel) return;
  const list = filteredDecks();
  sel.innerHTML = list.map(d=>`<option value="${d.id}">${d.name} (${d.src}→${d.tgt})</option>`).join('');
  const ul = $('#deckList'); if (ul) ul.innerHTML = list.map(d=>`<li><b>${d.name}</b> · ${d.src}→${d.tgt}</li>`).join('');
}
