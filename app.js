/* ============ 有有的小天地 - App Logic ============ */

const STORE_KEY = 'youyou_data_v1';
const todayStr = () => new Date().toISOString().slice(0,10);

// ---------- 默认数据 ----------
function defaultData(){
  return {
    points: 0,
    habits: [
      {id:'h1', ic:'🦷', name:'早晚刷牙', desc:'保护小牙齿', reward:2},
      {id:'h2', ic:'🛏️', name:'早睡早起', desc:'晚上9点前睡觉', reward:3},
      {id:'h3', ic:'💧', name:'多喝水', desc:'每天喝够水', reward:1},
      {id:'h4', ic:'🥦', name:'不挑食', desc:'蔬菜都要吃', reward:2},
      {id:'h5', ic:'🧹', name:'整理玩具', desc:'自己收拾好', reward:2},
      {id:'h6', ic:'🏃', name:'户外运动', desc:'出去玩一玩', reward:3},
    ],
    habitLog: {}, // {date: [habitId,...]}
    studyLog: {}, // {date: {math,chinese,english,read}}
    moods: {}, // {date: '😊'}
    diaries: {}, // {date: 'text'}
    health: {
      height: [], // [{date, value}]
      weight: [],
      vision: [],
      sick: [], // [{date, desc}]
    },
    shop: [
      {id:'s1', ic:'🍦', name:'冰淇淋一个', cost:10},
      {id:'s2', ic:'🎈', name:'小气球', cost:5},
      {id:'s3', ic:'🎨', name:'画本一本', cost:20},
      {id:'s4', ic:'🧸', name:'小玩具', cost:30},
      {id:'s5', ic:'📺', name:'看动画片30分钟', cost:8},
      {id:'s6', ic:'🎢', name:'周末去游乐场', cost:50},
    ],
    redeemed: [], // [{id, shopId, date}]
    growth: [], // [{id, date, emoji, title, note}]
    settings: { dailyGoal: 4 },
  };
}

// ---------- 存储 ----------
function load(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(!raw) return defaultData();
    const d = JSON.parse(raw);
    // 兜底合并
    const base = defaultData();
    return {...base, ...d, health:{...base.health, ...(d.health||{})}, settings:{...base.settings, ...(d.settings||{})}};
  }catch(e){ return defaultData(); }
}
function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
let state = load();

