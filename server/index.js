const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const db = require('./db');
const { notify, interviewProposed, slotPicked } = require('./notify');

const app = express();
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'linkwork-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' },
}));

const UPLOAD_ROOT = path.join(__dirname, 'uploads');
fs.mkdirSync(path.join(UPLOAD_ROOT, 'photos'), { recursive: true });
app.use('/uploads', express.static(UPLOAD_ROOT));
const photoUpload = multer({
  storage: multer.diskStorage({
    destination: path.join(UPLOAD_ROOT, 'photos'),
    filename: (req, file, cb) => cb(null, `u${req.session.user.id}-${Date.now()}${path.extname(file.originalname) || '.jpg'}`),
  }),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\/(png|jpe?g|webp)$/.test(file.mimetype)),
});

// ---------- helpers ----------
const POLICY_VERSION = '2026-07-21';
const STAGES = ['applied', 'skill_test', 'ai_interview', 'company_test', 'hr_interview', 'tech_interview', 'hired'];
const nextStage = (s) => STAGES[Math.min(STAGES.indexOf(s) + 1, STAGES.length - 1)];

function requireAuth(role) {
  return (req, res, next) => {
    if (!req.session.user) return res.status(401).json({ error: 'Sign in to continue.' });
    if (role && req.session.user.role !== role) return res.status(403).json({ error: 'Not allowed for your account type.' });
    next();
  };
}
function publicUser(u) {
  if (!u) return u;
  const base = { id: u.id, role: u.role, email: u.email, name: u.name, university_id: u.university_id, faculty_id: u.faculty_id, major: u.major, education_level: u.education_level, doc_status: u.doc_status, phone: u.phone, photo_path: u.photo_path };
  if (u.role === 'company') {
    const comp = db.prepare('SELECT name, website, description FROM companies WHERE owner_user_id = ?').get(u.id);
    if (comp) Object.assign(base, { company_name: comp.name, website: comp.website, description: comp.description });
  }
  return base;
}

// ---------- meta ----------
app.get('/api/meta', (req, res) => {
  const universities = db.prepare('SELECT id, name, domains FROM universities').all();
  const faculties = db.prepare('SELECT id, university_id, name FROM faculties').all();
  const majors = db.prepare('SELECT id, faculty_id, name, min_level FROM majors ORDER BY name').all();
  res.json({ universities, faculties, majors });
});

// ---------- auth ----------
app.post('/api/auth/register-student', (req, res) => {
  const { email, password, name, faculty_id, major, education_level, terms_accepted } = req.body || {};
  if (!email || !password || !name || !faculty_id || !major || !education_level) return res.status(400).json({ error: 'All fields are required.' });
  if (!terms_accepted) return res.status(400).json({ error: 'You must accept the Terms of Service and Privacy Policy to register.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  const domain = String(email).split('@')[1]?.toLowerCase();
  const uni = db.prepare('SELECT * FROM universities').all()
    .find(u => u.domains.split(',').map(d => d.trim().toLowerCase()).includes(domain));
  if (!uni) return res.status(400).json({ error: 'Use your official university email address. This platform is invite-only per university.' });

  const fac = db.prepare('SELECT * FROM faculties WHERE id = ? AND university_id = ?').get(faculty_id, uni.id);
  if (!fac) return res.status(400).json({ error: 'Select a faculty belonging to your university.' });
  const majorRow = db.prepare('SELECT * FROM majors WHERE faculty_id = ? AND name = ?').get(fac.id, major);
  if (!majorRow) return res.status(400).json({ error: 'Select a major that belongs to your faculty.' });
  const EDU_LEVEL_RANK = { "Bachelor's": 0, "Master's": 1, 'PhD': 2, 'Other': 0 };
  if (majorRow.min_level && (EDU_LEVEL_RANK[education_level] ?? -1) < EDU_LEVEL_RANK[majorRow.min_level]) {
    return res.status(400).json({ error: `${major} requires at least a ${majorRow.min_level} level of education.` });
  }
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) return res.status(400).json({ error: 'An account with this email already exists.' });

  const r = db.prepare(`INSERT INTO users (role,email,password_hash,name,university_id,faculty_id,major,education_level,terms_accepted_at,privacy_policy_version)
    VALUES ('student',?,?,?,?,?,?,?,datetime('now'),?)`)
    .run(email, bcrypt.hashSync(password, 10), name, uni.id, fac.id, major, education_level, POLICY_VERSION);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(r.lastInsertRowid);
  req.session.user = publicUser(user);
  res.json({ user: req.session.user });
});

app.post('/api/auth/register-company', (req, res) => {
  const { email, password, contact_name, company_name, website, description, terms_accepted } = req.body || {};
  if (!email || !password || !contact_name || !company_name) return res.status(400).json({ error: 'All fields are required.' });
  if (!terms_accepted) return res.status(400).json({ error: 'You must accept the Terms of Service and Privacy Policy to register.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  const domain = String(email).split('@')[1]?.toLowerCase() || '';
  const freeMail = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'mail.com', 'proton.me', 'protonmail.com'];
  if (freeMail.includes(domain)) return res.status(400).json({ error: 'Register with your company work email, not a personal address.' });
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) return res.status(400).json({ error: 'An account with this email already exists.' });

  const u = db.prepare(`INSERT INTO users (role,email,password_hash,name,terms_accepted_at,privacy_policy_version)
    VALUES ('company',?,?,?,datetime('now'),?)`)
    .run(email, bcrypt.hashSync(password, 10), contact_name, POLICY_VERSION);
  db.prepare(`INSERT INTO companies (owner_user_id,name,website,description) VALUES (?,?,?,?)`)
    .run(u.lastInsertRowid, company_name, website || '', description || '');
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(u.lastInsertRowid);
  req.session.user = publicUser(user);
  res.json({ user: req.session.user, notice: 'Your company is pending admin review. You can post once approved.' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email || '');
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(400).json({ error: 'Email or password is incorrect.' });
  }
  req.session.user = publicUser(user);
  res.json({ user: req.session.user });
});

app.post('/api/auth/logout', (req, res) => { req.session.destroy(() => res.json({ ok: true })); });
app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) return res.json({ user: null });
  const fresh = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.user.id);
  req.session.user = publicUser(fresh);
  res.json({ user: req.session.user });
});

