/* ==========================================================
   SuryaLab — app.js
   Simple client-side data layer using localStorage.
   Everything a static host (GitHub Pages / Render static site)
   can run with zero backend. Swap this layer for a real API
   later without touching the page code much.
   ========================================================== */

const DB_KEYS = {
  users: 'suryalab_users',
  tests: 'suryalab_tests',
  packages: 'suryalab_packages',
  patients: 'suryalab_patients',
  results: 'suryalab_results',
  session: 'suryalab_session',
  seeded: 'suryalab_seeded'
};

const SuryaDB = {

  /* ---------------- Seed on first run ---------------- */
  init(){
    if (localStorage.getItem(DB_KEYS.seeded)) return;

    localStorage.setItem(DB_KEYS.users, JSON.stringify([
      { id:'u1', username:'admin', password:'admin123', role:'admin', name:'Lab Admin' },
      { id:'u2', username:'staff', password:'staff123', role:'staff', name:'Lab Staff' }
    ]));

    localStorage.setItem(DB_KEYS.tests, JSON.stringify([
      { id:'t1', name:'Hb (Hemoglobin)', rate:120, unit:'g/dL', range:'13–17' },
      { id:'t2', name:'CBC', rate:350, unit:'-', range:'-' },
      { id:'t3', name:'CRP', rate:400, unit:'mg/L', range:'0–5' },
      { id:'t4', name:'ESR', rate:150, unit:'mm/hr', range:'0–20' },
      { id:'t5', name:'Typhoid (Widal)', rate:250, unit:'-', range:'Negative' },
      { id:'t6', name:'Dengue NS1', rate:500, unit:'-', range:'Negative' },
      { id:'t7', name:'Blood Sugar (Fasting)', rate:80, unit:'mg/dL', range:'70–100' },
      { id:'t8', name:'Urine Routine', rate:150, unit:'-', range:'Normal' }
    ]));

    localStorage.setItem(DB_KEYS.packages, JSON.stringify([
      { id:'p1', name:'Fever Package', tests:['t2','t3','t4','t5','t6'], price:950 }
    ]));

    localStorage.setItem(DB_KEYS.patients, JSON.stringify([]));
    localStorage.setItem(DB_KEYS.results, JSON.stringify([]));
    localStorage.setItem(DB_KEYS.seeded, '1');
  },

  _get(key){ return JSON.parse(localStorage.getItem(key) || '[]'); },
  _set(key, val){ localStorage.setItem(key, JSON.stringify(val)); },

  /* ---------------- Auth ---------------- */
  login(username, password){
    const user = this._get(DB_KEYS.users).find(u =>
      u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (!user) return null;
    const session = { id:user.id, username:user.username, role:user.role, name:user.name };
    localStorage.setItem(DB_KEYS.session, JSON.stringify(session));
    return session;
  },
  logout(){ localStorage.removeItem(DB_KEYS.session); },
  currentUser(){
    const raw = localStorage.getItem(DB_KEYS.session);
    return raw ? JSON.parse(raw) : null;
  },
  requireAuth(basePath){
    const u = this.currentUser();
    if (!u) window.location.href = basePath + 'login.html';
    return u;
  },

  /* ---------------- Tests ---------------- */
  getTests(){ return this._get(DB_KEYS.tests); },
  saveTest(test){
    const tests = this.getTests();
    if (test.id){
      const i = tests.findIndex(t => t.id === test.id);
      tests[i] = test;
    } else {
      test.id = 't' + Date.now();
      tests.push(test);
    }
    this._set(DB_KEYS.tests, tests);
    return test;
  },
  deleteTest(id){
    this._set(DB_KEYS.tests, this.getTests().filter(t => t.id !== id));
  },

  /* ---------------- Packages ---------------- */
  getPackages(){ return this._get(DB_KEYS.packages); },
  savePackage(pkg){
    const pkgs = this.getPackages();
    if (pkg.id){
      const i = pkgs.findIndex(p => p.id === pkg.id);
      pkgs[i] = pkg;
    } else {
      pkg.id = 'p' + Date.now();
      pkgs.push(pkg);
    }
    this._set(DB_KEYS.packages, pkgs);
    return pkg;
  },
  deletePackage(id){
    this._set(DB_KEYS.packages, this.getPackages().filter(p => p.id !== id));
  },

  /* ---------------- Patients / Invoices ---------------- */
  getPatients(){ return this._get(DB_KEYS.patients); },
  getPatient(id){ return this.getPatients().find(p => p.id === id); },
  nextInvoiceNo(){
    const patients = this.getPatients();
    const n = patients.length + 1;
    return 'SL-' + String(n).padStart(4, '0');
  },
  addPatient(data){
    const patients = this.getPatients();
    const patient = Object.assign({
      id: 'pt' + Date.now(),
      invoiceNo: this.nextInvoiceNo(),
      date: new Date().toISOString().slice(0,10),
      createdAt: Date.now()
    }, data);
    patients.push(patient);
    this._set(DB_KEYS.patients, patients);
    return patient;
  },

  /* ---------------- Results ---------------- */
  getResults(){ return this._get(DB_KEYS.results); },
  getResultsForPatient(patientId){
    return this.getResults().filter(r => r.patientId === patientId);
  },
  saveResult(patientId, testId, resultValue){
    const results = this.getResults();
    const i = results.findIndex(r => r.patientId === patientId && r.testId === testId);
    const entry = { patientId, testId, result: resultValue, enteredAt: Date.now() };
    if (i > -1) results[i] = entry; else results.push(entry);
    this._set(DB_KEYS.results, results);
  },
  isReportComplete(patientId){
    const patient = this.getPatient(patientId);
    if (!patient) return false;
    const done = this.getResultsForPatient(patientId).map(r => r.testId);
    return patient.testIds.every(id => done.includes(id));
  },

  /* ---------------- Dashboard stats ---------------- */
  stats(){
    const today = new Date().toISOString().slice(0,10);
    const patients = this.getPatients();
    const todays = patients.filter(p => p.date === today);
    const todaysCollection = todays.reduce((sum,p) => sum + (p.amount || 0), 0);
    const pending = patients.filter(p => !this.isReportComplete(p.id)).length;
    return {
      todayPatients: todays.length,
      todayCollection: todaysCollection,
      pendingReports: pending
    };
  }
};

SuryaDB.init();

/* ================= Shared helpers ================= */
function escapeHtml(str){
  return String(str ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function formatMoney(n){ return '₹' + Number(n || 0).toLocaleString('en-IN'); }
function formatDateDisplay(iso){
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

/* ================= Shared chrome: sidebar + topbar =================
   basePath: '' when called from root (index.html),
             '../' when called from a page inside /pages/
   active: key of current nav item to highlight
*/
function renderShell(basePath, active){
  const user = SuryaDB.currentUser();
  const nav = [
    { key:'dashboard', label:'Dashboard', icon:'🏠', href:basePath+'pages/dashboard.html' },
    { key:'test-entry', label:'Test Entry', icon:'📝', href:basePath+'pages/test-entry.html' },
    { key:'report', label:'Lab Report', icon:'📄', href:basePath+'pages/report.html' },
    { key:'collection', label:'Collection', icon:'💰', href:basePath+'pages/collection.html' },
    { key:'settings', label:'Settings', icon:'⚙️', href:basePath+'pages/settings.html', adminOnly:true }
  ];

  const navHtml = nav
    .filter(item => !item.adminOnly || (user && user.role === 'admin'))
    .map(item => `<a class="nav-link ${item.key===active?'active':''}" href="${item.href}">
        <span>${item.icon}</span><span>${item.label}</span></a>`).join('');

  document.getElementById('sidebar').innerHTML = `
    <div class="brand-name">🧪 SuryaLab</div>
    <div class="brand-sub" style="padding:0 20px 14px;color:#9CCFC9;font-size:11px;letter-spacing:1.5px;">DIAGNOSTIC CENTRE</div>
    ${navHtml}
    <div class="nav-sep"></div>
    <a class="nav-link" href="#" id="logoutLink">🚪 Logout</a>
  `;

  document.getElementById('topbar').innerHTML = `
    <button class="hamburger" id="hamburgerBtn">☰</button>
    <div class="who">Signed in as <strong>${escapeHtml(user?.name || '')}</strong> (${escapeHtml(user?.role || '')})</div>
  `;

  document.getElementById('logoutLink').addEventListener('click', (e) => {
    e.preventDefault();
    SuryaDB.logout();
    window.location.href = basePath + 'pages/login.html';
  });
  const hamburger = document.getElementById('hamburgerBtn');
  if (hamburger){
    hamburger.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
  }
}
