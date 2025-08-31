document.addEventListener('DOMContentLoaded',()=>{
 fetch('decks.json').then(r=>r.json()).then(data=>{
   const cont=document.getElementById('deckList');
   data.decks.forEach(d=>{
     const div=document.createElement('div');
     div.textContent=d.name+' ('+d.cards.length+' Karten)';
     cont.appendChild(div);
   });
 });
});