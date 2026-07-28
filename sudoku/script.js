/* ---------- Generator ---------- */
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function canPlace(g,r,c,n){
  for(let i=0;i<9;i++){if(g[r][i]===n||g[i][c]===n)return false;}
  const br=r-r%3, bc=c-c%3;
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)if(g[br+i][bc+j]===n)return false;
  return true;
}

function fillGrid(g){
  for(let r=0;r<9;r++)for(let c=0;c<9;c++){
    if(g[r][c]===0){
      for(const n of shuffle([1,2,3,4,5,6,7,8,9])){
        if(canPlace(g,r,c,n)){g[r][c]=n;if(fillGrid(g))return true;g[r][c]=0;}
      }
      return false;
    }
  }
  return true;
}

function countSolutions(g,limit){
  let count=0;
  (function solve(){
    for(let r=0;r<9;r++)for(let c=0;c<9;c++){
      if(g[r][c]===0){
        for(let n=1;n<=9;n++){
          if(canPlace(g,r,c,n)){g[r][c]=n;solve();g[r][c]=0;if(count>=limit)return;}
        }
        return;
      }
    }
    count++;
  })();
  return count;
}

function generate(givensTarget){
  const solution=Array.from({length:9},()=>Array(9).fill(0));
  fillGrid(solution);
  const puzzle=solution.map(r=>r.slice());
  const cells=shuffle([...Array(81).keys()]);
  let givens=81;
  for(const idx of cells){
    if(givens<=givensTarget)break;
    const r=Math.floor(idx/9), c=idx%9;
    const backup=puzzle[r][c];
    puzzle[r][c]=0;
    const test=puzzle.map(row=>row.slice());
    if(countSolutions(test,2)!==1){puzzle[r][c]=backup;}
    else givens--;
  }
  return {puzzle,solution};
}

/* ---------- Udostępnianie ---------- */
const LEVEL_CODES={child:'c',easy:'e',medium:'m',normal:'n',hard:'h',vhard:'v',extreme:'x'};
const CODE_LEVELS=Object.fromEntries(Object.entries(LEVEL_CODES).map(([k,v])=>[v,k]));

let origPuzzle=null; // puzzle w momencie startu (bez ruchów gracza)

function encodePuzzle(){
  if(!origPuzzle)return null;
  const lvCode=LEVEL_CODES[levelSel.value]||'e';
  let digits='';
  for(let r=0;r<9;r++)for(let c=0;c<9;c++)digits+=origPuzzle[r][c];
  return lvCode+digits;
}

function validatePuzzleCode(code){
  if(!code||code.length!==82)return null;
  const lvCode=code[0];
  const level=CODE_LEVELS[lvCode];
  if(!level)return null;
  const digits=code.slice(1);
  if(!/^[0-9]{81}$/.test(digits))return null;
  const grid=[];
  for(let r=0;r<9;r++)grid.push(digits.slice(r*9,r*9+9).split('').map(Number));
  // sprawdź brak konfliktów
  for(let r=0;r<9;r++)for(let c=0;c<9;c++){
    const v=grid[r][c]; if(!v)continue;
    for(let i=0;i<9;i++){
      if(i!==c&&grid[r][i]===v)return null;
      if(i!==r&&grid[i][c]===v)return null;
    }
    const br=r-r%3,bc=c-c%3;
    for(let i=0;i<3;i++)for(let j=0;j<3;j++)
      if((br+i!==r||bc+j!==c)&&grid[br+i][bc+j]===v)return null;
  }
  return {level,grid};
}

function loadFromCode(code){
  const parsed=validatePuzzleCode(code);
  if(!parsed)return false;
  const{level,grid}=parsed;
  // wypełnij rozwiązanie przez backtracking
  const sol=grid.map(r=>r.slice());
  if(!fillGrid(sol))return false;
  levelSel.value=level;
  solution=sol;
  origPuzzle=grid.map(r=>r.slice());
  puzzle=grid.map(r=>r.slice());
  given=grid.map(r=>r.map(v=>v!==0));
  notes=Array.from({length:9},()=>Array.from({length:9},()=>new Set()));
  history=[];noteMode=false;finishTime=0;hintsUsed=0;
  noteBtnEl.classList.remove('note-active');
  document.body.classList.remove('note-mode');
  selected=null;mistakes=0;solved=false;
  updateHintBtn();
  instantCheck=INSTANT_CHECK.has(level);
  document.getElementById('overlay').classList.remove('show');
  document.getElementById('printLevel').textContent='Poziom: '+levelSel.options[levelSel.selectedIndex].text;
  render();updateStats();resetTimer();
  return true;
}