// ---------- account: profile, password, job alerts ----------
app.post('/api/auth/profile', requireAuth(), (req, res) => {
  const u = req.session.user;
  const { name, phone, company_name, website, description } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name is required.' });
  db.prepare('UPDATE users SET name=?, phone=? WHERE id=?').run(name, phone || '', u.id);
  if (u.role === 'company') {
    db.prepare('UPDATE companies SET name=COALESCE(?,name), website=?, description=? WHERE owner_user_id=?')
      .run(company_name || null, website || '', description || '', u.id);
  }
  const fresh = db.prepare('SELECT * FROM users WHERE id = ?').get(u.id);
  req.session.user = publicUser(fresh);
  res.json({ user: req.session.user });
});

app.post('/api/auth/upload-photo', requireAuth(), photoUpload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Upload a PNG, JPEG, or WebP image.' });
  db.prepare('UPDATE users SET photo_path=? WHERE id=?').run(`/uploads/photos/${req.file.filename}`, req.session.user.id);
  const fresh = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.user.id);
  req.session.user = publicUser(fresh);
  res.json({ user: req.session.user });
});

app.post('/api/auth/change-password', requireAuth(), (req, res) => {
  const { current_password, new_password } = req.body || {};
  if (!current_password || !new_password) return res.status(400).json({ error: 'All fields are required.' });
  if (new_password.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.user.id);
  if (!bcrypt.compareSync(current_password, user.password_hash)) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }
  db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(new_password, 10), user.id);
  res.json({ ok: true });
});

// ---------- companies: directory + follow ----------
app.get('/api/companies', requireAuth(), (req, res) => {
  const rows = db.prepare(`
    SELECT c.id, c.name, c.website, c.description,
           COUNT(CASE WHEN j.status='open' THEN 1 END) AS open_jobs
    FROM companies c LEFT JOIN jobs j ON j.company_id = c.id
    WHERE c.status='approved'
    GROUP BY c.id ORDER BY open_jobs DESC, c.name ASC`).all();
  res.json({ companies: rows });
});

app.get('/api/companies/:id', requireAuth(), (req, res) => {
  const company = db.prepare(`SELECT id, name, website, description FROM companies WHERE id=? AND status='approved'`).get(req.params.id);
  if (!company) return res.status(404).json({ error: 'Company not found.' });
  const jobs = db.prepare(`SELECT j.*, f.name AS faculty_name FROM jobs j LEFT JOIN faculties f ON f.id=j.faculty_id
    WHERE j.company_id=? AND j.status='open' ORDER BY j.created_at DESC`).all(company.id);
  let following = false;
  if (req.session.user.role === 'student') {
    following = !!db.prepare('SELECT 1 FROM company_follows WHERE student_id=? AND company_id=?').get(req.session.user.id, company.id);
  }
  res.json({ company, jobs, following });
});

app.post('/api/companies/:id/follow', requireAuth('student'), (req, res) => {
  const company = db.prepare(`SELECT id FROM companies WHERE id=? AND status='approved'`).get(req.params.id);
  if (!company) return res.status(404).json({ error: 'Company not found.' });
  try { db.prepare('INSERT INTO company_follows (student_id, company_id) VALUES (?,?)').run(req.session.user.id, company.id); }
  catch { /* already following */ }
  res.json({ ok: true });
});

app.post('/api/companies/:id/unfollow', requireAuth('student'), (req, res) => {
  db.prepare('DELETE FROM company_follows WHERE student_id=? AND company_id=?').run(req.session.user.id, req.params.id);
  res.json({ ok: true });
});

app.get('/api/my-follows', requireAuth('student'), (req, res) => {
  const rows = db.prepare(`
    SELECT cf.id AS follow_id, c.id AS company_id, c.name, c.website,
           COUNT(CASE WHEN j.status='open' THEN 1 END) AS open_jobs
    FROM company_follows cf JOIN companies c ON c.id = cf.company_id
    LEFT JOIN jobs j ON j.company_id = c.id
    WHERE cf.student_id = ? GROUP BY cf.id ORDER BY cf.created_at DESC`).all(req.session.user.id);
  res.json({ follows: rows });
});

// ---------- stats ----------
app.get('/api/my-applications/stats', requireAuth('student'), (req, res) => {
  const rows = db.prepare('SELECT stage FROM applications WHERE student_id=?').all(req.session.user.id);
  const ONGOING = ['applied', 'skill_test', 'ai_interview', 'company_test', 'hr_interview', 'tech_interview'];
  res.json({ stats: {
    ongoing: rows.filter(r => ONGOING.includes(r.stage)).length,
    offers: rows.filter(r => r.stage === 'hired').length,
    rejected: rows.filter(r => r.stage === 'rejected').length,
  }});
});

app.get('/api/stats', (req, res) => {
  res.json({
    open_jobs: db.prepare(`SELECT COUNT(*) c FROM jobs WHERE status='open'`).get().c,
    hires: db.prepare(`SELECT COUNT(*) c FROM matches`).get().c,
    approved_companies: db.prepare(`SELECT COUNT(*) c FROM companies WHERE status='approved'`).get().c,
    companies: db.prepare(`SELECT name FROM companies WHERE status='approved' ORDER BY created_at DESC LIMIT 6`).all(),
  });
});

// ---------- translation (Google Cloud Translation API, DB-cached) ----------
app.post('/api/translate', requireAuth(), async (req, res) => {
  const { texts, lang } = req.body || {};
  if (!Array.isArray(texts) || !lang) return res.status(400).json({ error: 'texts[] and lang are required.' });
  const { translateBatch, FEATURE_ENABLED } = require('./translate');
  if (!FEATURE_ENABLED || lang === 'en') return res.json({ texts });
  try {
    res.json({ texts: await translateBatch(texts.map(t => t || ''), lang) });
  } catch (e) {
    res.json({ texts }); // never break a page over a translation-provider hiccup
  }
});

