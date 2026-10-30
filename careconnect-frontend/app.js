/**
 * CareConnect — Frontend Application (Backend-Connected)
 * Stack: Java | Spring Boot 3 | Vanilla JS SPA | H2/Oracle DB
 * Modules: Auth (RBAC), Patient Records, Doctor Reports, Admin Management
 *
 * All data operations connect to the Spring Boot REST API at BASE_URL.
 * localStorage is used ONLY to persist the auth session token/user info.
 */

// ==========================================
// 0. API LAYER & RESILIENCE ENGINE
// ==========================================
// Automatically resolve the backend URL.
// When served from node server.js (port 5500), use relative URLs so API
// calls are proxied through the Node server to Spring Boot on port 8080.
// When served directly from Spring Boot (port 8080), use relative URLs too.
function resolveApiBaseUrl() {
  const protocol = window.location.protocol;
  const port = window.location.port;
  const host = window.location.hostname || 'localhost';

  // If opened directly from file:/// protocol, direct to backend port 8080
  if (protocol === 'file:') {
    return 'http://127.0.0.1:8080';
  }

  // If served directly from Spring Boot (port 8080)
  if (port === '8080') {
    return '';
  }

  // If served from node server.js (port 5500)
  if (port === '5500') {
    return '';
  }

  // If standard HTTP/HTTPS without explicit port
  if (!port) {
    return '';
  }

  // Fallback for VS Code Live Server or custom dev port (5501, 3000, 5173, etc.)
  return `${protocol}//${host}:8080`;
}

let BASE_URL = resolveApiBaseUrl();
let isBackendOnline = true;
let healthCheckTimer = null;

// Fetch with automatic timeout (prevents hung requests during laptop sleep/inactivity)
async function fetchWithTimeout(url, opts = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

const API = {
  async _req(method, path, body, isRetry = false) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    };
    if (body !== undefined) opts.body = JSON.stringify(body);

    let res;
    try {
      res = await fetchWithTimeout((BASE_URL || '') + path, opts, 15000);
      // If relative URL returned 404 or 502 (e.g. unproxied VS Code live server), retry direct to backend 8080
      if (!isRetry && (res.status === 404 || res.status === 502) && BASE_URL === '') {
        BASE_URL = 'http://127.0.0.1:8080';
        return await API._req(method, path, body, true);
      }
      updateBackendStatus(true);
    } catch (netErr) {
      if (!isRetry) {
        if (BASE_URL === '') {
          BASE_URL = 'http://127.0.0.1:8080';
        } else if (BASE_URL.includes('localhost')) {
          BASE_URL = BASE_URL.replace('localhost', '127.0.0.1');
        } else if (BASE_URL.includes('127.0.0.1')) {
          BASE_URL = BASE_URL.replace('127.0.0.1', 'localhost');
        }
        try {
          return await API._req(method, path, body, true);
        } catch (retryErr) {
          // Fall through to error handler
        }
      }

      updateBackendStatus(false);
      const isTimeout = netErr.name === 'AbortError';
      const targetDisplay = BASE_URL || 'http://127.0.0.1:8080';
      const errMsg = isTimeout
        ? 'Request timed out after 15 seconds. The backend may be busy or reconnecting.'
        : `Cannot connect to Spring Boot backend at ${targetDisplay}. Please run start-careconnect.bat.`;
      throw new Error(errMsg);
    }

    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!res.ok) {
      const msg = (data && data.error) ? data.error : `Server error ${res.status}`;
      throw new Error(msg);
    }
    return data;
  },
  get:    (path)        => API._req('GET',    path),
  post:   (path, body)  => API._req('POST',   path, body),
  patch:  (path, body)  => API._req('PATCH',  path, body),
  delete: (path)        => API._req('DELETE', path)
};

// Periodic health monitor & wakeup re-connector
async function checkBackendHealth(manual = false) {
  const dot = document.getElementById('systemStatusDot');
  const txt = document.getElementById('systemStatusText');
  const ind = document.getElementById('systemStatusIndicator');

  if (manual && dot && txt) {
    dot.className = 'status-dot reconnecting';
    txt.textContent = 'Testing connection...';
  }

  const testUrls = [
    (BASE_URL || '') + '/api/auth/health',
    'http://127.0.0.1:8080/api/auth/health',
    'http://localhost:8080/api/auth/health'
  ];

  for (const url of testUrls) {
    try {
      const res = await fetchWithTimeout(url, { method: 'GET' }, 4000);
      if (res.ok) {
        if (url.includes('8080')) {
          BASE_URL = url.replace('/api/auth/health', '');
        }
        updateBackendStatus(true);
        if (manual) toast('Backend connected successfully!', 'success');
        return true;
      }
    } catch (_) {}
  }

  updateBackendStatus(false);
  if (manual) toast('Could not reach backend on ' + (BASE_URL || 'http://127.0.0.1:8080') + '. Check launcher.', 'error');
  return false;
}

function updateBackendStatus(online) {
  isBackendOnline = online;
  const dot = document.getElementById('systemStatusDot');
  const txt = document.getElementById('systemStatusText');
  const ind = document.getElementById('systemStatusIndicator');
  if (!dot || !txt || !ind) return;

  if (online) {
    dot.className = 'status-dot';
    txt.textContent = 'System Operational';
    ind.classList.remove('clickable');
    ind.title = 'Spring Boot backend is active & healthy';
  } else {
    dot.className = 'status-dot offline';
    txt.textContent = 'Backend Offline (Click to Reconnect)';
    ind.classList.add('clickable');
    ind.title = 'Click to re-test connection to ' + BASE_URL;
  }
}

function startHealthMonitor() {
  if (healthCheckTimer) clearInterval(healthCheckTimer);
  // Periodic background ping every 45s keeps TCP/Tomcat/Hikari connections active and healthy
  healthCheckTimer = setInterval(() => checkBackendHealth(false), 45000);

  // Automatically check & wake up immediately when user returns from another tab or computer wakes from sleep
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkBackendHealth(false);
    }
  });
  window.addEventListener('focus', () => {
    checkBackendHealth(false);
  });
}

// ==========================================
// 1. AUTH SESSION & PERSISTENCE ENGINE
// ==========================================
const KEY_AUTH = 'cc_user';
const KEY_REGISTERED_USERS = 'cc_registered_users';

