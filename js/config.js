Hava script is: // ============================================================

// js/config.js  –  Global configuration & API wrapper

// ============================================================



const CONFIG = {

  API_URL: 'https://script.google.com/macros/s/AKfycby9jR1w80G-W2aNFoiSAb04R9sCZdtQb3wvzQEd5nNWl57TcsXyqMBSfcih8MOt7nrs/exec',



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

      let fetchOptions = { 

        method: 'POST', // Default all traffic to POST for data payload symmetry

        redirect: 'follow',

        mode: 'cors'

      };



      // Define read actions that are completely safe to use via standard GET execution

      const strictReadActions = [

        'checkAuthorizedID', 'getMarks', 'getLectureNotes', 'getOnlineTests', 

        'getComplaints', 'getCourses', 'getNotices', 'getDashboard', 'getAllStudents'

      ];



      if (strictReadActions.includes(action)) {

        fetchOptions.method = 'GET';

        const qs = Object.entries(allParams)

          .filter(([, v]) => v !== undefined && v !== null)

          .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(

            typeof v === 'object' ? JSON.stringify(v) : v

          ))

          .join('&');

        url += '?' + qs;

        delete fetchOptions.body;

      } else {

        // Safe cross-origin POST execution using form urlencoded boundaries

        const formParams = new URLSearchParams();

        Object.entries(allParams).forEach(([k, v]) => {

          formParams.append(k, typeof v === 'object' ? JSON.stringify(v) : v);

        });

        fetchOptions.body = formParams.toString();

        fetchOptions.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

      }



      const res = await fetch(url, fetchOptions);



      if (!res.ok) throw new Error('HTTP Status ' + res.status);

      const text = await res.text();



      if (!text.trim().startsWith('{') && !text.trim().startsWith('[')) {

        console.error('Non-JSON Engine Response:', text.substring(0, 200));

        return { success: false, message: 'Unexpected server payload configuration. Verify Apps Script deployment.' };

      }



      return JSON.parse(text);

    } catch (err) {

      console.error('API Connection Error:', err);

      if (err.message && err.message.includes('Failed to fetch')) {

        return { success: false, message: 'Cannot reach the server. Make sure your Apps Script Web App URL is correct in js/config.js and is deployed as "Anyone" access.' };

      }

      return { success: false, message: 'Network interface error: ' + err.message };

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

} and Appscript is :// ============================================================

// Google Apps Script Backend - Combined Core Engine

// Deploy as Web App: Execute as "Me", Access "Anyone"

// ============================================================



const ss = SpreadsheetApp.getActiveSpreadsheet();



// ─── CREDENTIALS & BOT CONFIGURATION ────────────────────────

const TELEGRAM_TOKEN = "8775466330:AAEEuQmHmynlKrn6O-FuyX5WDNFiT-5eSxA";

const TELEGRAM_API   = "https://api.telegram.org/bot" + TELEGRAM_TOKEN;



// ─── CORS PRE-FLIGHT INTERCEPTOR (UNIFIED OPTIONS ROUTER) ───

function doOptions(e) {

  // Apps Script returns default CORS configuration parameters back to standard text pre-flights

  return ContentService.createTextOutput("")

    .setMimeType(ContentService.MimeType.TEXT);

}



function doGet(e) {

  return handleRequest(e);

}



function doPost(e) {

  return handleRequest(e);

}



function handleRequest(e) {

  let data = {};

 

  // 1. Parse parameters from GET query strings or standard form POST submissions

  if (e && e.parameter) {

    Object.assign(data, e.parameter);

   

    // Check if the payload comes nested within an e.parameter.payload string variable

    if (e.parameter.payload) {

      try {

        const structuralPayload = JSON.parse(e.parameter.payload);

        Object.assign(data, structuralPayload);

      } catch(err) {}

    }

  }

 

  // 2. Parse parameters from raw JSON or form-urlencoded stream payloads

  try {

    if (e && e.postData && e.postData.contents) {

      if (e.postData.type === "application/json") {

        const payload = JSON.parse(e.postData.contents);

        Object.assign(data, payload);

      } else if (e.postData.type === "application/x-www-form-urlencoded" && e.parameter.payload) {

        const payload = JSON.parse(e.parameter.payload);

        Object.assign(data, payload);

      } else {

        // Fallback for custom or unrecognized encoding configurations

        const rawPayload = JSON.parse(e.postData.contents);

        Object.assign(data, rawPayload);

      }

    }

  } catch(err) {

    // Content stream context wasn't JSON formatted, continue tracking data map safely

  }



  // 3. TELEGRAM TRIGGER: If it contains a raw bot message payload shell with no action property

  if (data.message && data.message.text && !data.action) {

    handleBot(data.message);

    return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT);

  }



  const action = data.action;



  // 4. FALLBACK STATUS: If no action property is requested by web or webhook layout maps

  if (!action) {

    return ContentService.createTextOutput("FB Advanced Educational & Administrative Core Engine Online.")

                         .setMimeType(ContentService.MimeType.TEXT);

  }



  let result;

  try {

    switch (action) {

      // AUTHENTICATION INFRASTRUCTURE

      case 'checkAuthorizedID':   result = checkAuthorizedID(data); break;

      case 'registerStudent':     result = registerStudentCore(data); break;

      case 'register':            result = registerStudent(data.id, data.password); break; // Legacy interface mapping

      case 'loginStudent':        result = loginStudent(data); break;

      case 'loginUser':           result = loginUser(data.id, data.password); break;       // Legacy interface mapping

      case 'login':               result = loginUser(data.id, data.password); break;       // Alternative structure mapping

      case 'loginInstructor':     result = loginInstructor(data); break;



      // STUDENT FUNCTION PIPELINES

      case 'getMarks':

        if (data.studentId) result = getMarks(data);

        else if (data.id) result = getStudentMarksFromAllTabs(data.id);

        break;

      case 'submitComplaint':     result = submitComplaint(data); break;

      case 'getLectureNotes':     result = getLectureNotes(data); break;

      case 'getNotes':            result = getAllLectureNotes(); break; // Legacy file system sync map

      case 'getOnlineTests':      result = getOnlineTests(data); break;

      case 'getExam':             result = studentFetchExamPaper(data.course); break;

      case 'submitTestResult':    result = submitTestResult(data); break;

      case 'chatbot':             result = chatbot(data); break;



      // INSTRUCTOR ADMINISTRATIVE CONTEXTS

      case 'getDashboard':        result = getDashboard(data); break;

      case 'getAllStudents':      result = getAllStudents(data); break;

      case 'updateMark':

        if (data.field) result = updateMark(data);

        else result = updateStudentMarkInTab(data.id, data.subject, data.quiz, data.mid, data.assignment, data.final, data.adminId, data.adminPassword);

        break;

      case 'uploadLectureNote':   result = uploadLectureNote(data); break;

      case 'uploadNote':          result = adminUploadLectureNote(data.course, data.title, data.url, data.adminId, data.adminPassword); break;

      case 'uploadQuestion':      result = uploadQuestion(data); break;

      case 'addQuestion':         result = adminAddExamQuestion(data.course, data.question, data.a, data.b, data.c, data.d, data.correct, data.timer, data.adminId, data.adminPassword); break;

      case 'sendNotice':          result = sendNotice(data); break;

      case 'getComplaints':       result = getComplaints(data); break;

      case 'resolveComplaint':    result = resolveComplaint(data); break;

      case 'getCourses':          result = getCourses(data); break;

      case 'getNotices':          result = getNotices(data); break;

      case 'getGrid':             result = getGridForCourse(data.subject, data.adminId, data.adminPassword); break;



      default: result = { success: false, message: 'Unknown engine action parameter: ' + action };

    }

  } catch (err) {

    result = { success: false, message: err.message };

  }



  // Unified clean JSON return structure for your web UI client calls

  const output = ContentService.createTextOutput(JSON.stringify(result));

  output.setMimeType(ContentService.MimeType.JSON);

  return output;

}