// ---------- student: identity documents ----------
app.post('/api/student/submit-docs', requireAuth('student'), (req, res) => {
  const { note } = req.body || {};
  db.prepare(`UPDATE users SET doc_status='submitted', doc_note=? WHERE id=?`).run(note || 'Documents submitted', req.session.user.id);
  res.json({ ok: true });
});

// ---------- jobs ----------
app.get('/api/jobs', requireAuth(), (req, res) => {
  const u = req.session.user;
  let rows;
  const base = `SELECT j.*, c.name AS company_name, f.name AS faculty_name
    FROM jobs j JOIN companies c ON c.id=j.company_id LEFT JOIN faculties f ON f.id=j.faculty_id`;
  if (u.role === 'student') {
    rows = db.prepare(`${base} WHERE j.university_id = ? AND j.status='open' ORDER BY j.faculty_verified DESC, j.created_at DESC`).all(u.university_id);
  } else if (u.role === 'company') {
    const comp = db.prepare('SELECT * FROM companies WHERE owner_user_id = ?').get(u.id);
    rows = db.prepare(`${base} WHERE j.company_id = ? ORDER BY j.created_at DESC`).all(comp?.id || -1);
  } else {
    rows = db.prepare(`${base} ORDER BY j.created_at DESC`).all();
  }
  res.json({ jobs: rows });
});

app.get('/api/jobs/:id', requireAuth(), (req, res) => {
  const job = db.prepare(`SELECT j.*, c.name AS company_name, c.website, c.description AS company_description, f.name AS faculty_name, un.name AS university_name
    FROM jobs j JOIN companies c ON c.id=j.company_id
    LEFT JOIN faculties f ON f.id=j.faculty_id
    JOIN universities un ON un.id=j.university_id WHERE j.id=?`).get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found.' });
  let application = null;
  if (req.session.user.role === 'student') {
    application = db.prepare('SELECT * FROM applications WHERE job_id=? AND student_id=?').get(job.id, req.session.user.id) || null;
  }
  res.json({ job, application });
});