let toastTimer=null;
function showToast(msg,ms=2200){
  const el=document.getElementById('toast');
  el.textContent=msg;el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>el.classList.remove('show'),ms);
}

/* ---------- Stan gry ---------- */
const LEVELS={
  child:48, easy:42, medium:36, normal:32, hard:28, vhard:23, extreme:19
};
const INSTANT_CHECK=new Set(['child','easy','medium','normal']);
let instantCheck=true;
let solution, puzzle, given, notes, selected=null, mistakes=0;
let startTime=null, timerId=null, solved=false, finishTime=0;
let history=[], noteMode=false, paused=false, pausedElapsed=0, hintsUsed=0;
const MAX_HINTS=3;
const boardEl=document.getElementById('board');
const padEl=document.getElementById('pad');
const levelSel=document.getElementById('levelSel');
const loadingEl=document.getElementById('loading');
const noteBtnEl=document.getElementById('noteBtn');
const cells=[];

// przywróć ostatni poziom (domyślnie easy)
levelSel.value=localStorage.getItem('sudokuLevel')||'easy';
levelSel.addEventListener('change',()=>localStorage.setItem('sudokuLevel',levelSel.value));

function newGame(){
  if(paused)resume();
  loadingEl.classList.add('show');
  resetTimer();
  setTimeout(()=>{
    const target=LEVELS[levelSel.value]||42;
    instantCheck=INSTANT_CHECK.has(levelSel.value);
    const {puzzle:p,solution:s}=generate(target);
    solution=s;
    origPuzzle=p.map(r=>r.slice());
    puzzle=p.map(r=>r.slice());
    given=p.map(r=>r.map(v=>v!==0));
    notes=Array.from({length:9},()=>Array.from({length:9},()=>new Set()));
    history=[]; noteMode=false; finishTime=0; hintsUsed=0;
    noteBtnEl.classList.remove('note-active');
    document.body.classList.remove('note-mode');
    selected=null; mistakes=0; solved=false;
    updateHintBtn();
    document.getElementById('overlay').classList.remove('show');
    document.getElementById('printLevel').textContent='Poziom: '+levelSel.options[levelSel.selectedIndex].text;
    render();
    updateStats();
    loadingEl.classList.remove('show');
  },30);
}

function render(){
  boardEl.innerHTML='';
  cells.length=0;
  for(let r=0;r<9;r++)for(let c=0;c<9;c++){
    const d=document.createElement('div');
    d.className='cell';
    if(c%3===2 && c!==8)d.classList.add('br');
    if(r%3===2 && r!==8)d.classList.add('bb');
    if(given[r][c])d.classList.add('given');
    d.dataset.r=r; d.dataset.c=c;
    d.addEventListener('click',()=>selectCell(r,c));
    boardEl.appendChild(d);
    cells.push(d);
  }
  buildPad();
  paint();
}

function cellAt(r,c){return cells[r*9+c];}

// czy cyfra w (r,c) łamie regułę: ta sama w rzędzie, kolumnie lub kwadracie 3×3
function hasConflict(r,c){
  const v=puzzle[r][c];
  if(!v)return false;
  for(let i=0;i<9;i++){
    if(i!==c && puzzle[r][i]===v)return true;
    if(i!==r && puzzle[i][c]===v)return true;
  }
  const br=r-r%3, bc=c-c%3;
  for(let i=0;i<3;i++)for(let j=0;j<3;j++){
    const rr=br+i, cc=bc+j;
    if((rr!==r||cc!==c) && puzzle[rr][cc]===v)return true;
  }
  return false;
}

// czy wpis gracza w (r,c) powinien być oznaczony na czerwono
function isFlagged(r,c){
  const v=puzzle[r][c];
  if(v===0 || given[r][c])return false;
  return instantCheck ? v!==solution[r][c] : hasConflict(r,c);
}

function selectCell(r,c){
  selected={r,c};
  paint();
}

function buildNotesHtml(noteSet){
  let h='<div class="notes-grid">';
  for(let n=1;n<=9;n++) h+=`<div class="note${noteSet.has(n)?'':' off'}">${n}</div>`;
  return h+'</div>';
}