// ─── UTILITY INTERNAL HELPERS ────────────────────────────────

function getSheet(name) {

  return ss.getSheetByName(name);

}



function sheetToObjects(sheet) {

  const data = sheet.getDataRange().getValues();

  if (data.length < 2) return [];

  const headers = data[0];

  return data.slice(1).map(row => {

    const obj = {};

    headers.forEach((h, i) => obj[h] = row[i]);

    return obj;

  });

}



function generateOTP() {

  return Math.floor(100000 + Math.random() * 900000).toString();

}



function hashPassword(password) {

  return Utilities.base64Encode(Utilities.computeDigest(

    Utilities.DigestAlgorithm.SHA_256,

    String(password)

  ));

}



// ─── AUTHENTICATION WEB ARCHITECTURE MODULES ─────────────────

function checkAuthorizedID(data) {

  const sheet = getSheet('Authorized_IDs');

  const rows = sheetToObjects(sheet);

  const found = rows.find(r => String(r['ID']).trim() === String(data.studentId).trim());

  if (found) {

    const users = sheetToObjects(getSheet('Users'));

    const registered = users.find(u => String(u['ID']).trim() === String(data.studentId).trim());

    return { success: true, name: found['Name'], alreadyRegistered: !!registered };

  }

  return { success: false, message: 'Student ID not found in authorized list.' };

}



function sendOTP(data) {

  const otp = generateOTP();

  const sheet = getSheet('OTP_Verification');

  const rows = sheet.getDataRange().getValues();

  for (let i = rows.length - 1; i >= 1; i--) {

    if (String(rows[i][1]) === String(data.studentId)) {

      sheet.deleteRow(i + 1);

    }

  }

  sheet.appendRow([data.chatId || 'WEB', data.studentId, otp, new Date().toISOString()]);



  try {

    const users = sheetToObjects(getSheet('Users'));

    const user = users.find(u => String(u['ID']) === String(data.studentId));

    const email = data.email || (user ? user['Email'] : null);

    if (email) {

      MailApp.sendEmail({

        to: email,

        subject: 'Your OTP Code - Student Portal',

        body: `Your OTP code is: ${otp}\n\nThis code expires in 10 minutes.`

      });

    }

  } catch(e) {}



  return { success: true, message: 'OTP sent.', otp: otp };

}



function verifyOTP(data) {

  const sheet = getSheet('OTP_Verification');

  const rows = sheetToObjects(sheet);

  const record = rows.find(r =>

    String(r['Student_ID']).trim() === String(data.studentId).trim() &&

    String(r['OTP_Code']).trim() === String(data.otp).trim()

  );

  if (!record) return { success: false, message: 'Invalid OTP.' };



  const created = new Date(record['Timestamp']);

  const now = new Date();

  if ((now - created) > 10 * 60 * 1000) return { success: false, message: 'OTP expired.' };



  return { success: true, message: 'OTP verified.' };

}



function registerStudentCore(data) {

  const otpCheck = verifyOTP(data);

  if (!otpCheck.success) return otpCheck;



  const sheet = getSheet('Users');

  const existing = sheetToObjects(sheet).find(u => String(u['ID']) === String(data.studentId));

  if (existing) return { success: false, message: 'Student already registered.' };



  const authSheet = getSheet('Authorized_IDs');

  const authRows = sheetToObjects(authSheet);

  const authRecord = authRows.find(r => String(r['ID']).trim() === String(data.studentId).trim());



  sheet.appendRow([

    data.studentId,

    hashPassword(data.password),

    authRecord ? authRecord['Name'] : data.name,

    data.telegramUsername || '',

    '', // savedChatId empty placeholder

    'student'

  ]);



  return { success: true, message: 'Registration successful!' };

}



function loginStudent(data) {

  const sheet = getSheet('Users');

  const rows = sheetToObjects(sheet);

  const user = rows.find(r =>

    String(r['ID']).trim() === String(data.studentId).trim() &&

    r['Password'] === hashPassword(data.password)

  );

  if (!user) return { success: false, message: 'Invalid ID or password.' };

  return { success: true, name: user['Name'], studentId: user['ID'], role: 'student' };

}



function loginInstructor(data) {

  const adminUser = 'admin';

  const adminPass = hashPassword('admin123');

  if (data.username === adminUser && hashPassword(data.password) === adminPass) {

    return { success: true, name: 'Instructor', role: 'instructor' };

  }

 

  const sheet = getSheet('Users');

  const rows = sheetToObjects(sheet);

  const user = rows.find(r =>

    String(r['Telegram_Username']).trim() === String(data.username).trim() &&

    r['Password'] === hashPassword(data.password) &&

    r['Role'] === 'instructor'

  );

  if (user) return { success: true, name: user['Name'], role: 'instructor' };

  return { success: false, message: 'Invalid credentials.' };

}



// ─── LEGACY COMPATIBILITY LOGIC SYSTEM HOOKS ─────────────────

function registerStudent(id, password) {

  id = id.toString().trim().toLowerCase();

  const authProfile = getAuthorizedProfile(id);

  if (!authProfile.authorized) return { success: false, message: "Denied from authorization ledger maps." };

 

  const sheet = getSheet("Users");

  const users = sheetToObjects(sheet);

  if (users.find(u => String(u['ID']).trim().toLowerCase() === id)) {

    return { success: false, message: "Account already instantiated." };

  }

 

  sheet.appendRow([id, hashPassword(password), authProfile.name, '', '', 'student']);

  return { success: true, message: "Account created." };

}



function loginUser(id, password) {

  id = id.trim().toLowerCase();

  if (id === "admin" && password.toString() === "admin123") {

    return { success: true, role: "admin", name: "System Administrator", id: "admin" };

  }

  const sheet = getSheet("Users");

  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {

    if (String(rows[i][0]).trim().toLowerCase() === id && rows[i][1].toString().trim() === hashPassword(password).trim()) {

      return { success: true, role: rows[i][5] ? String(rows[i][5]).toLowerCase() : "student", id: String(rows[i][0]).trim().toLowerCase(), name: rows[i][2] };

    }

  }

  return { success: false, message: "Incorrect login credentials matched." };

}