app.post('/api/jobs', requireAuth('company'), (req, res) => {
  const comp = db.prepare('SELECT * FROM companies WHERE owner_user_id = ?').get(req.session.user.id);
  if (!comp) return res.status(400).json({ error: 'No company profile found.' });
  if (comp.status !== 'approved') return res.status(403).json({ error: 'Your company must be approved by the admin before posting.' });
  const { university_id, faculty_id, title, job_type, description, requirements, positions, faculty_verified, location, work_mode, salary_huf } = req.body || {};
  if (!university_id || !title || !job_type || !description || !positions) return res.status(400).json({ error: 'Fill in every required field.' });
  if (work_mode && !['on_site', 'hybrid', 'remote'].includes(work_mode)) return res.status(400).json({ error: 'Invalid work mode.' });
  const r = db.prepare(`INSERT INTO jobs (company_id,university_id,faculty_id,title,job_type,description,requirements,positions,faculty_verified,location,work_mode,salary_huf)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(comp.id, university_id, faculty_id || null, title, job_type, description, requirements || '', Math.max(1, +positions), faculty_verified ? 1 : 0,
      location || 'Debrecen', work_mode || 'on_site', salary_huf ? Math.max(0, +salary_huf) || null : null);
  res.json({ id: r.lastInsertRowid });
});

// ---------- applications: student side ----------
app.post('/api/jobs/:id/apply', requireAuth('student'), (req, res) => {
  const u = req.session.user;
  const job = db.prepare('SELECT * FROM jobs WHERE id=?').get(req.params.id);
  if (!job || job.status !== 'open') return res.status(400).json({ error: 'This posting is closed.' });
  if (job.university_id !== u.university_id) return res.status(403).json({ error: 'This posting belongs to another university.' });
  if (u.doc_status !== 'verified') return res.status(403).json({ error: 'Your identity documents must be verified before applying. Submit them from your dashboard.' });
  try {
    const r = db.prepare(`INSERT INTO applications (job_id, student_id, stage) VALUES (?,?, 'skill_test')`).run(job.id, u.id);
    res.json({ id: r.lastInsertRowid, stage: 'skill_test' });
  } catch {
    res.status(400).json({ error: 'You already applied to this posting.' });
  }
});

app.get('/api/my-applications', requireAuth('student'), (req, res) => {
  const rows = db.prepare(`SELECT a.*, j.title, j.status AS job_status, c.name AS company_name
    FROM applications a JOIN jobs j ON j.id=a.job_id JOIN companies c ON c.id=j.company_id
    WHERE a.student_id=? ORDER BY a.updated_at DESC`).all(req.session.user.id);
  res.json({ applications: rows });
});

// Skill test (based on major) — supports one retake with different questions; final score
// is the average of both attempts if retaken, or just attempt 1's score otherwise.
function pickQuestions(major, excludeIds) {
  const all = db.prepare('SELECT id FROM skill_questions WHERE major=?').all(major).map(r => r.id);
  const pool = all.filter(id => !excludeIds.includes(id));
  const source = pool.length ? pool : all; // graceful fallback if the bank is too small
  return source.sort(() => Math.random() - 0.5).slice(0, 5);
}

app.get('/api/applications/:id/skill-test', requireAuth('student'), (req, res) => {
  const a = db.prepare('SELECT * FROM applications WHERE id=? AND student_id=?').get(req.params.id, req.session.user.id);
  if (!a) return res.status(404).json({ error: 'Application not found.' });
  if (a.stage !== 'skill_test') return res.status(400).json({ error: 'The skill test is not the current step.' });

  const attempts = db.prepare('SELECT * FROM skill_test_attempts WHERE application_id=? ORDER BY attempt_number').all(a.id);
  const wantRetake = req.query.retake === '1';
  let attempt = attempts.find(x => x.score == null);

  if (!attempt) {
    if (wantRetake) {
      if (attempts.length !== 1 || attempts[0].score == null) return res.status(400).json({ error: 'No attempt available to retake.' });
      const usedIds = JSON.parse(attempts[0].question_ids);
      const ids = pickQuestions(req.session.user.major, usedIds);
      if (!ids.length) return res.status(400).json({ error: 'No question bank for your major yet. Contact your faculty coordinator.' });
      db.prepare('INSERT INTO skill_test_attempts (application_id, attempt_number, question_ids) VALUES (?,2,?)').run(a.id, JSON.stringify(ids));
      attempt = db.prepare('SELECT * FROM skill_test_attempts WHERE application_id=? AND attempt_number=2').get(a.id);
    } else if (!attempts.length) {
      const ids = pickQuestions(req.session.user.major, []);
      if (!ids.length) return res.status(400).json({ error: 'No question bank for your major yet. Contact your faculty coordinator.' });
      db.prepare('INSERT INTO skill_test_attempts (application_id, attempt_number, question_ids) VALUES (?,1,?)').run(a.id, JSON.stringify(ids));
      attempt = db.prepare('SELECT * FROM skill_test_attempts WHERE application_id=? AND attempt_number=1').get(a.id);
    } else {
      return res.status(400).json({ error: 'Test already completed.' });
    }
  }
  const ids = JSON.parse(attempt.question_ids);
  const qs = ids.map(id => db.prepare('SELECT id, question, options FROM skill_questions WHERE id=?').get(id));
  res.json({ attemptNumber: attempt.attempt_number, questions: qs.map(q => ({ ...q, options: JSON.parse(q.options) })) });
});

app.post('/api/applications/:id/skill-test', requireAuth('student'), (req, res) => {
  const a = db.prepare('SELECT * FROM applications WHERE id=? AND student_id=?').get(req.params.id, req.session.user.id);
  if (!a || a.stage !== 'skill_test') return res.status(400).json({ error: 'The skill test is not the current step.' });
  const attempt = db.prepare('SELECT * FROM skill_test_attempts WHERE application_id=? AND score IS NULL ORDER BY attempt_number DESC').get(a.id);
  if (!attempt) return res.status(400).json({ error: 'No active attempt to submit.' });

  const answers = req.body?.answers || {}; // {questionId: optionIdx}
  const ids = JSON.parse(attempt.question_ids);
  const qs = ids.map(id => db.prepare('SELECT * FROM skill_questions WHERE id=?').get(id));
  const correct = qs.filter(q => +answers[q.id] === q.answer_idx).length;
  const score = Math.round((correct / qs.length) * 100);
  db.prepare('UPDATE skill_test_attempts SET score=? WHERE id=?').run(score, attempt.id);

  if (attempt.attempt_number === 1) {
    return res.json({ attemptNumber: 1, score, canRetake: true });
  }
  // Attempt 2: auto-finalize with the average of both attempts, no further retake.
  const first = db.prepare('SELECT score FROM skill_test_attempts WHERE application_id=? AND attempt_number=1').get(a.id);
  const finalScore = Math.round((first.score + score) / 2);
  const passed = finalScore >= 60;
  db.prepare(`UPDATE applications SET skill_score=?, stage=?, updated_at=datetime('now') WHERE id=?`)
    .run(finalScore, passed ? 'ai_interview' : 'rejected', a.id);
  res.json({ attemptNumber: 2, score, finalScore, passed });
});

app.post('/api/applications/:id/skill-test/continue', requireAuth('student'), (req, res) => {
  const a = db.prepare('SELECT * FROM applications WHERE id=? AND student_id=?').get(req.params.id, req.session.user.id);
  if (!a || a.stage !== 'skill_test') return res.status(400).json({ error: 'The skill test is not the current step.' });
  const attempt = db.prepare('SELECT * FROM skill_test_attempts WHERE application_id=? AND attempt_number=1').get(a.id);
  if (!attempt || attempt.score == null) return res.status(400).json({ error: 'Complete the skill test first.' });
  const passed = attempt.score >= 60;
  db.prepare(`UPDATE applications SET skill_score=?, stage=?, updated_at=datetime('now') WHERE id=?`)
    .run(attempt.score, passed ? 'ai_interview' : 'rejected', a.id);
  res.json({ finalScore: attempt.score, passed });
});

// AI interview (MVP: structured questions recorded for review; AI scoring is a planned integration).
// Supports one retake with a different set of questions — both rounds are stored and shown to the
// company, since there's no live numeric score to average here (see server/anthropic.js).
const AI_QUESTIONS = [
  'Describe a project or coursework you are most proud of, and your specific contribution.',
  'Why do you want this particular role, and what do you hope to learn in the first 3 months?',
  'Tell us about a time you had to learn something difficult quickly. How did you approach it?',
];
const AI_QUESTIONS_ROUND2 = [
  'Tell us about a time you disagreed with a teammate or classmate. How did you handle it?',
  'What does success in this role look like to you after six months?',
  'Describe a mistake you made on a project and what you changed afterward.',
];
app.get('/api/applications/:id/ai-interview', requireAuth('student'), (req, res) => {
  const a = db.prepare('SELECT * FROM applications WHERE id=? AND student_id=?').get(req.params.id, req.session.user.id);
  if (!a || a.stage !== 'ai_interview') return res.status(400).json({ error: 'The AI interview is not the current step.' });
  const round1Done = db.prepare('SELECT 1 FROM ai_answers WHERE application_id=? AND attempt=1').get(a.id);
  const round2Done = db.prepare('SELECT 1 FROM ai_answers WHERE application_id=? AND attempt=2').get(a.id);
  if (req.query.retake === '1') {
    if (!round1Done || round2Done) return res.status(400).json({ error: 'No retake available.' });
    return res.json({ attempt: 2, questions: AI_QUESTIONS_ROUND2 });
  }
  if (round1Done) return res.status(400).json({ error: 'Interview already answered.' });
  res.json({ attempt: 1, questions: AI_QUESTIONS });
});
app.post('/api/applications/:id/ai-interview', requireAuth('student'), (req, res) => {
  const a = db.prepare('SELECT * FROM applications WHERE id=? AND student_id=?').get(req.params.id, req.session.user.id);
  if (!a || a.stage !== 'ai_interview') return res.status(400).json({ error: 'The AI interview is not the current step.' });
  const attempt = req.body?.attempt === 2 ? 2 : 1;
  const questions = attempt === 2 ? AI_QUESTIONS_ROUND2 : AI_QUESTIONS;
  const answers = req.body?.answers || [];
  if (answers.length !== questions.length || answers.some(x => !x || x.trim().length < 30)) {
    return res.status(400).json({ error: 'Answer every question with at least a short paragraph (30+ characters).' });
  }
  if (answers.some(x => x.length > 1000)) {
    return res.status(400).json({ error: 'Each answer must be 1000 characters or fewer.' });
  }
  const ins = db.prepare('INSERT INTO ai_answers (application_id, question, answer, attempt) VALUES (?,?,?,?)');
  questions.forEach((q, i) => ins.run(a.id, q, answers[i], attempt));
  res.json({ ok: true, attempt, canRetake: attempt === 1 });
});
app.post('/api/applications/:id/ai-interview/continue', requireAuth('student'), (req, res) => {
  const a = db.prepare('SELECT * FROM applications WHERE id=? AND student_id=?').get(req.params.id, req.session.user.id);
  if (!a || a.stage !== 'ai_interview') return res.status(400).json({ error: 'The AI interview is not the current step.' });
  const answered = db.prepare('SELECT 1 FROM ai_answers WHERE application_id=?').get(a.id);
  if (!answered) return res.status(400).json({ error: 'Complete the interview first.' });
  db.prepare(`UPDATE applications SET stage='company_test', ai_summary='Interview answers recorded, pending company review.', updated_at=datetime('now') WHERE id=?`).run(a.id);
  res.json({ ok: true, stage: 'company_test' });
});

// ---------- applications: company side ----------
app.get('/api/company/applicants', requireAuth('company'), (req, res) => {
  const comp = db.prepare('SELECT * FROM companies WHERE owner_user_id=?').get(req.session.user.id);
  // TEST-ONLY flag: a flagged company sees every submitted application. In production
  // no company is flagged, so the WHERE clause scopes results to its own postings.
  const base = `SELECT a.*, u.name AS student_name, u.email AS student_email, u.major, j.title, j.id AS job_id, co.name AS company_name
    FROM applications a JOIN users u ON u.id=a.student_id JOIN jobs j ON j.id=a.job_id JOIN companies co ON co.id=j.company_id`;
  const rows = comp?.can_view_all_applicants
    ? db.prepare(`${base} ORDER BY a.updated_at DESC`).all()
    : db.prepare(`${base} WHERE j.company_id=? ORDER BY a.updated_at DESC`).all(comp?.id || -1);
  rows.forEach(r => { r.can_advance = stageComplete(r) ? 1 : 0; });
  res.json({ applicants: rows });
});

app.get('/api/company/applicants/:id', requireAuth('company'), (req, res) => {
  const comp = db.prepare('SELECT * FROM companies WHERE owner_user_id=?').get(req.session.user.id);
  const a = db.prepare(`SELECT a.*, u.name AS student_name, u.email AS student_email, u.major, j.title, j.company_id
    FROM applications a JOIN users u ON u.id=a.student_id JOIN jobs j ON j.id=a.job_id WHERE a.id=?`).get(req.params.id);
  if (!a || (a.company_id !== comp?.id && !comp?.can_view_all_applicants)) return res.status(404).json({ error: 'Applicant not found.' });
  const aiAnswers = db.prepare('SELECT id, question, answer, attempt, company_score FROM ai_answers WHERE application_id=? ORDER BY attempt, id').all(a.id);
  const interviews = db.prepare('SELECT * FROM interviews WHERE application_id=? ORDER BY created_at').all(a.id).map(iv => serializeInterview(iv));
  const ctQuestions = companyTestQuestions().map(q => ({ id: q.id, type: q.type, question: q.question, options: q.options ? JSON.parse(q.options) : null, answer_idx: q.answer_idx }));
  const ctAnswers = db.prepare('SELECT question_id, answer_idx, answer_text FROM company_test_answers WHERE application_id=?').all(a.id);
  res.json({
    applicant: a, aiAnswers, interviews,
    companyTest: { questions: ctQuestions, answers: ctAnswers, score: a.company_test_score },
    can_advance: stageComplete(a),
  });
});

// Whether the current company-controlled stage's requirement is met, so the
// company may advance — guards against advancing before the step (test taken,
// interview scheduled) is actually done.
function stageComplete(a) {
  if (a.stage === 'company_test') return a.company_test_score != null;
  if (a.stage === 'hr_interview' || a.stage === 'tech_interview') {
    return !!db.prepare(`SELECT 1 FROM interviews WHERE application_id=? AND kind=? AND status='scheduled'`).get(a.id, a.stage);
  }
  return false;
}
function stageGateMessage(stage) {
  if (stage === 'company_test') return 'The candidate must complete the company test before you can advance them.';
  if (stage === 'hr_interview') return 'Schedule (and hold) the HR interview before advancing.';
  if (stage === 'tech_interview') return 'Schedule (and hold) the technical interview before hiring.';
  return 'This stage is not ready to advance.';
}

app.post('/api/company/applicants/:id/advance', requireAuth('company'), (req, res) => {
  const comp = db.prepare('SELECT * FROM companies WHERE owner_user_id=?').get(req.session.user.id);
  const a = db.prepare(`SELECT a.*, j.company_id, j.id AS jid FROM applications a JOIN jobs j ON j.id=a.job_id WHERE a.id=?`).get(req.params.id);
  if (!a || (a.company_id !== comp?.id && !comp?.can_view_all_applicants)) return res.status(404).json({ error: 'Applicant not found.' });
  if (['hired', 'rejected'].includes(a.stage)) return res.status(400).json({ error: 'This application is already final.' });
  if (['applied', 'skill_test', 'ai_interview'].includes(a.stage)) return res.status(400).json({ error: 'The candidate must finish platform verification steps first.' });
  if (!stageComplete(a)) return res.status(400).json({ error: stageGateMessage(a.stage) });

  const to = nextStage(a.stage);
  if (to === 'hired') return hire(a, res);
  db.prepare(`UPDATE applications SET stage=?, updated_at=datetime('now') WHERE id=?`).run(to, a.id);
  res.json({ stage: to });
});

app.post('/api/company/applicants/:id/reject', requireAuth('company'), (req, res) => {
  const comp = db.prepare('SELECT * FROM companies WHERE owner_user_id=?').get(req.session.user.id);
  const a = db.prepare(`SELECT a.*, j.company_id FROM applications a JOIN jobs j ON j.id=a.job_id WHERE a.id=?`).get(req.params.id);
  if (!a || (a.company_id !== comp?.id && !comp?.can_view_all_applicants)) return res.status(404).json({ error: 'Applicant not found.' });
  if (a.stage === 'hired') return res.status(400).json({ error: 'A hired candidate cannot be rejected. Contact the admin.' });
  db.prepare(`UPDATE applications SET stage='rejected', updated_at=datetime('now') WHERE id=?`).run(a.id);
  res.json({ stage: 'rejected' });
});

// Company scores the AI interview answers (0-10 each); overall section score is
// the average scaled to 0-100. (The live AI-graded video interview is a later phase;
// for now the company grades the recorded answers.)
app.post('/api/company/applicants/:id/ai-scores', requireAuth('company'), (req, res) => {
  const comp = db.prepare('SELECT * FROM companies WHERE owner_user_id=?').get(req.session.user.id);
  const a = db.prepare(`SELECT a.*, j.company_id FROM applications a JOIN jobs j ON j.id=a.job_id WHERE a.id=?`).get(req.params.id);
  if (!a || (a.company_id !== comp?.id && !comp?.can_view_all_applicants)) return res.status(404).json({ error: 'Applicant not found.' });
  const scores = req.body?.scores || {};
  const upd = db.prepare('UPDATE ai_answers SET company_score=? WHERE id=? AND application_id=?');
  for (const [ansId, s] of Object.entries(scores)) {
    if (s === '' || s == null) continue;
    upd.run(Math.max(0, Math.min(10, Math.round(+s))), ansId, a.id);
  }
  const scored = db.prepare('SELECT company_score FROM ai_answers WHERE application_id=? AND company_score IS NOT NULL').all(a.id).map(r => r.company_score);
  const overall = scored.length ? Math.round((scored.reduce((x, y) => x + y, 0) / scored.length) * 10) : null;
  db.prepare('UPDATE applications SET ai_score=? WHERE id=?').run(overall, a.id);
  res.json({ ai_score: overall });
});

// ---------- company test (student takes the company's own MCQ/essay test) ----------
function companyTestQuestions() {
  return db.prepare(`SELECT id, type, question, options, answer_idx, position FROM company_test_questions WHERE company_id IS NULL ORDER BY position, id`).all();
}

app.get('/api/applications/:id/company-test', requireAuth('student'), (req, res) => {
  const a = db.prepare('SELECT * FROM applications WHERE id=? AND student_id=?').get(req.params.id, req.session.user.id);
  if (!a) return res.status(404).json({ error: 'Application not found.' });
  const questions = companyTestQuestions().map(q => ({ id: q.id, type: q.type, question: q.question, options: q.options ? JSON.parse(q.options) : null }));
  const answers = db.prepare('SELECT question_id, answer_idx, answer_text FROM company_test_answers WHERE application_id=?').all(a.id);
  res.json({ questions, answers, score: a.company_test_score, submitted: a.company_test_score != null });
});

app.post('/api/applications/:id/company-test', requireAuth('student'), (req, res) => {
  const a = db.prepare('SELECT * FROM applications WHERE id=? AND student_id=?').get(req.params.id, req.session.user.id);
  if (!a || a.stage !== 'company_test') return res.status(400).json({ error: 'The company test is not the current step.' });
  if (a.company_test_score != null) return res.status(400).json({ error: 'You have already submitted the company test.' });
  const answers = req.body?.answers || {};
  const questions = companyTestQuestions();
  for (const q of questions) {
    const ans = answers[q.id];
    if (q.type === 'mcq') {
      if (!ans || ans.answer_idx == null || ans.answer_idx === '') return res.status(400).json({ error: 'Answer every multiple-choice question.' });
    } else if (!ans || !ans.answer_text || ans.answer_text.trim().length < 30) {
      return res.status(400).json({ error: 'Answer every written question with at least a short paragraph (30+ characters).' });
    }
  }
  const ins = db.prepare(`INSERT INTO company_test_answers (application_id, question_id, answer_idx, answer_text) VALUES (?,?,?,?)
    ON CONFLICT(application_id, question_id) DO UPDATE SET answer_idx=excluded.answer_idx, answer_text=excluded.answer_text`);
  let mcqTotal = 0, mcqCorrect = 0;
  const score = db.transaction(() => {
    for (const q of questions) {
      const ans = answers[q.id];
      if (q.type === 'mcq') {
        const idx = +ans.answer_idx;
        ins.run(a.id, q.id, idx, null);
        mcqTotal++; if (idx === q.answer_idx) mcqCorrect++;
      } else {
        ins.run(a.id, q.id, null, String(ans.answer_text));
      }
    }
    const s = mcqTotal ? Math.round((mcqCorrect / mcqTotal) * 100) : 0;
    db.prepare('UPDATE applications SET company_test_score=? WHERE id=?').run(s, a.id);
    return s;
  })();
  res.json({ score });
});

// ---------- interviews (scheduling; live video is a later phase) ----------
const INTERVIEW_STAGES = ['hr_interview', 'tech_interview'];

// Fetch an interview joined to its application/job/company/student, or null.
function interviewContext(interviewId) {
  return db.prepare(`SELECT iv.*, a.student_id, a.job_id, j.company_id, j.title AS role_title,
      u.name AS student_name, u.email AS student_email, co.name AS company_name, co.owner_user_id AS company_user_id
    FROM interviews iv
    JOIN applications a ON a.id = iv.application_id
    JOIN jobs j ON j.id = a.job_id
    JOIN companies co ON co.id = j.company_id
    JOIN users u ON u.id = a.student_id
    WHERE iv.id = ?`).get(interviewId);
}

function serializeInterview(iv) {
  const slots = db.prepare('SELECT * FROM interview_slots WHERE interview_id=? ORDER BY start_at').all(iv.id);
  const participants = db.prepare('SELECT id, email FROM interview_participants WHERE interview_id=? ORDER BY id').all(iv.id);
  const chosen = iv.chosen_slot_id ? slots.find(s => s.id === iv.chosen_slot_id) : null;
  return {
    id: iv.id, application_id: iv.application_id, kind: iv.kind, status: iv.status,
    room_id: iv.room_id, chosen_slot_id: iv.chosen_slot_id, chosen_slot: chosen,
    slots, participants,
  };
}

function whenText(startAt, durationMin) {
  const d = new Date(startAt);
  const date = d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  return `${date} (${durationMin} min)`;
}

// HR proposes interview slots for an applicant at an interview stage.
app.post('/api/company/interviews', requireAuth('company'), (req, res) => {
  const comp = db.prepare('SELECT * FROM companies WHERE owner_user_id=?').get(req.session.user.id);
  const { application_id, slots } = req.body || {};
  const a = db.prepare(`SELECT a.*, j.company_id, j.title AS role_title, u.name AS student_name
    FROM applications a JOIN jobs j ON j.id=a.job_id JOIN users u ON u.id=a.student_id WHERE a.id=?`).get(application_id);
  if (!a || (a.company_id !== comp?.id && !comp?.can_view_all_applicants)) return res.status(404).json({ error: 'Applicant not found.' });
  if (!INTERVIEW_STAGES.includes(a.stage)) return res.status(400).json({ error: 'This candidate is not at an interview stage yet.' });
  if (!Array.isArray(slots) || slots.length < 1 || slots.length > 6) return res.status(400).json({ error: 'Propose between 1 and 6 time slots.' });
  for (const s of slots) {
    if (!s.start_at || isNaN(Date.parse(s.start_at))) return res.status(400).json({ error: 'Each slot needs a valid date and time.' });
    const dur = +s.duration_min;
    if (!(dur >= 15 && dur <= 180)) return res.status(400).json({ error: 'Duration must be between 15 and 180 minutes.' });
  }
  const roomId = crypto.randomUUID();
  const tx = db.transaction(() => {
    const r = db.prepare('INSERT INTO interviews (application_id, kind, room_id) VALUES (?,?,?)').run(a.id, a.stage, roomId);
    const ins = db.prepare('INSERT INTO interview_slots (interview_id, start_at, duration_min) VALUES (?,?,?)');
    slots.forEach(s => ins.run(r.lastInsertRowid, new Date(s.start_at).toISOString(), Math.round(+s.duration_min)));
    return r.lastInsertRowid;
  });
  const interviewId = tx();
  const msg = interviewProposed({
    studentName: a.student_name, companyName: comp?.name || 'the company',
    roleTitle: a.role_title, kind: a.stage, link: '/my-applications',
  });
  notify(a.student_id, msg);
  res.json({ interview: serializeInterview(interviewContext(interviewId)) });
});

// Add a participant (e.g. a technical team member) to an interview by email.
app.post('/api/company/interviews/:id/participants', requireAuth('company'), (req, res) => {
  const comp = db.prepare('SELECT * FROM companies WHERE owner_user_id=?').get(req.session.user.id);
  const iv = interviewContext(req.params.id);
  if (!iv || (iv.company_id !== comp?.id && !comp?.can_view_all_applicants)) return res.status(404).json({ error: 'Interview not found.' });
  const email = (req.body?.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  try {
    db.prepare('INSERT INTO interview_participants (interview_id, email) VALUES (?,?)').run(iv.id, email);
  } catch { return res.status(400).json({ error: 'That person is already invited.' }); }
  // Notify the invitee only if they have a LinkWork account (in-app); otherwise the
  // scaffolded email would reach them once real delivery is wired up.
  const invitee = db.prepare('SELECT id FROM users WHERE email=?').get(email);
  if (invitee) {
    notify(invitee.id, {
      kind: `${iv.kind}_invite`,
      subject: `You've been added to an interview on LinkWork`,
      body: `You've been added as a participant to a ${iv.kind === 'hr_interview' ? 'HR' : 'technical'} interview for the ${iv.role_title} role. You'll be able to join the live meeting at the scheduled time.`,
      link: '/notifications',
    });
  }
  res.json({ interview: serializeInterview(interviewContext(iv.id)) });
});