function paint(){
  for(let r=0;r<9;r++)for(let c=0;c<9;c++){
    const d=cellAt(r,c);
    const v=puzzle[r][c];
    if(v){ d.textContent=v; }
    else if(notes[r][c].size>0){ d.innerHTML=buildNotesHtml(notes[r][c]); }
    else { d.textContent=''; }
    d.classList.remove('sel','peer','same','bad','conflict');
    if(hasConflict(r,c))d.classList.add('conflict');
    if(isFlagged(r,c))d.classList.add('bad');
  }
  if(selected){
    const {r,c}=selected;
    const selVal=puzzle[r][c];
    for(let i=0;i<9;i++){cellAt(r,i).classList.add('peer');cellAt(i,c).classList.add('peer');}
    const br=r-r%3, bc=c-c%3;
    for(let i=0;i<3;i++)for(let j=0;j<3;j++)cellAt(br+i,bc+j).classList.add('peer');
    if(selVal!==0){
      for(let rr=0;rr<9;rr++)for(let cc=0;cc<9;cc++)
        if(puzzle[rr][cc]===selVal)cellAt(rr,cc).classList.add('same');
    }
    cellAt(r,c).classList.remove('peer','same');
    cellAt(r,c).classList.add('sel');
  }
}

function place(n){
  if(solved||!selected||paused)return;
  const {r,c}=selected;
  if(given[r][c])return;
  if(!startTime)startTimer();

  if(noteMode && n!==0){
    history.push({r,c,oldVal:puzzle[r][c],oldNotes:new Set(notes[r][c])});
    if(notes[r][c].has(n)) notes[r][c].delete(n); else notes[r][c].add(n);
    paint(); return;
  }

  if(n!==0 && n===puzzle[r][c])return;
  history.push({r,c,oldVal:puzzle[r][c],oldNotes:new Set(notes[r][c])});
  puzzle[r][c]=n;
  if(n!==0){
    notes[r][c].clear();
    for(let i=0;i<9;i++){notes[r][i].delete(n);notes[i][c].delete(n);}
    const br=r-r%3,bc=c-c%3;
    for(let i=0;i<3;i++)for(let j=0;j<3;j++)notes[br+i][bc+j].delete(n);
  }
  const d=cellAt(r,c);
  d.classList.remove('pop'); void d.offsetWidth; d.classList.add('pop');
  paint(); updateStats(); checkWin();
}

function undo(){
  if(!history.length||solved)return;
  const {r,c,oldVal,oldNotes}=history.pop();
  puzzle[r][c]=oldVal;
  notes[r][c]=new Set(oldNotes);
  selected={r,c};
  paint(); updateStats();
}

function buildPad(){
  padEl.innerHTML='';
  for(let n=1;n<=9;n++){
    const b=document.createElement('button');
    b.className='num';
    b.textContent=n;
    b.dataset.n=n;
    b.addEventListener('click',()=>place(n));
    padEl.appendChild(b);
  }
}

function updatePadCounts(){
  const counts={};
  for(let r=0;r<9;r++)for(let c=0;c<9;c++){
    const v=puzzle[r][c];
    if(v && v===solution[r][c])counts[v]=(counts[v]||0)+1;
  }
  padEl.querySelectorAll('.num').forEach(b=>{
    const n=+b.dataset.n;
    b.classList.toggle('done',(counts[n]||0)>=9);
  });
}

function updateStats(){
  let filled=0;
  for(let r=0;r<9;r++)for(let c=0;c<9;c++)if(puzzle[r][c]!==0)filled++;
  document.getElementById('filled').textContent=filled+'/81';
  updatePadCounts();
}

function checkWin(){
  for(let r=0;r<9;r++)for(let c=0;c<9;c++)
    if(puzzle[r][c]!==solution[r][c])return;
  solved=true;
  finishTime=elapsed();
  stopTimer();
  setTimeout(showWinOverlay,250);
}

/* ---------- Pauza ---------- */
function pause(){
  if(paused||solved||!startTime)return;
  paused=true;
  pausedElapsed=elapsed();
  stopTimer();
  document.getElementById('pauseMask').classList.add('show');
  document.getElementById('pauseBtn').innerHTML=
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px"><polygon points="5 3 19 12 5 21 5 3"/></svg> Wznów';
}
function resume(){
  if(!paused)return;
  paused=false;
  startTime=Date.now()-pausedElapsed*1000;
  timerId=setInterval(()=>{document.getElementById('timer').textContent=fmt(elapsed());},1000);
  document.getElementById('pauseMask').classList.remove('show');
  document.getElementById('pauseBtn').innerHTML=
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pauza';
}