function getStudentMarksFromAllTabs(id) {

  const records = [];

  ["Geometric Design of Road and Streets (CEng 3201)", "Transport Planning and Modeling (CEng 2901)"].forEach(function(tab) {

    const sheet = getSheet(tab);

    if (!sheet) return;

    const rows = sheet.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {

      if (String(rows[i][0]).trim().toLowerCase() === id.toLowerCase()) {

        const tot = (parseFloat(rows[i][1])||0) + (parseFloat(rows[i][2])||0) + (parseFloat(rows[i][3])||0) + (parseFloat(rows[i][4])||0);

        records.push({ subject: tab, quiz: rows[i][1], mid: rows[i][2], assignment: rows[i][3], final: rows[i][4], total: tot.toFixed(2), grade: gradeOf(tot) });

        break;

      }

    }

  });

  return { success: true, data: records };

}



function updateStudentMarkInTab(id, subject, quiz, mid, assignment, finalMark, adminId, adminPassword) {

  if (adminId !== "admin" || adminPassword !== "admin123") return { success: false, message: "Unauthorized." };

  const sheet = getSheet(subject);

  if (!sheet) return { success: false, message: "Target course sheet missing." };

  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {

    if (String(rows[i][0]).trim().toLowerCase() === id.toLowerCase()) {

      sheet.getRange(i + 1, 2, 1, 4).setValues([[quiz, mid, assignment, finalMark]]);

      return { success: true, message: "Saved." };

    }

  }

  return { success: false, message: "Student record location not discovered." };

}



// ─── PORTAL WEB PIPELINE CONTROLLERS ─────────────────────────

function getMarks(data) {

  const courses = [

    'Geometric Design of Road and Streets (CEng 3201)',

    'Transport Planning and Modeling (CEng 2901)'

  ];

  const result = [];

  courses.forEach(course => {

    const sheet = getSheet(course);

    if (!sheet) return;

    const rows = sheetToObjects(sheet);

    const record = rows.find(r => String(r['StudentID'] || r['Student ID']).trim().toLowerCase() === String(data.studentId).trim().toLowerCase());

    if (record) {

      const q = Number(record['Quiz'] || record['Quiz (10%)'] || 0);

      const m = Number(record['Mid'] || record['Mid Exam (20%)'] || 0);

      const a = Number(record['Assignment'] || record['Assignment (20%)'] || 0);

      const f = Number(record['Final'] || record['Final Exam (50%)'] || 0);

      result.push({ course, quiz: q, mid: m, assignment: a, final: f, total: (q + m + a + f) });

    }

  });

  return { success: true, marks: result };

}



function submitComplaint(data) {

  let sheet = getSheet('Complaints');

  if (!sheet) {

    sheet = ss.insertSheet('Complaints');

    sheet.appendRow(['StudentID', 'Course', 'Type', 'Message', 'Status', 'Timestamp', 'Response']);

  }

  sheet.appendRow([data.studentId, data.course, data.type, data.message, 'Pending', new Date().toISOString(), '']);

  return { success: true, message: 'Complaint submitted successfully.' };

}



function getLectureNotes(data) {

  const sheet = getSheet('Lecture_Notes');

  if (!sheet) return { success: true, notes: [] };

  const rows = sheetToObjects(sheet);

  const filtered = data.course ? rows.filter(r => r['Course_Name'] || r['Course'] === data.course) : rows;

  return { success: true, notes: filtered };

}



function getAllLectureNotes() {

  const sheet = getSheet("Lecture_Notes");

  if (!sheet) return { success: false, message: "Notes database sheet absent." };

  const rows = sheet.getDataRange().getValues();

  const notes = [];

  for (let i = 1; i < rows.length; i++) {

    if (rows[i][0] || rows[i][1]) {

      notes.push({ course: rows[i][0], title: rows[i][1], url: rows[i][2] });

    }

  }

  return { success: true, data: notes };

}



function getOnlineTests(data) {

  const sheet = getSheet('Online_Tests');

  if (!sheet) return { success: true, questions: [] };

  const rows = sheetToObjects(sheet);

  const filtered = data.course ? rows.filter(r => r['Course_Name'] || r['Course'] === data.course) : rows;

   

  const sanitized = filtered.map((q, index) => ({

    course: q['Course_Name'] || q['Course'],

    question: q['Question_Text'] || q['Question'],

    optionA: q['Option_A'] || q['Option A'] || q['a'],

    optionB: q['Option_B'] || q['Option B'] || q['b'],

    optionC: q['Option_C'] || q['Option C'] || q['c'],

    optionD: q['Option_D'] || q['Option D'] || q['d'],

    id: Utilities.base64Encode(index + "_" + String(q['Question_Text'] || q['Question']).substring(0, 15))

  }));

  return { success: true, questions: sanitized };

}



function submitTestResult(data) {

  let sheet = getSheet('Test_Results') || ss.insertSheet('Test_Results');

  sheet.appendRow([data.studentId, data.course, data.score, data.total, new Date().toISOString()]);

  return { success: true, message: 'Test result saved.', score: data.score, total: data.total };

}



function chatbot(data) {

  const msg = (data.message || '').toLowerCase();

  let reply = "I can help with marks, online tests, lecture notes, and complaints. What do you need help with?";

  if (msg.includes('mark') || msg.includes('grade')) reply = 'To view your marks, go to "My Marks" from the dashboard.';

  if (msg.includes('test') || msg.includes('exam')) reply = 'Online tests are available under "Online Tests".';

  if (msg.includes('note') || msg.includes('lecture')) reply = 'Lecture notes can be downloaded from the "Lecture Notes" section.';

  if (msg.includes('complain')) reply = 'You can submit a complaint from "My Marks" page.';

  return { success: true, reply };

}



// ─── ADMINISTRATIVE ACTIONS PIPELINE MODULES ────────────────

function getDashboard(data) {

  const usersSheet = getSheet('Users');

  const users = sheetToObjects(usersSheet);

  const students = users.filter(u => u['Role'] !== 'instructor');



  const courses = [

    'Geometric Design of Road and Streets (CEng 3201)',

    'Transport Planning and Modeling (CEng 2901)'

  ];



  const stats = courses.map(course => {

    const sheet = getSheet(course);

    if (!sheet) return { course, count: 0, avgFinal: 0 };

    const rows = sheetToObjects(sheet);

    const finals = rows.map(r => Number(r['Final'] || r['Final Exam (50%)'] || 0)).filter(f => f > 0);

    const avg = finals.length ? (finals.reduce((a, b) => a + b, 0) / finals.length).toFixed(1) : 0;

    return { course, count: rows.length, avgFinal: avg };

  });



  const complaintsSheet = getSheet('Complaints');

  const pendingComplaints = complaintsSheet ? sheetToObjects(complaintsSheet).filter(c => c['Status'] === 'Pending').length : 0;



  return { success: true, totalStudents: students.length, courses: stats, pendingComplaints };

}



function getAllStudents(data) {

  const sheet = getSheet(data.course);

  if (!sheet) return { success: false, message: 'Course profile array missing.' };

  return { success: true, students: sheetToObjects(sheet) };

}



