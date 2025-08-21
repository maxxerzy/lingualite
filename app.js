function showSection(id){
  document.querySelectorAll('.section').forEach(s=>s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}
function resetAll(){
  localStorage.clear();
  location.reload();
}
console.log('Lingualite v16 final loaded');