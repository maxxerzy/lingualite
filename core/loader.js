const Decks = {
  list: [],
  schema: { id: "string", name: "string", src: "string", tgt: "string", cards: [ { front: "string", back: "string", example: "string?", tags: "string[]?" } ] },
  async loadBuiltins() {
    const files = ["da_pack_01.json", "da_pack_02.json", "da_pack_03.json", "da_pack_04.json", "da_pack_05.json", "da_pack_06.json", "da_pack_07.json", "da_pack_08.json", "da_pack_09.json", "da_pack_10.json"];
    for (const f of files) {
      try { const res = await fetch('decks/'+f); if(!res.ok) continue; const data = await res.json(); this.addDeck(data); }
      catch(e){/*ignore*/}
    }
  },
  addDeck(deck){ if(!deck||!deck.id||!deck.cards||!deck.name||!deck.src||!deck.tgt) return; if(!Array.isArray(deck.cards)) return; this.list.push(deck); },
  exportAll(){ return JSON.stringify(this.list,null,2); },
  importFromObject(obj){ if(Array.isArray(obj)) obj.forEach(d=>this.addDeck(d)); else this.addDeck(obj); }
};
