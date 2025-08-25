function showSection(id){document.querySelectorAll('.section').forEach(s=>s.classList.add('hidden'));document.getElementById(id).classList.remove('hidden');}
function resetAll(){localStorage.clear();location.reload();}
function startLearning(){document.getElementById('learningArea').innerHTML='<div class=card>Session gestartet!</div>';}