function updateMark(data) {

  const sheet = getSheet(data.course);

  if (!sheet) return { success: false, message: 'Course matrix target absent.' };

  const rows = sheet.getDataRange().getValues();

  const headers = rows[0];

  const sidIdx = headers.indexOf('StudentID') !== -1 ? headers.indexOf('StudentID') : headers.indexOf('Student ID');

 

  // Dynamic header cross match resolution mapping arrays

  let targetField = data.field;

  if (targetField === "Quiz" && headers.indexOf("Quiz (10%)") !== -1) targetField = "Quiz (10%)";

  if (targetField === "Mid" && headers.indexOf("Mid Exam (20%)") !== -1) targetField = "Mid Exam (20%)";

  if (targetField === "Assignment" && headers.indexOf("Assignment (20%)") !== -1) targetField = "Assignment (20%)";

  if (targetField === "Final" && headers.indexOf("Final Exam (50%)") !== -1) targetField = "Final Exam (50%)";



  const colIdx = headers.indexOf(targetField);



  for (let i = 1; i < rows.length; i++) {

    if (String(rows[i][sidIdx]).trim().toLowerCase() === String(data.studentId).trim().toLowerCase()) {

      if (colIdx !== -1) {

        sheet.getRange(i + 1, colIdx + 1).setValue(data.value);

        return { success: true, message: 'Mark updated.' };

      }

    }

  }

  return { success: false, message: 'Student row parameters unlocated.' };

}



function uploadQuestion(data) {

  const sheet = getSheet('Online_Tests');

  sheet.appendRow([data.course, data.question, data.optionA, data.optionB, data.optionC, data.optionD, data.correctAnswer]);

  return { success: true, message: 'Question uploaded.' };

}



function uploadLectureNote(data) {

  const sheet = getSheet('Lecture_Notes');

  sheet.appendRow([data.course, data.title, data.url]);

  return { success: true, message: 'Lecture note uploaded.' };

}



function adminUploadLectureNote(course, title, url, adminId, adminPassword) {

  if (adminId !== "admin" || adminPassword !== "admin123") return { success: false, message: "Unauthorized." };

  getSheet("Lecture_Notes").appendRow([course, title, url]);

  return { success: true, message: "Material published!" };

}



function adminAddExamQuestion(course, question, a, b, c, d, correct, timerMinutes, adminId, adminPassword) {

  if (adminId !== "admin" || adminPassword !== "admin123") return { success: false, message: "Unauthorized." };

  getSheet("Online_Tests").appendRow([course, question, a, b, c, d, correct.toUpperCase().trim(), timerMinutes || 15]);

  return { success: true, message: "Question mapped safely." };

}



function studentFetchExamPaper(course) {

  const sheet = getSheet("Online_Tests");

  if (!sheet) return { success: false, message: "Missing testing repository." };

  const rows = sheet.getDataRange().getValues();

  const paper = [];

  for (let i = 1; i < rows.length; i++) {

    if (rows[i][0].toString().trim().toLowerCase() === course.toLowerCase()) {

      paper.push({ question: rows[i][1], a: rows[i][2], b: rows[i][3], c: rows[i][4], d: rows[i][5], correct: rows[i][6], timer: rows[i][7] || 15 });

    }

  }

  return { success: true, questions: paper };

}



function sendNotice(data) {

  let sheet = getSheet('Notices') || ss.insertSheet('Notices');

  sheet.appendRow([data.title, data.message, new Date().toISOString(), 'Instructor']);

  return { success: true, message: 'Notice sent.' };

}



function getComplaints(data) {

  const sheet = getSheet('Complaints');

  if (!sheet) return { success: true, complaints: [] };

  return { success: true, complaints: sheetToObjects(sheet) };

}



function resolveComplaint(data) {

  const sheet = getSheet('Complaints');

  if (!sheet) return { success: false, message: 'No complaints ledger active.' };

  const rows = sheet.getDataRange().getValues();

  const headers = rows[0];

  const statusIdx = headers.indexOf('Status');

  const responseIdx = headers.indexOf('Response');

  const sidIdx = headers.indexOf('StudentID') !== -1 ? headers.indexOf('StudentID') : headers.indexOf('Student ID');

  const tsIdx = headers.indexOf('Timestamp');



  for (let i = 1; i < rows.length; i++) {

    if (String(rows[i][tsIdx]) === String(data.timestamp) && String(rows[i][sidIdx]).trim().toLowerCase() === String(data.studentId).trim().toLowerCase()) {

      if (statusIdx !== -1) sheet.getRange(i + 1, statusIdx + 1).setValue(data.status);

      if (responseIdx !== -1) sheet.getRange(i + 1, responseIdx + 1).setValue(data.response || '');

      return { success: true, message: 'Complaint resolved.' };

    }

  }

  return { success: false, message: 'Complaint entry context not discovered.' };

}



function getCourses(data) {

  return { success: true, courses: ['Geometric Design of Road and Streets (CEng 3201)', 'Transport Planning and Modeling (CEng 2901)'] };

}



function getNotices(data) {

  const sheet = getSheet('Notices');

  if (!sheet) return { success: true, notices: [] };

  return { success: true, notices: sheetToObjects(sheet) };

}



function getGridForCourse(subject, adminId, adminPassword) {

  if (adminId !== "admin" || adminPassword !== "admin123") return { success: false, message: "Unauthorized." };

  const sheet = getSheet(subject);

  if (!sheet) return { success: false, message: "Sheet not found." };

  const rows = sheet.getDataRange().getValues();

  const data = [];

  for (let i = 1; i < rows.length; i++) {

    if (!rows[i][0]) continue;

    const total = (parseFloat(rows[i][1])||0) + (parseFloat(rows[i][2])||0) + (parseFloat(rows[i][3])||0) + (parseFloat(rows[i][4])||0);

    data.push({

      id: rows[i][0].toString(), quiz: rows[i][1], mid: rows[i][2], assignment: rows[i][3], final: rows[i][4],

      total: total.toFixed(2), grade: gradeOf(total)

    });

  }

  return { success: true, data: data };

}



function gradeOf(total) {

  if (total >= 90) return "A";

  if (total >= 80) return "B";

  if (total >= 70) return "C";

  if (total >= 60) return "D";

  return "F";

}



// ═══════════════════════════════════════════════════════════

// TELEGRAM EDUCATIONAL HUB BOT MODULE ENGINE

// ═══════════════════════════════════════════════════════════