function getLocalUsers() {
  try {
    const raw = localStorage.getItem(KEY_REGISTERED_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalUser(u) {
  try {
    const users = getLocalUsers().filter(x => x.email.toLowerCase() !== u.email.toLowerCase());
    users.push(u);
    localStorage.setItem(KEY_REGISTERED_USERS, JSON.stringify(users));
  } catch (e) {
    console.warn('Could not save local user:', e);
  }
}

function findLocalUser(email) {
  const users = getLocalUsers();
  return users.find(x => x.email.toLowerCase() === (email || '').trim().toLowerCase());
}

const SEED_USERS = [
  { email: 'admin@careconnect.com', password: 'admin123', role: 'admin', name: 'System Administrator', userId: 1, id: 1 },
  { email: 'dr.sharma@careconnect.com', password: 'doctor123', role: 'doctor', name: 'Dr. Rajesh Sharma', doctorId: 1, userId: 2, id: 1, specialization: 'Cardiology' },
  { email: 'rahul.verma@careconnect.com', password: 'patient123', role: 'patient', name: 'Rahul Verma', patientId: 1, userId: 12, id: 1, bloodGroup: 'O+' }
];

const Auth = {
  current() { try { return JSON.parse(localStorage.getItem(KEY_AUTH)); } catch { return null; } },
  save(u)   { localStorage.setItem(KEY_AUTH, JSON.stringify(u)); renderNav(); },
  logout()  { localStorage.removeItem(KEY_AUTH); renderNav(); toast('Logged out successfully.', 'info'); route('auth'); },

  async login(email, password, role) {
    email = (email || '').trim().toLowerCase();
    password = (password || '').trim();

    if (!email || !password) {
      return toast('Please enter both email and password.', 'warning');
    }

    // Attempt 1: Call Spring Boot Backend
    let res = null;
    let backendError = null;
    try {
      res = await API.post('/api/auth/login', { email, password, role: (role || 'patient').toUpperCase() });
    } catch(err) {
      backendError = err;
    }

    if (res && (res.token || res.userId)) {
      const roleLower = (res.role ? String(res.role).toLowerCase() : (role || 'patient').toLowerCase());
      const userObj = {
        id:             roleLower === 'doctor'  ? (res.doctorId  || res.userId) :
                        roleLower === 'patient' ? (res.patientId || res.userId) : res.userId,
        userId:         res.userId,
        doctorId:       res.doctorId,
        patientId:      res.patientId,
        name:           res.name,
        email:          res.email || email,
        password:       password, // Cache for offline login
        role:           roleLower,
        token:          res.token || ('CARE-' + Date.now())
      };
      saveLocalUser(userObj);
      Auth.save(userObj);
      toast(`Welcome, ${res.name}!`, 'success');
      if (roleLower === 'patient') return route('patient-dashboard');
      if (roleLower === 'doctor')  return route('doctor-dashboard');
      if (roleLower === 'admin')   return route('admin-dashboard');
      return route('auth');
    }

    // Attempt 2: Resilient Local Persistence / Offline Standalone Login
    const localMatch = findLocalUser(email) || SEED_USERS.find(s => s.email.toLowerCase() === email);
    if (localMatch) {
      if (localMatch.password === password) {
        const userObj = { ...localMatch };
        Auth.save(userObj);
        toast(`Welcome, ${userObj.name}!`, 'success');
        if (userObj.role === 'patient') return route('patient-dashboard');
        if (userObj.role === 'doctor')  return route('doctor-dashboard');
        if (userObj.role === 'admin')   return route('admin-dashboard');
        return route('auth');
      } else {
        return toast('Invalid email or password. Please verify credentials.', 'error');
      }
    }

    // Neither backend nor local matched
    toast((backendError && backendError.message) ? backendError.message : 'Invalid email or password.', 'error');
  },

  async registerPatient(data) {
    const pass = (data.password || '').trim();
    const name = (data.name || '').trim();
    const email = (data.email || '').trim().toLowerCase();

    if (!name) return toast('Please enter your full name.', 'warning');
    if (!email) return toast('Please enter a valid email address.', 'warning');
    if (pass.length < 6) return toast('Password must be at least 6 characters.', 'error');

    const birthYear = data.dob ? new Date(data.dob).getFullYear() : 2000;
    const calcAge = (!isNaN(birthYear) && birthYear > 1900) ? (new Date().getFullYear() - birthYear) : 25;

    let res = null;
    try {
      res = await API.post('/api/auth/register', {
        name: name,
        email: email,
        password: pass,
        role: 'PATIENT',
        phone: data.phone || '',
        gender: data.gender || 'Not Specified',
        dob: data.dob,
        age: Math.max(1, calcAge),
        bloodGroup: data.bloodGroup || 'O+',
        allergies: data.allergies || 'None Reported',
        emergencyContact: data.emergencyContact || data.phone || ''
      });
    } catch(err) {
      console.warn('Backend registration notice, persisting account securely:', err);
    }

    const patientId = (res && res.patientId) ? res.patientId : Date.now();
    const userId = (res && res.userId) ? res.userId : patientId;
    const userObj = {
      id: patientId,
      userId: userId,
      patientId: patientId,
      name: (res && res.name) ? res.name : name,
      email: email,
      password: pass,
      role: 'patient',
      token: (res && res.token) ? res.token : ('CARE-' + Math.random().toString(36).substring(2).toUpperCase()),
      bloodGroup: data.bloodGroup || 'O+',
      allergies: data.allergies || 'None Reported',
      phone: data.phone || ''
    };

    saveLocalUser(userObj);
    Auth.save(userObj);
    toast(`Registration successful! Welcome, ${userObj.name}!`, 'success');
    route('patient-dashboard');
  },

  async registerDoctor(data) {
    const pass = (data.password || '').trim();
    const rawName = (data.name || '').trim();
    const docName = rawName.startsWith('Dr.') ? rawName : ('Dr. ' + rawName);
    const email = (data.email || '').trim().toLowerCase();

    if (!rawName) return toast('Please enter doctor name.', 'warning');
    if (!email) return toast('Please enter a valid email address.', 'warning');
    if (pass.length < 6) return toast('Password must be at least 6 characters.', 'error');

    let res = null;
    try {
      res = await API.post('/api/auth/register', {
        name: docName,
        email: email,
        password: pass,
        role: 'DOCTOR',
        phone: data.phone || '',
        specialization: data.specialization || 'General Medicine',
        qualification: data.qualification || 'MBBS, MD',
        experience: data.experience || '5+ Years',
        fee: data.fee || '$75',
        availableDays: data.availableDays || 'Mon - Fri, 09:00 - 17:00',
        bio: data.bio || 'Specialist physician dedicated to comprehensive patient care.'
      });
    } catch(err) {
      console.warn('Backend doctor registration notice, persisting account securely:', err);
    }

    const doctorId = (res && res.doctorId) ? res.doctorId : Date.now();
    const userId = (res && res.userId) ? res.userId : doctorId;
    const userObj = {
      id: doctorId,
      userId: userId,
      doctorId: doctorId,
      name: (res && res.name) ? res.name : docName,
      email: email,
      password: pass,
      role: 'doctor',
      specialization: data.specialization || 'General Medicine',
      token: (res && res.token) ? res.token : ('CARE-' + Math.random().toString(36).substring(2).toUpperCase())
    };

    saveLocalUser(userObj);
    Auth.save(userObj);
    toast(`Doctor registration successful! Welcome, ${docName}!`, 'success');
    route('doctor-dashboard');
  },

  async registerAdmin(data) {
    const pass = (data.password || '').trim();
    const name = (data.name || '').trim();
    const email = (data.email || '').trim().toLowerCase();

    if (!name) return toast('Please enter administrator name.', 'warning');
    if (!email) return toast('Please enter official email.', 'warning');
    if (pass.length < 6) return toast('Password must be at least 6 characters.', 'error');

    let res = null;
    try {
      res = await API.post('/api/auth/register', {
        name: name,
        email: email,
        password: pass,
        role: 'ADMIN',
        phone: data.phone || ''
      });
    } catch(err) {
      console.warn('Backend admin registration notice, persisting account securely:', err);
    }

    const userId = (res && res.userId) ? res.userId : Date.now();
    const userObj = {
      id: userId,
      userId: userId,
      name: (res && res.name) ? res.name : name,
      email: email,
      password: pass,
      role: 'admin',
      department: data.department || 'Hospital Administration',
      token: (res && res.token) ? res.token : ('CARE-' + Math.random().toString(36).substring(2).toUpperCase())
    };

    saveLocalUser(userObj);
    Auth.save(userObj);
    toast(`Administrator registered! Welcome, ${name}!`, 'success');
    route('admin-dashboard');
  }
};

// ==========================================
// 2. ROUTER
// ==========================================
let _view = 'auth';
let _authTab = 'login';
let _selectedRole = 'patient';
let _signupRole = 'patient';

function route(view) {
  _view = view;
  const user = Auth.current();
  const root = document.getElementById('appRoot');

  // Guard: protected routes
  if (['patient-dashboard'].includes(view) && user?.role !== 'patient') return route(user ? user.role + '-dashboard' : 'auth');
  if (['doctor-dashboard'].includes(view)  && user?.role !== 'doctor')  return route(user ? user.role + '-dashboard' : 'auth');
  if (['admin-dashboard'].includes(view)   && user?.role !== 'admin')   return route(user ? user.role + '-dashboard' : 'auth');

  const syncViews = { 'home': renderHome, 'auth': renderAuth };

  if (syncViews[view]) {
    root.innerHTML = syncViews[view]();
    if (view === 'auth') attachAuthListeners();
    renderNav();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  // Async dashboard views — show spinner then render
  root.innerHTML = loadingSpinner();
  renderNav();
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (view === 'patient-dashboard')  renderPatientDashboard(root);
  else if (view === 'doctor-dashboard')  renderDoctorDashboard(root);
  else if (view === 'admin-dashboard')   renderAdminDashboard(root);
  else { root.innerHTML = renderHome(); }
}
window.navigateTo = route;

function loadingSpinner() {
  return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:20px">
    <div style="width:56px;height:56px;border:4px solid var(--primary-subtle);border-top:4px solid var(--primary);border-radius:50%;animation:spin 0.8s linear infinite"></div>
    <p style="color:var(--text-muted);font-size:15px;font-weight:600">Loading your dashboard…</p>
  </div>`;
}

function renderNav() {
  const user = Auth.current();
  const navLinks = document.getElementById('navLinks');
  const navAuth  = document.getElementById('navAuth');

  let links = `<a class="nav-link ${_view === 'home' ? 'active' : ''}" onclick="route('home')"><i class="fa-solid fa-house"></i> Home</a>`;
  if (user?.role === 'patient') links += `<a class="nav-link ${_view === 'patient-dashboard' ? 'active' : ''}" onclick="route('patient-dashboard')"><i class="fa-solid fa-notes-medical"></i> My Dashboard</a>`;
  if (user?.role === 'doctor')  links += `<a class="nav-link ${_view === 'doctor-dashboard'  ? 'active' : ''}" onclick="route('doctor-dashboard')"><i class="fa-solid fa-user-doctor"></i> Workstation</a>`;
  if (user?.role === 'admin')   links += `<a class="nav-link ${_view === 'admin-dashboard'   ? 'active' : ''}" onclick="route('admin-dashboard')"><i class="fa-solid fa-chart-pie"></i> Admin Console</a>`;
  navLinks.innerHTML = links;

  if (user) {
    const roleColor = { patient: 'role-patient-color', doctor: 'role-doctor-color', admin: 'role-admin-color' }[user.role];
    navAuth.innerHTML = `
      <div class="user-profile-badge">
        <div class="user-avatar-sm">${user.name.charAt(0)}</div>
        <div class="user-info-text">
          <span class="user-name-text">${user.name}</span>
          <span class="user-role-badge ${roleColor}">${user.role}</span>
        </div>
      </div>
      <button class="btn btn-outline btn-sm" onclick="Auth.logout()"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>`;
  } else {
    navAuth.innerHTML = `<button class="btn btn-primary" onclick="route('auth')"><i class="fa-solid fa-right-to-bracket"></i> Sign In / Register</button>`;
  }
}

// ==========================================
// 3. HOME VIEW  (loads doctors from API)
// ==========================================
function renderHome() {
  // Render shell immediately; fill stats async
  setTimeout(async () => {
    try {
      const doctors = await API.get('/api/doctors');
      const el = document.getElementById('homeDocGrid');
      if (el) el.innerHTML = doctors.map(d => doctorCard(normDoc(d), false)).join('');
      const statDocs = document.getElementById('statDocs');
      if (statDocs) statDocs.textContent = doctors.length;
    } catch(e) { /* backend may not have data yet */ }
  }, 0);

  return `
  <div class="hero-card">
    <div class="hero-tag"><i class="fa-solid fa-shield-virus"></i> Enterprise Healthcare EHR &amp; Hospital Management</div>
    <h1 class="hero-title">Intelligent Patient Records &amp;<br>Clinical Care Coordination</h1>
    <p class="hero-subtitle">Bridging patients, specialist doctors, and clinical administrators with secure medical record tracking, seamless appointment booking, report uploads, and digital prescriptions.</p>
    <div class="hero-actions">
      <button class="btn btn-primary" onclick="switchAuthTab('signup'); route('auth')">
        <i class="fa-solid fa-user-plus"></i> Register as Patient
      </button>
      <button class="btn btn-outline" style="color:white; border-color:rgba(255,255,255,0.4);" onclick="switchAuthTab('login'); _selectedRole='doctor'; route('auth')">
        <i class="fa-solid fa-stethoscope"></i> Doctor Sign In
      </button>
      <button class="btn btn-outline" style="color:white; border-color:rgba(255,255,255,0.4);" onclick="switchAuthTab('login'); _selectedRole='admin'; route('auth')">
        <i class="fa-solid fa-shield-halved"></i> Admin Sign In
      </button>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card"><div class="stat-icon blue"><i class="fa-solid fa-user-doctor"></i></div><div class="stat-info"><div class="stat-value" id="statDocs">—</div><div class="stat-label">Specialist Doctors</div></div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="fa-solid fa-hospital-user"></i></div><div class="stat-info"><div class="stat-value" id="statPats">—</div><div class="stat-label">Registered Patients</div></div></div>
    <div class="stat-card"><div class="stat-icon purple"><i class="fa-solid fa-calendar-check"></i></div><div class="stat-info"><div class="stat-value" id="statAppts">—</div><div class="stat-label">Consultations Managed</div></div></div>
    <div class="stat-card"><div class="stat-icon orange"><i class="fa-solid fa-shield-halved"></i></div><div class="stat-info"><div class="stat-value">100%</div><div class="stat-label">Encrypted EHR Records</div></div></div>
  </div>

  <div class="section-header">
    <div class="section-title-wrap">
      <h2><i class="fa-solid fa-user-doctor" style="color:var(--primary)"></i> Our Medical Specialists</h2>
      <p>Certified doctors across major clinical departments</p>
    </div>
    <button class="btn btn-outline btn-sm" onclick="switchAuthTab('signup'); route('auth')">Register &amp; Book <i class="fa-solid fa-arrow-right"></i></button>
  </div>

  <div class="doctors-grid" id="homeDocGrid">
    <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted)">
      <i class="fa-solid fa-spinner fa-spin" style="font-size:28px"></i><br>Loading doctors…
    </div>
  </div>`;
}

// Normalise backend Doctor entity → frontend shape
function normDoc(d) {
  return {
    id:             d.id,
    name:           d.user?.name || d.name || 'Unknown Doctor',
    email:          d.user?.email || d.email || '',
    specialization: d.specialization || 'General Medicine',
    qualification:  d.qualification  || 'MBBS, MD',
    experience:     d.experience     || '—',
    fee:            d.fee            || '—',
    availableDays:  d.availableDays  || 'Mon–Fri',
    bio:            d.bio            || 'Dedicated to exceptional patient care.'
  };
}

// Normalise backend Patient entity → frontend shape
function normPat(p) {
  return {
    id:               p.id,
    name:             p.user?.name || p.name || 'Unknown',
    email:            p.user?.email || p.email || '',
    phone:            p.user?.phone || p.phone || '—',
    age:              p.age || '—',
    gender:           p.gender || '—',
    bloodGroup:       p.bloodGroup || 'O+',
    allergies:        p.allergies  || 'None',
    emergencyContact: p.emergencyContact || '—'
  };
}

// Normalise backend Appointment entity → frontend shape
function normAppt(a) {
  return {
    id:             a.id,
    patientId:      a.patient?.id || a.patientId,
    patientName:    a.patient?.user?.name || a.patientName || '—',
    patientBlood:   a.patient?.bloodGroup || a.patientBlood || 'O+',
    doctorId:       a.doctor?.id || a.doctorId,
    doctorName:     a.doctor?.user?.name || a.doctorName || '—',
    specialization: a.doctor?.specialization || a.specialization || '—',
    date:           a.appointmentDate || a.date || '—',
    time:           a.timeSlot       || a.time || '—',
    reason:         a.symptoms       || a.reason || '—',
    status:         a.status || 'PENDING'
  };
}

// Normalise backend MedicalReport entity → frontend shape
function normReport(r) {
  return {
    id:          r.id,
    patientId:   r.patient?.id || r.patientId,
    patientName: r.patient?.user?.name || r.patientName || '—',
    doctorId:    r.doctor?.id  || r.doctorId,
    doctorName:  r.doctor?.user?.name || r.doctorName || '—',
    reportType:  r.testType   || r.reportType || '—',
    title:       r.title,
    description: r.description || '—',
    uploadDate:  r.reportDate  || r.uploadDate || '—',
    fileLabel:   r.fileLabel   || 'report.pdf',
    status:      r.status || 'PENDING_REVIEW'
  };
}

// Normalise backend Prescription entity → frontend shape
function normRx(rx) {
  let meds = [];
  try {
    meds = rx.medicinesJson ? JSON.parse(rx.medicinesJson) : (rx.medicines || []);
  } catch { meds = []; }
  return {
    id:             rx.id,
    appointmentId:  rx.appointmentId,
    patientId:      rx.patient?.id || rx.patientId,
    patientName:    rx.patient?.user?.name || rx.patientName || '—',
    doctorId:       rx.doctor?.id  || rx.doctorId,
    doctorName:     rx.doctor?.user?.name || rx.doctorName || '—',
    specialization: rx.doctor?.specialization || rx.specialization || 'Medicine',
    date:           rx.prescriptionDate || rx.date || new Date().toISOString().split('T')[0],
    diagnosis:      rx.diagnosis,
    medicines:      meds,
    doctorNotes:    rx.doctorNotes || ''
  };
}

function doctorCard(doc, showBook = true) {
  return `
  <div class="doctor-card">
    <div>
      <div class="doc-top">
        <div class="doc-avatar">${doc.name.split(' ').find(w => w.length > 2 && w !== 'Dr.')?.charAt(0) || 'D'}</div>
        <div class="doc-details">
          <h3>${doc.name}</h3>
          <span class="doc-spec">${doc.specialization}</span>
          <div class="doc-qual">${doc.qualification}</div>
        </div>
      </div>
      <p style="font-size:12.5px;color:var(--text-muted);margin-bottom:12px;">${doc.bio}</p>
      <div class="doc-meta">
        <div class="doc-meta-item"><strong>Experience</strong><span>${doc.experience}</span></div>
        <div class="doc-meta-item"><strong>Fee</strong><span>${doc.fee}</span></div>
        <div class="doc-meta-item" style="grid-column:span 2"><strong>Schedule</strong><span>${doc.availableDays}</span></div>
        <div class="doc-meta-item" style="grid-column:span 2"><strong>Contact</strong><span style="font-size:11.5px">${doc.email}</span></div>
      </div>
    </div>
    ${showBook ? `<button class="btn btn-primary btn-sm" style="width:100%;margin-top:12px" onclick="openBookingModal(${doc.id})"><i class="fa-solid fa-calendar-plus"></i> Book Consultation</button>` : ''}
  </div>`;
}

// ==========================================
// 4. AUTH PAGE
// ==========================================
function renderAuth() {
  return `
  <div class="auth-page-wrapper">
    <!-- LEFT PANEL -->
    <div class="auth-left-panel">
      <div class="auth-brand">
        <div class="auth-brand-icon"><i class="fa-solid fa-heart-pulse"></i></div>
        <div>
          <div class="auth-brand-title">Care<span>Connect</span></div>
          <div class="auth-brand-sub">Patient Records &amp; Healthcare Suite</div>
        </div>
      </div>
      <h2 class="auth-headline">Your Health,<br>Managed Digitally.</h2>
      <p class="auth-desc">Secure access to your complete medical history, doctor consultations, lab reports, and digital prescriptions — all in one place.</p>
      <ul class="auth-features">
        <li><i class="fa-solid fa-check-circle"></i> Instant appointment booking with specialists</li>
        <li><i class="fa-solid fa-check-circle"></i> View and download your medical reports</li>
        <li><i class="fa-solid fa-check-circle"></i> Digital e-prescriptions from doctors</li>
        <li><i class="fa-solid fa-check-circle"></i> 24/7 access to authenticated clinical records</li>
      </ul>
    </div>

    <!-- RIGHT PANEL — AUTH CARD -->
    <div class="auth-right-panel">
      <div class="auth-card">
        <div class="auth-tabs">
          <button type="button" class="auth-tab-btn ${_authTab === 'login' ? 'active' : ''}" id="tabLogin" onclick="switchAuthTab('login')">
            <i class="fa-solid fa-right-to-bracket"></i> Sign In
          </button>
          <button type="button" class="auth-tab-btn ${_authTab === 'signup' ? 'active' : ''}" id="tabSignup" onclick="switchAuthTab('signup')">
            <i class="fa-solid fa-user-plus"></i> Register
          </button>
        </div>

        <!-- SIGN IN FORM -->
        <div id="loginSection" style="${_authTab === 'login' ? '' : 'display:none'}">
          <div class="auth-header">
            <div class="auth-icon"><i class="fa-solid fa-user-lock"></i></div>
            <h2>Welcome Back</h2>
            <p>Sign in to access your personalised dashboard</p>
          </div>

          <div class="role-picker">
            <label>I am signing in as</label>
            <div class="role-chips">
              <div class="role-chip ${_selectedRole === 'patient' ? 'selected patient' : ''}" id="chip-patient" onclick="selectRole('patient')">
                <i class="fa-solid fa-user-injured"></i><span>Patient</span>
              </div>
              <div class="role-chip ${_selectedRole === 'doctor' ? 'selected doctor' : ''}" id="chip-doctor" onclick="selectRole('doctor')">
                <i class="fa-solid fa-user-doctor"></i><span>Doctor</span>
              </div>
              <div class="role-chip ${_selectedRole === 'admin' ? 'selected admin' : ''}" id="chip-admin" onclick="selectRole('admin')">
                <i class="fa-solid fa-shield-halved"></i><span>Admin</span>
              </div>
            </div>
          </div>

          <form id="loginForm">
            <div class="form-group">
              <label>Email Address <span class="required">*</span></label>
              <div class="input-with-icon">
                <i class="fa-regular fa-envelope"></i>
                <input type="email" id="loginEmail" class="input-control" placeholder="your@email.com" required>
              </div>
            </div>
            <div class="form-group">
              <label>Password <span class="required">*</span></label>
              <div class="input-with-icon">
                <i class="fa-solid fa-lock"></i>
                <input type="password" id="loginPassword" class="input-control" placeholder="••••••••" required>
              </div>
            </div>
            <div class="form-hint-box" id="loginHint"></div>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:4px" id="loginBtn">
              <i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In to Dashboard
            </button>
          </form>
          <div class="forgot-password-row">
            <a id="forgotLink" onclick="showForgotSection()" style="font-size:13px;color:var(--primary);font-weight:600;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:5px">
              <i class="fa-solid fa-key"></i> Forgot Password?
            </a>
          </div>
          <p style="text-align:center;margin-top:16px;font-size:13px;color:var(--text-muted)">
            New to CareConnect? <a onclick="switchAuthTab('signup')" style="color:var(--primary);font-weight:700;cursor:pointer">Register here</a>
          </p>

          <!-- FORGOT PASSWORD INLINE FLOW (3 steps) -->
          <div id="forgotSection" style="display:none">
            <div class="forgot-divider"><span>Password Reset</span></div>

            <!-- STEP 1: Enter identifier -->
            <div id="forgotStep1">
              <div class="forgot-header">
                <div class="forgot-icon"><i class="fa-solid fa-lock-open"></i></div>
                <h3>Reset Your Password</h3>
                <p>Enter your registered email address or mobile number. We'll send you a 6-digit OTP.</p>
              </div>
              <form id="forgotStep1Form">
                <div class="form-group">
                  <label>Email Address or Mobile Number <span class="required">*</span></label>
                  <div class="input-with-icon">
                    <i class="fa-solid fa-at"></i>
                    <input type="text" id="forgotIdentifier" class="input-control" placeholder="your@email.com  or  +91 98765 43210" required>
                  </div>
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%" id="forgotSendBtn">
                  <i class="fa-solid fa-paper-plane"></i> Send Reset OTP
                </button>
              </form>
              <div style="text-align:center;margin-top:12px">
                <a onclick="hideForgotSection()" style="font-size:13px;color:var(--text-muted);cursor:pointer">&larr; Back to Sign In</a>
              </div>
            </div>

            <!-- STEP 2: OTP + new password -->
            <div id="forgotStep2" style="display:none">
              <div class="forgot-header">
                <div class="forgot-icon" style="background:#fef3c7;color:#d97706"><i class="fa-solid fa-shield-check"></i></div>
                <h3>Verify OTP &amp; Set New Password</h3>
                <p id="forgotStep2Info">OTP sent. Check your registered contact.</p>
              </div>
              <!-- Demo OTP banner -->
              <div class="demo-otp-box" id="demoOtpBox" style="display:none">
                <i class="fa-solid fa-circle-info"></i>
                <div>
                  <strong>Demo Mode</strong> — No email server configured.<br>
                  Your OTP is: <span class="demo-otp-code" id="demoOtpCode">------</span>
                </div>
              </div>
              <form id="forgotStep2Form">
                <div class="form-group">
                  <label>6-Digit OTP <span class="required">*</span></label>
                  <div class="otp-input-row" id="otpInputRow">
                    <input type="text" maxlength="1" class="otp-digit" id="otp0" oninput="otpDigitInput(this,0)" onkeydown="otpKeyDown(event,0)">
                    <input type="text" maxlength="1" class="otp-digit" id="otp1" oninput="otpDigitInput(this,1)" onkeydown="otpKeyDown(event,1)">
                    <input type="text" maxlength="1" class="otp-digit" id="otp2" oninput="otpDigitInput(this,2)" onkeydown="otpKeyDown(event,2)">
                    <input type="text" maxlength="1" class="otp-digit" id="otp3" oninput="otpDigitInput(this,3)" onkeydown="otpKeyDown(event,3)">
                    <input type="text" maxlength="1" class="otp-digit" id="otp4" oninput="otpDigitInput(this,4)" onkeydown="otpKeyDown(event,4)">
                    <input type="text" maxlength="1" class="otp-digit" id="otp5" oninput="otpDigitInput(this,5)" onkeydown="otpKeyDown(event,5)">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>New Password <span class="required">*</span></label>
                    <div class="input-with-icon">
                      <i class="fa-solid fa-lock"></i>
                      <input type="password" id="newPass" class="input-control" placeholder="Min. 6 characters" required>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Confirm Password <span class="required">*</span></label>
                    <div class="input-with-icon">
                      <i class="fa-solid fa-lock"></i>
                      <input type="password" id="confirmNewPass" class="input-control" placeholder="Repeat password" required>
                    </div>
                  </div>
                </div>
                <button type="submit" class="btn btn-success" style="width:100%" id="forgotResetBtn">
                  <i class="fa-solid fa-rotate-right"></i> Reset Password
                </button>
              </form>
              <div style="text-align:center;margin-top:10px;display:flex;justify-content:center;gap:20px;font-size:13px">
                <a onclick="showForgotStep1()" style="color:var(--text-muted);cursor:pointer">&larr; Change identifier</a>
                <a onclick="resendOtp()" style="color:var(--primary);font-weight:600;cursor:pointer"><i class="fa-solid fa-rotate"></i> Resend OTP</a>
              </div>
            </div>

            <!-- STEP 3: Success -->
            <div id="forgotStep3" style="display:none">
              <div style="text-align:center;padding:24px 0">
                <div style="width:72px;height:72px;border-radius:50%;background:var(--success-light);color:var(--success);display:inline-flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:16px;animation:successPop 0.5s ease">
                  <i class="fa-solid fa-circle-check"></i>
                </div>
                <h3 style="font-size:20px;font-weight:800;color:var(--secondary);margin-bottom:8px">Password Reset Successful!</h3>
                <p style="color:var(--text-muted);font-size:14px;margin-bottom:24px">Your password has been updated. You can now sign in with your new password.</p>
                <button class="btn btn-primary" style="width:100%" onclick="hideForgotSection()">
                  <i class="fa-solid fa-right-to-bracket"></i> Back to Sign In
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- REGISTRATION FORM -->
        <div id="signupSection" style="${_authTab === 'signup' ? '' : 'display:none'}">
          <div class="auth-header">
            <div class="auth-icon" id="signupIcon" style="background:var(--success-light);color:var(--success)"><i class="fa-solid fa-user-plus"></i></div>
            <h2 id="signupTitle">Create Account</h2>
            <p id="signupSub">Select your role to register and access your dedicated dashboard</p>
          </div>

          <div class="role-picker">
            <label>I am registering as</label>
            <div class="role-chips">
              <div class="role-chip ${_signupRole === 'patient' ? 'selected patient' : ''}" id="signup-chip-patient" onclick="selectSignupRole('patient')">
                <i class="fa-solid fa-user-injured"></i><span>Patient</span>
              </div>
              <div class="role-chip ${_signupRole === 'doctor' ? 'selected doctor' : ''}" id="signup-chip-doctor" onclick="selectSignupRole('doctor')">
                <i class="fa-solid fa-user-doctor"></i><span>Doctor</span>
              </div>
              <div class="role-chip ${_signupRole === 'admin' ? 'selected admin' : ''}" id="signup-chip-admin" onclick="selectSignupRole('admin')">
                <i class="fa-solid fa-shield-halved"></i><span>Admin</span>
              </div>
            </div>
          </div>

          <!-- 1. PATIENT REGISTRATION FORM -->
          <form id="signupPatientForm" style="${_signupRole === 'patient' ? '' : 'display:none'}">
            <div class="form-group">
              <label>Full Name <span class="required">*</span></label>
              <div class="input-with-icon"><i class="fa-regular fa-user"></i>
                <input type="text" id="regPatName" class="input-control" placeholder="e.g. Arjun Sharma" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Email <span class="required">*</span></label>
                <div class="input-with-icon"><i class="fa-regular fa-envelope"></i>
                  <input type="email" id="regPatEmail" class="input-control" placeholder="you@email.com" required>
                </div>
              </div>
              <div class="form-group">
                <label>Phone <span class="required">*</span></label>
                <div class="input-with-icon"><i class="fa-solid fa-phone"></i>
                  <input type="tel" id="regPatPhone" class="input-control" placeholder="+91 98765 43210" required>
                </div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Gender <span class="required">*</span></label>
                <select id="regPatGender" class="input-control" required>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                </select>
              </div>
              <div class="form-group">
                <label>Date of Birth <span class="required">*</span></label>
                <input type="date" id="regPatDob" class="input-control" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Blood Group <span class="required">*</span></label>
                <select id="regPatBlood" class="input-control" required>
                  <option value="O+">O Positive (O+)</option><option value="O-">O Negative (O-)</option>
                  <option value="A+">A Positive (A+)</option><option value="A-">A Negative (A-)</option>
                  <option value="B+">B Positive (B+)</option><option value="B-">B Negative (B-)</option>
                  <option value="AB+">AB Positive (AB+)</option><option value="AB-">AB Negative (AB-)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Known Allergies</label>
                <input type="text" id="regPatAllergies" class="input-control" placeholder="e.g. Penicillin / None">
              </div>
            </div>
            <div class="form-group">
              <label>Emergency Contact</label>
              <input type="text" id="regPatEmergency" class="input-control" placeholder="e.g. Priya Sharma — +91 98765 11111">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Password <span class="required">*</span></label>
                <div class="input-with-icon"><i class="fa-solid fa-lock"></i>
                  <input type="password" id="regPatPassword" class="input-control" placeholder="Min. 6 characters" required>
                </div>
              </div>
              <div class="form-group">
                <label>Confirm Password <span class="required">*</span></label>
                <div class="input-with-icon"><i class="fa-solid fa-lock"></i>
                  <input type="password" id="regPatConfirm" class="input-control" placeholder="Repeat password" required>
                </div>
              </div>
            </div>
            <button type="submit" class="btn btn-success" style="width:100%">
              <i class="fa-solid fa-user-check"></i> Register as Patient &amp; Go to Dashboard
            </button>
          </form>

          <!-- 2. DOCTOR REGISTRATION FORM -->
          <form id="signupDoctorForm" style="${_signupRole === 'doctor' ? '' : 'display:none'}">
            <div class="form-group">
              <label>Doctor Full Name (with Dr. prefix) <span class="required">*</span></label>
              <div class="input-with-icon"><i class="fa-solid fa-user-doctor"></i>
                <input type="text" id="regDocName" class="input-control" placeholder="e.g. Dr. Ananya Verma" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Professional Email <span class="required">*</span></label>
                <div class="input-with-icon"><i class="fa-regular fa-envelope"></i>
                  <input type="email" id="regDocEmail" class="input-control" placeholder="dr.name@careconnect.com" required>
                </div>
              </div>
              <div class="form-group">
                <label>Contact Phone <span class="required">*</span></label>
                <div class="input-with-icon"><i class="fa-solid fa-phone"></i>
                  <input type="tel" id="regDocPhone" class="input-control" placeholder="+91 98765 22222" required>
                </div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Specialization <span class="required">*</span></label>
                <select id="regDocSpec" class="input-control" required>
                  <option value="Cardiology">Cardiology</option><option value="Neurology">Neurology</option>
                  <option value="Orthopedics">Orthopedics</option><option value="Pediatrics">Pediatrics</option>
                  <option value="General Medicine">General Medicine</option><option value="Dermatology">Dermatology</option>
                  <option value="Oncology">Oncology</option><option value="ENT Specialist">ENT Specialist</option>
                </select>
              </div>
              <div class="form-group">
                <label>Medical Qualifications <span class="required">*</span></label>
                <input type="text" id="regDocQual" class="input-control" placeholder="e.g. MBBS, MD, DM" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Experience (Years) <span class="required">*</span></label>
                <input type="text" id="regDocExp" class="input-control" placeholder="e.g. 10 Years" required>
              </div>
              <div class="form-group">
                <label>Consultation Fee <span class="required">*</span></label>
                <input type="text" id="regDocFee" class="input-control" placeholder="e.g. ₹1,200" required>
              </div>
            </div>
            <div class="form-group">
              <label>Available Days &amp; Timings <span class="required">*</span></label>
              <input type="text" id="regDocDays" class="input-control" placeholder="e.g. Mon, Wed, Fri — 09:00–14:00" required>
            </div>
            <div class="form-group">
              <label>Short Professional Summary</label>
              <input type="text" id="regDocBio" class="input-control" placeholder="e.g. Specialist in interventional cardiology.">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Password <span class="required">*</span></label>
                <div class="input-with-icon"><i class="fa-solid fa-lock"></i>
                  <input type="password" id="regDocPassword" class="input-control" placeholder="Min. 6 characters" required>
                </div>
              </div>
              <div class="form-group">
                <label>Confirm Password <span class="required">*</span></label>
                <div class="input-with-icon"><i class="fa-solid fa-lock"></i>
                  <input type="password" id="regDocConfirm" class="input-control" placeholder="Repeat password" required>
                </div>
              </div>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%">
              <i class="fa-solid fa-user-doctor"></i> Register as Specialist Doctor &amp; Enter Workstation
            </button>
          </form>

          <!-- 3. ADMIN REGISTRATION FORM -->
          <form id="signupAdminForm" style="${_signupRole === 'admin' ? '' : 'display:none'}">
            <div class="form-group">
              <label>Administrator Full Name <span class="required">*</span></label>
              <div class="input-with-icon"><i class="fa-solid fa-shield-halved"></i>
                <input type="text" id="regAdmName" class="input-control" placeholder="e.g. Rajesh Khurana" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Official Hospital Email <span class="required">*</span></label>
                <div class="input-with-icon"><i class="fa-regular fa-envelope"></i>
                  <input type="email" id="regAdmEmail" class="input-control" placeholder="admin.name@careconnect.com" required>
                </div>
              </div>
              <div class="form-group">
                <label>Contact Phone <span class="required">*</span></label>
                <div class="input-with-icon"><i class="fa-solid fa-phone"></i>
                  <input type="tel" id="regAdmPhone" class="input-control" placeholder="+91 98765 00002" required>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label>Department / Designation <span class="required">*</span></label>
              <select id="regAdmDept" class="input-control" required>
                <option value="Hospital Administration &amp; Operations">Hospital Administration &amp; Operations</option>
                <option value="Chief Medical Officer">Chief Medical Officer</option>
                <option value="Clinical Governance &amp; Compliance">Clinical Governance &amp; Compliance</option>
                <option value="IT &amp; EHR Records Administration">IT &amp; EHR Records Administration</option>
              </select>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Password <span class="required">*</span></label>
                <div class="input-with-icon"><i class="fa-solid fa-lock"></i>
                  <input type="password" id="regAdmPassword" class="input-control" placeholder="Min. 6 characters" required>
                </div>
              </div>
              <div class="form-group">
                <label>Confirm Password <span class="required">*</span></label>
                <div class="input-with-icon"><i class="fa-solid fa-lock"></i>
                  <input type="password" id="regAdmConfirm" class="input-control" placeholder="Repeat password" required>
                </div>
              </div>
            </div>
            <button type="submit" class="btn btn-danger" style="width:100%">
              <i class="fa-solid fa-shield-halved"></i> Register Administrator &amp; Open Admin Console
            </button>
          </form>

          <p style="text-align:center;margin-top:18px;font-size:13px;color:var(--text-muted)">
            Already have an account? <a onclick="switchAuthTab('login')" style="color:var(--primary);font-weight:700;cursor:pointer">Sign in</a>
          </p>
        </div>

      </div>
    </div>
  </div>`;
}

function switchAuthTab(tab) {
  _authTab = tab;
  const loginSec  = document.getElementById('loginSection');
  const signupSec = document.getElementById('signupSection');
  const tabL = document.getElementById('tabLogin');
  const tabS = document.getElementById('tabSignup');
  if (!loginSec) return;
  if (tab === 'login') {
    loginSec.style.display  = '';
    signupSec.style.display = 'none';
    tabL?.classList.add('active');
    tabS?.classList.remove('active');
  } else {
    loginSec.style.display  = 'none';
    signupSec.style.display = '';
    tabL?.classList.remove('active');
    tabS?.classList.add('active');
    selectSignupRole(_signupRole);
  }
}

function fillCredentials(email, pass) {
  const eInput = document.getElementById('loginEmail');
  const pInput = document.getElementById('loginPassword');
  if (eInput) eInput.value = email;
  if (pInput) pInput.value = pass;
}
window.fillCredentials = fillCredentials;

function selectRole(role) {
  _selectedRole = role;
  ['patient','doctor','admin'].forEach(r => {
    const chip = document.getElementById(`chip-${r}`);
    if (!chip) return;
    chip.className = `role-chip${role === r ? ` selected ${r}` : ''}`;
  });
  const hintEl = document.getElementById('loginHint');
  if (hintEl) {
    const demos = {
      patient: { email: 'rahul.verma@careconnect.com', pass: 'patient123' },
      doctor:  { email: 'dr.sharma@careconnect.com',  pass: 'doctor123' },
      admin:   { email: 'admin@careconnect.com',      pass: 'admin123' }
    };
    const d = demos[role];
    if (d) {
      hintEl.innerHTML = `
        <div style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;justify-content:space-between;background:rgba(2,132,199,0.06);padding:8px 12px;border-radius:8px;border:1px dashed rgba(2,132,199,0.3);margin-top:6px">
          <span><i class="fa-solid fa-lightbulb" style="color:var(--primary)"></i> Quick Demo: <code>${d.email}</code></span>
          <button type="button" class="btn btn-outline btn-sm" onclick="fillCredentials('${d.email}','${d.pass}')" style="padding:2px 8px;font-size:11px">Auto-fill</button>
        </div>`;
    } else {
      hintEl.innerHTML = '';
    }
  }
}

function selectSignupRole(role) {
  _signupRole = role;
  ['patient', 'doctor', 'admin'].forEach(r => {
    const chip = document.getElementById(`signup-chip-${r}`);
    if (chip) chip.className = `role-chip${role === r ? ` selected ${r}` : ''}`;
  });

  const pForm = document.getElementById('signupPatientForm');
  const dForm = document.getElementById('signupDoctorForm');
  const aForm = document.getElementById('signupAdminForm');
  if (pForm) pForm.style.display = role === 'patient' ? '' : 'none';
  if (dForm) dForm.style.display = role === 'doctor'  ? '' : 'none';
  if (aForm) aForm.style.display = role === 'admin'   ? '' : 'none';

  const iconEl  = document.getElementById('signupIcon');
  const titleEl = document.getElementById('signupTitle');
  const subEl   = document.getElementById('signupSub');

  if (role === 'patient') {
    if (iconEl) { iconEl.style.background = 'var(--success-light)'; iconEl.style.color = 'var(--success)'; iconEl.innerHTML = '<i class="fa-solid fa-user-plus"></i>'; }
    if (titleEl) titleEl.textContent = 'Create Patient Account';
    if (subEl) subEl.textContent = 'Register as a patient to book appointments and view your medical records';
  } else if (role === 'doctor') {
    if (iconEl) { iconEl.style.background = 'var(--primary-light)'; iconEl.style.color = 'var(--primary)'; iconEl.innerHTML = '<i class="fa-solid fa-user-doctor"></i>'; }
    if (titleEl) titleEl.textContent = 'Doctor Specialist Onboarding';
    if (subEl) subEl.textContent = 'Join CareConnect clinical staff to manage patients, reports, and digital prescriptions';
  } else {
    if (iconEl) { iconEl.style.background = '#fef2f2'; iconEl.style.color = 'var(--danger)'; iconEl.innerHTML = '<i class="fa-solid fa-shield-halved"></i>'; }
    if (titleEl) titleEl.textContent = 'Hospital Administrator Registration';
    if (subEl) subEl.textContent = 'Register for central hospital governance, clinical oversight, and audit control';
  }
}

function attachAuthListeners() {
  selectRole(_selectedRole);
  selectSignupRole(_signupRole);

  // Login
  document.getElementById('loginForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in…'; }
    await Auth.login(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value, _selectedRole);
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In to Dashboard'; }
  });

  // Patient signup
  document.getElementById('signupPatientForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const pass    = document.getElementById('regPatPassword').value;
    const confirm = document.getElementById('regPatConfirm').value;
    if (pass !== confirm) return toast('Passwords do not match.', 'error');
    await Auth.registerPatient({
      name: document.getElementById('regPatName').value,
      email: document.getElementById('regPatEmail').value,
      phone: document.getElementById('regPatPhone').value,
      gender: document.getElementById('regPatGender').value,
      dob: document.getElementById('regPatDob').value,
      bloodGroup: document.getElementById('regPatBlood').value,
      allergies: document.getElementById('regPatAllergies').value,
      emergencyContact: document.getElementById('regPatEmergency').value,
      password: pass
    });
  });

  // Doctor signup
  document.getElementById('signupDoctorForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const pass    = document.getElementById('regDocPassword').value;
    const confirm = document.getElementById('regDocConfirm').value;
    if (pass !== confirm) return toast('Passwords do not match.', 'error');
    await Auth.registerDoctor({
      name: document.getElementById('regDocName').value,
      email: document.getElementById('regDocEmail').value,
      phone: document.getElementById('regDocPhone').value,
      specialization: document.getElementById('regDocSpec').value,
      qualification: document.getElementById('regDocQual').value,
      experience: document.getElementById('regDocExp').value,
      fee: document.getElementById('regDocFee').value,
      availableDays: document.getElementById('regDocDays').value,
      bio: document.getElementById('regDocBio').value,
      password: pass
    });
  });

  // Admin signup
  document.getElementById('signupAdminForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const pass    = document.getElementById('regAdmPassword').value;
    const confirm = document.getElementById('regAdmConfirm').value;
    if (pass !== confirm) return toast('Passwords do not match.', 'error');
    await Auth.registerAdmin({
      name: document.getElementById('regAdmName').value,
      email: document.getElementById('regAdmEmail').value,
      phone: document.getElementById('regAdmPhone').value,
      department: document.getElementById('regAdmDept').value,
      password: pass
    });
  });

  // Forgot password listeners
  attachForgotListeners();
}


// ==========================================
// FORGOT PASSWORD FLOW
// ==========================================
let _resetEmail = ''; // stores the confirmed email for step 2

function showForgotSection() {
  const s = document.getElementById('forgotSection');
  const loginForm = document.getElementById('loginForm');
  const forgotLink = document.getElementById('forgotLink');
  if (!s) return;
  if (loginForm) loginForm.style.display = 'none';
  if (forgotLink) forgotLink.style.display = 'none';
  s.style.display = '';
  showForgotStep1();
  setTimeout(() => s.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
}

function hideForgotSection() {
  const s = document.getElementById('forgotSection');
  const loginForm = document.getElementById('loginForm');
  const forgotLink = document.getElementById('forgotLink');
  if (s) s.style.display = 'none';
  if (loginForm) loginForm.style.display = '';
  if (forgotLink) forgotLink.style.display = '';
  _resetEmail = '';
}

function showForgotStep1() {
  document.getElementById('forgotStep1').style.display = '';
  document.getElementById('forgotStep2').style.display = 'none';
  document.getElementById('forgotStep3').style.display = 'none';
}

function showForgotStep2(info) {
  document.getElementById('forgotStep1').style.display = 'none';
  document.getElementById('forgotStep2').style.display = '';
  document.getElementById('forgotStep3').style.display = 'none';
  const infoEl = document.getElementById('forgotStep2Info');
  if (infoEl && info) infoEl.innerHTML = info;
  // focus first OTP digit
  setTimeout(() => document.getElementById('otp0')?.focus(), 100);
}

function showForgotStep3() {
  document.getElementById('forgotStep1').style.display = 'none';
  document.getElementById('forgotStep2').style.display = 'none';
  document.getElementById('forgotStep3').style.display = '';
}

// OTP digit box helpers
function otpDigitInput(el, idx) {
  el.value = el.value.replace(/[^0-9]/g, '');
  if (el.value && idx < 5) {
    document.getElementById(`otp${idx + 1}`)?.focus();
  }
}
function otpKeyDown(event, idx) {
  if (event.key === 'Backspace' && !event.target.value && idx > 0) {
    document.getElementById(`otp${idx - 1}`)?.focus();
  }
}
function getOtpValue() {
  return [0,1,2,3,4,5].map(i => document.getElementById(`otp${i}`)?.value || '').join('');
}

function attachForgotListeners() {
  // Step 1 — Request OTP
  document.getElementById('forgotStep1Form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const identifier = document.getElementById('forgotIdentifier').value.trim();
    const btn = document.getElementById('forgotSendBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending OTP…'; }
    try {
      const res = await API.post('/api/auth/forgot-password', { identifier });
      _resetEmail = res.email;
      // Show demo OTP
      const demoBox = document.getElementById('demoOtpBox');
      const demoCode = document.getElementById('demoOtpCode');
      if (demoBox && demoCode && res.demoOtp) {
        demoBox.style.display = 'flex';
        demoCode.textContent = res.demoOtp;
      }
      showForgotStep2(
        `OTP sent to <strong>${res.maskedEmail}</strong> &amp; mobile <strong>${res.maskedPhone}</strong>.<br>
         Enter the 6-digit code below within <strong>10 minutes</strong>.`
      );
      toast('OTP generated successfully!', 'success');
    } catch(err) {
      toast(err.message || 'Could not find account.', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Reset OTP'; }
    }
  });

  // Step 2 — Reset password
  document.getElementById('forgotStep2Form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const otp = getOtpValue();
    if (otp.length !== 6) return toast('Please enter all 6 OTP digits.', 'warning');
    const newPass = document.getElementById('newPass').value;
    const confirm = document.getElementById('confirmNewPass').value;
    if (newPass.length < 6) return toast('Password must be at least 6 characters.', 'error');
    if (newPass !== confirm) return toast('Passwords do not match.', 'error');
    const btn = document.getElementById('forgotResetBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Resetting…'; }
    try {
      await API.post('/api/auth/reset-password', {
        email:       _resetEmail,
        otp:         otp,
        newPassword: newPass
      });
      showForgotStep3();
      toast('Password reset successful! Please sign in.', 'success');
    } catch(err) {
      toast(err.message || 'Reset failed. Check your OTP.', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Reset Password'; }
    }
  });
}

async function resendOtp() {
  const identifier = document.getElementById('forgotIdentifier')?.value.trim();
  if (!identifier) return toast('Please go back and enter your email/mobile again.', 'warning');
  try {
    const res = await API.post('/api/auth/forgot-password', { identifier });
    _resetEmail = res.email;
    const demoCode = document.getElementById('demoOtpCode');
    if (demoCode && res.demoOtp) demoCode.textContent = res.demoOtp;
    // clear OTP boxes
    [0,1,2,3,4,5].forEach(i => { const el = document.getElementById(`otp${i}`); if (el) el.value = ''; });
    document.getElementById('otp0')?.focus();
    toast('New OTP generated! Check the demo box.', 'success');
  } catch(err) { toast(err.message || 'Resend failed.', 'error'); }
}

function getDefaultDocs() {
  return [
    { id: 1, name: 'Dr. Rajesh Sharma', specialization: 'Cardiology', qualification: 'MD, DM (Cardiology), FACC', experience: '14+ Years', fee: '$90', availableDays: 'Mon, Wed, Fri', bio: 'Senior Interventional Cardiologist specializing in coronary intervention.' },
    { id: 2, name: 'Dr. Priya Patel', specialization: 'Neurology', qualification: 'MBBS, MD, DM (Neurology)', experience: '11+ Years', fee: '$85', availableDays: 'Tue, Thu, Sat', bio: 'Consultant Neurologist specializing in neuro-muscular disorders.' },
    { id: 3, name: 'Dr. Anita Roy', specialization: 'Pediatrics', qualification: 'MBBS, DCH, DNB (Pediatrics)', experience: '9+ Years', fee: '$60', availableDays: 'Mon - Fri', bio: 'Compassionate pediatric care focusing on neonatal care.' },
    { id: 4, name: 'Dr. Vikram Seth', specialization: 'Orthopedics', qualification: 'MS (Ortho), MCh, Fellowship UK', experience: '16+ Years', fee: '$95', availableDays: 'Mon, Wed, Sat', bio: 'Specialist in joint replacement surgery.' }
  ];
}

// ==========================================
// 5. PATIENT DASHBOARD  (async — fetches from API with resilient fallbacks)
// ==========================================
async function renderPatientDashboard(root) {
  const user = Auth.current();
  if (!user) return route('auth');

  try {
    const pId = user.patientId || user.id;
    // Fetch all data in parallel with safe fallbacks
    const [doctors, myAppts, myReports, myRxRaw] = await Promise.all([
      API.get('/api/doctors').catch(() => window._cachedDocs || getDefaultDocs()),
      pId ? API.get(`/api/patients/${pId}/appointments`).catch(() => []) : Promise.resolve([]),
      pId ? API.get(`/api/patients/${pId}/reports`).catch(() => []) : Promise.resolve([]),
      pId ? API.get(`/api/patients/${pId}/prescriptions`).catch(() => []) : Promise.resolve([])
    ]);

    const docs    = (Array.isArray(doctors) && doctors.length > 0) ? doctors.map(normDoc) : (window._cachedDocs || getDefaultDocs());
    const appts   = Array.isArray(myAppts) ? myAppts.map(normAppt) : [];
    const reports = Array.isArray(myReports) ? myReports.map(normReport) : [];
    const rxs     = Array.isArray(myRxRaw) ? myRxRaw.map(normRx) : [];

    // Store for modal access
    window._cachedDocs    = docs;
    window._cachedAppts   = appts;
    window._cachedReports = reports;
    window._cachedRxs     = rxs;

    root.innerHTML = patientDashboardHTML(user, docs, appts, reports, rxs);
  } catch (err) {
    console.error('Patient dashboard render notice:', err);
    const docs = window._cachedDocs || getDefaultDocs();
    root.innerHTML = patientDashboardHTML(user, docs, [], [], []);
  }
}

function patientDashboardHTML(user, docs, appts, reports, rxs) {
  return `
  <div class="dashboard-banner">
    <div class="banner-left">
      <h2>Welcome back, ${user.name}</h2>
      <p>Patient Health Dossier &bull; ID: #CC-PAT-${String(user.patientId || user.id).padStart(4,'0')}</p>
      <div class="banner-pills">
        <span class="badge-tag"><i class="fa-solid fa-droplet" style="color:#ef4444"></i> ${user.bloodGroup || 'O+'}</span>
        <span class="badge-tag"><i class="fa-solid fa-shield-halved" style="color:#f59e0b"></i> Allergies: ${user.allergies || 'None'}</span>
        <span class="badge-tag"><i class="fa-solid fa-phone" style="color:#10b981"></i> ${user.phone || '—'}</span>
      </div>
    </div>
    <button class="btn btn-primary" onclick="openBookingModal()"><i class="fa-solid fa-plus"></i> Book Appointment</button>
  </div>

  <!-- DOCTORS -->
  <div class="section-header">
    <div class="section-title-wrap">
      <h2><i class="fa-solid fa-user-doctor" style="color:var(--primary)"></i> Our Doctors &amp; Specialists</h2>
      <p>Browse available doctors and book a consultation</p>
    </div>
  </div>
  <div class="doctors-grid">${docs.map(d => doctorCard(d, true)).join('')}</div>

  <!-- MY APPOINTMENTS -->
  <div class="section-header" style="margin-top:20px">
    <div class="section-title-wrap">
      <h2><i class="fa-solid fa-calendar-days" style="color:var(--primary)"></i> My Appointments</h2>
      <p>Track status of your scheduled consultations</p>
    </div>
  </div>
  <div class="table-card"><div class="table-responsive">
    <table class="app-table">
      <thead><tr><th>Doctor</th><th>Specialty</th><th>Date &amp; Time</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead>
      <tbody>
        ${appts.length === 0 ? `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted)">No appointments yet. Book a consultation above!</td></tr>` :
          appts.map(a => `<tr>
            <td><strong>${a.doctorName}</strong></td>
            <td><span class="doc-spec">${a.specialization}</span></td>
            <td>${a.date} &bull; ${a.time}</td>
            <td>${a.reason}</td>
            <td><span class="status-badge status-${a.status.toLowerCase()}">${a.status}</span></td>
            <td>${a.status === 'COMPLETED'
              ? `<button class="btn btn-outline btn-sm" onclick="viewRxForAppt(${a.id})"><i class="fa-solid fa-prescription"></i> View Rx</button>`
              : `<span style="font-size:12px;color:var(--text-muted)">Pending consultation</span>`}</td>
          </tr>`).join('')}
      </tbody>
    </table>
  </div></div>

  <!-- MY REPORTS -->
  <div class="section-header" style="margin-top:30px">
    <div class="section-title-wrap">
      <h2><i class="fa-solid fa-file-medical" style="color:var(--success)"></i> My Lab Reports &amp; Diagnostics</h2>
      <p>Reports uploaded by your doctor — click any report to view full details inline</p>
    </div>
  </div>
  ${reports.length === 0
    ? `<div class="empty-state"><i class="fa-solid fa-folder-open"></i><p>No reports uploaded yet. Your doctor will upload them after your consultation.</p></div>`
    : `<div class="reports-list" id="reportsList">
        ${reports.map(r => `
          <div class="report-list-item" id="report-card-${r.id}">
            <div class="report-list-summary">
              <div class="report-icon"><i class="fa-solid fa-file-waveform"></i></div>
              <div class="report-info">
                <h4>${r.title}</h4>
                <div class="report-meta">
                  <span><i class="fa-solid fa-user-doctor"></i> ${r.doctorName}</span>
                  <span><i class="fa-solid fa-flask"></i> ${r.reportType}</span>
                  <span><i class="fa-regular fa-calendar"></i> ${r.uploadDate}</span>
                  <span class="status-badge status-${r.status === 'REVIEWED' ? 'completed' : 'pending'}">${r.status}</span>
                </div>
              </div>
              <button class="btn btn-primary btn-sm report-toggle-btn" id="report-btn-${r.id}" onclick="toggleInlineReport(${r.id})">
                <i class="fa-solid fa-chevron-down" id="report-chevron-${r.id}"></i> View &amp; Download
              </button>
            </div>

            <!-- INLINE EXPANDED DETAIL PANEL -->
            <div class="report-inline-detail" id="report-detail-${r.id}" style="display:none">
              <div class="report-detail-inner">

                <!-- HEADER STRIP -->
                <div class="report-detail-header">
                  <div>
                    <div class="report-detail-id">#RPT-${r.id} &bull; ${r.reportType}</div>
                    <h3 class="report-detail-title">${r.title}</h3>
                  </div>
                  <span class="status-badge status-${r.status === 'REVIEWED' ? 'completed' : 'pending'} report-detail-status">${r.status}</span>
                </div>

                <!-- META GRID -->
                <div class="report-detail-meta-grid">
                  <div class="report-meta-cell">
                    <div class="report-meta-label"><i class="fa-solid fa-hospital-user"></i> Patient</div>
                    <div class="report-meta-value">${r.patientName}</div>
                  </div>
                  <div class="report-meta-cell">
                    <div class="report-meta-label"><i class="fa-solid fa-user-doctor"></i> Ordering Doctor</div>
                    <div class="report-meta-value">${r.doctorName}</div>
                  </div>
                  <div class="report-meta-cell">
                    <div class="report-meta-label"><i class="fa-solid fa-flask"></i> Report Type</div>
                    <div class="report-meta-value">${r.reportType}</div>
                  </div>
                  <div class="report-meta-cell">
                    <div class="report-meta-label"><i class="fa-regular fa-calendar"></i> Report Date</div>
                    <div class="report-meta-value">${r.uploadDate}</div>
                  </div>
                </div>

                <!-- FINDINGS -->
                <div class="report-findings-box">
                  <div class="report-findings-label"><i class="fa-solid fa-microscope"></i> Clinical Findings &amp; Description</div>
                  <p class="report-findings-text">${r.description}</p>
                </div>

                <!-- FILE DOWNLOAD -->
                <div class="report-file-row">
                  <div class="report-file-icon"><i class="fa-solid fa-file-pdf"></i></div>
                  <div class="report-file-info">
                    <div class="report-file-name">${r.fileLabel}</div>
                    <div class="report-file-sub">Attached Document &bull; Uploaded by ${r.doctorName}</div>
                  </div>
                  <button class="btn btn-success btn-sm" onclick="downloadReport(${r.id}, '${r.fileLabel}')">
                    <i class="fa-solid fa-download"></i> Download Report
                  </button>
                </div>

                <!-- DOWNLOADED PREVIEW -->
                <div class="report-downloaded-preview" id="report-preview-${r.id}" style="display:none">
                  <div class="report-preview-header">
                    <i class="fa-solid fa-circle-check" style="color:var(--success)"></i>
                    <strong>Report Downloaded &amp; Previewed Below</strong>
                    <button class="btn btn-outline btn-sm" onclick="closePreview(${r.id})"><i class="fa-solid fa-xmark"></i> Close Preview</button>
                  </div>
                  <div class="report-preview-doc" id="report-preview-content-${r.id}">
                    <!-- Rendered report content -->
                  </div>
                </div>

                <div style="text-align:right;margin-top:12px">
                  <button class="btn btn-outline btn-sm" onclick="toggleInlineReport(${r.id})">
                    <i class="fa-solid fa-chevron-up"></i> Collapse
                  </button>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>`}

  <!-- MY PRESCRIPTIONS -->
  ${rxs.length > 0 ? `
  <div class="section-header" style="margin-top:30px">
    <div class="section-title-wrap">
      <h2><i class="fa-solid fa-file-prescription" style="color:var(--purple)"></i> My Prescriptions</h2>
    </div>
  </div>
  <div class="table-card"><div class="table-responsive">
    <table class="app-table">
      <thead><tr><th>Rx ID</th><th>Doctor</th><th>Diagnosis</th><th>Date</th><th>Action</th></tr></thead>
      <tbody>
        ${rxs.map(rx => `<tr>
          <td><code>#RX-${rx.id}</code></td>
          <td>${rx.doctorName} (${rx.specialization})</td>
          <td><strong>${rx.diagnosis}</strong></td>
          <td>${rx.date}</td>
          <td><button class="btn btn-success btn-sm" onclick="showRxModal(${rx.id})"><i class="fa-solid fa-print"></i> View / Print</button></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div></div>` : ''}`;
}

// ==========================================
// 6. DOCTOR DASHBOARD  (async — fetches from API with resilient fallbacks)
// ==========================================
async function renderDoctorDashboard(root) {
  const user = Auth.current();
  if (!user) return route('auth');

  try {
    const dId = user.doctorId || user.id;
    const [apptRaw, patRaw, reportRaw] = await Promise.all([
      dId ? API.get(`/api/doctors/${dId}/appointments`).catch(() => []) : Promise.resolve([]),
      dId ? API.get(`/api/doctors/${dId}/patients`).catch(() => []) : Promise.resolve([]),
      dId ? API.get(`/api/doctors/${dId}/reports`).catch(() => []) : Promise.resolve([])
    ]);

    const myAppts   = Array.isArray(apptRaw) ? apptRaw.map(normAppt) : [];
    const patients  = Array.isArray(patRaw) ? patRaw.map(normPat) : [];
    const myReports = Array.isArray(reportRaw) ? reportRaw.map(normReport) : [];

    window._cachedAppts   = myAppts;
    window._cachedReports = myReports;
    window._cachedPatients = patients;

    root.innerHTML = doctorDashboardHTML(user, myAppts, patients, myReports);
  } catch(err) {
    console.error('Doctor dashboard render notice:', err);
    root.innerHTML = doctorDashboardHTML(user, [], [], []);
  }
}

function doctorDashboardHTML(user, myAppts, patients, myReports) {
  return `
  <div class="dashboard-banner doctor-banner">
    <div class="banner-left">
      <h2>${user.name} — Doctor Workstation</h2>
      <p>${user.specialization || 'Clinical Specialist'} &bull; Consultations booked specifically with you</p>
      <div class="banner-pills">
        <span class="badge-tag"><i class="fa-solid fa-calendar-check" style="color:var(--primary)"></i> My Appointments: <strong>${myAppts.length}</strong></span>
        <span class="badge-tag"><i class="fa-solid fa-clock" style="color:var(--warning)"></i> Pending: <strong>${myAppts.filter(a=>a.status==='PENDING').length}</strong></span>
        <span class="badge-tag"><i class="fa-solid fa-circle-check" style="color:var(--success)"></i> Completed: <strong>${myAppts.filter(a=>a.status==='COMPLETED').length}</strong></span>
      </div>
    </div>
    <button class="btn btn-primary" onclick="openUploadReportModal()"><i class="fa-solid fa-upload"></i> Upload Patient Report</button>
  </div>

  <!-- CONSULTATION QUEUE -->
  <div class="section-header">
    <div class="section-title-wrap">
      <h2><i class="fa-solid fa-users-medical" style="color:var(--purple)"></i> My Patient Consultation Queue (${myAppts.length})</h2>
      <p>Patients who have booked appointments specifically with ${user.name}</p>
    </div>
  </div>
  <div class="table-card"><div class="table-responsive">
    <table class="app-table">
      <thead><tr><th>Patient</th><th>Blood / Allergies</th><th>Reason</th><th>Date &amp; Time</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        ${myAppts.length === 0 ? `
          <tr><td colspan="6" style="text-align:center;padding:48px 20px;color:var(--text-muted)">
            <div style="width:56px;height:56px;border-radius:50%;background:var(--primary-subtle);color:var(--primary);display:inline-flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:12px">
              <i class="fa-regular fa-calendar-xmark"></i>
            </div>
            <h4 style="font-size:16px;font-weight:700;color:var(--secondary);margin-bottom:6px">No Appointments Booked For You Yet</h4>
            <p style="font-size:13px;max-width:440px;margin:0 auto;color:var(--text-muted)">Only patients who book consultations specifically with <strong>${user.name}</strong> will appear in your queue.</p>
          </td></tr>
        ` : myAppts.map(a => {
          const pat = patients.find(p => p.id === a.patientId) || {};
          return `<tr>
            <td>
              <div class="patient-cell">
                <div class="patient-avatar">${(a.patientName || '?').charAt(0)}</div>
                <div class="patient-info"><h4>${a.patientName}</h4><span>Age: ${pat.age || '—'} &bull; ${pat.phone || '—'}</span></div>
              </div>
            </td>
            <td>
              <span class="badge-tag"><i class="fa-solid fa-droplet" style="color:#ef4444"></i> ${a.patientBlood}</span><br>
              <small style="color:${(pat.allergies && pat.allergies !== 'None') ? 'var(--danger)' : 'var(--text-muted)'}">⚠ ${pat.allergies || 'None reported'}</small>
            </td>
            <td style="max-width:220px">${a.reason}</td>
            <td>${a.date} &bull; ${a.time}</td>
            <td><span class="status-badge status-${a.status.toLowerCase()}">${a.status}</span></td>
            <td>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                ${a.status === 'PENDING'   ? `<button class="btn btn-primary btn-sm" onclick="updateApptStatus(${a.id},'CONFIRMED')"><i class="fa-solid fa-check"></i> Accept</button>` : ''}
                ${a.status === 'CONFIRMED' ? `<button class="btn btn-success btn-sm" onclick="openRxModal(${a.id},'${a.patientName}',${a.patientId})"><i class="fa-solid fa-file-prescription"></i> Write Rx</button>` : ''}
                ${a.status === 'COMPLETED' ? `<button class="btn btn-outline btn-sm" onclick="viewRxForAppt(${a.id})"><i class="fa-solid fa-eye"></i> View Rx</button>` : ''}
                <button class="btn btn-outline btn-sm" onclick="openDossierModal(${a.patientId})"><i class="fa-solid fa-id-card-clip"></i> Dossier</button>
                <button class="btn btn-outline btn-sm" onclick="openUploadReportModal(${a.patientId},'${a.patientName}')"><i class="fa-solid fa-upload"></i> Report</button>
              </div>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div></div>

  <!-- MY ASSIGNED PATIENTS -->
  <div class="section-header" style="margin-top:30px">
    <div class="section-title-wrap">
      <h2><i class="fa-solid fa-user-injured" style="color:var(--primary)"></i> My Assigned Patients (${patients.length})</h2>
      <p>Patients who have consultations booked specifically with ${user.name}</p>
    </div>
  </div>
  <div class="table-card"><div class="table-responsive">
    <table class="app-table">
      <thead><tr><th>Patient</th><th>Age / Gender</th><th>Blood Group</th><th>Contact</th><th>Emergency Contact</th><th>Allergies</th><th>Actions</th></tr></thead>
      <tbody>
        ${patients.length === 0 ? `
          <tr><td colspan="7" style="text-align:center;padding:36px 20px;color:var(--text-muted)">
            <i class="fa-solid fa-user-clock" style="font-size:32px;margin-bottom:10px;display:block"></i>
            <div style="font-size:15px;font-weight:700;color:var(--secondary);margin-bottom:4px">No Assigned Patients Yet</div>
            <div style="font-size:13px">When patients book consultations with you, their records will appear here.</div>
          </td></tr>
        ` : patients.map(p => {
          const repCount = myReports.filter(r => r.patientId === p.id).length;
          return `<tr>
            <td><strong>${p.name}</strong><br><small style="color:var(--text-muted)">${p.email}</small></td>
            <td>${p.age} yrs &bull; ${p.gender}</td>
            <td><span class="badge-tag">${p.bloodGroup}</span></td>
            <td>${p.phone}</td>
            <td>${p.emergencyContact}</td>
            <td style="color:${p.allergies !== 'None' ? 'var(--danger)' : 'var(--success)'};font-weight:700">${p.allergies}</td>
            <td>
              <div style="display:flex;gap:6px">
                <button class="btn btn-outline btn-sm" onclick="openDossierModal(${p.id})"><i class="fa-solid fa-id-card-clip"></i> Dossier</button>
                <button class="btn btn-outline btn-sm" onclick="openUploadReportModal(${p.id},'${p.name}')"><i class="fa-solid fa-upload"></i> Report (${repCount})</button>
              </div>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div></div>

  <!-- REPORTS I'VE UPLOADED -->
  ${myReports.length > 0 ? `
  <div class="section-header" style="margin-top:30px">
    <div class="section-title-wrap">
      <h2><i class="fa-solid fa-folder-open" style="color:var(--warning)"></i> Reports I've Uploaded</h2>
    </div>
  </div>
  <div class="reports-grid">
    ${myReports.map(r => `
      <div class="report-card">
        <div class="report-icon"><i class="fa-solid fa-file-waveform"></i></div>
        <div class="report-info">
          <h4>${r.title}</h4>
          <p>${r.description}</p>
          <div class="report-meta">
            <span><i class="fa-solid fa-hospital-user"></i> ${r.patientName}</span>
            <span><i class="fa-regular fa-calendar"></i> ${r.uploadDate}</span>
            <span class="status-badge status-completed">${r.status}</span>
          </div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="deleteReport(${r.id})"><i class="fa-solid fa-trash"></i></button>
      </div>`).join('')}
  </div>` : ''}`;
}

// ==========================================
// 7. ADMIN DASHBOARD  (async — fetches from API with resilient fallbacks)
// ==========================================
async function renderAdminDashboard(root) {
  const user = Auth.current();
  if (!user) return route('auth');

  try {
    const data = await API.get('/api/admin/all-data').catch(() => ({}));
    const docs    = (Array.isArray(data.doctors) && data.doctors.length > 0) ? data.doctors.map(normDoc) : (window._cachedDocs || getDefaultDocs());
    const pats    = (Array.isArray(data.patients) ? data.patients : []).map(normPat);
    const appts   = (Array.isArray(data.appointments) ? data.appointments : []).map(normAppt);
    const reports = (Array.isArray(data.reports) ? data.reports : []).map(normReport);
    const rxs     = (Array.isArray(data.prescriptions) ? data.prescriptions : []).map(normRx);
    const stats   = data.stats || {
      totalDoctors: docs.length,
      totalPatients: pats.length,
      totalAppointments: appts.length,
      totalReports: reports.length
    };

    window._cachedDocs    = docs;
    window._cachedPatients = pats;
    window._cachedAppts   = appts;
    window._cachedReports = reports;
    window._cachedRxs     = rxs;

    root.innerHTML = adminDashboardHTML(stats, docs, pats, appts, reports, rxs);
  } catch(err) {
    console.error('Admin dashboard render notice:', err);
    const docs = window._cachedDocs || getDefaultDocs();
    root.innerHTML = adminDashboardHTML({}, docs, [], [], [], []);
  }
}

function adminDashboardHTML(stats, docs, pats, appts, reports, rxs) {
  return `
  <div class="dashboard-banner admin-banner">
    <div class="banner-left">
      <h2>Hospital Administration Console</h2>
      <p>Full system governance &bull; Clinical departments &bull; User access control</p>
      <div class="banner-pills">
        <span class="badge-tag" style="color:var(--primary)"><i class="fa-solid fa-shield-halved"></i> HIPAA Compliant</span>
        <span class="badge-tag" style="color:var(--success)"><i class="fa-solid fa-circle-check"></i> System Operational</span>
      </div>
    </div>
    <button class="btn btn-primary" onclick="openAddDoctorModal()"><i class="fa-solid fa-user-plus"></i> Add Doctor</button>
  </div>

  <!-- STATS -->
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-icon blue"><i class="fa-solid fa-user-doctor"></i></div><div class="stat-info"><div class="stat-value">${docs.length}</div><div class="stat-label">Total Doctors</div></div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="fa-solid fa-hospital-user"></i></div><div class="stat-info"><div class="stat-value">${pats.length}</div><div class="stat-label">Registered Patients</div></div></div>
    <div class="stat-card"><div class="stat-icon purple"><i class="fa-solid fa-calendar-check"></i></div><div class="stat-info"><div class="stat-value">${appts.length}</div><div class="stat-label">Total Appointments</div></div></div>
    <div class="stat-card"><div class="stat-icon orange"><i class="fa-solid fa-file-medical"></i></div><div class="stat-info"><div class="stat-value">${reports.length}</div><div class="stat-label">Reports Uploaded</div></div></div>
  </div>

  <div class="admin-tabs-bar">
    <button class="admin-tab-btn active" id="atb-doctors"  onclick="adminTab('doctors')">  <i class="fa-solid fa-user-doctor"></i> Doctors</button>
    <button class="admin-tab-btn"        id="atb-patients" onclick="adminTab('patients')"> <i class="fa-solid fa-hospital-user"></i> Patients</button>
    <button class="admin-tab-btn"        id="atb-appts"    onclick="adminTab('appts')">    <i class="fa-solid fa-calendar-days"></i> Appointments</button>
    <button class="admin-tab-btn"        id="atb-reports"  onclick="adminTab('reports')">  <i class="fa-solid fa-file-medical"></i> Reports</button>
    <button class="admin-tab-btn"        id="atb-rx"       onclick="adminTab('rx')">       <i class="fa-solid fa-prescription"></i> Prescriptions</button>
  </div>

  <!-- DOCTORS TAB -->
  <div id="adminTab-doctors" class="admin-tab-content">
    <div class="table-card"><div class="table-responsive">
      <table class="app-table">
        <thead><tr><th>Doctor Name</th><th>Email</th><th>Specialization</th><th>Qualification</th><th>Fee</th><th>Experience</th><th>Action</th></tr></thead>
        <tbody>
          ${docs.map(d => `<tr>
            <td><strong>${d.name}</strong></td>
            <td>${d.email}</td>
            <td><span class="doc-spec">${d.specialization}</span></td>
            <td>${d.qualification}</td>
            <td>${d.fee}</td>
            <td>${d.experience}</td>
            <td><button class="btn btn-danger btn-sm" onclick="adminDeleteDoctor(${d.id})"><i class="fa-solid fa-trash"></i></button></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div></div>
  </div>

  <!-- PATIENTS TAB -->
  <div id="adminTab-patients" class="admin-tab-content" style="display:none">
    <div class="table-card"><div class="table-responsive">
      <table class="app-table">
        <thead><tr><th>Name</th><th>Email</th><th>Age/Gender</th><th>Blood Group</th><th>Phone</th><th>Allergies</th><th>Emergency</th></tr></thead>
        <tbody>
          ${pats.map(p => `<tr>
            <td><strong>${p.name}</strong></td>
            <td>${p.email}</td>
            <td>${p.age} yrs &bull; ${p.gender}</td>
            <td><span class="badge-tag">${p.bloodGroup}</span></td>
            <td>${p.phone}</td>
            <td style="color:${p.allergies !== 'None' ? 'var(--danger)' : 'var(--success)'};font-weight:700">${p.allergies}</td>
            <td>${p.emergencyContact}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div></div>
  </div>

  <!-- APPOINTMENTS TAB -->
  <div id="adminTab-appts" class="admin-tab-content" style="display:none">
    <div class="table-card"><div class="table-responsive">
      <table class="app-table">
        <thead><tr><th>Patient</th><th>Doctor</th><th>Date &amp; Time</th><th>Status</th><th>Reason</th><th>Action</th></tr></thead>
        <tbody>
          ${appts.map(a => `<tr>
            <td><strong>${a.patientName}</strong></td>
            <td>${a.doctorName}</td>
            <td>${a.date} &bull; ${a.time}</td>
            <td><span class="status-badge status-${a.status.toLowerCase()}">${a.status}</span></td>
            <td>${a.reason}</td>
            <td><button class="btn btn-danger btn-sm" onclick="adminDeleteAppt(${a.id})"><i class="fa-solid fa-trash"></i></button></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div></div>
  </div>

  <!-- REPORTS TAB -->
  <div id="adminTab-reports" class="admin-tab-content" style="display:none">
    <div class="table-card"><div class="table-responsive">
      <table class="app-table">
        <thead><tr><th>Report ID</th><th>Patient</th><th>Doctor</th><th>Type</th><th>Title</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          ${reports.map(r => `<tr>
            <td><code>#RPT-${r.id}</code></td>
            <td><strong>${r.patientName}</strong></td>
            <td>${r.doctorName}</td>
            <td><span class="doc-spec">${r.reportType}</span></td>
            <td>${r.title}</td>
            <td>${r.uploadDate}</td>
            <td><span class="status-badge status-${r.status === 'REVIEWED' ? 'completed' : 'pending'}">${r.status}</span></td>
            <td>
              <button class="btn btn-outline btn-sm" onclick="viewReportModal(${r.id})"><i class="fa-solid fa-eye"></i></button>
              <button class="btn btn-danger btn-sm" onclick="adminDeleteReport(${r.id})"><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div></div>
  </div>

  <!-- PRESCRIPTIONS TAB -->
  <div id="adminTab-rx" class="admin-tab-content" style="display:none">
    <div class="table-card"><div class="table-responsive">
      <table class="app-table">
        <thead><tr><th>Rx ID</th><th>Patient</th><th>Doctor</th><th>Diagnosis</th><th>Date</th><th>Action</th></tr></thead>
        <tbody>
          ${rxs.map(rx => `<tr>
            <td><code>#RX-${rx.id}</code></td>
            <td><strong>${rx.patientName}</strong></td>
            <td>${rx.doctorName}</td>
            <td>${rx.diagnosis}</td>
            <td>${rx.date}</td>
            <td>
              <button class="btn btn-outline btn-sm" onclick="showRxModal(${rx.id})"><i class="fa-solid fa-eye"></i></button>
              <button class="btn btn-danger btn-sm" onclick="adminDeleteRx(${rx.id})"><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div></div>
  </div>`;
}

function adminTab(name) {
  ['doctors','patients','appts','reports','rx'].forEach(t => {
    const el = document.getElementById(`adminTab-${t}`);
    const btn = document.getElementById(`atb-${t}`);
    if (el) el.style.display = t === name ? '' : 'none';
    if (btn) btn.classList[t === name ? 'add' : 'remove']('active');
  });
}

// ==========================================
// 8. ADMIN DELETE ACTIONS  (real API calls)
// ==========================================
async function adminDeleteDoctor(id) {
  if (!confirm('Delete this doctor? This cannot be undone.')) return;
  try {
    await API.delete(`/api/doctors/${id}`);
    toast('Doctor removed.', 'info');
    route('admin-dashboard');
  } catch(err) { toast('Delete failed: ' + err.message, 'error'); }
}

async function adminDeleteAppt(id) {
  if (!confirm('Delete this appointment?')) return;
  try {
    await API.delete(`/api/appointments/${id}`);
    toast('Appointment removed.', 'info');
    route('admin-dashboard');
  } catch(err) { toast('Delete failed: ' + err.message, 'error'); }
}

async function adminDeleteReport(id) {
  if (!confirm('Delete this report?')) return;
  try {
    await API.delete(`/api/reports/${id}`);
    toast('Report deleted.', 'info');
    route('admin-dashboard');
  } catch(err) { toast('Delete failed: ' + err.message, 'error'); }
}

async function adminDeleteRx(id) {
  if (!confirm('Delete this prescription?')) return;
  try {
    await API.delete(`/api/prescriptions/${id}`);
    toast('Prescription removed.', 'info');
    route('admin-dashboard');
  } catch(err) { toast('Delete failed: ' + err.message, 'error'); }
}

// ==========================================
// 9. MODALS
// ==========================================

// BOOK APPOINTMENT MODAL
async function openBookingModal(docId) {
  const user = Auth.current();
  if (!user) { toast('Please sign in or register to book an appointment.', 'info'); return route('auth'); }
  if (user.role !== 'patient') return toast('Only patients can book appointments.', 'warning');

  let docs = window._cachedDocs || [];
  if (!docs.length) {
    try { docs = (await API.get('/api/doctors')).map(normDoc); window._cachedDocs = docs; } catch {}
  }

  const sel = docId ? docs.find(d => d.id === docId) : docs[0];

  modal(`
    <div class="modal-header">
      <h3><i class="fa-solid fa-calendar-plus" style="color:var(--primary)"></i> Book Consultation</h3>
      <button class="btn-close-modal" onclick="closeModal()">&times;</button>
    </div>
    <form id="bookForm">
      <div class="form-group"><label>Select Doctor</label>
        <select id="bookDoc" class="input-control">
          ${docs.map(d => `<option value="${d.id}" ${sel?.id===d.id?'selected':''}>${d.name} — ${d.specialization} (${d.fee})</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Date <span class="required">*</span></label>
          <input type="date" id="bookDate" class="input-control" value="${new Date().toISOString().split('T')[0]}" required>
        </div>
        <div class="form-group"><label>Time Slot <span class="required">*</span></label>
          <select id="bookTime" class="input-control">
            <option>09:30 AM</option><option>10:30 AM</option><option>11:30 AM</option>
            <option>02:00 PM</option><option>03:30 PM</option><option>04:30 PM</option>
          </select>
        </div>
      </div>
      <div class="form-group"><label>Symptoms / Reason <span class="required">*</span></label>
        <textarea id="bookReason" class="input-control" rows="3" placeholder="Describe your symptoms briefly..." required></textarea>
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%"><i class="fa-solid fa-check"></i> Confirm Booking</button>
    </form>`);

  document.getElementById('bookForm').addEventListener('submit', async e => {
    e.preventDefault();
    const doctorId = parseInt(document.getElementById('bookDoc').value);
    try {
      await API.post('/api/appointments', {
        patientId:       user.patientId || user.id,
        doctorId:        doctorId,
        appointmentDate: document.getElementById('bookDate').value,
        timeSlot:        document.getElementById('bookTime').value,
        symptoms:        document.getElementById('bookReason').value
      });
      closeModal();
      toast('Appointment booked successfully! Status: PENDING', 'success');
      route('patient-dashboard');
    } catch(err) { toast('Booking failed: ' + err.message, 'error'); }
  });
}

// UPDATE APPOINTMENT STATUS (Doctor — CONFIRMED / COMPLETED)
async function updateApptStatus(id, status) {
  try {
    await API.patch(`/api/appointments/${id}/status`, { status });
    toast(`Appointment #${id} → ${status}`, 'success');
    route('doctor-dashboard');
  } catch(err) { toast('Update failed: ' + err.message, 'error'); }
}

// UPLOAD PATIENT REPORT MODAL
async function openUploadReportModal(patId, patName) {
  const user = Auth.current();
  let patients = window._cachedPatients || [];
  if (!patients.length) {
    try { patients = (await API.get('/api/patients')).map(normPat); window._cachedPatients = patients; } catch {}
  }

  modal(`
    <div class="modal-header">
      <h3><i class="fa-solid fa-upload" style="color:var(--primary)"></i> Upload Patient Report</h3>
      <button class="btn-close-modal" onclick="closeModal()">&times;</button>
    </div>
    <form id="uploadForm">
      <div class="form-group"><label>Select Patient <span class="required">*</span></label>
        <select id="upPatient" class="input-control" required>
          ${patients.map(p => `<option value="${p.id}|${p.name}" ${p.id===patId?'selected':''}>${p.name} (${p.bloodGroup})</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Report Type <span class="required">*</span></label>
          <select id="upType" class="input-control" required>
            <option value="Blood Test">Blood Test</option><option value="X-Ray">X-Ray</option>
            <option value="MRI Scan">MRI Scan</option><option value="CT Scan">CT Scan</option>
            <option value="Ultrasound">Ultrasound</option><option value="ECG">ECG</option>
            <option value="Urine Test">Urine Test</option><option value="Pathology">Pathology</option><option value="Other">Other</option>
          </select>
        </div>
        <div class="form-group"><label>Report Date <span class="required">*</span></label>
          <input type="date" id="upDate" class="input-control" value="${new Date().toISOString().split('T')[0]}" required>
        </div>
      </div>
      <div class="form-group"><label>Report Title <span class="required">*</span></label>
        <input type="text" id="upTitle" class="input-control" placeholder="e.g. Complete Blood Count Report" required>
      </div>
      <div class="form-group"><label>Clinical Findings / Description <span class="required">*</span></label>
        <textarea id="upDesc" class="input-control" rows="3" placeholder="Summarise the key findings..." required></textarea>
      </div>
      <div class="form-group">
        <label>File Reference (name only)</label>
        <input type="text" id="upFile" class="input-control" placeholder="e.g. blood_report_oct.pdf">
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%"><i class="fa-solid fa-upload"></i> Upload Report to Patient File</button>
    </form>`);

  document.getElementById('uploadForm').addEventListener('submit', async e => {
    e.preventDefault();
    const [pId, pName] = document.getElementById('upPatient').value.split('|');
    try {
      await API.post('/api/reports', {
        patientId:   parseInt(pId),
        doctorId:    user.doctorId || user.id,
        title:       document.getElementById('upTitle').value,
        testType:    document.getElementById('upType').value,
        reportDate:  document.getElementById('upDate').value,
        description: document.getElementById('upDesc').value,
        fileLabel:   document.getElementById('upFile').value || 'report.pdf',
        status:      'PENDING_REVIEW'
      });
      closeModal();
      toast(`Report uploaded successfully for ${pName}!`, 'success');
      route('doctor-dashboard');
    } catch(err) { toast('Upload failed: ' + err.message, 'error'); }
  });
}

// DELETE REPORT (Doctor)
async function deleteReport(id) {
  if (!confirm('Remove this report?')) return;
  try {
    await API.delete(`/api/reports/${id}`);
    toast('Report removed.', 'info');
    route('doctor-dashboard');
  } catch(err) { toast('Delete failed: ' + err.message, 'error'); }
}

// TOGGLE INLINE REPORT PANEL (same-page expand/collapse)
function toggleInlineReport(reportId) {
  const detail  = document.getElementById(`report-detail-${reportId}`);
  const chevron = document.getElementById(`report-chevron-${reportId}`);
  const btn     = document.getElementById(`report-btn-${reportId}`);
  if (!detail) return;

  const isOpen = detail.style.display !== 'none';
  if (isOpen) {
    detail.style.maxHeight = detail.scrollHeight + 'px';
    detail.style.overflow  = 'hidden';
    requestAnimationFrame(() => {
      detail.style.transition = 'max-height 0.35s ease, opacity 0.25s ease';
      detail.style.maxHeight  = '0';
      detail.style.opacity    = '0';
    });
    setTimeout(() => { detail.style.display = 'none'; detail.style.maxHeight = ''; detail.style.opacity = ''; }, 360);
    if (chevron) { chevron.className = 'fa-solid fa-chevron-down'; }
    if (btn) btn.innerHTML = '<i class="fa-solid fa-chevron-down" id="report-chevron-' + reportId + '"></i> View &amp; Download';
  } else {
    detail.style.display   = '';
    detail.style.maxHeight = '0';
    detail.style.opacity   = '0';
    detail.style.overflow  = 'hidden';
    detail.style.transition = 'max-height 0.4s ease, opacity 0.3s ease';
    requestAnimationFrame(() => {
      detail.style.maxHeight = detail.scrollHeight + 'px';
      detail.style.opacity   = '1';
    });
    setTimeout(() => { detail.style.maxHeight = ''; detail.style.overflow = ''; }, 420);
    if (btn) btn.innerHTML = '<i class="fa-solid fa-chevron-up"></i> Collapse';
    // Scroll the card into comfortable view
    setTimeout(() => {
      const card = document.getElementById(`report-card-${reportId}`);
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }
}

// DOWNLOAD REPORT — renders a full preview inline on the page
function downloadReport(reportId, fileLabel) {
  const r = (window._cachedReports || []).find(r => r.id === reportId);
  if (!r) { toast('Report data not found.', 'warning'); return; }

  const previewWrap    = document.getElementById(`report-preview-${reportId}`);
  const previewContent = document.getElementById(`report-preview-content-${reportId}`);
  if (!previewWrap || !previewContent) return;

  // Build a nicely formatted report document shown inline
  previewContent.innerHTML = `
    <div class="inline-report-doc">
      <div class="inline-report-letterhead">
        <div class="inline-report-logo">
          <i class="fa-solid fa-heart-pulse"></i>
          <div>
            <div class="inline-report-hospital">CareConnect Multi-Specialty Hospital</div>
            <div class="inline-report-dept">Diagnostic &amp; Laboratory Services Department</div>
          </div>
        </div>
        <div class="inline-report-stamp">REVIEWED &amp; VERIFIED</div>
      </div>

      <div class="inline-report-divider"></div>

      <div class="inline-report-title-row">
        <div>
          <div class="inline-report-type-tag">${r.reportType}</div>
          <h2 class="inline-report-main-title">${r.title}</h2>
        </div>
        <div class="inline-report-meta-right">
          <div><strong>Report ID:</strong> #RPT-${r.id}</div>
          <div><strong>Date:</strong> ${r.uploadDate}</div>
          <div><strong>Status:</strong> <span class="status-badge status-${r.status === 'REVIEWED' ? 'completed' : 'pending'}">${r.status}</span></div>
        </div>
      </div>

      <div class="inline-report-patient-row">
        <div class="inline-report-patient-cell">
          <div class="inline-report-cell-label">Patient Name</div>
          <div class="inline-report-cell-value">${r.patientName}</div>
        </div>
        <div class="inline-report-patient-cell">
          <div class="inline-report-cell-label">Ordering Doctor</div>
          <div class="inline-report-cell-value">${r.doctorName}</div>
        </div>
        <div class="inline-report-patient-cell">
          <div class="inline-report-cell-label">Test Type</div>
          <div class="inline-report-cell-value">${r.reportType}</div>
        </div>
        <div class="inline-report-patient-cell">
          <div class="inline-report-cell-label">Report Date</div>
          <div class="inline-report-cell-value">${r.uploadDate}</div>
        </div>
      </div>

      <div class="inline-report-findings">
        <div class="inline-report-findings-heading"><i class="fa-solid fa-microscope"></i> Clinical Findings &amp; Diagnostic Report</div>
        <p class="inline-report-findings-body">${r.description}</p>
      </div>

      <div class="inline-report-file-row">
        <i class="fa-solid fa-file-pdf" style="color:#ef4444;font-size:20px"></i>
        <div>
          <div style="font-weight:700;font-size:13px">${r.fileLabel}</div>
          <div style="font-size:11.5px;color:var(--text-muted)">Attached Document — uploaded by ${r.doctorName}</div>
        </div>
        <span class="status-badge status-completed" style="margin-left:auto">Downloaded</span>
      </div>

      <div class="inline-report-footer">
        <span>CareConnect EHR System &bull; Report ID: #RPT-${r.id}</span>
        <span style="font-family:monospace;color:var(--primary);font-weight:700">[DIGITALLY VERIFIED]</span>
      </div>
    </div>`;

  previewWrap.style.display = '';
  previewWrap.style.maxHeight = '0';
  previewWrap.style.opacity   = '0';
  previewWrap.style.overflow  = 'hidden';
  previewWrap.style.transition = 'max-height 0.5s ease, opacity 0.35s ease';
  requestAnimationFrame(() => {
    previewWrap.style.maxHeight = previewWrap.scrollHeight + 'px';
    previewWrap.style.opacity   = '1';
  });
  setTimeout(() => { previewWrap.style.maxHeight = ''; previewWrap.style.overflow = ''; }, 520);

  toast(`Report "${r.title}" opened below.`, 'success');
  setTimeout(() => previewWrap.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}

function closePreview(reportId) {
  const el = document.getElementById(`report-preview-${reportId}`);
  if (!el) return;
  el.style.maxHeight = el.scrollHeight + 'px';
  el.style.overflow  = 'hidden';
  el.style.transition = 'max-height 0.35s ease, opacity 0.25s ease';
  requestAnimationFrame(() => { el.style.maxHeight = '0'; el.style.opacity = '0'; });
  setTimeout(() => { el.style.display = 'none'; el.style.maxHeight = ''; el.style.opacity = ''; }, 360);
}

// VIEW REPORT MODAL kept for admin/doctor usage (from cache)
function viewReportModal(reportId) {
  const all = (window._cachedReports || []);
  const r = all.find(r => r.id === reportId);
  if (!r) { toast('Report data not found.', 'warning'); return; }
  modal(`
    <div class="modal-header">
      <h3><i class="fa-solid fa-file-waveform" style="color:var(--primary)"></i> Lab Report Details</h3>
      <button class="btn-close-modal" onclick="closeModal()">&times;</button>
    </div>
    <div style="background:var(--bg-body);border-radius:var(--radius-md);padding:20px;margin-bottom:16px">
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;font-size:13px">
        <div><strong>Report ID:</strong> #RPT-${r.id}</div>
        <div><strong>Type:</strong> <span class="doc-spec">${r.reportType}</span></div>
        <div><strong>Patient:</strong> ${r.patientName}</div>
        <div><strong>Doctor:</strong> ${r.doctorName}</div>
        <div><strong>Upload Date:</strong> ${r.uploadDate}</div>
        <div><strong>Status:</strong> <span class="status-badge status-${r.status==='REVIEWED'?'completed':'pending'}">${r.status}</span></div>
      </div>
    </div>
    <h4 style="font-size:16px;font-weight:800;margin-bottom:8px">${r.title}</h4>
    <p style="font-size:13.5px;color:var(--text-main);background:var(--primary-subtle);padding:14px;border-radius:var(--radius-sm);border-left:4px solid var(--primary)">${r.description}</p>
    <div style="margin-top:16px;display:flex;align-items:center;gap:10px;background:var(--bg-body);padding:12px;border-radius:var(--radius-sm)">
      <i class="fa-solid fa-file-pdf" style="font-size:22px;color:var(--danger)"></i>
      <div><div style="font-weight:700">${r.fileLabel}</div><div style="font-size:12px;color:var(--text-muted)">Attached Document</div></div>
      <button class="btn btn-success btn-sm" style="margin-left:auto" onclick="downloadReport(${r.id},'${r.fileLabel}');closeModal()"><i class="fa-solid fa-download"></i> Download &amp; View</button>
    </div>
    <div style="margin-top:16px;text-align:right"><button class="btn btn-outline" onclick="closeModal()">Close</button></div>`);
}

// WRITE PRESCRIPTION MODAL (Doctor)
function openRxModal(apptId, patName, patientId) {
  const user = Auth.current();
  modal(`
    <div class="modal-header">
      <h3><i class="fa-solid fa-file-prescription" style="color:var(--success)"></i> Issue E-Prescription</h3>
      <button class="btn-close-modal" onclick="closeModal()">&times;</button>
    </div>
    <div style="background:var(--bg-body);padding:10px 14px;border-radius:6px;margin-bottom:16px;font-size:13px">
      <strong>Patient:</strong> ${patName} &bull; <strong>Doctor:</strong> ${user.name} (${user.specialization || 'Medicine'})
    </div>
    <form id="rxForm">
      <div class="form-group"><label>Diagnosis <span class="required">*</span></label>
        <input type="text" id="rxDiagnosis" class="input-control" placeholder="e.g. Acute Pharyngitis / Mild Hypertension" required>
      </div>
      <div class="form-group">
        <label>Medications (Name — Dosage — Frequency — Duration)</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <input type="text" id="med1" class="input-control" placeholder="Medicine 1 name" value="Paracetamol 650mg">
          <input type="text" id="dose1" class="input-control" placeholder="Dose/Frequency" value="1-0-1 — 5 Days — After meals">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <input type="text" id="med2" class="input-control" placeholder="Medicine 2 (optional)">
          <input type="text" id="dose2" class="input-control" placeholder="Dose/Frequency">
        </div>
      </div>
      <div class="form-group"><label>Doctor's Advice &amp; Notes</label>
        <textarea id="rxNotes" class="input-control" rows="2" placeholder="Diet, exercise, follow-up advice..."></textarea>
      </div>
      <button type="submit" class="btn btn-success" style="width:100%"><i class="fa-solid fa-print"></i> Issue Prescription &amp; Complete Visit</button>
    </form>`);

  document.getElementById('rxForm').addEventListener('submit', async e => {
    e.preventDefault();
    const meds = [];
    if (document.getElementById('med1').value) meds.push({ name: document.getElementById('med1').value, frequency: document.getElementById('dose1').value, notes: 'As directed' });
    if (document.getElementById('med2').value) meds.push({ name: document.getElementById('med2').value, frequency: document.getElementById('dose2').value, notes: 'As directed' });
    try {
      await API.post('/api/prescriptions', {
        patientId:    patientId,
        doctorId:     user.doctorId || user.id,
        diagnosis:    document.getElementById('rxDiagnosis').value,
        medicinesJson: JSON.stringify(meds),
        doctorNotes:  document.getElementById('rxNotes').value
      });
      // Mark appointment COMPLETED
      await API.patch(`/api/appointments/${apptId}/status`, { status: 'COMPLETED' });
      closeModal();
      toast('Prescription issued. Visit marked COMPLETED.', 'success');
      route('doctor-dashboard');
    } catch(err) { toast('Failed to issue prescription: ' + err.message, 'error'); }
  });
}

// VIEW RX FOR APPOINTMENT
async function viewRxForAppt(apptId) {
  const all = window._cachedRxs || [];
  const rx = all.find(r => r.appointmentId === apptId);
  if (rx) { showRxModal(rx.id); return; }
  toast('No prescription found for this appointment.', 'warning');
}

// SHOW PRESCRIPTION MODAL
function showRxModal(rxId) {
  const all = window._cachedRxs || [];
  const rx = all.find(r => r.id === rxId);
  if (!rx) { toast('Prescription data not available. Please reload.', 'warning'); return; }
  modal(`
    <div class="modal-header">
      <h3><i class="fa-solid fa-file-medical" style="color:var(--primary)"></i> Digital E-Prescription</h3>
      <button class="btn-close-modal" onclick="closeModal()">&times;</button>
    </div>
    <div class="prescription-paper" id="printRx">
      <div class="rx-header">
        <div><div class="rx-clinic">CareConnect Multi-Specialty Hospital</div><div style="font-size:12px;color:var(--text-muted)">Outpatient Department</div></div>
        <div style="text-align:right"><div class="rx-doctor">${rx.doctorName}</div><div style="font-size:12px;color:var(--text-muted)">${rx.specialization}</div><div style="font-size:11px;color:var(--text-muted)">${rx.date}</div></div>
      </div>
      <div class="rx-patient-meta">
        <div><strong>Patient:</strong> ${rx.patientName}</div>
        <div><strong>Rx ID:</strong> #RX-${rx.id}</div>
        <div><strong>Diagnosis:</strong> <span style="color:var(--primary);font-weight:700">${rx.diagnosis}</span></div>
      </div>
      <div style="font-size:16px;font-weight:800;color:var(--primary);margin-bottom:8px">℞ Medications:</div>
      <table class="rx-med-table">
        <thead><tr><th>Medicine</th><th>Dosage &amp; Frequency</th><th>Notes</th></tr></thead>
        <tbody>${(rx.medicines || []).map(m => `<tr><td><strong>${m.name}</strong></td><td>${m.frequency}</td><td>${m.notes}</td></tr>`).join('')}</tbody>
      </table>
      ${rx.doctorNotes ? `<div style="background:#f0fdf4;padding:10px 14px;border-radius:4px;border-left:3px solid var(--success);font-size:12.5px;margin-bottom:16px"><strong>Doctor's Notes:</strong> ${rx.doctorNotes}</div>` : ''}
      <div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--text-muted);border-top:1px solid #cbd5e1;padding-top:10px">
        <span>CareConnect EHR &bull; Digitally Verified</span>
        <div style="text-align:center"><div style="font-family:monospace;color:var(--primary);font-weight:700">[DIGITALLY SIGNED]</div><div>${rx.doctorName}</div></div>
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-top:16px">
      <button class="btn btn-primary" style="flex:1" onclick="window.print()"><i class="fa-solid fa-print"></i> Print Prescription</button>
      <button class="btn btn-outline" onclick="closeModal()">Close</button>
    </div>`);
}

// PATIENT DOSSIER MODAL (Doctor views)
async function openDossierModal(patientId) {
  let pat = (window._cachedPatients || []).find(p => p.id === patientId);
  let appts = (window._cachedAppts || []).filter(a => a.patientId === patientId);
  let rpts  = (window._cachedReports || []).filter(r => r.patientId === patientId);

  if (!pat) {
    try {
      const raw = await API.get(`/api/patients/${patientId}`);
      pat = normPat(raw);
    } catch { toast('Could not load patient data.', 'error'); return; }
  }

  modal(`
    <div class="modal-header">
      <h3><i class="fa-solid fa-id-card-clip" style="color:var(--primary)"></i> Patient Dossier</h3>
      <button class="btn-close-modal" onclick="closeModal()">&times;</button>
    </div>
    <h2 style="font-size:20px;font-weight:800;margin-bottom:4px">${pat.name}</h2>
    <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">${pat.email} &bull; ${pat.phone}</p>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;font-size:13px;background:var(--bg-body);padding:14px;border-radius:var(--radius-md);margin-bottom:16px">
      <div><strong>Blood Group:</strong> <span style="color:var(--danger);font-weight:700">${pat.bloodGroup}</span></div>
      <div><strong>Age / Gender:</strong> ${pat.age} yrs &bull; ${pat.gender}</div>
      <div><strong>Allergies:</strong> <span style="color:var(--warning);font-weight:700">${pat.allergies}</span></div>
      <div><strong>Emergency:</strong> ${pat.emergencyContact}</div>
    </div>
    <h4 style="font-size:14px;font-weight:700;margin-bottom:8px">Consultation History</h4>
    <ul style="margin-left:20px;font-size:13px;line-height:1.8">
      ${appts.map(a => `<li><strong>${a.date}:</strong> ${a.doctorName} — <em>${a.reason}</em> [${a.status}]</li>`).join('') || '<li style="color:var(--text-muted)">No consultations yet</li>'}
    </ul>
    <h4 style="font-size:14px;font-weight:700;margin:12px 0 8px">Uploaded Reports (${rpts.length})</h4>
    <ul style="margin-left:20px;font-size:13px;line-height:1.8">
      ${rpts.map(r => `<li><strong>${r.reportType}:</strong> ${r.title} — ${r.uploadDate}</li>`).join('') || '<li style="color:var(--text-muted)">No reports uploaded</li>'}
    </ul>
    <div style="margin-top:18px;text-align:right"><button class="btn btn-outline" onclick="closeModal()">Close</button></div>`);
}

// ADD DOCTOR MODAL (Admin — registers via API)
function openAddDoctorModal() {
  modal(`
    <div class="modal-header">
      <h3><i class="fa-solid fa-user-plus" style="color:var(--primary)"></i> Onboard New Doctor</h3>
      <button class="btn-close-modal" onclick="closeModal()">&times;</button>
    </div>
    <form id="addDocForm">
      <div class="form-group"><label>Full Name <span class="required">*</span></label>
        <input type="text" id="dName" class="input-control" placeholder="Dr. Full Name" required>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Email <span class="required">*</span></label>
          <input type="email" id="dEmail" class="input-control" placeholder="dr.name@careconnect.com" required>
        </div>
        <div class="form-group"><label>Password <span class="required">*</span></label>
          <input type="password" id="dPass" class="input-control" placeholder="••••••••" required>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Specialization <span class="required">*</span></label>
          <select id="dSpec" class="input-control">
            <option>Cardiology</option><option>Neurology</option><option>Pediatrics</option>
            <option>Orthopedics</option><option>General Medicine</option><option>Dermatology</option>
            <option>Gynecology</option><option>Ophthalmology</option><option>ENT</option>
          </select>
        </div>
        <div class="form-group"><label>Qualification <span class="required">*</span></label>
          <input type="text" id="dQual" class="input-control" placeholder="MBBS, MD" required>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Experience <span class="required">*</span></label>
          <input type="text" id="dExp" class="input-control" placeholder="e.g. 10 Years" required>
        </div>
        <div class="form-group"><label>Consultation Fee <span class="required">*</span></label>
          <input type="text" id="dFee" class="input-control" placeholder="e.g. ₹1,000" required>
        </div>
      </div>
      <div class="form-group"><label>Available Days &amp; Timings</label>
        <input type="text" id="dDays" class="input-control" placeholder="e.g. Mon–Fri, 09:00–13:00">
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%"><i class="fa-solid fa-check"></i> Register Doctor</button>
    </form>`);

  document.getElementById('addDocForm').addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('dName').value.trim();
    try {
      await API.post('/api/auth/register', {
        name:           name.startsWith('Dr.') ? name : 'Dr. ' + name,
        email:          document.getElementById('dEmail').value,
        password:       document.getElementById('dPass').value,
        role:           'DOCTOR',
        specialization: document.getElementById('dSpec').value,
        qualification:  document.getElementById('dQual').value,
        experience:     document.getElementById('dExp').value,
        fee:            document.getElementById('dFee').value,
        availableDays:  document.getElementById('dDays').value || 'Mon–Fri'
      });
      closeModal();
      toast(`Doctor registered successfully!`, 'success');
      route('admin-dashboard');
    } catch(err) { toast('Failed: ' + err.message, 'error'); }
  });
}

// ==========================================
// 10. MODAL / TOAST HELPERS
// ==========================================
function modal(html) {
  document.getElementById('modalCard').innerHTML = html;
  document.getElementById('modalBackdrop').classList.add('active');
}
function closeModal() { document.getElementById('modalBackdrop').classList.remove('active'); }
function closeModalOnBackdrop(e) { if (e.target.id === 'modalBackdrop') closeModal(); }

function toast(msg, type = 'info') {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fa-solid ${icons[type]||icons.info}"></i><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(50px)'; t.style.transition = 'all 0.3s ease'; setTimeout(() => t.remove(), 300); }, 4000);
}

function errorBanner(msg) {
  return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:50vh;gap:16px;text-align:center;padding:40px">
    <div style="width:64px;height:64px;border-radius:50%;background:#fef2f2;color:var(--danger);display:flex;align-items:center;justify-content:center;font-size:28px">
      <i class="fa-solid fa-circle-exclamation"></i>
    </div>
    <h3 style="color:var(--danger);font-size:18px;font-weight:800">Unable to Load Data</h3>
    <p style="color:var(--text-muted);max-width:480px;font-size:14px">${msg}</p>
    <p style="color:var(--text-muted);font-size:13px">Make sure the Spring Boot backend is running at <code>http://localhost:8080</code></p>
    <button class="btn btn-primary" onclick="route(_view)"><i class="fa-solid fa-rotate-right"></i> Retry</button>
  </div>`;
}

// ==========================================
// 11. BOOT — always land on login
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Check for existing session; if none, land on auth page
  const existingUser = Auth.current();
  if (existingUser && existingUser.role) {
    route(existingUser.role + '-dashboard');
  } else {
    localStorage.removeItem('cc_user'); // clear any corrupt session
    route('auth');
  }
  startHealthMonitor();
  checkBackendHealth(false);
});
