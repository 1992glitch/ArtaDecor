// ── STATE & DATA MANAGEMENT ──
const DATA_KEY = 'artadecor_v1';
let state = {
  decors: [],
  incomes: [],
  expenses: [],
  workers: [],
  channels: [],
  messages: {},
  tasks: [],
  reports: [],
  settings: { theme: 'gold', confetti: false },
  adminPassword: 'rinni',
  adminUsername: 'riniadmin'
};
 
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentChannel = 'pergjithshme';
 
const EMOJIS = ['😊', '✨', '🎈', '💐', '🎉', '🥂', '💖', '📅', '📝', '📍'];
 
async function loadState() {
  try {
    const res = await fetch('/api/state');
    const saved = await res.json();
    if (saved && saved.decors) {
      state = saved;
    } else {
      seedData();
    }
  } catch (err) {
    console.error('Gabim gjatë ngarkimit:', err);
    seedData();
  }
  // Migration guards
  if (!state.channels || state.channels.length === 0) {
    state.channels = [{ id: 'pergjithshme', name: 'pergjithshme', desc: 'Biseda e përgjithshme' }];
  }
  if (!state.messages)      state.messages = {};
  if (!state.tasks)         state.tasks = [];
  state.tasks.forEach(t => { if (!t.status) t.status = t.done ? 'done' : 'todo'; });
  if (!state.reports)       state.reports = [];
  if (!state.settings)      state.settings = { theme: 'gold', confetti: false };
  if (!state.adminPassword) state.adminPassword = 'rinni';
  if (!state.adminUsername) state.adminUsername = 'riniadmin';
}
 
async function saveState() {
  try {
    await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });
  } catch (err) {
    console.error('Gabim gjatë ruajtjes:', err);
  }
}
 
function uid() { return 'id_' + Math.random().toString(36).substr(2, 9); }
 
function seedData() {
  state.workers = [
    { id: uid(), name: 'Erion Krasniqi', role: 'Koordinator Eventesh', phone: '+355 69 111 2233', start: '2023-03-01', color: '#EEEDFE', textColor: '#3C3489', password: 'erion123', access: 'worker' },
    { id: uid(), name: 'Mirela Hoxha', role: 'Punëtor', phone: '+355 68 234 5678', start: '2022-06-15', color: '#E1F5EE', textColor: '#085041', password: 'mirela123', access: 'worker' },
    { id: uid(), name: 'Liridon Berisha', role: 'Shofer', phone: '+355 67 345 6789', start: '2023-09-10', color: '#FFF3CD', textColor: '#856404', password: 'liridon123', access: 'worker' }
  ];
  const todayStr = new Date().toISOString().slice(0, 10);
  state.decors = [
    { id: uid(), client: 'Arben & Valbona', type: 'Dasmë', date: todayStr, price: 1200, location: 'Plaza Hotel', worker: 'Erion Krasniqi', status: 'I Konfirmuar', notes: 'Dekor me lule natyrale të bardha dhe ndriçim led shtesë.' }
  ];
  state.incomes = [
    { id: uid(), desc: 'Parapagesë - Arben & Valbona', amount: 600, date: todayStr }
  ];
  state.expenses = [
    { id: uid(), desc: 'Blerje Lule Natyrale', amount: 250, date: todayStr }
  ];
  state.channels = [
    { id: 'pergjithshme', name: 'përgjithshme', desc: 'Diskutime kryesore mbi eventet', icon: '💬' },
    { id: 'ide-dekorimi', name: 'ide-dekorimi', desc: 'Frymëzime dhe koncepte të reja lulesh', icon: '✨' }
  ];
  state.messages = {
    'pergjithshme': [
      { sender: 'Mirela Hoxha', text: 'Përshëndetje ekip! Sapo përfunduam skicën për skenën te Plaza Hotel.', time: '10:14' },
      { sender: 'Admin', text: 'Shkëlqyeshëm Mirela! Arta e verifikoi dhe duket perfekte.', time: '10:30' }
    ],
    'ide-dekorimi': [
      { sender: 'Erion Krasniqi', text: 'Kemi marrë tullumbace të reja pastel me shkëlqim ari.', time: '09:00' }
    ]
  };
  state.tasks = [
    { id: uid(), title: 'Përgatit dekorimin për dasmën e Arben & Valbona', worker: 'Erion Krasniqi', due: todayStr, desc: 'Sigurohu që lulet natyrale të jenë gati një ditë para eventit.', status: 'inprogress', createdAt: todayStr }
  ];
  state.reports = [
    { id: uid(), type: 'Shënim', content: 'Stoku i tullumbaceve të arta po mbaron, duhet porosi e re.', author: 'Mirela Hoxha', date: todayStr }
  ];
  state.settings = { theme: 'gold', confetti: false };
}
 
// ── SESSION ──
let currentUser = null;
 
// ── INITIALIZATION ──
document.addEventListener('DOMContentLoaded', async () => {
  await loadState();
  buildEmojiPicker();
  const saved = localStorage.getItem('artadecor_session');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      showApp();
    } catch(e) { localStorage.removeItem('artadecor_session'); }
  }
 
  // ── FORM SUBMIT LISTENERS ──
  document.getElementById('decor-form').addEventListener('submit', function(e) {
    e.preventDefault();
    saveDecor();
    this.reset();
    document.getElementById('d-id').value = '';
  });
 
  document.getElementById('worker-form').addEventListener('submit', function(e) {
    e.preventDefault();
    saveWorker();
    this.reset();
  });
 
  document.getElementById('task-form').addEventListener('submit', function(e) {
    e.preventDefault();
    saveTask();
    this.reset();
  });
 
  document.getElementById('report-form').addEventListener('submit', function(e) {
    e.preventDefault();
    saveReport();
    this.reset();
  });
 
  document.getElementById('trans-form').addEventListener('submit', function(e) {
    e.preventDefault();
    saveTransaction();
    this.reset();
    document.getElementById('t-type').value = '';
  });
});
 
// ── LOGIN SYSTEM ──
let selectedRole = null;
 
