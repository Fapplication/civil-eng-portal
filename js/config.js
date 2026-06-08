// ============================================================
// js/config.js  –  Global configuration & API wrapper
// ============================================================

const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbz0J49lcZiwTkYcW3t8oBOr2D5_3RbSM1oxWeJ-Gow/dev',

  COURSES: [
    'Geometric Design of Road and Streets (CEng 3201)',
    'Transport Planning and Modeling (CEng 2901)'
  ],

  GRADE_WEIGHTS: {
    Quiz: 10,
    Mid: 30,
    Assignment: 10,
    Final: 50
  }
};

// ─── API Wrapper ─────────────────────────────────────────────
const API = {
  async call(action, params = {}) {
    try {
      const allParams = { action, ...params };
      let url = CONFIG.API_URL;
      let fetchOptions = { redirect: 'follow' };

      // FIX: Dynamically classify mutations to execute through POST.
      // This protects the system from URL query string overflow crashes (HTTP 414).
      const stateWriteActions = [
        'registerStudent', 'submitComplaint', 'submitTestResult', 
        'updateMark', 'uploadQuestion', 'uploadLectureNote', 'sendNotice', 'resolveComplaint'
      ];

      if (stateWriteActions.includes(action)) {
        fetchOptions.method = 'POST';
        fetchOptions.body = JSON.stringify(allParams);
        // Using text/plain content header avoids pre-flight CORS blocks inside Web App structures
        fetchOptions.headers = { 'Content-Type': 'text/plain' };
      } else {
        fetchOptions.method = 'GET';
        const qs = Object.entries(allParams)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(
            typeof v === 'object' ? JSON.stringify(v) : v
          ))
          .join('&');
        url += '?' + qs;
      }

      const res = await fetch(url, fetchOptions);

      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();

      if (!text.trim().startsWith('{') && !text.trim().startsWith('[')) {
        console.error('Non-JSON response:', text.substring(0, 200));
        return { success: false, message: 'Server returned an unexpected response. Check your Apps Script deployment.' };
      }

      return JSON.parse(text);
    } catch (err) {
      console.error('API Error:', err);
      if (err.message && err.message.includes('Failed to fetch')) {
        return { success: false, message: 'Cannot reach the server. Make sure your Apps Script Web App URL is correct in js/config.js and is deployed as "Anyone" access.' };
      }
      return { success: false, message: 'Network error: ' + err.message };
    }
  },

  // Auth
  checkID: (studentId) => API.call('checkAuthorizedID', { studentId }),
  sendOTP: (studentId, chatId = 'WEB') => API.call('sendOTP', { studentId, chatId }),
  verifyOTP: (studentId, otp) => API.call('verifyOTP', { studentId, otp }),
  register: (data) => API.call('registerStudent', data),
  loginStudent: (studentId, password) => API.call('loginStudent', { studentId, password }),
  loginInstructor: (username, password) => API.call('loginInstructor', { username, password }),

  // Student
  getMarks: (studentId) => API.call('getMarks', { studentId }),
  submitComplaint: (data) => API.call('submitComplaint', data),
  getLectureNotes: (course = '') => API.call('getLectureNotes', { course }),
  getOnlineTests: (course = '') => API.call('getOnlineTests', { course }),
  submitTestResult: (data) => API.call('submitTestResult', data),
  chatbot: (message, studentId) => API.call('chatbot', { message, studentId }),

  // Instructor
  getDashboard: () => API.call('getDashboard'),
  getAllStudents: (course) => API.call('getAllStudents', { course }),
  updateMark: (data) => API.call('updateMark', data),
  uploadQuestion: (data) => API.call('uploadQuestion', data),
  uploadLectureNote: (data) => API.call('uploadLectureNote', data),
  sendNotice: (data) => API.call('sendNotice', data),
  getComplaints: () => API.call('getComplaints'),
  resolveComplaint: (data) => API.call('resolveComplaint', data),
  getCourses: () => API.call('getCourses')
};

// ─── Session Helpers ─────────────────────────────────────────
const Session = {
  get: () => JSON.parse(localStorage.getItem('portalSession') || 'null'),
  set: (data) => localStorage.setItem('portalSession', JSON.stringify(data)),
  clear: () => localStorage.removeItem('portalSession'),
  isStudent: () => { const s = Session.get(); return s && s.role === 'student'; },
  isInstructor: () => { const s = Session.get(); return s && s.role === 'instructor'; },
  requireStudent: () => {
    if (!Session.isStudent()) { window.location.href = 'index.html'; return null; }
    return Session.get();
  },
  requireInstructor: () => {
    if (!Session.isInstructor()) { window.location.href = 'index.html'; return null; }
    return Session.get();
  }
};

// ─── Toast Notifications ─────────────────────────────────────
const Toast = {
  show(message, type = 'info', duration = 3500) {
    const existing = document.querySelector('.toast-container');
    const container = existing || (() => {
      const c = document.createElement('div');
      c.className = 'toast-container';
      document.body.appendChild(c);
      return c;
    })();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ'}</span><span>${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  },
  success: (m) => Toast.show(m, 'success'),
  error: (m) => Toast.show(m, 'error'),
  info: (m) => Toast.show(m, 'info'),
  warning: (m) => Toast.show(m, 'warning')
};

// ─── Loading Spinner ─────────────────────────────────────────
const Loader = {
  show(el, text = 'Loading...') {
    if (!el) return;
    el._original = el.innerHTML;
    el.disabled = true;
    el.innerHTML = `<span class="spinner"></span>${text}`;
  },
  hide(el) {
    if (!el || !el._original) return;
    el.innerHTML = el._original;
    el.disabled = false;
    delete el._original;
  }
};

// ─── Grade Utility ───────────────────────────────────────────
function getGradeLetter(total) {
  if (total >= 90) return { letter: 'A+', color: '#10b981' };
  if (total >= 85) return { letter: 'A',  color: '#10b981' };
  if (total >= 80) return { letter: 'A-', color: '#10b981' };
  if (total >= 75) return { letter: 'B+', color: '#3b82f6' };
  if (total >= 70) return { letter: 'B',  color: '#3b82f6' };
  if (total >= 65) return { letter: 'B-', color: '#3b82f6' };
  if (total >= 60) return { letter: 'C+', color: '#f59e0b' };
  if (total >= 50) return { letter: 'C',  color: '#f59e0b' };
  if (total >= 45) return { letter: 'D',  color: '#f97316' };
  return { letter: 'F', color: '#ef4444' };
}
