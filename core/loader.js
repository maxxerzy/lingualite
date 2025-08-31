const Decks = {
  list: [],
  schema: { id: "string", name: "string", src: "string", tgt: "string", cards: [ { front:"string", back:"string" } ] },
  async loadBuiltins(){
    const patterns = [
      ["DA","decks/da_pack_01.json","decks/da_pack_02.json","decks/da_pack_03.json","decks/da_pack_04.json","decks/da_pack_05.json","decks/da_pack_06.json","decks/da_pack_07.json","decks/da_pack_08.json","decks/da_pack_09.json","decks/da_pack_10.json"],
      ["RU","decks/ru_pack_01.json","decks/ru_pack_02.json","decks/ru_pack_03.json","decks/ru_pack_04.json","decks/ru_pack_05.json","decks/ru_pack_06.json","decks/ru_pack_07.json","decks/ru_pack_08.json","decks/ru_pack_09.json","decks/ru_pack_10.json"],
      ["LA","decks/la_pack_01.json","decks/la_pack_02.json","decks/la_pack_03.json","decks/la_pack_04.json","decks/la_pack_05.json","decks/la_pack_06.json","decks/la_pack_07.json","decks/la_pack_08.json","decks/la_pack_09.json","decks/la_pack_10.json"]
    ];
    for (const arr of patterns){
      for (let i=1;i<arr.length;i++){
        const path = arr[i];
        try{ const res = await fetch(path); if(!res.ok) continue; const deck = await res.json(); this.addDeck(deck); }catch(e){ /* ignore missing */ }
      }
    }
  },
  addDeck(deck){ if(!deck||!deck.id||!deck.cards||!deck.src||!deck.tgt) return; if(!Array.isArray(deck.cards)) return; this.list.push(deck); },
  importFromObject(obj){ Array.isArray(obj)?obj.forEach(d=>this.addDeck(d)):this.addDeck(obj); },
  exportAll(){ return JSON.stringify(this.list,null,2); }
};
