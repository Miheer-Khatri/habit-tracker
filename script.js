const HABIT_KEY="habits";
const DATA_KEY="trackerData";

let habits = JSON.parse(localStorage.getItem(HABIT_KEY)) || [
  "Do the dishes",
  "Meditate 5–10 minutes"
];

let data = JSON.parse(localStorage.getItem(DATA_KEY)) || {};
const cactusImgs = ["1","2","3","4","5"].map(n=>`cactus/${n}.png`);

const today = new Date();
let year = today.getFullYear();
let month = today.getMonth();

const monthSelect = document.getElementById("monthSelect");
const yearSelect = document.getElementById("yearSelect");

/* SELECTORS */
(function(){
  const months=[...Array(12)].map((_,i)=>
    new Date(0,i).toLocaleString("default",{month:"long"})
  );
  monthSelect.innerHTML = months.map((m,i)=>`<option value="${i}">${m}</option>`).join("");
  for(let y=year-3;y<=year+3;y++) yearSelect.innerHTML+=`<option>${y}</option>`;
  monthSelect.value=month;
  yearSelect.value=year;
})();

monthSelect.onchange=e=>{month=+e.target.value;build()};
yearSelect.onchange=e=>{year=+e.target.value;build()};

/* ADD HABIT */
document.getElementById("addHabit").onclick=()=>{
  const v=document.getElementById("newHabit").value.trim();
  if(!v) return;
  habits.push(v);
  localStorage.setItem(HABIT_KEY,JSON.stringify(habits));
  document.getElementById("newHabit").value="";
  build();
};

/* REMOVE HABIT */
document.addEventListener("click",e=>{
  if(e.target.classList.contains("remove")){
    habits.splice(+e.target.dataset.i,1);
    localStorage.setItem(HABIT_KEY,JSON.stringify(habits));
    build();
  }
});

/* HELPERS */
const daysInMonth=(y,m)=>new Date(y,m+1,0).getDate();
const weekClass=d=>d<=7?"week1":d<=14?"week2":d<=21?"week3":d<=28?"week4":"week5";

/* BUILD */
function build(){
  const days=daysInMonth(year,month);
  buildTable(days);
  drawGraph(days);
}

/* TABLE */
function buildTable(days){
  const t=document.getElementById("tracker");
  t.innerHTML="";

  /* ROW 1 – DAILY CACTUS (DIVIDED GROWTH) */
  let r1=`<tr><th></th>`;
  let fullDays=0;

  for(let d=1;d<=days;d++){
    let done = habits.filter(h=>data[`${year}-${month}-${h}-${d}`]).length;

    let level = 0;
    if (habits.length > 0) {
      level = Math.floor((done / habits.length) * 5);
      if (level > 4) level = 4;
    }

    if(done === habits.length && habits.length > 0) fullDays++;

    r1+=`<th class="cactus"><img src="${cactusImgs[level]}"></th>`;
  }
  r1+=`<th></th><th></th></tr>`;
  t.innerHTML+=r1;

  /* ROW 2 – WEEKDAYS */
  const labels=["S","M","T","W","T","F","S"];
  let r2=`<tr><th></th>`;
  for(let d=1;d<=days;d++){
    r2+=`<th class="weekday">${labels[new Date(year,month,d).getDay()]}</th>`;
  }
  r2+=`<th></th><th></th></tr>`;
  t.innerHTML+=r2;

  /* ROW 3 – DATES */
  let r3=`<tr><th class="habit">Habits</th>`;
  for(let d=1;d<=days;d++) r3+=`<th class="${weekClass(d)}">${d}</th>`;
  r3+=`<th>Done</th><th>Streak</th></tr>`;
  t.innerHTML+=r3;

  /* HABIT ROWS */
  habits.forEach((h,i)=>{
    let row=`<tr><td><b>${h}</b><span class="remove" data-i="${i}">✕</span></td>`;
    let done=0,streak=0,max=0;

    for(let d=1;d<=days;d++){
      const k=`${year}-${month}-${h}-${d}`;
      const chk=data[k];
      const future=new Date(year,month,d)>today;

      if(chk){done++;streak++;max=Math.max(max,streak)}
      else streak=0;

      row+=`<td class="${weekClass(d)}">
        <input type="checkbox"
          ${chk?"checked":""}
          ${future?"disabled":""}
          data-key="${k}">
      </td>`;
    }
    row+=`<td>${done}</td><td>${max}</td></tr>`;
    t.innerHTML+=row;
  });

  document.getElementById("grownCount").innerText=fullDays;
  document.getElementById("monthCactus").src=
    cactusImgs[Math.min(fullDays,cactusImgs.length-1)];
}

/* GRAPH */
function drawGraph(days){
  const c=document.getElementById("graph");
  c.width=c.offsetWidth;
  c.height=260;
  const ctx=c.getContext("2d");
  ctx.clearRect(0,0,c.width,c.height);

  const pad=30,w=c.width-pad*2,h=c.height-pad*2;
  let pts=[];

  for(let d=1;d<=days;d++){
    let p=habits.length?
      habits.filter(h=>data[`${year}-${month}-${h}-${d}`]).length/habits.length:0;
    pts.push({x:pad+(w/(days-1))*(d-1),y:pad+h-p*h});
  }

  ctx.beginPath();
  ctx.moveTo(pts[0].x,pad+h);
  pts.forEach(p=>ctx.lineTo(p.x,p.y));
  ctx.lineTo(pts.at(-1).x,pad+h);
  ctx.fillStyle="rgba(170,210,170,.3)";
  ctx.fill();

  ctx.beginPath();
  pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
  ctx.strokeStyle="#9ccc9c";
  ctx.lineWidth=2;
  ctx.stroke();

  ctx.fillStyle="#a8d5a2";
  pts.forEach(p=>{
    ctx.beginPath();
    ctx.arc(p.x,p.y,3,0,Math.PI*2);
    ctx.fill();
  });

  ctx.fillStyle="#555";
  for(let i=0;i<=100;i+=25){
    ctx.fillText(i+"%",2,pad+h-(i/100)*h);
  }

  for(let d=1;d<=days;d++){
    const x=pad+(w/(days-1))*(d-1);
    ctx.fillText(d,x-4,pad+h+18);
  }
}

/* SAVE */
document.addEventListener("change",e=>{
  if(e.target.dataset.key){
    data[e.target.dataset.key]=e.target.checked;
    localStorage.setItem(DATA_KEY,JSON.stringify(data));
    build();
  }
});

build();
