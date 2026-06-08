// ============================================================
// js/config.js  –  Global configuration & API wrapper (UPDATED)
// ============================================================

const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycby7zvqElO4CssZSvI74ZI9mSBKKe4hMMIAyT7lpGBcReZLltzQfsbCptMhSXfzCj4oG/exec',

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


// ─────────────────────────────────────────────
// API CORE
// ─────────────────────────────────────────────
const API = {
  async call(action, params = {}) {
    try {
      const allParams = { action, ...params };

      const qs = Object.entries(allParams)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) =>
          encodeURIComponent(k) + '=' + encodeURIComponent(
            typeof v === 'object' ? JSON.stringify(v) : v
          )
        )
        .join('&');

      const url = CONFIG.API_URL + '?' + qs;

      const res = await fetch(url, { method: 'GET', redirect: 'follow' });

      const text = await res.text();

      if (!text.trim().startsWith('{')) {
        console.error('Non-JSON response:', text);
        return { success: false, message: 'Server error or invalid response' };
      }

      return JSON.parse(text);

    } catch (err) {
      return {
        success: false,
        message: 'Network error: ' + err.message
      };
    }
  },

  // ─────────────────────────────────────────────
  // AUTH (UPDATED - NO OTP)
  // ─────────────────────────────────────────────
  checkID: (studentId) =>
    API.call('checkAuthorizedID', {
      studentId: studentId.trim().toUpperCase()
    }),

  register: (data) =>
    API.call('registerStudent', {
      ...data,
      studentId: data.studentId.trim().toUpperCase()
    }),

  loginStudent: (studentId, password) =>
    API.call('loginStudent', {
      studentId: studentId.trim().toUpperCase(),
      password
    }),

  loginInstructor: (username, password) =>
    API.call('loginInstructor', { username, password }),


  // ─────────────────────────────────────────────
  // PASSWORD RESET SYSTEM (NEW)
  // ─────────────────────────────────────────────
  requestPasswordReset: (studentId) =>
    API.call('requestPasswordReset', {
      studentId: studentId.trim().toUpperCase()
    }),

  verifyPasswordResetOTP: (studentId, otp) =>
    API.call('verifyPasswordResetOTP', {
      studentId: studentId.trim().toUpperCase(),
      otp
    }),

  resetPassword: (studentId, newPassword) =>
    API.call('resetPassword', {
      studentId: studentId.trim().toUpperCase(),
      newPassword
    }),


  // ─────────────────────────────────────────────
  // STUDENT
  // ─────────────────────────────────────────────
  getMarks: (studentId) =>
    API.call('getMarks', {
      studentId: studentId.trim().toUpperCase()
    }),

  submitComplaint: (data) =>
    API.call('submitComplaint', data),

  getLectureNotes: (course = '') =>
    API.call('getLectureNotes', { course }),

  getOnlineTests: (course = '') =>
    API.call('getOnlineTests', { course }),

  submitTestResult: (data) =>
    API.call('submitTestResult', data),

  chatbot: (message, studentId) =>
    API.call('chatbot', {
      message,
      studentId: studentId?.trim().toUpperCase()
    }),


  // ─────────────────────────────────────────────
  // INSTRUCTOR
  // ─────────────────────────────────────────────
  getDashboard: () => API.call('getDashboard'),

  getAllStudents: (course) =>
    API.call('getAllStudents', { course }),

  updateMark: (data) => API.call('updateMark', data),

  uploadQuestion: (data) => API.call('uploadQuestion', data),

  uploadLectureNote: (data) => API.call('uploadLectureNote', data),

  sendNotice: (data) => API.call('sendNotice', data),

  getComplaints: () => API.call('getComplaints'),

  resolveComplaint: (data) => API.call('resolveComplaint', data),

  getCourses: () => API.call('getCourses')
};


// ─────────────────────────────────────────────
// SESSION
// ─────────────────────────────────────────────
const Session = {
  get: () => JSON.parse(localStorage.getItem('portalSession') || 'null'),
  set: (data) => localStorage.setItem('portalSession', JSON.stringify(data)),
  clear: () => localStorage.removeItem('portalSession'),

  isStudent: () => {
    const s = Session.get();
    return s && s.role === 'student';
  },

  isInstructor: () => {
    const s = Session.get();
    return s && s.role === 'instructor';
  }
};


// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
const Toast = {
  show(message, type = 'info') {
    const container = document.querySelector('.toast-container') ||
      (() => {
        const c = document.createElement('div');
        c.className = 'toast-container';
        document.body.appendChild(c);
        return c;
      })();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerText = message;

    container.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  },

  success: (m) => Toast.show(m, 'success'),
  error: (m) => Toast.show(m, 'error'),
  info: (m) => Toast.show(m, 'info'),
  warning: (m) => Toast.show(m, 'warning')
};


// ─────────────────────────────────────────────
// LOADER
// ─────────────────────────────────────────────
const Loader = {
  show(el, text = 'Loading...') {
    el._html = el.innerHTML;
    el.disabled = true;
    el.innerHTML = text;
  },
  hide(el) {
    el.innerHTML = el._html;
    el.disabled = false;
  }
};


// ─────────────────────────────────────────────
// GRADE UTILITY
// ─────────────────────────────────────────────
function getGradeLetter(total) {
  if (total >= 90) return { letter: 'A+', color: '#10b981' };
  if (total >= 80) return { letter: 'A', color: '#10b981' };
  if (total >= 70) return { letter: 'B', color: '#3b82f6' };
  if (total >= 60) return { letter: 'C', color: '#f59e0b' };
  if (total >= 50) return { letter: 'D', color: '#f97316' };
  return { letter: 'F', color: '#ef4444' };
}