/* ---------- Podpowiedź ---------- */
function updateHintBtn(){
  const remaining=MAX_HINTS-hintsUsed;
  const btn=document.getElementById('hintBtn');
  document.getElementById('hintCount').textContent=`(${remaining})`;
  btn.disabled=remaining<=0;
  btn.style.opacity=remaining<=0?'0.4':'';
}

function hint(){
  if(solved||hintsUsed>=MAX_HINTS)return;
  const empties=[];
  for(let r=0;r<9;r++)for(let c=0;c<9;c++)
    if(!given[r][c] && puzzle[r][c]!==solution[r][c])empties.push({r,c});
  if(!empties.length)return;
  const {r,c}=empties[Math.floor(Math.random()*empties.length)];
  if(!startTime)startTimer();
  puzzle[r][c]=solution[r][c];
  given[r][c]=true;
  hintsUsed++;
  updateHintBtn();
  const d=cellAt(r,c);
  d.classList.add('given','hint-flash');
  setTimeout(()=>d.classList.remove('hint-flash'),900);
  selected={r,c};
  paint();
  updateStats();
  checkWin();
}

/* ---------- Timer ---------- */
function startTimer(){startTime=Date.now();timerId=setInterval(()=>{document.getElementById('timer').textContent=fmt(elapsed());},1000);}
function stopTimer(){clearInterval(timerId);timerId=null;}
function resetTimer(){stopTimer();startTime=null;document.getElementById('timer').textContent='0:00';}
function elapsed(){return startTime?Math.floor((Date.now()-startTime)/1000):0;}
function fmt(s){const m=Math.floor(s/60);return m+':'+String(s%60).padStart(2,'0');}

/* ---------- Klawiatura ---------- */
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();undo();return;}
  if(e.key==='n'||e.key==='N'){noteMode=!noteMode;noteBtnEl.classList.toggle('note-active',noteMode);document.body.classList.toggle('note-mode',noteMode);return;}
  if(e.key==='Escape'&&paused){resume();return;}
  if(!selected)return;
  if(e.key>='1'&&e.key<='9')place(+e.key);
  else if(e.key==='Backspace'||e.key==='Delete'||e.key==='0')place(0);
  else if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
    e.preventDefault();
    let {r,c}=selected;
    if(e.key==='ArrowUp')r=Math.max(0,r-1);
    if(e.key==='ArrowDown')r=Math.min(8,r+1);
    if(e.key==='ArrowLeft')c=Math.max(0,c-1);
    if(e.key==='ArrowRight')c=Math.min(8,c+1);
    selectCell(r,c);
  }
});

document.getElementById('eraseBtn').addEventListener('click',()=>place(0));
document.getElementById('hintBtn').addEventListener('click',hint);
document.getElementById('newBtn').addEventListener('click',newGame);
document.getElementById('undoBtn').addEventListener('click',undo);
document.getElementById('pauseBtn').addEventListener('click',()=>{if(paused)resume();else pause();});
document.getElementById('noteBtn').addEventListener('click',()=>{
  noteMode=!noteMode;
  noteBtnEl.classList.toggle('note-active',noteMode);
  document.body.classList.toggle('note-mode',noteMode);
});
levelSel.addEventListener('change',newGame);
document.getElementById('printBtn').addEventListener('click',()=>{
  selected=null; paint();
  window.print();
});

/* ---------- Tryb ciemny ---------- */
(()=>{
  const btn=document.getElementById('themeBtn');
  const saved=localStorage.getItem('sudokuTheme');
  if(saved==='dark'){document.body.classList.add('dark');btn.textContent='☀️ Jasny';}
  btn.addEventListener('click',()=>{
    const dark=document.body.classList.toggle('dark');
    btn.textContent=dark?'☀️ Jasny':'🌙 Ciemny';
    localStorage.setItem('sudokuTheme',dark?'dark':'light');
  });
})();

/* ---------- Rekordy ---------- */
const RECORDS_KEY='sudokuRecords';
const LEVEL_LABELS={child:'Dziecko',easy:'Łatwy',medium:'Średni',normal:'Normalny',hard:'Trudny',vhard:'Bardzo trudny',extreme:'Ekstremalny'};
let recActiveLevel='easy';
let recordSaved=false;

function loadRecords(){
  try{return JSON.parse(localStorage.getItem(RECORDS_KEY)||'{}')}catch{return {}}
}