function handleBot(message) {

  const chatId = message.chat.id;

  const text   = message.text ? message.text.trim() : "";

  const telegramUsername = message.from && message.from.username ? message.from.username.toLowerCase().trim() : "";



  const menuMain   = [["🔑 Log In", "📝 Register"], ["🔄 Forgot Password"]];

  const menuCourse = [["🛣️ CEng 3201", "🚌 CEng 2901"], ["🔒 Log Out"]];

  const menuBack   = [["🔙 Back to Main Menu"]];

 

  const menuAdmin  = [["📋 View Global Marks Grid", "➕ Publish Grades Now"], ["📚 Upload Lecture Notes", "⚙️ Create New Course"], ["🔒 Log Out"]];

  const menuAdminSelectCourse = [["🛣️ CEng 3201 Sheet", "🚌 CEng 2901 Sheet"], ["🔙 Admin Dashboard"]];



  if (text === "/start" || text === "🔙 Back to Main Menu") {

    clearBotSession(chatId);

    sendMsg(chatId, "👋 *Welcome to Ambo University Educational Portal Bot!*\n\n👇 Choose an option from the menu below:", menuMain);

    return;

  }



  if (text === "/logout" || text === "🔒 Log Out") {

    saveSession(chatId, "", "IDLE", "");

    sendMsg(chatId, "🔒 *Logged out safely.* All secure operational dashboards closed.", menuMain);

    return;

  }



  if (text === "🔑 Log In" || text === "/login") {

    saveSession(chatId, "", "NEED_ID", "");

    sendMsg(chatId, "🆔 Please type your *User Configuration ID Number*:", menuBack);

    return;

  }



  if (text === "📝 Register" || text === "/register") {

    saveSession(chatId, "", "REG_NEED_ID", "");

    sendMsg(chatId, "📝 Please type your *Student ID* to begin profile verification:", menuBack);

    return;

  }



  if (text === "🔄 Forgot Password") {

    saveSession(chatId, "", "RESET_NEED_ID", "");

    sendMsg(chatId, "🔄 Enter your registered *Student ID* to request a password reset code:", menuBack);

    return;

  }



  const s = getSession(chatId);



  // ── BOT LOGIN STATE WHEELS ────────────────────────────────

  if (s.status === "NEED_ID") {

    saveSession(chatId, text.toLowerCase().trim(), "NEED_PWD", "");

    sendMsg(chatId, "🔑 Got it. Now type your account *Password*:", menuBack);

    return;

  }



  if (s.status === "NEED_PWD") {

    const result = loginUser(s.uid, text);

    if (result.success) {

      if (result.role === "admin") {

        saveSession(chatId, "admin", "ADMIN_HOME", "System Administrator");

        sendMsg(chatId, "👑 *Welcome back, Instructor!*\n\nSecure operational deck verified. Use the dashboard controls below to manage the platform directly:", menuAdmin);

        return;

      }

      if (telegramUsername !== "") bindTelegramHandleToUser(result.id, telegramUsername, chatId);

      saveSession(chatId, result.id, "AUTH", result.name);

      sendMsg(chatId, "✅ *Welcome, " + result.name + "!*\n\n👇 Select an active course hub room below:", menuCourse);

    } else {

      saveSession(chatId, "", "IDLE", "");

      sendMsg(chatId, "❌ *Login failed.* Incorrect ID or password.", menuMain);

    }

    return;

  }



  // ── BOT REGISTRATION RUNSTATES ─────────────────────────────

  if (s.status === "REG_NEED_ID") {

    const uid = text.toLowerCase().trim();

    const studentInfo = getAuthorizedProfile(uid);

    if (!studentInfo.authorized) {

      saveSession(chatId, "", "IDLE", "");

      sendMsg(chatId, "❌ *ID not verified* in the administrative authorization records.", menuMain);

      return;

    }

    if (doesAccountExist(uid)) {

      saveSession(chatId, "", "IDLE", "");

      sendMsg(chatId, "⚠️ Account already initialized for this ID. Tap *🔑 Log In* to sign in.", menuMain);

      return;

    }

    saveSession(chatId, uid, "REG_NEED_PWD", studentInfo.name);

    sendMsg(chatId, "✅ ID verified for *" + studentInfo.name + "*.\n\nNow choose and send a strong account *Password*:", menuBack);

    return;

  }



  if (s.status === "REG_NEED_PWD") {

    const regRes = registerStudent(s.uid, text.trim());

    if (regRes.success) {

      if (telegramUsername !== "") bindTelegramHandleToUser(s.uid, telegramUsername, chatId);

      saveSession(chatId, "", "IDLE", "");

      sendMsg(chatId, "🎉 *Account Created Successfully!*\n\n👇 Tap *🔑 Log In* below to proceed:", menuMain);

    } else {

      saveSession(chatId, "", "IDLE", "");

      sendMsg(chatId, "⚠️ Exception triggered: " + regRes.message, menuMain);

    }

    return;

  }



  // ── BOT PASSWORD RESET CONTEXTS ────────────────────────────

  if (s.status === "RESET_NEED_ID") {

    const uid = text.toLowerCase().trim();

    const userProfile = getUserProfileRow(uid);

    if (!userProfile.exists) {

      saveSession(chatId, "", "IDLE", "");

      sendMsg(chatId, "❌ *Account does not exist* under that Student ID.", menuMain);

      return;

    }

    if (!userProfile.telegramUsername) {

      saveSession(chatId, "", "IDLE", "");

      sendMsg(chatId, "⚠️ *Security Reset Error:* No verified Telegram account handle linked to this profile ID.", menuMain);

      return;

    }



    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    saveOTPRecord(chatId, uid, generatedOtp, "RESET");

    saveSession(chatId, uid, "RESET_NEED_OTP", userProfile.name);



    let secureOtpText = "🔐 *Security Password Reset Notification*\n\nYour One-Time Password Verification Pin is: `" + generatedOtp + "`";

    sendMsg(userProfile.savedChatId, secureOtpText, null);

    sendMsg(chatId, "📲 Verification security code has been sent **privately** to the user linked to ID: `" + uid.toUpperCase() + "`.\n\nEnter that *6-Digit Code* here:", menuBack);

    return;

  }



  if (s.status === "RESET_NEED_OTP") {

    if (verifyOTPRecord(chatId, s.uid, text, "RESET")) {

      saveSession(chatId, s.uid, "RESET_NEW_PWD", s.name);

      sendMsg(chatId, "✅ Verification code validated. Enter your *New Secure Password*:", menuBack);

    } else {

      sendMsg(chatId, "❌ *Invalid or expired token match entry.* Try again:", menuBack);

    }

    return;

  }



  if (s.status === "RESET_NEW_PWD") {

    updatePasswordInRegistry(s.uid, hashPassword(text.trim()));

    clearOTPRecord(chatId);

    saveSession(chatId, "", "IDLE", "");

    sendMsg(chatId, "🔒 *Password Updated Successfully!* Please select *🔑 Log In* to continue.", menuMain);

    return;

  }



  // ── BOT INSTRUCTOR COMMAND CONTROL ACTIONS ─────────────────

  if (s.status.startsWith("ADMIN_")) {

    if (text === "🔙 Admin Dashboard") {

      saveSession(chatId, "admin", "ADMIN_HOME", "System Administrator");

      sendMsg(chatId, "👑 Returned to Administration Core. Select an action command:", menuAdmin);

      return;

    }



    if (s.status === "ADMIN_HOME") {

      if (text === "📋 View Global Marks Grid") {

        saveSession(chatId, "admin", "ADMIN_SELECT_VIEW_COURSE", "System Administrator");

        sendMsg(chatId, "🔍 Select which course performance ledger matrix you want to read:", menuAdminSelectCourse);

        return;

      }

      if (text === "➕ Publish Grades Now") {

        saveSession(chatId, "admin", "ADMIN_INPUT_ID", "System Administrator");

        sendMsg(chatId, "➕ *Publish Continuous Assessment Mark*\n\nPlease type the target *Student ID Number*:", [["🔙 Admin Dashboard"]]);

        return;

      }

      if (text === "📚 Upload Lecture Notes") {

        saveSession(chatId, "admin", "ADMIN_NOTE_COURSE", "System Administrator");

        sendMsg(chatId, "📚 *Upload New Lecture Notes*\n\nPlease select target course assignment:\n\n1. `Geometric Design of Road and Streets (CEng 3201)`\n2. `Transport Planning and Modeling (CEng 2901)`", [["🔙 Admin Dashboard"]]);

        return;

      }

      if (text === "⚙️ Create New Course") {

        saveSession(chatId, "admin", "ADMIN_CREATE_COURSE_NAME", "System Administrator");

        sendMsg(chatId, "⚙️ *Course Builder & Filter Automation Machine*\n\nPlease enter the **New Course Name & Code** to construct for next semester (e.g., `Advanced Highway Engineering (CEng 4202)`):", [["🔙 Admin Dashboard"]]);

        return;

      }

    }



    if (s.status === "ADMIN_SELECT_VIEW_COURSE") {

      if (text === "🛣️ CEng 3201 Sheet") { adminCompileAndSendGlobalGrids(chatId, "Geometric Design of Road and Streets (CEng 3201)"); return; }

      if (text === "🚌 CEng 2901 Sheet") { adminCompileAndSendGlobalGrids(chatId, "Transport Planning and Modeling (CEng 2901)"); return; }

    }



    if (s.status === "ADMIN_INPUT_ID") {

      saveSession(chatId, "admin|" + text.trim().toLowerCase(), "ADMIN_INPUT_COURSE", "System Administrator");

      sendMsg(chatId, "📚 ID verified. Type the target course sheet name exactly:\n\n`Geometric Design of Road and Streets (CEng 3201)`\n`Transport Planning and Modeling (CEng 2901)`", [["🔙 Admin Dashboard"]]);

      return;

    }

    if (s.status === "ADMIN_INPUT_COURSE") {

      saveSession(chatId, s.uid + "|" + text.trim(), "ADMIN_INPUT_MARKS", "System Administrator");

      sendMsg(chatId, "📝 Enter components separated by commas:\n\n`Quiz, Mid, Assignment, Final`\n\n*Example:* `8.5, 17, 19, 44`", [["🔙 Admin Dashboard"]]);

      return;

    }

    if (s.status === "ADMIN_INPUT_MARKS") {

      const parts = s.uid.split("|"); const targetId = parts[1]; const targetCourse = parts[2]; const marksArray = text.split(",");

      if (marksArray.length !== 4) { sendMsg(chatId, "❌ Error! Supply exactly 4 values separated by commas:", [["🔙 Admin Dashboard"]]); return; }

      const q = parseFloat(marksArray[0].trim()) || 0; const m = parseFloat(marksArray[1].trim()) || 0; const a = parseFloat(marksArray[2].trim()) || 0; const f = parseFloat(marksArray[3].trim()) || 0;

      let pushResult = updateStudentMarkInTab(targetId, targetCourse, q, m, a, f, "admin", "admin123");

      saveSession(chatId, "admin", "ADMIN_HOME", "System Administrator");

      sendMsg(chatId, pushResult.success ? "🎉 **Success:** " + pushResult.message : "❌ **Failed:** " + pushResult.message, menuAdmin);

      return;

    }



    if (s.status === "ADMIN_NOTE_COURSE") {

      saveSession(chatId, "admin|" + text.trim(), "ADMIN_NOTE_TITLE", "System Administrator");

      sendMsg(chatId, "📝 Type and send the **Topic Title**:", [["🔙 Admin Dashboard"]]); return;

    }

    if (s.status === "ADMIN_NOTE_TITLE") {

      saveSession(chatId, s.uid + "|" + text.trim(), "ADMIN_NOTE_URL", "System Administrator");

      sendMsg(chatId, "🔗 Paste and send the **Cloud Download URL Link**:", [["🔙 Admin Dashboard"]]); return;

    }

    if (s.status === "ADMIN_NOTE_URL") {

      const parts = s.uid.split("|"); let uploadResult = adminUploadLectureNote(parts[1], parts[2], text.trim(), "admin", "admin123");

      saveSession(chatId, "admin", "ADMIN_HOME", "System Administrator");

      sendMsg(chatId, uploadResult.success ? "🎉 **Success:** " + uploadResult.message : "❌ **Upload Failed:** " + uploadResult.message, menuAdmin);

      return;

    }



    if (s.status === "ADMIN_CREATE_COURSE_NAME") {

      saveSession(chatId, "admin|" + text.trim(), "ADMIN_CREATE_COURSE_FILTER", "System Administrator");

      const menuSourceChoices = [["🛣️ CEng 3201 Source"], ["🚌 CEng 2901 Source"], ["🔙 Admin Dashboard"]];

      sendMsg(chatId, "🎯 **Select Automation Nomination Rule Strategy Filter**:", menuSourceChoices);

      return;

    }

    if (s.status === "ADMIN_CREATE_COURSE_FILTER") {

      const parts = s.uid.split("|");

      const newCourseName = parts[1];

      let baselineSourceTab = text.trim();

      if (baselineSourceTab === "🛣️ CEng 3201 Source") baselineSourceTab = "Geometric Design of Road and Streets (CEng 3201)";

      if (baselineSourceTab === "🚌 CEng 2901 Source") baselineSourceTab = "Transport Planning and Modeling (CEng 2901)";



      let buildOutcome = executeDynamicCourseNominatorChain(newCourseName, baselineSourceTab);

      saveSession(chatId, "admin", "ADMIN_HOME", "System Administrator");

      sendMsg(chatId, buildOutcome.success ? "🎉 **Success!**\n\n" + buildOutcome.message : "❌ **Builder Exception:** " + buildOutcome.message, menuAdmin);

      return;

    }

  }



  // ── BOT AUTHENTICATED STUDENT COURSE ROOM SELECTION ───────

  if (s.status === "AUTH") {

    const courseSubMenu = [["📊 View My Marks", "📚 Download Notes"], ["📝 Take Online Test", "🔙 Back to Course List"]];

    if (text === "🔙 Back to Course List") {

      saveSession(chatId, s.uid, "AUTH", s.name);

      sendMsg(chatId, "👋 Select a course hub room below:", menuCourse);

      return;

    }

   

    if (text === "🛣️ CEng 3201" || text === "🚌 CEng 2901" || nominatedInDynamicTabMatch(s.uid, text)) {

      let targetCourse = text;

      if (text === "🛣️ CEng 3201") targetCourse = "Geometric Design of Road and Streets (CEng 3201)";

      if (text === "🚌 CEng 2901") targetCourse = "Transport Planning and Modeling (CEng 2901)";

     

      if (!nominatedInTab(s.uid, targetCourse)) { sendMsg(chatId, "⚠️ You are not nominated for this room profile context row.", menuCourse); return; }

      saveSession(chatId, s.uid, "COURSE_HUB:" + targetCourse, s.name);

      sendMsg(chatId, "🏫 Entered **" + targetCourse + "** Hub Room.\n\n👇 Choose an activity below:", courseSubMenu); return;

    }

  }



  // ── BOT STUDENT ACTIVE ROOM HUB COMMAND STRINGS ────────────

  if (s.status.startsWith("COURSE_HUB:")) {

    const currentCourse = s.status.split(":")[1];

    const courseSubMenu = [["📊 View My Marks", "📚 Download Notes"], ["📝 Take Online Test", "🔙 Back to Course List"]];

    if (text === "🔙 Back to Course List") { saveSession(chatId, s.uid, "AUTH", s.name); sendMsg(chatId, "👋 Returned to list view:", menuCourse); return; }

    if (text === "📊 View My Marks") { sendMarks(chatId, s.uid, currentCourse); return; }

   

    if (text === "📚 Download Notes") {

      fetchAndSendLectureNotes(chatId, currentCourse); return;

    }

    if (text === "📝 Take Online Test") {

      sendMsg(chatId, "⚠️ *Not Published Yet.*", courseSubMenu); return;

    }

  }



  let chatResponse = runConversationalAI(text);

  let activeMenuKeyboard = s.status.startsWith("COURSE_HUB:") ? [["📊 View My Marks", "📚 Download Notes"], ["📝 Take Online Test", "🔙 Back to Course List"]] : (s.status === "AUTH" ? menuCourse : (s.status.startsWith("ADMIN_") ? menuAdmin : menuMain));

  sendMsg(chatId, chatResponse, activeMenuKeyboard);

}