app.delete('/api/company/interviews/:id/participants/:pid', requireAuth('company'), (req, res) => {
  const comp = db.prepare('SELECT * FROM companies WHERE owner_user_id=?').get(req.session.user.id);
  const iv = interviewContext(req.params.id);
  if (!iv || (iv.company_id !== comp?.id && !comp?.can_view_all_applicants)) return res.status(404).json({ error: 'Interview not found.' });
  db.prepare('DELETE FROM interview_participants WHERE id=? AND interview_id=?').run(req.params.pid, iv.id);
  res.json({ interview: serializeInterview(interviewContext(iv.id)) });
});

// Student: list interviews for one of their applications.
app.get('/api/applications/:id/interviews', requireAuth('student'), (req, res) => {
  const a = db.prepare('SELECT * FROM applications WHERE id=? AND student_id=?').get(req.params.id, req.session.user.id);
  if (!a) return res.status(404).json({ error: 'Application not found.' });
  const ivs = db.prepare('SELECT * FROM interviews WHERE application_id=? ORDER BY created_at').all(a.id);
  res.json({ interviews: ivs.map(iv => serializeInterview(iv)) });
});

// Student: pick a preferred slot.
app.post('/api/interviews/:id/pick-slot', requireAuth('student'), (req, res) => {
  const iv = interviewContext(req.params.id);
  if (!iv || iv.student_id !== req.session.user.id) return res.status(404).json({ error: 'Interview not found.' });
  if (iv.status !== 'awaiting_pick') return res.status(400).json({ error: 'This interview is already scheduled.' });
  const slot = db.prepare('SELECT * FROM interview_slots WHERE id=? AND interview_id=?').get(req.body?.slot_id, iv.id);
  if (!slot) return res.status(400).json({ error: 'Pick one of the proposed slots.' });
  db.prepare(`UPDATE interviews SET chosen_slot_id=?, status='scheduled' WHERE id=?`).run(slot.id, iv.id);
  const msg = slotPicked({
    studentName: iv.student_name, roleTitle: iv.role_title, kind: iv.kind,
    whenText: whenText(slot.start_at, slot.duration_min), link: '/company',
  });
  notify(iv.company_user_id, msg);
  res.json({ interview: serializeInterview(interviewContext(iv.id)) });
});