function selectLoginRole(role) {
  selectedRole = role;
  document.getElementById('role-selection-box').style.display = 'none';
  document.getElementById('password-input-box').style.display = 'block';
 
  if (role === 'admin') {
    document.getElementById('selected-role-title').innerText = 'Kyçu si Admin';
    document.getElementById('admin-username-field').style.display = 'block';
    document.getElementById('worker-select-field').style.display = 'none';
    document.getElementById('login-username').value = '';
    document.getElementById('login-pass').value = '';
    document.getElementById('login-username').focus();
  } else {
    document.getElementById('selected-role-title').innerText = 'Kyçu si Punëtor';
    document.getElementById('admin-username-field').style.display = 'none';
    document.getElementById('worker-select-field').style.display = 'block';
    // Populate worker dropdown
    const dropdown = document.getElementById('login-worker-dropdown');
    const workers = state.workers.filter(w => w.password);
    dropdown.innerHTML = workers.length === 0
      ? '<option value="">— Asnjë punëtor me fjalëkalim —</option>'
      : '<option value="">— Zgjidh emrin tënd —</option>' + workers.map(w => `<option value="${w.id}">${w.name} (${w.role})</option>`).join('');
    document.getElementById('login-pass').value = '';
    document.getElementById('login-pass').focus();
  }
}
 
function backToRoles() {
  selectedRole = null;
  document.getElementById('role-selection-box').style.display = 'block';
  document.getElementById('password-input-box').style.display = 'none';
  document.getElementById('admin-username-field').style.display = 'none';
  document.getElementById('worker-select-field').style.display = 'none';
  document.getElementById('login-username').value = '';
  document.getElementById('login-pass').value = '';
}
 
function checkLogin() {
  const p = document.getElementById('login-pass').value;
 
  if (selectedRole === 'admin') {
    const u = document.getElementById('login-username').value.trim();
    if (!u) { toast('Ju lutem shkruani emrin e përdoruesit!', 'error'); return; }
    if (!p)  { toast('Ju lutem shkruani fjalëkalimin!', 'error'); return; }
    if (p.length < 4) { toast('Fjalëkalimi duhet të ketë të paktën 4 karaktere!', 'error'); return; }
    if (u !== state.adminUsername) {
      toast('Emri i përdoruesit është i gabuar!', 'error');
      return;
    }
    if (p !== state.adminPassword) {
      toast('Fjalëkalimi i gabuar!', 'error');
      return;
    }
    currentUser = { name: 'Arta (Admin)', role: 'Super Admin', access: 'admin' };
    localStorage.setItem('artadecor_session', JSON.stringify(currentUser));
    showApp();
    toast('Mirëseerdhët në Arta Decor!', 'success');
  } else {
    const workerId = document.getElementById('login-worker-dropdown').value;
    if (!workerId) { toast('Ju lutem zgjidhni emrin tuaj!', 'error'); return; }
    const worker = state.workers.find(w => w.id === workerId);
    if (!worker) { toast('Punëtori nuk u gjet!', 'error'); return; }
    if (!worker.password || worker.password !== p) {
      toast('Fjalëkalimi i gabuar!', 'error');
      return;
    }
    currentUser = { name: worker.name, role: worker.role, access: worker.access || 'worker', workerId: worker.id };
    localStorage.setItem('artadecor_session', JSON.stringify(currentUser));
    showApp();
    toast(`Mirëseerdhët, ${worker.name}!`, 'success');
  }
}
 
function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-layout').style.display = 'flex';
  applyTheme(state.settings.theme);
  if (state.settings.darkMode) document.documentElement.setAttribute('data-theme', 'dark');
  applyAccessControl();
  renderAll();
}
 
function applyAccessControl() {
  if (!currentUser) return;
  const isAdmin = currentUser.access === 'admin';
 
  // Update sidebar user info
  const avatarEl = document.querySelector('.user-avatar');
  const nameEl = document.querySelector('.user-name');
  const roleEl = document.querySelector('.user-role');
  if (avatarEl) avatarEl.innerText = currentUser.name.charAt(0).toUpperCase();
  if (nameEl) nameEl.innerText = currentUser.name;
  if (roleEl) roleEl.innerText = isAdmin ? 'Super Admin' : currentUser.role;
 
  // Hide/show menu items based on access
  const adminOnlyTabs = ['decors', 'workers', 'finance'];
  adminOnlyTabs.forEach(tab => {
    const menuItem = document.querySelector(`.menu-item[data-tab="${tab}"]`);
    if (menuItem) menuItem.style.display = isAdmin ? 'block' : 'none';
  });
 
  // Tasks: only admin can assign new tasks
  const addTaskBtn = document.getElementById('add-task-btn');
  if (addTaskBtn) addTaskBtn.style.display = isAdmin ? 'inline-flex' : 'none';
  const tasksSubtitle = document.getElementById('tasks-subtitle');
  if (tasksSubtitle) tasksSubtitle.innerText = isAdmin
    ? 'Caktoni detyra për ekipin dhe ndiqni progresin e tyre.'
    : 'Detyrat e caktuara për ty. Shenjo si të përfunduara kur i mbaron.';
 
  // If worker is on a restricted tab, redirect to dashboard
  if (!isAdmin) {
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
      const tabId = activeTab.id.replace('tab-', '');
      if (adminOnlyTabs.includes(tabId)) switchTab('dashboard');
    }
    // Hide "Rezervo Event" buttons visible to workers
    document.querySelectorAll('.btn-primary[onclick="openDecorModal()"]').forEach(b => b.style.display = 'none');
  }
}
 
function logout() {
  currentUser = null;
  localStorage.removeItem('artadecor_session');
  document.getElementById('app-layout').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  // Reset login screen
  backToRoles();
}
 
// ── NAVIGATION ──
function switchTab(tabId) {
  const adminOnlyTabs = ['decors', 'workers', 'finance'];
  if (adminOnlyTabs.includes(tabId) && currentUser && currentUser.access !== 'admin') {
    toast('Nuk keni qasje në këtë seksion!', 'error');
    return;
  }
  document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
 
  const targetItem = document.querySelector(`.menu-item[data-tab="${tabId}"]`);
  if (targetItem) targetItem.classList.add('active');
 
  const targetTab = document.getElementById(`tab-${tabId}`);
  if (targetTab) targetTab.classList.add('active');
 
  renderAll();
  // Render chat after tab is active (renderAll checks if chat tab is active)
  if (tabId === 'chat') renderChat();
}
 