// ─── FILTER AND AUTOMATION MATRIX EXTENSION LOADER ──────────

function executeDynamicCourseNominatorChain(newCourseName, sourceBaselineTab) {

  try {

    let targetSheet = getSheet(newCourseName);

    if (!targetSheet) {

      targetSheet = ss.insertSheet(newCourseName);

      targetSheet.appendRow(["Student ID", "Quiz (10%)", "Mid Exam (20%)", "Assignment (20%)", "Final Exam (50%)"]);

    }

   

    let sourceSheet = getSheet(sourceBaselineTab);

    if (!sourceSheet) return { success: false, message: "Source tab metric array block not located." };

   

    let baselineRows = sourceSheet.getDataRange().getValues();

    let nominationCounter = 0;

   

    for (let i = 1; i < baselineRows.length; i++) {

      let studentId = baselineRows[i][0].toString().trim().toLowerCase();

      if (!studentId) continue;

     

      let quizMark   = parseFloat(baselineRows[i][1]) || 0;

      let midMark    = parseFloat(baselineRows[i][2]) || 0;

      let assignMark = parseFloat(baselineRows[i][3]) || 0;

      let finalMark  = parseFloat(baselineRows[i][4]) || 0;

     

      let compositeTotalScore = quizMark + midMark + assignMark + finalMark;

     

      if (compositeTotalScore >= 70.0) {

        let internalRows = targetSheet.getDataRange().getValues();

        let alreadyNominated = false;

        for (let k = 0; k < internalRows.length; k++) {

          if (internalRows[k][0].toString().trim().toLowerCase() === studentId) { alreadyNominated = true; break; }

        }

       

        if (!alreadyNominated) {

          targetSheet.appendRow([studentId, 0, 0, 0, 0]);

          nominationCounter++;

        }

      }

    }

    return { success: true, message: "Constructed sheet `" + newCourseName + "` and auto-nominated [" + nominationCounter + "] students matching C grade filters." };

  } catch(err) {

    return { success: false, message: err.toString() };

  }

}