// Meeting room (placeholder until live video ships). Accessible to the student,
// the company owner, and invited participants.
app.get('/api/interviews/:id/room', requireAuth(), (req, res) => {
  const iv = interviewContext(req.params.id);
  if (!iv) return res.status(404).json({ error: 'Interview not found.' });
  const u = req.session.user;
  const comp = u.role === 'company' ? db.prepare('SELECT * FROM companies WHERE owner_user_id=?').get(u.id) : null;
  const isParticipant = !!db.prepare('SELECT 1 FROM interview_participants WHERE interview_id=? AND email=?').get(iv.id, u.email);
  const allowed = iv.student_id === u.id
    || (comp && (iv.company_id === comp.id || comp.can_view_all_applicants))
    || isParticipant;
  if (!allowed) return res.status(403).json({ error: 'You are not part of this interview.' });
  const full = serializeInterview(iv);
  res.json({
    interview: full,
    role_title: iv.role_title, company_name: iv.company_name, student_name: iv.student_name,
    when: full.chosen_slot ? whenText(full.chosen_slot.start_at, full.chosen_slot.duration_min) : null,
  });
});

// ---------- notifications (in-app; scaffold for future email) ----------
app.get('/api/notifications', requireAuth(), (req, res) => {
  const rows = db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(req.session.user.id);
  const unread = db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id=? AND read_at IS NULL').get(req.session.user.id).c;
  res.json({ notifications: rows, unread });
});