function saveRecord(name,level,timeSeconds,mistakeCount){
  const data=loadRecords();
  if(!data[level])data[level]=[];
  data[level].push({name,time:timeSeconds,mistakes:mistakeCount,date:new Date().toLocaleDateString('pl-PL')});
  data[level].sort((a,b)=>a.time-b.time||a.mistakes-b.mistakes);
  data[level]=data[level].slice(0,10);
  localStorage.setItem(RECORDS_KEY,JSON.stringify(data));
}

function renderRecTable(level){
  const data=loadRecords();
  const rows=data[level]||[];
  if(!rows.length)return '<p class="rec-empty">Brak rekordów dla tego poziomu.</p>';
  const medals=['🥇','🥈','🥉'];
  let h='<table class="rec-table"><thead><tr><th>#</th><th>Imię</th><th>Czas</th><th>Błędy</th><th>Data</th></tr></thead><tbody>';
  rows.forEach((r,i)=>{
    const m=medals[i]||`${i+1}.`;
    h+=`<tr><td>${m}</td><td>${r.name}</td><td style="color:var(--user);font-weight:600">${fmt(r.time)}</td><td>${r.mistakes}</td><td style="color:var(--ink-soft);font-size:11px">${r.date}</td></tr>`;
  });
  return h+'</tbody></table>';
}

function buildRecTabs(){
  const tabs=document.getElementById('recTabs');
  tabs.innerHTML=Object.entries(LEVEL_LABELS).map(([k,v])=>
    `<button class="rec-tab${k===recActiveLevel?' active':''}" data-lv="${k}">${v}</button>`
  ).join('');
  tabs.querySelectorAll('.rec-tab').forEach(btn=>{
    btn.addEventListener('click',()=>{
      recActiveLevel=btn.dataset.lv;
      buildRecTabs();
      document.getElementById('recTable').innerHTML=renderRecTable(recActiveLevel);
    });
  });
  document.getElementById('recTable').innerHTML=renderRecTable(recActiveLevel);
}

function openRecords(){
  recActiveLevel=levelSel.value||'easy';
  buildRecTabs();
  document.getElementById('recPanel').classList.add('show');
}

document.getElementById('shareBtn').addEventListener('click',()=>{
  const code=encodePuzzle();
  if(!code){showToast('Brak aktywnej gry');return;}
  const url=location.origin+location.pathname+'?p='+code;
  navigator.clipboard.writeText(url).then(()=>showToast('✓ Link skopiowany!')).catch(()=>{
    prompt('Skopiuj link:',url);
  });
});

document.getElementById('recordsBtn').addEventListener('click',openRecords);
document.getElementById('recCloseBtn').addEventListener('click',()=>document.getElementById('recPanel').classList.remove('show'));
document.getElementById('showRecordsFromWin').addEventListener('click',openRecords);

document.getElementById('againBtn').addEventListener('click',()=>{
  document.getElementById('overlay').classList.remove('show');
  newGame();
});

// załaduj z URL jeśli podano ?p=...
const _urlCode=new URLSearchParams(location.search).get('p');
if(_urlCode){
  loadingEl.classList.add('show');
  setTimeout(()=>{
    const ok=loadFromCode(_urlCode);
    loadingEl.classList.remove('show');
    if(!ok){
      const em=document.getElementById('errorMask');
      em.classList.add('show');
      setTimeout(()=>{em.classList.remove('show');newGame();},6000);
    }
    else{window.history.replaceState({},'',location.pathname);}
  },30);
}else{
  newGame();
}

document.getElementById('saveBtn').addEventListener('click',()=>{
  if(recordSaved)return;
  const name=document.getElementById('playerName').value.trim();
  if(!name){document.getElementById('playerName').focus();return;}
  saveRecord(name,levelSel.value,finishTime,mistakes);
  recordSaved=true;
  document.getElementById('saveBtn').disabled=true;
  document.getElementById('saveInfo').style.display='block';
});

function showWinOverlay(){
  recordSaved=hintsUsed>0;
  const saveBtn=document.getElementById('saveBtn');
  saveBtn.disabled=hintsUsed>0;
  document.getElementById('saveInfo').style.display=hintsUsed>0?'block':'none';
  document.getElementById('saveInfo').textContent=hintsUsed>0?'⚠️ Gry z podpowiedziami nie są zapisywane.':'✓ Wynik zapisany!';
  document.getElementById('winTime').textContent=fmt(finishTime);
  document.getElementById('winMistakes').textContent=mistakes;
  document.getElementById('overlay').classList.add('show');
}