function adminCompileAndSendGlobalGrids(chatId, courseTabSheet) {

  const sheet = getSheet(courseTabSheet);

  const menuAdminSelectCourse = [["🛣️ CEng 3201 Sheet", "🚌 CEng 2901 Sheet"], ["🔙 Admin Dashboard"]];

  if (!sheet) { sendMsg(chatId, "⚠️ Sheet target `" + courseTabSheet + "` missing.", menuAdminSelectCourse); return; }

  const rows = sheet.getDataRange().getValues();

  if (rows.length <= 1) { sendMsg(chatId, "ℹ️ Repository empty.", menuAdminSelectCourse); return; }

 

  let gridDump = "📊 **Master Grid: " + courseTabSheet + "**\n━━━━━━━━━━━━━━━━━━━━\n\n";

  for (let i = 1; i < rows.length; i++) {

    const tot = (parseFloat(rows[i][1])||0) + (parseFloat(rows[i][2])||0) + (parseFloat(rows[i][3])||0) + (parseFloat(rows[i][4])||0);

    gridDump += "🆔 **ID:** `" + rows[i][0].toString().toUpperCase() + "`\n📍 Q:" + rows[i][1] + " | M:" + rows[i][2] + " | A:" + rows[i][3] + " | F:" + rows[i][4] + "\n📈 **Total:** " + tot.toFixed(2) + " ➔ **[" + gradeOf(tot) + "]**\n────────────────────\n";

  }

  sendMsg(chatId, gridDump, menuAdminSelectCourse);

}



function runConversationalAI(inputPhrase) {

  let query = inputPhrase.toLowerCase();

  if (query.includes("hello") || query.includes("hi")) return "🤖 *Hello!* I am your AI portal assistant. Use the operational menu keyboard buttons to execute actions loop queries.";

  return "ℹ️ Unrecognized text sentence expression context parameter. Select a custom layout menu button below to run tasks.";

}



function fetchAndSendLectureNotes(chatId, courseName) {

  const courseSubMenu = [["📊 View My Marks", "📚 Download Notes"], ["📝 Take Online Test", "🔙 Back to Course List"]];

  const sheet = getSheet("Lecture_Notes");

  if (!sheet) { sendMsg(chatId, "⚠️ Notes repository unavailable.", courseSubMenu); return; }

  const rows = sheetToObjects(sheet);

  const filtered = rows.filter(r => String(r['Course_Name'] || r['Course']).trim().toLowerCase() === courseName.toLowerCase().trim());

 

  if (filtered.length === 0) {

    sendMsg(chatId, "📚 *No lecture notes published yet* for this course track.", courseSubMenu);

    return;

  }

 

  let msg = "📚 *Available Lecture Notes for " + courseName + ":*\n━━━━━━━━━━━━━━━━━━━━\n\n";

  filtered.forEach((note, index) => {

    msg += (index + 1) + ". 📝 *" + (note['Title_Name'] || note['title'] || "Unit Topic") + "*\n🔗 [Download Link](" + (note['URL_Link'] || note['url']) + ")\n────────────────────\n";

  });

  sendMsg(chatId, msg, courseSubMenu);

}



function getUserProfileRow(uid) {

  const sheet = getSheet("Users");

  if (!sheet) return { exists: false };

  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {

    if (rows[i][0].toString().trim().toLowerCase() === uid.toLowerCase()) return { exists: true, name: rows[i][2], telegramUsername: rows[i][3], savedChatId: rows[i][4] };

  }

  return { exists: false };

}