app.post('/api/notifications/:id/read', requireAuth(), (req, res) => {
  db.prepare(`UPDATE notifications SET read_at=datetime('now') WHERE id=? AND user_id=? AND read_at IS NULL`).run(req.params.id, req.session.user.id);
  res.json({ ok: true });
});

app.post('/api/notifications/read-all', requireAuth(), (req, res) => {
  db.prepare(`UPDATE notifications SET read_at=datetime('now') WHERE user_id=? AND read_at IS NULL`).run(req.session.user.id);
  res.json({ ok: true });
});

// Hiring: create the job-ID ⟷ candidate-ID match, close job when filled
function hire(a, res) {
  const tx = db.transaction(() => {
    const job = db.prepare('SELECT * FROM jobs WHERE id=?').get(a.job_id);
    if (job.filled >= job.positions) throw new Error('All positions for this posting are already filled.');
    db.prepare(`UPDATE applications SET stage='hired', updated_at=datetime('now') WHERE id=?`).run(a.id);
    db.prepare('INSERT INTO matches (job_id, student_id) VALUES (?,?)').run(a.job_id, a.student_id);
    const filled = job.filled + 1;
    const closed = filled >= job.positions;
    db.prepare(`UPDATE jobs SET filled=?, status=? WHERE id=?`).run(filled, closed ? 'closed' : 'open', job.id);
    if (closed) {
      // Posting is filled: end all remaining active applications
      db.prepare(`UPDATE applications SET stage='rejected', updated_at=datetime('now')
        WHERE job_id=? AND stage NOT IN ('hired','rejected')`).run(job.id);
    }
    return { closed };
  });
  try {
    const { closed } = tx();
    res.json({ stage: 'hired', job_closed: closed });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

// ---------- admin ----------
app.get('/api/admin/overview', requireAuth('admin'), (req, res) => {
  const companies = db.prepare(`SELECT c.*, u.email AS owner_email, u.name AS owner_name FROM companies c JOIN users u ON u.id=c.owner_user_id ORDER BY c.created_at DESC`).all();
  const students = db.prepare(`SELECT id, name, email, major, doc_status, doc_note FROM users WHERE role='student' ORDER BY created_at DESC`).all();
  const matches = db.prepare(`SELECT m.*, j.title, c.name AS company_name, u.name AS student_name
    FROM matches m JOIN jobs j ON j.id=m.job_id JOIN companies c ON c.id=j.company_id JOIN users u ON u.id=m.student_id
    ORDER BY m.hired_at DESC`).all();
  const stats = {
    open_jobs: db.prepare(`SELECT COUNT(*) c FROM jobs WHERE status='open'`).get().c,
    students: students.length,
    companies_pending: companies.filter(c => c.status === 'pending').length,
    hires: matches.length,
  };
  res.json({ companies, students, matches, stats });
});

app.post('/api/admin/companies/:id/status', requireAuth('admin'), (req, res) => {
  const { status } = req.body || {};
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  db.prepare('UPDATE companies SET status=? WHERE id=?').run(status, req.params.id);
  res.json({ ok: true });
});

app.post('/api/admin/students/:id/doc-status', requireAuth('admin'), (req, res) => {
  const { status } = req.body || {};
  if (!['verified', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  db.prepare('UPDATE users SET doc_status=? WHERE id=? AND role=?').run(status, req.params.id, 'student');
  res.json({ ok: true });
});

// AI interview confidence scoring — admin-only, not wired into any student/company flow yet.
app.post('/api/admin/applications/:id/score-ai-interview', requireAuth('admin'), async (req, res) => {
  try {
    const { scoreApplication } = require('./anthropic');
    const result = await scoreApplication(req.params.id);
    res.json({ ok: true, result });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ---------- static (production build) ----------
const dist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(dist));
app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`LinkWork server on http://localhost:${PORT}`));