// ── MAIN RENDERER ──
function renderAll() {
  renderMetrics();
  renderDashboard();
  renderCharts();
  renderCalendar();
  renderDecors();
  renderTasks();
  renderReports();
  renderWorkers();
  renderFinance();
  renderSettings();
 
  if (document.getElementById('tab-chat').classList.contains('active')) {
    renderChat();
  }
}
 
function renderMetrics() {
  const totalEvents = state.decors.length;
  const totalInc = state.incomes.reduce((acc, i) => acc + Number(i.amount), 0);
  const totalExp = state.expenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const balance = totalInc - totalExp;
 
  document.getElementById('m-total-events').innerText = totalEvents;
  document.getElementById('m-total-income').innerText = fmt(totalInc) + ' €';
  document.getElementById('m-total-expense').innerText = fmt(totalExp) + ' €';
  document.getElementById('m-balance').innerText = fmt(balance) + ' €';
 
  const fInc = document.getElementById('f-total-income');
  const fExp = document.getElementById('f-total-expense');
  const fBal = document.getElementById('f-balance');
  if (fInc) fInc.innerText = fmt(totalInc) + ' €';
  if (fExp) fExp.innerText = fmt(totalExp) + ' €';
  if (fBal) fBal.innerText = fmt(balance) + ' €';
}
 
// ── DASHBOARD CHARTS (Chart.js) ──
let financeChartInstance = null;
let eventTypesChartInstance = null;
 
function renderCharts() {
  const financeCanvas = document.getElementById('chart-finance');
  const typesCanvas = document.getElementById('chart-event-types');
  if (!financeCanvas || !typesCanvas || typeof Chart === 'undefined') return;
 
  // Build last 6 months income/expense totals
  const months = [];
  const incomeByMonth = [];
  const expenseByMonth = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    months.push(MONTH_NAMES[d.getMonth()].slice(0,3));
    const inc = state.incomes.filter(x => x.date && x.date.startsWith(key)).reduce((a,x) => a + Number(x.amount), 0);
    const exp = state.expenses.filter(x => x.date && x.date.startsWith(key)).reduce((a,x) => a + Number(x.amount), 0);
    incomeByMonth.push(inc);
    expenseByMonth.push(exp);
  }
 
  const goldDark = getComputedStyle(document.documentElement).getPropertyValue('--gold-dark').trim() || '#8B6914';
  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text2').trim() || '#6B6860';
 
  if (financeChartInstance) financeChartInstance.destroy();
  financeChartInstance = new Chart(financeCanvas, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        { label: 'Të Ardhura', data: incomeByMonth, backgroundColor: '#085041', borderRadius: 4 },
        { label: 'Shpenzime', data: expenseByMonth, backgroundColor: '#A30000', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: textColor, font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: textColor, font: { size: 11 } }, grid: { display: false } },
        y: { ticks: { color: textColor, font: { size: 11 } }, grid: { color: 'rgba(180,170,140,0.15)' } }
      }
    }
  });
 
  // Event types breakdown
  const typeCounts = {};
  state.decors.forEach(d => { typeCounts[d.type] = (typeCounts[d.type] || 0) + 1; });
  const typeLabels = Object.keys(typeCounts);
  const typeData = Object.values(typeCounts);
  const palette = ['#C9A84C', '#3C3489', '#085041', '#856404', '#A30000', '#0A58CA'];
 
  if (eventTypesChartInstance) eventTypesChartInstance.destroy();
  eventTypesChartInstance = new Chart(typesCanvas, {
    type: 'doughnut',
    data: {
      labels: typeLabels.length ? typeLabels : ['Asnjë event'],
      datasets: [{ data: typeData.length ? typeData : [1], backgroundColor: typeLabels.length ? palette : ['#EDEAE0'], borderWidth: 2, borderColor: '#FFF' }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: textColor, font: { size: 11 }, boxWidth: 12 } } }
    }
  });
}
 
function renderDashboard() {
  const sorted = [...state.decors].sort((a,b) => new Date(a.date) - new Date(b.date));
  const upcomingBody = document.getElementById('dash-upcoming-events');
  upcomingBody.innerHTML = sorted.length === 0 ? '<tr><td colspan="4" style="text-align:center;">Nuk ka evente.</td></tr>' : sorted.slice(0, 5).map(d => {
    let cls = 'badge-warning';
    if(d.status==='I Konfirmuar' || d.status==='Përfunduar') cls='badge-success';
    return `<tr>
      <td><strong>${d.client}</strong><br><span style="font-size:11px;color:var(--text2);">${d.type}</span></td>
      <td>${fmtDate(d.date)}</td>
      <td>${d.location || '—'}</td>
      <td><span class="badge ${cls}">${d.status}</span></td>
    </tr>`;
  }).join('');
 
  const workersList = document.getElementById('dash-workers-list');
  workersList.innerHTML = state.workers.length === 0 ? '<p style="font-size:12px;color:var(--text3);">Asnjë punëtor.</p>' : state.workers.map(w => `
    <div class="worker-pill" style="background:${w.color || '#F4F2EC'}; color:${w.textColor || '#1A1915'};">
      <div class="worker-circle" style="background:${w.textColor || '#1A1915'};"></div>
      <div><strong>${w.name}</strong> — ${w.role}</div>
    </div>
  `).join('');
}
 
// ── CALENDAR LOGIC (FullCalendar) ──
const MONTH_NAMES = ["Janar", "Shkurt", "Mars", "Prill", "Maj", "Qershor", "Korrik", "Gusht", "Shtator", "Tetor", "Nëntor", "Dhjetor"];
let fcInstance = null;
 