function bindTelegramHandleToUser(uid, username, chatId) {

  const sheet = getSheet("Users");

  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {

    if (rows[i][0].toString().trim().toLowerCase() === uid.toLowerCase()) {

      sheet.getRange(i + 1, 4).setValue(username);

      sheet.getRange(i + 1, 5).setValue(chatId);

      break;

    }

  }

}



function getAuthorizedProfile(uid) {

  const sheet = getSheet("Authorized_IDs");

  if (!sheet) return { authorized: false };

  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {

    if (rows[i][0].toString().trim().toLowerCase() === uid.toLowerCase()) return { authorized: true, name: rows[i][1] };

  }

  return { authorized: false };

}



function doesAccountExist(uid) {

  const sheet = getSheet("Users");

  if (!sheet) return false;

  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {

    if (rows[i][0].toString().trim().toLowerCase() === uid.toLowerCase()) return true;

  }

  return false;

}



function updatePasswordInRegistry(uid, hashedNewPassword) {

  const sheet = getSheet("Users");

  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {

    if (rows[i][0].toString().trim().toLowerCase() === uid.toLowerCase()) {

      sheet.getRange(i + 1, 2).setValue(hashedNewPassword);

      break;

    }

  }

}



function saveOTPRecord(chatId, studentId, otp, purpose) {

  const sheet = getSheet("OTP_Verification");

  const rows = sheet.getDataRange().getValues();

  const timestamp = new Date().getTime();

  for (let i = 1; i < rows.length; i++) {

    if (rows[i][0].toString() === chatId.toString()) {

      sheet.getRange(i + 1, 1, 1, 5).setValues([[chatId, studentId, otp, timestamp, purpose]]);

      return;

    }

  }

  sheet.appendRow([chatId, studentId, otp, timestamp, purpose]);

}



function verifyOTPRecord(chatId, studentId, inputOtp, purpose) {

  const sheet = getSheet("OTP_Verification");

  if (!sheet) return false;

  const rows = sheet.getDataRange().getValues();

  const currentTime = new Date().getTime();

  for (let i = 1; i < rows.length; i++) {

    if (rows[i][0].toString() === chatId.toString() && rows[i][2].toString().trim() === inputOtp.toString().trim() && rows[i][4].toString() === purpose) {

      if (currentTime - parseFloat(rows[i][3]) <= 300000) return true;

    }

  }

  return false;

}



function clearOTPRecord(chatId) {

  const sheet = getSheet("OTP_Verification");

  if (!sheet) return;

  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {

    if (rows[i][0].toString() === chatId.toString()) {

      sheet.deleteRow(i + 1);

      break;

    }

  }

}



function getSession(chatId) {

  const sheet = getSheet("Bot_Sessions");

  if (!sheet) return { uid: "", status: "IDLE", name: "" };

  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {

    if (rows[i][0].toString() === chatId.toString()) return { uid: rows[i][1] ? rows[i][1].toString().trim() : "", status: rows[i][2] ? rows[i][2].toString().trim() : "IDLE", name: rows[i][3] ? rows[i][3].toString().trim() : "" };

  }

  return { uid: "", status: "IDLE", name: "" };

}



function saveSession(chatId, uid, status, name) {

  let sheet = getSheet("Bot_Sessions");

  if (!sheet) return;

  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {

    if (rows[i][0].toString() === chatId.toString()) {

      sheet.getRange(i + 1, 1, 1, 4).setValues([[chatId, uid, status, name]]);

      return;

    }

  }

  sheet.appendRow([chatId, uid, status, name]);

}



function clearBotSession(chatId) {

  saveSession(chatId, "", "IDLE", "");

}



function nominatedInTab(uid, tabName) {

  const sheet = getSheet(tabName);

  if (!sheet) return false;

  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {

    if (rows[i][0] && rows[i][0].toString().trim().toLowerCase() === uid.toLowerCase()) return true;

  }

  return false;

}



function nominatedInDynamicTabMatch(uid, textInput) {

  return nominatedInTab(uid, textInput);

}



function sendMarks(chatId, uid, tabName) {

  const courseSubMenu = [["📊 View My Marks", "📚 Download Notes"], ["📝 Take Online Test", "🔙 Back to Course List"]];

  const sheet = getSheet(tabName);

  if (!sheet) return;

  const rows = sheet.getDataRange().getValues();

  const headers = rows[0];

 

  const qIdx = headers.indexOf("Quiz (10%)") !== -1 ? headers.indexOf("Quiz (10%)") : 1;

  const mIdx = headers.indexOf("Mid Exam (20%)") !== -1 ? headers.indexOf("Mid Exam (20%)") : 2;

  const aIdx = headers.indexOf("Assignment (20%)") !== -1 ? headers.indexOf("Assignment (20%)") : 3;

  const fIdx = headers.indexOf("Final Exam (50%)") !== -1 ? headers.indexOf("Final Exam (50%)") : 4;



  for (let i = 1; i < rows.length; i++) {

    if (rows[i][0].toString().trim().toLowerCase() === uid.toLowerCase()) {

      const q = parseFloat(rows[i][qIdx]) || 0;

      const m = parseFloat(rows[i][mIdx]) || 0;

      const a = parseFloat(rows[i][aIdx]) || 0;

      const f = parseFloat(rows[i][fIdx]) || 0;

      const tot = q + m + a + f;

     

      sendMsg(chatId, "📊 *" + tabName + " — Marks*\n\n🔸 *Quiz:* " + q + "\n🔸 *Mid Exam:* " + m + "\n🔸 *Assignment:* " + a + "\n🔸 *Final Exam:* " + f + "\n━━━━━━━━━━━━━━━━━━━━\n📈 *Total:* " + tot.toFixed(2) + " / 100\n🏆 *Grade:* " + gradeOf(tot), courseSubMenu);

      return;

    }

  }

  sendMsg(chatId, "⚠️ No metrics input yet published to this track.", courseSubMenu);

}



// ─── TRANSMISSION DISPATCH DATA PIPELINES ───────────────────

function sendMsg(chatId, text, keyboard) {

  if (!chatId) return;

  const payload = {

    method: "sendMessage",

    chat_id: chatId,

    text: text,

    parse_mode: "Markdown",

    disable_web_page_preview: true,

    reply_markup: keyboard ? JSON.stringify({ keyboard: keyboard, resize_keyboard: true, one_time_keyboard: false }) : JSON.stringify({ remove_keyboard: true })

  };

  try {

    UrlFetchApp.fetch(TELEGRAM_API + "/", { method: "post", contentType: "application/json", payload: JSON.stringify(payload) });

  } catch(e) {}

}



function registerBotWebhook() {

  // Automatically resolves the active web app deployment link tracking parameters

  const url = ScriptApp.getService().getUrl();

  if (!url) {

    Logger.log("Error: Deploy your script as a Web App first to fetch a valid Webhook URL.");

    return;

  }

  const response = UrlFetchApp.fetch(TELEGRAM_API + "/setWebhook?url=" + url).getContentText();

  Logger.log("Webhook Connection Status: " + response);

}.