// ---------- 工具 ----------
function toast(msg){
  let t = document.querySelector('.toast');
  if(!t){ t = document.createElement('div'); t.className='toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid = setTimeout(()=>t.classList.remove('show'), 1800);
}

function openModal(html){
  let mask = document.querySelector('.modal-mask');
  if(!mask){
    mask = document.createElement('div');
    mask.className='modal-mask';
    mask.innerHTML = '<div class="modal"></div>';
    document.body.appendChild(mask);
    mask.addEventListener('click', e=>{ if(e.target===mask) mask.classList.remove('show'); });
  }
  mask.querySelector('.modal').innerHTML = html;
  mask.classList.add('show');
  return mask;
}
function closeModal(){ document.querySelector('.modal-mask')?.classList.remove('show'); }

function pointsDelta(n){
  state.points = Math.max(0, state.points + n);
  save();
}

// 计算今日完成概况
function todayOverview(){
  const t = todayStr();
  const studyDone = Object.values(state.studyLog[t]||{}).filter(Boolean).length;
  const habitDone = (state.habitLog[t]||[]).length;
  return { studyDone, studyTotal:4, habitDone, habitTotal: state.habits.length };
}

// ---------- 导航 ----------
const TABS = [
  {key:'home', ic:'🏠', name:'首页'},
  {key:'habit', ic:'✨', name:'习惯'},
  {key:'study', ic:'📚', name:'学习'},
  {key:'health', ic:'💪', name:'健康'},
  {key:'mood', ic:'😊', name:'心情'},
  {key:'points', ic:'⭐', name:'积分'},
  {key:'growth', ic:'🌱', name:'成长'},
];
let currentTab = 'home';

function renderTabbar(){
  const bar = document.getElementById('tabbar');
  bar.innerHTML = TABS.map(t=>`
    <button class="tab ${t.key===currentTab?'active':''}" data-key="${t.key}">
      <span class="ic">${t.ic}</span>
      <span>${t.name}</span>
    </button>`).join('');
  bar.querySelectorAll('.tab').forEach(b=>{
    b.onclick = ()=>{ currentTab = b.dataset.key; renderTabbar(); renderView(); document.getElementById('view-container').scrollTop=0; };
  });
}

function renderView(){
  const c = document.getElementById('view-container');
  const v = {
    home: viewHome, habit: viewHabit, study: viewStudy,
    health: viewHealth, mood: viewMood, points: viewPoints, growth: viewGrowth
  }[currentTab];
  c.innerHTML = v();
  // 通用事件绑定入口
  afterRender[currentTab]?.();
}

const afterRender = {};

// ================= 首页 =================
function viewHome(){
  const ov = todayOverview();
  const t = todayStr();
  const mood = state.moods[t];
  const moodEmoji = mood || '🤔';
  const summary = state.diaries[t] || '';
  const today = new Date();
  const wd = ['日','一','二','三','四','五','六'][today.getDay()];
  return `
    <div class="page-head">
      <div>
        <h1>嗨，有有！👋</h1>
        <div class="sub">${today.getMonth()+1}月${today.getDate()}日 星期${wd}</div>
      </div>
      <div style="font-size:34px;">🌈</div>
    </div>

    <div class="hero">
      <div class="label">我的小星星积分</div>
      <div class="num">${state.points}<small>颗 ⭐</small></div>
      <div class="row">
        <div class="pill">🎯 目标 ${state.settings.dailyGoal} 项/天</div>
        <div class="pill">今日已得 ${ov.studyDone + ov.habitDone} 分</div>
      </div>
    </div>

    <div class="card">
      <h2><span class="em">📋</span>今日完成概况</h2>
      <div class="stat-grid">
        <div class="stat">
          <div class="ic">📚</div>
          <div class="v">${ov.studyDone}/${ov.studyTotal}</div>
          <div class="k">学习打卡</div>
        </div>
        <div class="stat">
          <div class="ic">✨</div>
          <div class="v">${ov.habitDone}/${ov.habitTotal}</div>
          <div class="k">好习惯</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2><span class="em">${moodEmoji}</span>今日心情</h2>
      <div class="mood-row">
        ${['😊','😄','😐','😢','😡'].map(e=>`
          <div class="m ${mood===e?'selected':''}" data-mood="${e}">
            <span class="e">${e}</span><span>${{'😊':'开心','😄':'超开心','😐':'一般','😢':'难过','😡':'生气'}[e]}</span>
          </div>`).join('')}
      </div>
    </div>

    <div class="card">
      <h2><span class="em">📔</span>每日总结</h2>
      <div class="summary-box">
        <textarea id="summary-input" placeholder="今天有有什么有趣的事呢？让爸爸妈妈帮你写下来～">${summary}</textarea>
      </div>
    </div>
  `;
}
afterRender.home = function(){
  document.querySelectorAll('.mood-row .m').forEach(m=>{
    m.onclick = ()=>{
      state.moods[todayStr()] = m.dataset.mood;
      save();
      renderView();
      toast('心情已记录～');
    };
  });
  const si = document.getElementById('summary-input');
  if(si){
    let tid;
    si.oninput = ()=>{
      clearTimeout(tid);
      tid = setTimeout(()=>{
        state.diaries[todayStr()] = si.value;
        save();
      }, 400);
    };
    si.onblur = ()=>{ state.diaries[todayStr()] = si.value; save(); };
  }
};

// ================= 习惯 =================
function viewHabit(){
  const t = todayStr();
  const done = state.habitLog[t] || [];
  return `
    <div class="page-head">
      <h1>我的好习惯 ✨</h1>
      <button class="btn sm ghost" id="add-habit">+ 添加</button>
    </div>
    <div class="card" style="padding:10px 0;background:transparent;box-shadow:none;">
      ${state.habits.map(h=>`
        <div class="habit-item">
          <div class="ic">${h.ic}</div>
          <div class="info">
            <div class="t">${h.name}</div>
            <div class="s">${h.desc} · 奖励 ${h.reward} ⭐</div>
          </div>
          <button class="check ${done.includes(h.id)?'done':''}" data-hid="${h.id}">${done.includes(h.id)?'✓':''}</button>
        </div>
      `).join('')}
    </div>
    <div class="list-section-title">长按习惯可删除</div>
  `;
}
afterRender.habit = function(){
  const t = todayStr();
  if(!state.habitLog[t]) state.habitLog[t] = [];
  document.querySelectorAll('.habit-item .check').forEach(b=>{
    b.onclick = ()=>{
      const hid = b.dataset.hid;
      const arr = state.habitLog[t];
      const habit = state.habits.find(x=>x.id===hid);
      const idx = arr.indexOf(hid);
      if(idx>=0){
        arr.splice(idx,1);
        pointsDelta(-habit.reward);
        toast(`取消打卡 -${habit.reward}⭐`);
      }else{
        arr.push(hid);
        pointsDelta(habit.reward);
        toast(`真棒！+${habit.reward}⭐`);
      }
      save(); renderView();
    };
  });
  // 长按删除
  document.querySelectorAll('.habit-item').forEach(it=>{
    let timer;
    const start = ()=>{ timer = setTimeout(()=>{
      const hid = it.querySelector('.check').dataset.hid;
      if(confirm('删除这个习惯吗？')){
        state.habits = state.habits.filter(x=>x.id!==hid);
        save(); renderView();
      }
    }, 600); };
    it.addEventListener('touchstart', start);
    it.addEventListener('touchend', ()=>clearTimeout(timer));
    it.addEventListener('touchmove', ()=>clearTimeout(timer));
  });
  document.getElementById('add-habit').onclick = ()=>{
    const emojis = ['🦷','🛏️','💧','🥦','🧹','🏃','📖','🚿','🙏','😴','🥛','🎨','🎵','🪥'];
    openModal(`
      <h3>添加好习惯</h3>
      <div class="field">
        <label>选个图标</label>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${emojis.map(e=>`<button class="emoji-pick" data-e="${e}" style="width:44px;height:44px;font-size:24px;background:var(--pink-50);border:2px solid transparent;border-radius:10px;cursor:pointer;">${e}</button>`).join('')}
        </div>
      </div>
      <div class="field"><label>习惯名称</label><input id="h-name" placeholder="比如：自己穿衣服"></div>
      <div class="field"><label>描述</label><input id="h-desc" placeholder="小描述"></div>
      <div class="field"><label>奖励积分</label><input id="h-reward" type="number" value="2" min="1" max="20"></div>
      <div class="actions">
        <button class="btn ghost" onclick="closeModal()">取消</button>
        <button class="btn" id="h-save">保存</button>
      </div>
    `);
    let picked='✨';
    document.querySelectorAll('.emoji-pick').forEach(b=>{
      b.onclick=()=>{
        document.querySelectorAll('.emoji-pick').forEach(x=>x.style.borderColor='transparent');
        b.style.borderColor='var(--pink-400)';
        picked=b.dataset.e;
      };
    });
    document.getElementById('h-save').onclick=()=>{
      const name=document.getElementById('h-name').value.trim();
      if(!name){toast('写个名字吧～');return;}
      state.habits.push({id:'h'+Date.now(), ic:picked, name, desc:document.getElementById('h-desc').value.trim()||'加油哦', reward:parseInt(document.getElementById('h-reward').value)||1});
      save(); closeModal(); renderView(); toast('习惯已添加～');
    };
  };
};

// ================= 学习 =================
function viewStudy(){
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const t = todayStr();
  const study = state.studyLog[t] || {math:false,chinese:false,english:false,read:false};
  const subjects = [
    {k:'math', ic:'🔢', t:'数学', s:'数数与思维', cls:'math'},
    {k:'chinese', ic:'📝', t:'语文', s:'认字与表达', cls:'chinese'},
    {k:'english', ic:'🔤', t:'英语', s:'英语启蒙', cls:'english'},
    {k:'read', ic:'📖', t:'阅读', s:'绘本故事', cls:'read'},
  ];
  return `
    <div class="page-head"><h1>今日学习 📚</h1></div>
    <div class="card">
      <div class="cal-head">
        <button id="cal-prev">‹</button>
        <div class="ym" id="cal-ym">${y}年${m+1}月</div>
        <button id="cal-next">›</button>
      </div>
      <div class="cal-grid" id="cal-grid"></div>
    </div>
    <div class="card">
      <h2><span class="em">✏️</span>今日学习打卡</h2>
      <div class="checkin-grid">
        ${subjects.map(s=>`
          <div class="ci-card ${s.cls} ${study[s.k]?'done':''}" data-sk="${s.k}">
            <div class="badge">已打卡 ✓</div>
            <div class="ic">${s.ic}</div>
            <div class="t">${s.t}</div>
            <div class="s">${s.s}</div>
          </div>`).join('')}
      </div>
    </div>
  `;
}
afterRender.study = function(){
  // calendar
  let cy = new Date().getFullYear(), cm = new Date().getMonth();
  function drawCal(){
    const grid = document.getElementById('cal-grid');
    const ym = document.getElementById('cal-ym');
    ym.textContent = `${cy}年${cm+1}月`;
    const first = new Date(cy, cm, 1).getDay();
    const days = new Date(cy, cm+1, 0).getDate();
    const today = new Date();
    const tStr = today.toISOString().slice(0,10);
    let html = ['日','一','二','三','四','五','六'].map(w=>`<div class="wk">${w}</div>`).join('');
    for(let i=0;i<first;i++){
      const pd = new Date(cy,cm,1-i);
      html += `<div class="d other">${pd.getDate()}</div>`;
    }
    for(let d=1; d<=days; d++){
      const ds = `${cy}-${String(cm+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const study = state.studyLog[ds]||{};
      const doneCount = Object.values(study).filter(Boolean).length;
      const isToday = ds===tStr;
      const isDone = doneCount>=4;
      html += `<div class="d ${isToday?'today':''} ${isDone?'done':''}">${d}</div>`;
    }
    grid.innerHTML = html;
  }
  drawCal();
  document.getElementById('cal-prev').onclick = ()=>{ cm--; if(cm<0){cm=11;cy--;} drawCal(); };
  document.getElementById('cal-next').onclick = ()=>{ cm++; if(cm>11){cm=0;cy++;} drawCal(); };

  // checkin
  const t = todayStr();
  if(!state.studyLog[t]) state.studyLog[t] = {math:false,chinese:false,english:false,read:false};
  document.querySelectorAll('.ci-card').forEach(c=>{
    c.onclick = ()=>{
      const sk = c.dataset.sk;
      const s = state.studyLog[t];
      s[sk] = !s[sk];
      if(s[sk]){
        pointsDelta(2);
        toast(`真棒！+2⭐`);
      }else{
        pointsDelta(-2);
        toast(`取消打卡 -2⭐`);
      }
      save(); renderView();
    };
  });
};

// ================= 健康 =================
let healthChart = null;
function viewHealth(){
  const h = state.health;
  const lastH = h.height[h.length-1];
  const lastW = h.weight[h.weight.length-1];
  const lastV = h.vision[h.vision.length-1];
  return `
    <div class="page-head">
      <h1>健康成长 💪</h1>
      <button class="btn sm ghost" id="add-health">+ 记录</button>
    </div>
    <div class="card">
      <h2><span class="em">📏</span>健康数据</h2>
      <div class="health-grid">
        <div class="h-item"><div class="k">📏 身高</div><div class="v">${lastH?lastH.value:'--'}<small>cm</small></div></div>
        <div class="h-item"><div class="k">⚖️ 体重</div><div class="v">${lastW?lastW.value:'--'}<small>kg</small></div></div>
        <div class="h-item"><div class="k">👁️ 视力</div><div class="v">${lastV?lastV.value:'--'}</div></div>
        <div class="h-item"><div class="k">🤒 不适</div><div class="v">${h.sick.length}<small>次</small></div></div>
      </div>
    </div>
    <div class="card">
      <h2><span class="em">📈</span>生长曲线</h2>
      <select id="chart-type" style="width:100%;background:var(--pink-50);border:2px solid var(--pink-100);border-radius:10px;padding:8px;font-size:14px;margin-bottom:10px;color:var(--ink);outline:none;">
        <option value="height">身高 (cm)</option>
        <option value="weight">体重 (kg)</option>
      </select>
      <div class="chart-wrap"><canvas id="growth-chart"></canvas></div>
    </div>
    <div class="card">
      <h2><span class="em">🤒</span>不适记录</h2>
      ${h.sick.length===0 ? `<div class="empty"><div class="ic">💪</div><div class="t">身体棒棒的，没有不适记录</div></div>` :
        `<div class="record-list">
          ${h.sick.slice().reverse().map(s=>`
            <div class="record-item">
              <div class="ic">🤒</div>
              <div class="info"><div class="t">${s.desc}</div><div class="d">${s.date}</div></div>
              <button class="del" data-sid="${s.id}">×</button>
            </div>`).join('')}
        </div>`}
    </div>
  `;
}
afterRender.health = function(){
  if(healthChart){ healthChart.destroy(); healthChart=null; }
  const ctx = document.getElementById('growth-chart');
  if(ctx){
    const draw = (type)=>{
      const data = state.health[type];
      healthChart = new Chart(ctx, {
        type:'line',
        data:{
          labels: data.map(d=>d.date),
          datasets:[{
            label: type==='height'?'身高(cm)':'体重(kg)',
            data: data.map(d=>parseFloat(d.value)),
            borderColor:'#FF6B95',
            backgroundColor:'rgba(255,107,149,.15)',
            fill:true, tension:.35, pointRadius:5, pointBackgroundColor:'#FF6B95', pointBorderColor:'#fff', pointBorderWidth:2,
          }]
        },
        options:{
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{display:false} },
          scales:{
            y:{ beginAtZero:false, grid:{color:'#FFE4EC'} },
            x:{ grid:{display:false} }
          }
        }
      });
    };
    draw('height');
    document.getElementById('chart-type').onchange = (e)=>{
      healthChart.destroy();
      draw(e.target.value);
    };
  }
  document.querySelectorAll('.record-item .del').forEach(b=>{
    b.onclick = ()=>{
      state.health.sick = state.health.sick.filter(s=>s.id!==b.dataset.sid);
      save(); renderView();
    };
  });
  document.getElementById('add-health').onclick = ()=>{
    openModal(`
      <h3>记录健康数据</h3>
      <div class="field"><label>记录类型</label>
        <select id="r-type" style="width:100%;background:var(--pink-50);border:2px solid var(--pink-100);border-radius:12px;padding:12px;font-size:15px;outline:none;">
          <option value="height">身高</option>
          <option value="weight">体重</option>
          <option value="vision">视力</option>
          <option value="sick">身体不适</option>
        </select>
      </div>
      <div class="field"><label>数值 / 描述</label><input id="r-val" placeholder="身高如 110 / 体重如 18 / 视力如 4.8 / 不适描述"></div>
      <div class="field"><label>日期</label><input id="r-date" type="date" value="${todayStr()}"></div>
      <div class="actions">
        <button class="btn ghost" onclick="closeModal()">取消</button>
        <button class="btn" id="r-save">保存</button>
      </div>
    `);
    document.getElementById('r-save').onclick=()=>{
      const type=document.getElementById('r-type').value;
      const val=document.getElementById('r-val').value.trim();
      const date=document.getElementById('r-date').value;
      if(!val){toast('填一下数值吧～');return;}
      if(type==='sick'){
        state.health.sick.push({id:'s'+Date.now(), date, desc:val});
      }else{
        state.health[type].push({date, value:val});
        state.health[type].sort((a,b)=>a.date.localeCompare(b.date));
      }
      save(); closeModal(); renderView(); toast('记录成功～');
    };
  };
};

// ================= 心情 =================
function viewMood(){
  const t = todayStr();
  const todayMood = state.moods[t];
  const moods = ['😊','😄','😐','😢','😡','😴','🤩'];
  // 最近7天心情
  const days = [];
  for(let i=6;i>=0;i--){
    const d = new Date(); d.setDate(d.getDate()-i);
    const ds = d.toISOString().slice(0,10);
    days.push({ds, mood: state.moods[ds], label:`${d.getMonth()+1}/${d.getDate()}`});
  }
  return `
    <div class="page-head"><h1>心情日记 😊</h1></div>
    <div class="card">
      <h2><span class="em">${todayMood||'🤔'}</span>今天心情怎么样？</h2>
      <div class="mood-row">
        ${moods.map(e=>`
          <div class="m ${todayMood===e?'selected':''}" data-mood="${e}">
            <span class="e">${e}</span>
          </div>`).join('')}
      </div>
    </div>
    <div class="card">
      <h2><span class="em">📔</span>心情日记</h2>
      <textarea class="diary-input" id="diary-input" placeholder="今天发生了什么好玩的事？写下来吧～">${state.diaries[t]||''}</textarea>
      <button class="btn full" id="diary-save">保存日记</button>
    </div>
    <div class="card">
      <h2><span class="em">📆</span>最近7天心情</h2>
      <div class="mood-row" style="justify-content:space-between;">
        ${days.map(d=>`
          <div class="m" style="font-size:10px;">
            <span class="e">${d.mood||'·'}</span>
            <span>${d.label}</span>
          </div>`).join('')}
      </div>
    </div>
  `;
}
afterRender.mood = function(){
  const t = todayStr();
  document.querySelectorAll('.mood-row .m[data-mood]').forEach(m=>{
    m.onclick = ()=>{
      state.moods[t] = m.dataset.mood;
      save(); renderView(); toast('心情已记录～');
    };
  });
  const di = document.getElementById('diary-input');
  document.getElementById('diary-save').onclick = ()=>{
    state.diaries[t] = di.value;
    save(); toast('日记已保存～');
  };
};

// ================= 积分 =================
function viewPoints(){
  return `
    <div class="page-head"><h1>我的积分 ⭐</h1></div>
    <div class="points-hero">
      <div class="star">🌟</div>
      <div class="num">${state.points}</div>
      <div class="lbl">小星星积分</div>
    </div>
    <div class="card">
      <h2><span class="em">🎁</span>积分兑换<span class="more" id="go-set">设置 ›</span></h2>
      <div class="shop-grid">
        ${state.shop.map(s=>`
          <div class="shop-item" data-sid="${s.id}">
            <div class="ic">${s.ic}</div>
            <div class="t">${s.name}</div>
            <div class="p">${s.cost} ⭐</div>
          </div>`).join('')}
      </div>
    </div>
    <div class="card">
      <h2><span class="em">📋</span>兑换记录</h2>
      ${state.redeemed.length===0 ? `<div class="empty"><div class="ic">🎁</div><div class="t">还没有兑换过哦～</div></div>` :
        `<div class="record-list">
          ${state.redeemed.slice().reverse().map(r=>{
            const s = state.shop.find(x=>x.id===r.shopId) || {ic:'🎁',name:'已删除',cost:r.cost};
            return `<div class="record-item">
              <div class="ic">${s.ic}</div>
              <div class="info"><div class="t">${s.name}</div><div class="d">${r.date} · ${s.cost}⭐</div></div>
            </div>`;
          }).join('')}
        </div>`}
    </div>
  `;
}
afterRender.points = function(){
  document.querySelectorAll('.shop-item').forEach(it=>{
    it.onclick = ()=>{
      const sid = it.dataset.sid;
      const s = state.shop.find(x=>x.id===sid);
      if(!s) return;
      if(state.points < s.cost){ toast('星星不够哦，继续加油～'); return; }
      openModal(`
        <h3>确认兑换</h3>
        <div style="text-align:center;padding:14px 0;">
          <div style="font-size:54px;">${s.ic}</div>
          <div style="font-size:18px;font-weight:700;color:var(--pink-700);margin-top:8px;">${s.name}</div>
          <div style="font-size:14px;color:var(--ink-soft);margin-top:4px;">需要 ${s.cost} ⭐</div>
        </div>
        <div class="actions">
          <button class="btn ghost" onclick="closeModal()">再想想</button>
          <button class="btn" id="confirm-redeem">确认兑换</button>
        </div>
      `);
      document.getElementById('confirm-redeem').onclick = ()=>{
        pointsDelta(-s.cost);
        state.redeemed.push({id:'r'+Date.now(), shopId:s.id, cost:s.cost, date:todayStr()});
        save(); closeModal(); renderView(); toast('兑换成功！去和爸爸妈妈说～');
      };
    };
  });
  document.getElementById('go-set').onclick = ()=>{
    openModal(`
      <h3>兑换设置</h3>
      <div class="field"><label>每天学习目标（项）</label>
        <input id="set-goal" type="number" min="1" max="10" value="${state.settings.dailyGoal}">
      </div>
      <div class="list-section-title">兑换项目（点击删除）</div>
      <div class="set-list">
        ${state.shop.map(s=>`
          <div class="set-item">
            <div class="info"><div class="t">${s.ic} ${s.name}</div><div class="d">${s.cost} ⭐</div></div>
            <button class="del-btn" data-del="${s.id}">删除</button>
          </div>`).join('')}
      </div>
      <div class="actions" style="margin-top:14px;">
        <button class="btn ghost" id="add-shop">+ 新增兑换项</button>
      </div>
      <div class="actions">
        <button class="btn ghost" onclick="closeModal()">取消</button>
        <button class="btn" id="save-set">保存</button>
      </div>
    `);
    document.querySelectorAll('.del-btn').forEach(b=>{
      b.onclick=()=>{
        state.shop = state.shop.filter(x=>x.id!==b.dataset.del);
        // 更新弹窗内容
        const mask = document.querySelector('.modal-mask');
        mask.querySelector('.set-list').innerHTML = state.shop.map(s=>`
          <div class="set-item">
            <div class="info"><div class="t">${s.ic} ${s.name}</div><div class="d">${s.cost} ⭐</div></div>
            <button class="del-btn" data-del="${s.id}">删除</button>
          </div>`).join('');
        mask.querySelectorAll('.del-btn').forEach(bb=>{
          bb.onclick = ()=>{ state.shop = state.shop.filter(x=>x.id!==bb.dataset.del); save(); mask.querySelector('.set-list').innerHTML = state.shop.map(s=>`<div class="set-item"><div class="info"><div class="t">${s.ic} ${s.name}</div><div class="d">${s.cost} ⭐</div></div><button class="del-btn" data-del="${s.id}">删除</button></div>`).join(''); mask.querySelectorAll('.del-btn').forEach(cb=>{cb.onclick=()=>{state.shop=state.shop.filter(x=>x.id!==cb.dataset.del);save();cb.closest('.set-item').remove();}}); };
        });
        save();
      };
    });
    document.getElementById('add-shop').onclick = ()=>{
      openModal(`
        <h3>新增兑换项</h3>
        <div class="field"><label>图标</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${['🍦','🎈','🎨','🧸','📺','🎢','🚲','🍪','🧩','⚽','🎀','🎁','🍿','🎪'].map(e=>`<button class="sp-pick" data-e="${e}" style="width:44px;height:44px;font-size:24px;background:var(--pink-50);border:2px solid transparent;border-radius:10px;cursor:pointer;">${e}</button>`).join('')}
          </div>
        </div>
        <div class="field"><label>名称</label><input id="sp-name" placeholder="奖励名称"></div>
        <div class="field"><label>需要积分</label><input id="sp-cost" type="number" value="10" min="1"></div>
        <div class="actions">
          <button class="btn ghost" onclick="closeModal()">取消</button>
          <button class="btn" id="sp-save">添加</button>
        </div>
      `);
      let pk='🎁';
      document.querySelectorAll('.sp-pick').forEach(b=>b.onclick=()=>{document.querySelectorAll('.sp-pick').forEach(x=>x.style.borderColor='transparent');b.style.borderColor='var(--pink-400)';pk=b.dataset.e;});
      document.getElementById('sp-save').onclick=()=>{
        const n=document.getElementById('sp-name').value.trim();
        if(!n){toast('写个名字～');return;}
        state.shop.push({id:'s'+Date.now(), ic:pk, name:n, cost:parseInt(document.getElementById('sp-cost').value)||5});
        save(); closeModal(); toast('已添加～');
      };
    };
    document.getElementById('save-set').onclick=()=>{
      state.settings.dailyGoal = parseInt(document.getElementById('set-goal').value)||4;
      save(); closeModal(); renderView(); toast('设置已保存～');
    };
  };
};

// ================= 成长 =================
function viewGrowth(){
  return `
    <div class="page-head">
      <h1>成长瞬间 🌱</h1>
      <button class="btn sm ghost" id="add-growth">+ 记录</button>
    </div>
    ${state.growth.length===0 ? `
      <div class="card">
        <div class="empty"><div class="ic">🌱</div><div class="t">还没有成长记录</div></div>
      </div>
      <div class="growth-grid">
        <div class="growth-item add" id="add-growth-2">+ 记录成长瞬间</div>
      </div>
    ` : `
      <div class="growth-grid">
        ${state.growth.slice().reverse().map(g=>`
          <div class="growth-item" data-gid="${g.id}" style="${g.photo?`background-image:url(${g.photo})`:''}">
            ${g.photo?'':`<div style="font-size:48px;">${g.emoji||'🌟'}</div>`}
            <div class="info">
              <div class="t">${g.title}</div>
              <div>${g.date}</div>
            </div>
            <button class="del" data-del="${g.id}">×</button>
          </div>`).join('')}
        <div class="growth-item add" id="add-growth-2">+ 添加</div>
      </div>
    `}
  `;
}
afterRender.growth = function(){
  const add = ()=>{
    const emojis = ['🌟','👣','🏆','🎓','🚲','🦷','🎤','🍰','🎈','🎨','📚','🎁','🌈','💪'];
    openModal(`
      <h3>记录成长瞬间</h3>
      <div class="photo-placeholder" id="gp-photo">📷</div>
      <div class="field"><label>选个表情</label>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${emojis.map(e=>`<button class="g-pick" data-e="${e}" style="width:44px;height:44px;font-size:24px;background:var(--pink-50);border:2px solid transparent;border-radius:10px;cursor:pointer;">${e}</button>`).join('')}
        </div>
      </div>
      <div class="field"><label>标题</label><input id="g-title" placeholder="比如：第一次自己穿鞋"></div>
      <div class="field"><label>备注</label><textarea id="g-note" placeholder="小故事..."></textarea></div>
      <div class="field"><label>日期</label><input id="g-date" type="date" value="${todayStr()}"></div>
      <div class="actions">
        <button class="btn ghost" onclick="closeModal()">取消</button>
        <button class="btn" id="g-save">保存</button>
      </div>
    `);
    let photo=null, emoji='🌟';
    document.getElementById('gp-photo').onclick=()=>{
      const inp = document.createElement('input');
      inp.type='file'; inp.accept='image/*'; inp.capture='environment';
      inp.onchange = ()=>{
        const f = inp.files[0];
        if(!f) return;
        const r = new FileReader();
        r.onload = ()=>{
          photo = r.result;
          document.getElementById('gp-photo').style.backgroundImage=`url(${photo})`;
          document.getElementById('gp-photo').style.backgroundSize='cover';
          document.getElementById('gp-photo').style.backgroundPosition='center';
          document.getElementById('gp-photo').textContent='';
        };
        r.readAsDataURL(f);
      };
      inp.click();
    };
    document.querySelectorAll('.g-pick').forEach(b=>b.onclick=()=>{document.querySelectorAll('.g-pick').forEach(x=>x.style.borderColor='transparent');b.style.borderColor='var(--pink-400)';emoji=b.dataset.e;});
    document.getElementById('g-save').onclick=()=>{
      const title=document.getElementById('g-title').value.trim();
      if(!title){toast('写个标题吧～');return;}
      state.growth.push({id:'g'+Date.now(), date:document.getElementById('g-date').value, emoji, title, note:document.getElementById('g-note').value, photo});
      save(); closeModal(); renderView(); toast('成长瞬间已记录～');
    };
  };
  document.getElementById('add-growth')?.addEventListener('click', add);
  document.getElementById('add-growth-2')?.addEventListener('click', add);
  document.querySelectorAll('.growth-item .del').forEach(b=>{
    b.onclick = (e)=>{
      e.stopPropagation();
      if(confirm('删除这条成长记录吗？')){
        state.growth = state.growth.filter(g=>g.id!==b.dataset.del);
        save(); renderView();
      }
    };
  });
};

// ---------- 启动 ----------
renderTabbar();
renderView();

// PWA service worker
if('serviceWorker' in navigator){
  // 简单注册（用 data URL 避免 sw.js 文件依赖）
  const swCode = `
    const CACHE='youyou-v1';
    self.addEventListener('install',e=>{self.skipWaiting();});
    self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim());});
    self.addEventListener('fetch',e=>{
      if(e.request.method!=='GET') return;
      e.respondWith(
        caches.open(CACHE).then(c=>c.match(e.request).then(r=>{
          const f = fetch(e.request).then(res=>{
            try{ c.put(e.request, res.clone()); }catch(err){}
            return res;
          }).catch(()=>r);
          return r || f;
        }))
      );
    });
  `;
  const blob = new Blob([swCode], {type:'application/javascript'});
  const swUrl = URL.createObjectURL(blob);
  navigator.serviceWorker.register(swUrl).catch(()=>{});
}
