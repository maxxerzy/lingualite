const LS_KEY = 'lingualite_2000_v1';
const Store = {
  state: null,
  defaults() {
    return {
      progress: {}, // key -> {ef, interval, reps, due}
      settings: { maxNewPerSession: 30, onlyDue: false }
    };
  },
  load() {
    try { const raw = localStorage.getItem(LS_KEY); this.state = raw ? JSON.parse(raw) : this.defaults(); }
    catch(e){ this.state = this.defaults(); }
  },
  save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(this.state)); } catch(e){}
  },
  resetProgressOnly(){ this.state.progress = {}; this.save(); },
  resetAll(){ localStorage.removeItem(LS_KEY); location.reload(); },

  key(deckId, idx){ return deckId + '::' + idx; },
  getEntry(key){
    if (!this.state.progress[key]) this.state.progress[key] = { ef: 2.5, interval: 0, reps: 0, due: 0 };
    return this.state.progress[key];
  },
  grade(key, correct){
    const e = this.getEntry(key);
    const now = Date.now();
    // Map to SM-2 quality: correct -> q=4, wrong -> q=2
    const q = correct ? 4 : 2;
    // Update EF
    e.ef = Math.max(1.3, e.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    if (q < 3) {
      e.reps = 0;
      e.interval = 0;
      e.due = now; // soon
    } else {
      e.reps += 1;
      if (e.reps == 1) e.interval = 1;
      else if (e.reps == 2) e.interval = 6;
      else e.interval = Math.round(e.interval * e.ef);
      e.due = now + e.interval * 24*60*60*1000;
    }
    this.save();
  }
};
Store.load();
