const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
function showView(id){ $$('.view').forEach(v=>v.classList.add('hidden')); $('#view-'+id).classList.remove('hidden'); }
function fillDeckSelect(){ const sel=$('#deckSelect'); sel.innerHTML = Decks.list.map(d=>`<option value="${d.id}">${d.name} (${d.src}→${d.tgt})</option>`).join(''); const list=$('#deckList'); list.innerHTML = Decks.list.map(d=>`<li><b>${d.name}</b> · ${d.src}→${d.tgt} · ${d.cards.length} Karten</li>`).join(''); }
function getSelectedDeck(){ const id=$('#deckSelect').value; return Decks.list.find(d=>d.id===id) || Decks.list[0]; }
function setSchemaBox(){ $('#schemaBox').textContent = JSON.stringify(Decks.schema,null,2); }
