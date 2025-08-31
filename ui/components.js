const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
function showView(id){ $$('.view').forEach(v=>v.classList.add('hidden')); $('#view-'+id).classList.remove('hidden'); }
function languagesAvailable(){ const set=new Set(Decks.list.map(d=>d.src)); return Array.from(set); }
function fillLanguageFilter(){ const langs = languagesAvailable(); const sel=$('#langFilter'); const options = ['ALLE', ...langs]; sel.innerHTML = options.map(v=>`<option value="${v}">${v}</option>`).join(''); }
function fillDeckSelect(){ const sel=$('#deckSelect'); const lf=$('#langFilter').value; const filtered = Decks.list.filter(d=> lf==='ALLE' ? true : d.src===lf ); sel.innerHTML = filtered.map(d=>`<option value="${d.id}">${d.name} (${d.src}→${d.tgt})</option>`).join(''); const list=$('#deckList'); list.innerHTML = filtered.map(d=>`<li><b>${d.name}</b> · ${d.src}→${d.tgt} · ${d.cards.length} Karten</li>`).join(''); }
function getSelectedDeck(){ const id=$('#deckSelect').value; return Decks.list.find(d=>d.id===id); }
function setSchemaBox(){ $('#schemaBox').textContent = JSON.stringify(Decks.schema,null,2); }