function renderCalendar() {
  const el = document.getElementById('professional-calendar');
  if (!el || typeof FullCalendar === 'undefined') return;
 
  const events = state.decors.map(d => {
    const wObj = state.workers.find(w => w.name === d.worker);
    return {
      id: d.id,
      title: `${d.client} (${d.type})`,
      start: d.date,
      allDay: true,
      backgroundColor: wObj ? wObj.color : '#E8D4A0',
      textColor: wObj ? wObj.textColor : '#5C430A',
      borderColor: 'transparent'
    };
  });
 
  if (fcInstance) {
    fcInstance.removeAllEvents();
    events.forEach(e => fcInstance.addEvent(e));
    return;
  }
 
  fcInstance = new FullCalendar.Calendar(el, {
    initialView: 'dayGridMonth',
    height: 'auto',
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,dayGridWeek' },
    buttonText: { today: 'Sot', month: 'Muaji', week: 'Java' },
    events: events,
    eventClick: function(info) {
      viewDecorDetail(info.event.id);
    }
  });
  fcInstance.render();
}
 
// ── DECORS MANAGEMENT ──
function renderDecors() {
  const body = document.getElementById('decors-table-body');
  if (!body) return;
  body.innerHTML = state.decors.length === 0 ? '<tr><td colspan="7" style="text-align:center;">Asnjë rezervim i regjistruar.</td></tr>' : state.decors.map(d => {
    let cls = 'badge-warning';
    if(d.status==='I Konfirmuar' || d.status==='Përfunduar') cls='badge-success';
    return `<tr>
      <td><strong>${d.client}</strong></td>
      <td>${d.type}</td>
      <td>${fmtDate(d.date)}</td>
      <td><strong>${fmt(d.price)} €</strong></td>
      <td>${d.worker || 'Pa caktuar'}</td>
      <td><span class="badge ${cls}">${d.status}</span></td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="editDecor('${d.id}')">✏️</button>
        <button class="btn btn-outline btn-sm" style="color:#A30000;" onclick="deleteDecor('${d.id}')">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}
 
function openDecorModal() {
  document.getElementById('decor-modal-title').innerText = "Rezervo Event të Ri";
  document.getElementById('decor-form').reset();
  document.getElementById('d-id').value = '';
  
  const sel = document.getElementById('d-worker');
  sel.innerHTML = '<option value="">Pa caktuar</option>' + state.workers.map(w => `<option value="${w.name}">${w.name}</option>`).join('');
  
  openModal('decor-modal');
}
 
function saveDecor() {
  const id = document.getElementById('d-id').value;
  const client = document.getElementById('d-client').value.trim();
  const type = document.getElementById('d-type').value;
  const date = document.getElementById('d-date').value;
  const price = document.getElementById('d-price').value;
  const location = document.getElementById('d-location').value.trim();
  const worker = document.getElementById('d-worker').value;
  const status = document.getElementById('d-status').value;
  const notes = document.getElementById('d-notes').value.trim();
 
  let isNew = false;
  if (id) {
    const index = state.decors.findIndex(d => d.id === id);
    if(index !== -1) {
      state.decors[index] = { id, client, type, date, price: Number(price), location, worker, status, notes };
    }
  } else {
    isNew = true;
    state.decors.push({ id: uid(), client, type, date, price: Number(price), location, worker, status, notes });
    state.incomes.push({ id: uid(), desc: `Faturë Eventi: ${client}`, amount: Number(price), date: date });
  }
 
  saveState();
  closeModal('decor-modal');
  renderAll();
  toast('Eventi u ruajt me sukses!', 'success');
  if (isNew && state.settings.confetti) fireConfetti();
}
 
function editDecor(id) {
  const d = state.decors.find(x => x.id === id);
  if (!d) return;
 
  document.getElementById('decor-modal-title').innerText = "Modifiko Eventin";
  document.getElementById('d-id').value = d.id;
  document.getElementById('d-client').value = d.client;
  document.getElementById('d-type').value = d.type;
  document.getElementById('d-date').value = d.date;
  document.getElementById('d-price').value = d.price;
  document.getElementById('d-location').value = d.location || '';
  document.getElementById('d-status').value = d.status;
  document.getElementById('d-notes').value = d.notes || '';
 
  const sel = document.getElementById('d-worker');
  sel.innerHTML = '<option value="">Pa caktuar</option>' + state.workers.map(w => `<option value="${w.name}">${w.name}</option>`).join('');
  sel.value = d.worker || '';
 
  openModal('decor-modal');
}
 
function deleteDecor(id) {
  if (confirm('A jeni të sigurt që dëshironi të fshini këtë rezervim?')) {
    state.decors = state.decors.filter(x => x.id !== id);
    saveState();
    renderAll();
    toast('Rezervimi u fshi.', 'success');
  }
}
 
function viewDecorDetail(id) {
  const d = state.decors.find(x => x.id === id);
  if (!d) return;
  document.getElementById('detail-title').innerText = `Eventi: ${d.client}`;
  document.getElementById('detail-body').innerHTML = `
    <p style="margin-bottom:8px;"><strong>Lloji:</strong> ${d.type}</p>
    <p style="margin-bottom:8px;"><strong>Data:</strong> ${fmtDate(d.date)}</p>
    <p style="margin-bottom:8px;"><strong>Vendndodhja:</strong> ${d.location || '—'}</p>
    <p style="margin-bottom:8px;"><strong>Vlera:</strong> ${fmt(d.price)} €</p>
    <p style="margin-bottom:8px;"><strong>Përgjegjësi:</strong> ${d.worker || 'Pa caktuar'}</p>
    <p style="margin-bottom:8px;"><strong>Statusi:</strong> ${d.status}</p>
    <p style="margin-bottom:8px; border-top:1px solid var(--bg3); padding-top:8px;"><strong>Detaje / Shënime:</strong><br>${d.notes || 'Nuk ka shënime specifikimi.'}</p>
  `;
  openModal('detail-modal');
}
 
// ── WORKERS MANAGEMENT ──
const PALETTE = [
  { c: '#EEEDFE', tc: '#3C3489' },
  { c: '#E1F5EE', tc: '#085041' },
  { c: '#FFF3CD', tc: '#856404' },
  { c: '#FCE8E6', tc: '#A30000' },
  { c: '#E2F0FD', tc: '#0A58CA' }
];
 
const ROLE_BADGE = {
  'Shef': 'badge-warning',
  'Koordinator Eventesh': 'badge-success',
  'Shofer': 'badge-danger',
  'Punëtor': 'badge-warning'
};
 
function renderWorkers() {
  const body = document.getElementById('workers-table-body');
  if (!body) return;
  body.innerHTML = state.workers.length === 0 ? '<tr><td colspan="6" style="text-align:center;">Asnjë punëtor i regjistruar.</td></tr>' : state.workers.map(w => `
    <tr>
      <td><strong>${w.name}</strong></td>
      <td><span class="badge ${ROLE_BADGE[w.role] || 'badge-warning'}">${w.role}</span></td>
      <td>${w.phone || '—'}</td>
      <td>${fmtDate(w.start)}</td>
      <td>
        <span class="badge badge-success">👤 Punëtor (s'ka qasje në Financa)</span>
      </td>
      <td>
        <button class="btn btn-outline btn-sm" style="color:#A30000;" onclick="deleteWorker('${w.id}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}
 
function openWorkerModal() {
  document.getElementById('worker-form').reset();
  document.getElementById('w-id').value = '';
  openModal('worker-modal');
}
 
function saveWorker() {
  const name = document.getElementById('w-name').value.trim();
  const role = document.getElementById('w-role').value.trim();
  const phone = document.getElementById('w-phone').value.trim();
  const start = document.getElementById('w-start').value;
  const password = document.getElementById('w-pass').value.trim();
 
  const randomColorPair = PALETTE[Math.floor(Math.random() * PALETTE.length)];
  state.workers.push({
    id: uid(), name, role, phone, start,
    password, access: 'worker', // Vetëm Shefi (login admin) ka qasje në Financa, Rezervime, Ekipi & Rolet.
    color: randomColorPair.c,
    textColor: randomColorPair.tc
  });
 
  saveState(); closeModal('worker-modal'); renderAll();
  toast('Punëtori u regjistrua me sukses!', 'success');
}
 
function deleteWorker(id) {
  if (confirm('A jeni të sigurt? Kjo do ta heqë punëtorin nga lista.')) {
    state.workers = state.workers.filter(w => w.id !== id);
    saveState();
    renderAll();
    toast('Punëtori u fshi.', 'success');
  }
}
 
// ── FINANCES LOGIC ──
function renderFinance() {
  const body = document.getElementById('finance-table-body');
  if (!body) return;
 
  const arr = [];
  if(state.incomes) state.incomes.forEach(i => arr.push({ ...i, isIncome: true }));
  if(state.expenses) state.expenses.forEach(e => arr.push({ ...e, isIncome: false }));
 
  arr.sort((a,b) => new Date(b.date) - new Date(a.date));
 
  body.innerHTML = arr.length === 0 ? '<tr><td colspan="5" style="text-align:center;">Asnjë transaksion i regjistruar.</td></tr>' : arr.map(t => `
    <tr>
      <td><strong>${t.desc}</strong></td>
      <td><span class="badge ${t.isIncome ? 'badge-success' : 'badge-danger'}">${t.isIncome ? 'Hyrje' : 'Dalje'}</span></td>
      <td>${fmtDate(t.date)}</td>
      <td class="${t.isIncome ? 'text-success' : 'text-danger'}"><strong>${t.isIncome ? '+' : '-'}${fmt(t.amount)} €</strong></td>
      <td>
        <button class="btn btn-outline btn-sm" style="color:#A30000;" onclick="deleteTransaction('${t.id}', ${t.isIncome})">🗑️</button>
      </td>
    </tr>
  `).join('');
}
 
function openTransactionModal(type) {
  document.getElementById('trans-form').reset();
  document.getElementById('t-id').value = '';
  document.getElementById('t-type').value = type;
  document.getElementById('t-date').value = new Date().toISOString().slice(0, 10);
  document.getElementById('trans-modal-title').innerText = type === 'income' ? 'Shto të Ardhura (Hyrje)' : 'Shto Shpenzim (Dalje)';
  openModal('trans-modal');
}
 
function saveTransaction() {
  const type = document.getElementById('t-type').value;
  const desc = document.getElementById('t-desc').value.trim();
  const amount = document.getElementById('t-amount').value;
  const date = document.getElementById('t-date').value;
 
  const item = { id: uid(), desc, amount: Number(amount), date };
  if (type === 'income') {
    state.incomes.push(item);
  } else {
    state.expenses.push(item);
  }
 
  saveState();
  closeModal('trans-modal');
  renderAll();
  toast('Transaksioni u regjistrua!', 'success');
}
 
function deleteTransaction(id, isIncome) {
  if (confirm('Dëshironi ta fshini këtë transaksion financiar?')) {
    if (isIncome) {
      state.incomes = state.incomes.filter(x => x.id !== id);
    } else {
      state.expenses = state.expenses.filter(x => x.id !== id);
    }
    saveState();
    renderAll();
    toast('Transaksioni u fshi.', 'success');
  }
}
 
// ── CHAT COMPLETELY INTEGRATED LOGIC ──
function renderChat() {
  // Render Kanalet
  const chList = document.getElementById('channels-list');
  if (chList) {
    chList.innerHTML = state.channels.map(ch => `
      <div class="channel-item ${currentChannel === ch.id ? 'active' : ''}" onclick="selectChannel('${ch.id}')">
        # ${ch.name}
      </div>
    `).join('');
  }
 
  // Render Anëtarët Aktivë (dinamikisht nga lista e punëtorëve)
  const memList = document.getElementById('members-list');
  if (memList) {
    const myName = currentUser ? currentUser.name : 'Admin';
    memList.innerHTML = state.workers.map(w => {
      const isMe = w.name === myName;
      return `
        <div style="font-size:12px; padding: 6px 12px; display:flex; align-items:center; gap:8px; color: var(--text2);">
          <div style="width:7px; height:7px; border-radius:50%; background:#2ECC71;"></div>
          <div><strong>${w.name}</strong> <span style="font-size:10px; color:var(--text3);">${isMe ? '(Ju)' : '(' + w.role + ')'}</span></div>
        </div>`;
    }).join('') + (currentUser && currentUser.access === 'admin' ? `
      <div style="font-size:12px; padding: 6px 12px; display:flex; align-items:center; gap:8px; color: var(--text);">
        <div style="width:7px; height:7px; border-radius:50%; background:#2ECC71;"></div>
        <div><strong>Arta (Admin)</strong> <span style="font-size:10px; color:var(--gold-dark);">(Ju)</span></div>
      </div>` : '');
  }
 
  // Render Mesazhet
  const msgWrap = document.getElementById('messages-wrap');
  if (msgWrap) {
    const msgs = state.messages[currentChannel] || [];
    const myName = currentUser ? currentUser.name : 'Admin';
    msgWrap.innerHTML = msgs.map(m => {
      const isMe = (m.sender === myName || m.sender === 'Admin' && currentUser && currentUser.access === 'admin');
      return `
        <div class="msg-bubble ${isMe ? 'msg-sent' : 'msg-received'}">
          <div style="font-size:10px; opacity:0.7; margin-bottom:4px; font-weight:500;">
            ${isMe ? 'Ju' : m.sender} • ${m.time}
          </div>
          <div>${m.text}</div>
        </div>
      `;
    }).join('');
    msgWrap.scrollTop = msgWrap.scrollHeight;
  }
}
 
function selectChannel(id) {
  currentChannel = id;
  const ch = state.channels.find(c => c.id === id);
  if(ch) {
    document.getElementById('active-channel-name').innerText = ch.name;
    document.getElementById('active-channel-desc').innerText = ch.desc || '';
    document.getElementById('active-channel-icon').innerText = ch.icon || '💬';
  }
  renderChat();
}
 
function sendChatMessage() {
  const input = document.getElementById('chat-msg-input');
  const text = input.value.trim();
  if(!text) return;
 
  if(!state.messages[currentChannel]) state.messages[currentChannel] = [];
  
  const now = new Date();
  const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
 
  state.messages[currentChannel].push({
    sender: currentUser ? currentUser.name : 'Admin',
    text: text,
    time: timeStr
  });
 
  saveState();
  input.value = '';
  renderChat();
}
 
function createNewChannel() {
  const nameInput = document.getElementById('new-ch-name');
  const descInput = document.getElementById('new-ch-desc');
  const name = nameInput.value.trim().toLowerCase().replace(/\s+/g, '-');
  const desc = descInput.value.trim();
  
  if(!name) {
    toast('Emri i kanalit është i detyrueshëm!', 'error');
    return;
  }
 
  if(state.channels.some(c => c.id === name)) {
    toast('Ky kanal ekziston tashmë!', 'error');
    return;
  }
 
  state.channels.push({ id: name, name, desc, icon: '📍' });
  state.messages[name] = [];
  
  saveState();
  nameInput.value = '';
  descInput.value = '';
  closeModal('channel-modal');
  selectChannel(name);
  toast(`Kanali #${name} u krijua me sukses!`, 'success');
}
 
// ── EMOJI PICKER UTILS ──
function buildEmojiPicker() {
  const p = document.getElementById('chat-emoji-picker');
  if(!p) return;
  p.innerHTML = EMOJIS.map(e => `
    <span style="font-size:18px; cursor:pointer; padding:4px; text-align:center; transition:transform 0.1s;" 
          onclick="insertEmoji('${e}')" 
          onmouseover="this.style.transform='scale(1.2)'" 
          onmouseout="this.style.transform='scale(1)'">${e}</span>
  `).join('');
}
 
function toggleEmojiPicker(e) {
  e.stopPropagation();
  const p = document.getElementById('chat-emoji-picker');
  p.style.display = p.style.display === 'none' ? 'grid' : 'none';
}
 
function insertEmoji(emoji) {
  const inp = document.getElementById('chat-msg-input');
  inp.value += emoji;
  inp.focus();
  document.getElementById('chat-emoji-picker').style.display = 'none';
}
 
// Klikimi jashtë mbyll picker-in
document.addEventListener('click', () => {
  const p = document.getElementById('chat-emoji-picker');
  if(p) p.style.display = 'none';
});
 
// ── TASKS MANAGEMENT (KANBAN BOARD) ──
let draggedTaskId = null;
 
function renderTasks() {
  const cols = { todo: document.getElementById('kanban-todo'), inprogress: document.getElementById('kanban-inprogress'), done: document.getElementById('kanban-done') };
  if (!cols.todo) return;
 
  const isAdmin = currentUser && currentUser.access === 'admin';
  const myName = currentUser ? currentUser.name : '';
 
  // Workers see only their own tasks; admin sees all
  const visibleTasks = isAdmin ? state.tasks : state.tasks.filter(t => t.worker === myName);
 
  const total = visibleTasks.length;
  const doneCount = visibleTasks.filter(t => t.status === 'done').length;
  const totalEl = document.getElementById('task-count-total');
  const pendingEl = document.getElementById('task-count-pending');
  const doneEl = document.getElementById('task-count-done');
  if (totalEl) totalEl.innerText = total;
  if (pendingEl) pendingEl.innerText = total - doneCount;
  if (doneEl) doneEl.innerText = doneCount;
 
  ['todo', 'inprogress', 'done'].forEach(status => {
    const tasksInCol = visibleTasks.filter(t => (t.status || 'todo') === status)
      .sort((a,b) => new Date(a.due||0) - new Date(b.due||0));
 
    const countEl = document.getElementById('kanban-count-' + status);
    if (countEl) countEl.innerText = tasksInCol.length;
 
    cols[status].innerHTML = tasksInCol.length === 0
      ? '<div style="text-align:center; color:var(--text3); font-size:12px; padding:16px 4px;">Asnjë detyrë.</div>'
      : tasksInCol.map(t => `
        <div class="kanban-card" draggable="true" ondragstart="kanbanDragStart(event, '${t.id}')" ondragend="kanbanDragEnd(event)">
          <div class="kanban-card-title">${t.title}</div>
          ${t.desc ? `<div class="kanban-card-desc">${t.desc}</div>` : ''}
          <div class="kanban-card-meta">
            <span>👤 ${t.worker || 'Pa caktuar'}</span>
            ${t.due ? `<span>📅 ${fmtDate(t.due)}</span>` : ''}
          </div>
          ${isAdmin ? `<button class="btn btn-outline btn-sm" style="color:#A30000; margin-top:8px; width:100%;" onclick="deleteTask('${t.id}')">🗑️ Fshi</button>` : ''}
        </div>
      `).join('');
  });
}
 
function kanbanDragStart(e, taskId) {
  draggedTaskId = taskId;
  e.dataTransfer.effectAllowed = 'move';
  e.target.classList.add('dragging');
}
 
function kanbanDragEnd(e) {
  e.target.classList.remove('dragging');
  draggedTaskId = null;
}
 
function kanbanDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}
 
function kanbanDrop(e, newStatus) {
  e.preventDefault();
  document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('drag-over'));
  if (!draggedTaskId) return;
 
  const t = state.tasks.find(x => x.id === draggedTaskId);
  if (!t) return;
 
  const wasDone = t.status === 'done';
  t.status = newStatus;
  saveState();
  renderAll();
 
  if (newStatus === 'done' && !wasDone) {
    toast('Detyra u shënua si e përfunduar! 🎉', 'success');
    if (state.settings.confetti) fireConfetti();
  }
}
 
// Remove drag-over highlight if dropped outside or dragleave
document.addEventListener('dragleave', (e) => {
  if (e.target.classList && e.target.classList.contains('kanban-col')) {
    e.target.classList.remove('drag-over');
  }
});
 
function openTaskModal() {
  document.getElementById('task-form').reset();
  document.getElementById('task-id').value = '';
 
  const sel = document.getElementById('task-worker');
  sel.innerHTML = state.workers.map(w => `<option value="${w.name}">${w.name} (${w.role})</option>`).join('');
 
  openModal('task-modal');
}
 
function saveTask() {
  const title = document.getElementById('task-title').value.trim();
  const worker = document.getElementById('task-worker').value;
  const due = document.getElementById('task-due').value;
  const desc = document.getElementById('task-desc').value.trim();
 
  state.tasks.push({ id: uid(), title, worker, due, desc, status: 'todo', createdAt: new Date().toISOString().slice(0,10) });
  saveState();
  closeModal('task-modal');
  renderAll();
  toast('Detyra u caktua me sukses!', 'success');
}
 
function deleteTask(id) {
  if (confirm('A jeni të sigurt që dëshironi të fshini këtë detyrë?')) {
    state.tasks = state.tasks.filter(x => x.id !== id);
    saveState();
    renderAll();
    toast('Detyra u fshi.', 'success');
  }
}
 
// ── REPORTS & NOTES ──
function renderReports() {
  const list = document.getElementById('reports-list');
  if (!list) return;
  const isAdmin = currentUser && currentUser.access === 'admin';
 
  if (state.reports.length === 0) {
    list.innerHTML = '<p style="text-align:center; color:var(--text3); font-size:13px; padding:20px 0;">Asnjë raport i regjistruar.</p>';
    return;
  }
 
  const typeColors = { 'Problem': 'badge-danger', 'Përfundim Pune': 'badge-success', 'Shënim': 'badge-warning' };
  const sorted = [...state.reports].sort((a,b) => new Date(b.date) - new Date(a.date));
 
  list.innerHTML = sorted.map(r => `
    <div class="card" style="margin-bottom:0; padding:16px 20px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
        <div style="flex:1;">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
            <span class="badge ${typeColors[r.type] || 'badge-warning'}">${r.type}</span>
            <span style="font-size:11px; color:var(--text3);">${r.author} • ${fmtDate(r.date)}</span>
          </div>
          <div style="font-size:13px; color:var(--text);">${r.content}</div>
        </div>
        ${isAdmin ? `<button class="btn btn-outline btn-sm" style="color:#A30000;" onclick="deleteReport('${r.id}')">🗑️</button>` : ''}
      </div>
    </div>
  `).join('');
}
 
function openReportModal() {
  document.getElementById('report-form').reset();
  openModal('report-modal');
}
 
function saveReport() {
  const type = document.getElementById('report-type').value;
  const content = document.getElementById('report-content').value.trim();
 
  state.reports.push({
    id: uid(), type, content,
    author: currentUser ? currentUser.name : 'Admin',
    date: new Date().toISOString().slice(0,10)
  });
  saveState();
  closeModal('report-modal');
  renderAll();
  toast('Raporti u dërgua me sukses!', 'success');
}
 
function deleteReport(id) {
  if (confirm('A jeni të sigurt që dëshironi të fshini këtë raport?')) {
    state.reports = state.reports.filter(x => x.id !== id);
    saveState();
    renderAll();
    toast('Raporti u fshi.', 'success');
  }
}
 
// ── SETTINGS (ACCOUNT, APPEARANCE, EXTRAS) ──
const THEME_PALETTES = [
  { id: 'gold', label: 'Ari Klasik', swatch: '#C9A84C' },
  { id: 'rose', label: 'Trëndafil', swatch: '#C97B8C' },
  { id: 'emerald', label: 'Smerald', swatch: '#3F8A6B' },
  { id: 'sapphire', label: 'Safir', swatch: '#3E6FB0' }
];
 
const THEME_VARS = {
  gold:     { gold: '#C9A84C', light: '#F7F0DC', mid: '#E8D4A0', dark: '#8B6914', deep: '#5C430A' },
  rose:     { gold: '#C97B8C', light: '#FBEAEE', mid: '#EBC2CB', dark: '#9C4A5B', deep: '#6E2E3B' },
  emerald:  { gold: '#3F8A6B', light: '#E4F3EC', mid: '#BFE3D3', dark: '#246B4D', deep: '#15422F' },
  sapphire: { gold: '#3E6FB0', light: '#E6EEF8', mid: '#BBD2EC', dark: '#27517F', deep: '#16334F' }
};
 
function renderSettings() {
  if (!currentUser) return;
  const isAdmin = currentUser.access === 'admin';
 
  const nameInput = document.getElementById('settings-name');
  if (nameInput && document.activeElement !== nameInput) nameInput.value = currentUser.name;
 
  // Username field: visible only to admin
  const usernameField = document.getElementById('settings-username-field');
  const usernameInput = document.getElementById('settings-username');
  if (usernameField) usernameField.style.display = isAdmin ? 'block' : 'none';
  if (usernameInput && isAdmin && document.activeElement !== usernameInput) {
    usernameInput.value = state.adminUsername || '';
  }
 
  const avatarPreview = document.getElementById('settings-avatar-preview');
  if (avatarPreview) avatarPreview.innerText = currentUser.name.charAt(0).toUpperCase();
 
  const swatchWrap = document.getElementById('theme-swatches');
  if (swatchWrap) {
    swatchWrap.innerHTML = THEME_PALETTES.map(p => `
      <div onclick="setTheme('${p.id}')" style="cursor:pointer; text-align:center;">
        <div style="width:46px; height:46px; border-radius:50%; background:${p.swatch}; border:3px solid ${state.settings.theme === p.id ? p.swatch : 'transparent'}; box-shadow: 0 0 0 2px ${state.settings.theme === p.id ? p.swatch : 'transparent'}; margin-bottom:6px; transition: all 0.2s;"></div>
        <div style="font-size:11px; color:var(--text2);">${p.label}</div>
      </div>
    `).join('');
  }
 
  const confettiCheckbox = document.getElementById('settings-confetti');
  if (confettiCheckbox) confettiCheckbox.checked = !!state.settings.confetti;
 
  const darkCheckbox = document.getElementById('settings-darkmode');
  if (darkCheckbox) darkCheckbox.checked = !!state.settings.darkMode;
}
 
function saveAccountSettings() {
  const newName = document.getElementById('settings-name').value.trim();
  const pass1 = document.getElementById('settings-pass1').value;
  const pass2 = document.getElementById('settings-pass2').value;
 
  if (!newName) {
    toast('Emri nuk mund të jetë bosh!', 'error');
    return;
  }
  if (pass1 && pass1.length < 4) {
    toast('Fjalëkalimi duhet të ketë të paktën 4 karaktere!', 'error');
    return;
  }
  if (pass1 && pass1 !== pass2) {
    toast('Fjalëkalimet nuk përputhen!', 'error');
    return;
  }
 
  const oldName = currentUser.name;
 
  if (currentUser.access === 'admin' && !currentUser.workerId) {
    // Validate and save new username for admin
    const newUsername = document.getElementById('settings-username').value.trim();
    if (!newUsername) {
      toast('Emri i përdoruesit nuk mund të jetë bosh!', 'error');
      return;
    }
    currentUser.name = newName;
    state.adminUsername = newUsername;
    if (pass1) state.adminPassword = pass1;
  } else {
    const worker = state.workers.find(w => w.id === currentUser.workerId);
    if (worker) {
      worker.name = newName;
      if (pass1) worker.password = pass1;
      currentUser.name = newName;
    }
  }
 
  // Propagate name change across decors/tasks/messages so history stays consistent
  if (oldName !== newName) {
    state.decors.forEach(d => { if (d.worker === oldName) d.worker = newName; });
    state.tasks.forEach(t => { if (t.worker === oldName) t.worker = newName; });
    Object.keys(state.messages).forEach(ch => {
      state.messages[ch].forEach(m => { if (m.sender === oldName) m.sender = newName; });
    });
  }
 
  localStorage.setItem('artadecor_session', JSON.stringify(currentUser));
  saveState();
  applyAccessControl();
  renderAll();
  document.getElementById('settings-pass1').value = '';
  document.getElementById('settings-pass2').value = '';
  toast('Cilësimet e llogarisë u ruajtën!', 'success');
}
 
function setTheme(themeId) {
  state.settings.theme = themeId;
  saveState();
  applyTheme(themeId);
  renderSettings();
}
 
function applyTheme(themeId) {
  const t = THEME_VARS[themeId] || THEME_VARS.gold;
  const root = document.documentElement;
  root.style.setProperty('--gold', t.gold);
  root.style.setProperty('--gold-light', t.light);
  root.style.setProperty('--gold-mid', t.mid);
  root.style.setProperty('--gold-dark', t.dark);
  root.style.setProperty('--gold-deep', t.deep);
}
 
function toggleConfettiSetting() {
  state.settings.confetti = document.getElementById('settings-confetti').checked;
  saveState();
  if (state.settings.confetti) toast('Modaliteti Festiv u aktivizua! ✨', 'success');
}
 
function fireConfetti() {
  const colors = ['#C9A84C', '#F7F0DC', '#E8D4A0', '#FFD700', '#FFF3CD'];
  for (let i = 0; i < 40; i++) {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.top = '-10px';
    el.style.left = Math.random() * 100 + 'vw';
    el.style.width = '8px';
    el.style.height = '8px';
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    el.style.zIndex = '9999';
    el.style.opacity = '0.9';
    el.style.pointerEvents = 'none';
    el.style.transition = 'transform 1.6s ease-in, opacity 1.6s ease-in';
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.transform = `translateY(${80 + Math.random()*20}vh) rotate(${Math.random()*360}deg)`;
      el.style.opacity = '0';
    });
    setTimeout(() => el.remove(), 1700);
  }
}
 
// ── GENERAL UTILS / HELPERS ──
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
 
function toggleDarkMode() {
  const isDark = document.getElementById('settings-darkmode').checked;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : '');
  state.settings.darkMode = isDark;
  saveState();
}
 
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); });
});
 
function toast(msg, type = '') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast' + (type ? ' ' + type : '');
  t.innerText = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
 
function fmt(n) { return Number(n).toLocaleString('en-US'); }
function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s + 'T12:00:00');
  return d.toLocaleDateString('sq-AL', { day: 'numeric', month: 'short', year: 'numeric' });
}