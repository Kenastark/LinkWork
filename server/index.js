const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./db');

const app = express();
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'linkwork-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' },
}));

// ---------- helpers ----------
const STAGES = ['applied', 'skill_test', 'ai_interview', 'company_test', 'hr_interview', 'tech_interview', 'hired'];
const nextStage = (s) => STAGES[Math.min(STAGES.indexOf(s) + 1, STAGES.length - 1)];

function requireAuth(role) {
  return (req, res, next) => {
    if (!req.session.user) return res.status(401).json({ error: 'Sign in to continue.' });
    if (role && req.session.user.role !== role) return res.status(403).json({ error: 'Not allowed for your account type.' });
    next();
  };
}
const publicUser = (u) => u && ({ id: u.id, role: u.role, email: u.email, name: u.name, university_id: u.university_id, faculty_id: u.faculty_id, major: u.major, doc_status: u.doc_status });

// ---------- meta ----------
app.get('/api/meta', (req, res) => {
  const universities = db.prepare('SELECT id, name, domains FROM universities').all();
  const faculties = db.prepare('SELECT id, university_id, name FROM faculties').all();
  const majors = db.prepare('SELECT DISTINCT major FROM skill_questions').all().map(r => r.major);
  res.json({ universities, faculties, majors });
});

// ---------- auth ----------
app.post('/api/auth/register-student', (req, res) => {
  const { email, password, name, faculty_id, major } = req.body || {};
  if (!email || !password || !name || !faculty_id || !major) return res.status(400).json({ error: 'All fields are required.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  const domain = String(email).split('@')[1]?.toLowerCase();
  const uni = db.prepare('SELECT * FROM universities').all()
    .find(u => u.domains.split(',').map(d => d.trim().toLowerCase()).includes(domain));
  if (!uni) return res.status(400).json({ error: 'Use your official university email address. This platform is invite-only per university.' });

  const fac = db.prepare('SELECT * FROM faculties WHERE id = ? AND university_id = ?').get(faculty_id, uni.id);
  if (!fac) return res.status(400).json({ error: 'Select a faculty belonging to your university.' });
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) return res.status(400).json({ error: 'An account with this email already exists.' });

  const r = db.prepare(`INSERT INTO users (role,email,password_hash,name,university_id,faculty_id,major)
    VALUES ('student',?,?,?,?,?,?)`)
    .run(email, bcrypt.hashSync(password, 10), name, uni.id, fac.id, major);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(r.lastInsertRowid);
  req.session.user = publicUser(user);
  res.json({ user: req.session.user });
});

app.post('/api/auth/register-company', (req, res) => {
  const { email, password, contact_name, company_name, website, description } = req.body || {};
  if (!email || !password || !contact_name || !company_name) return res.status(400).json({ error: 'All fields are required.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  const domain = String(email).split('@')[1]?.toLowerCase() || '';
  const freeMail = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'mail.com', 'proton.me', 'protonmail.com'];
  if (freeMail.includes(domain)) return res.status(400).json({ error: 'Register with your company work email, not a personal address.' });
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) return res.status(400).json({ error: 'An account with this email already exists.' });

  const u = db.prepare(`INSERT INTO users (role,email,password_hash,name) VALUES ('company',?,?,?)`)
    .run(email, bcrypt.hashSync(password, 10), contact_name);
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
  const job = db.prepare(`SELECT j.*, c.name AS company_name, c.website, f.name AS faculty_name, un.name AS university_name
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
  const { university_id, faculty_id, title, job_type, description, requirements, positions, faculty_verified } = req.body || {};
  if (!university_id || !title || !job_type || !description || !positions) return res.status(400).json({ error: 'Fill in every required field.' });
  const r = db.prepare(`INSERT INTO jobs (company_id,university_id,faculty_id,title,job_type,description,requirements,positions,faculty_verified)
    VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(comp.id, university_id, faculty_id || null, title, job_type, description, requirements || '', Math.max(1, +positions), faculty_verified ? 1 : 0);
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

// Skill test (based on major)
app.get('/api/applications/:id/skill-test', requireAuth('student'), (req, res) => {
  const a = db.prepare('SELECT * FROM applications WHERE id=? AND student_id=?').get(req.params.id, req.session.user.id);
  if (!a) return res.status(404).json({ error: 'Application not found.' });
  if (a.stage !== 'skill_test') return res.status(400).json({ error: 'The skill test is not the current step.' });
  const qs = db.prepare('SELECT id, question, options FROM skill_questions WHERE major=?').all(req.session.user.major);
  res.json({ questions: qs.map(q => ({ ...q, options: JSON.parse(q.options) })) });
});

app.post('/api/applications/:id/skill-test', requireAuth('student'), (req, res) => {
  const a = db.prepare('SELECT * FROM applications WHERE id=? AND student_id=?').get(req.params.id, req.session.user.id);
  if (!a || a.stage !== 'skill_test') return res.status(400).json({ error: 'The skill test is not the current step.' });
  const answers = req.body?.answers || {}; // {questionId: optionIdx}
  const qs = db.prepare('SELECT * FROM skill_questions WHERE major=?').all(req.session.user.major);
  if (!qs.length) return res.status(400).json({ error: 'No question bank for your major yet. Contact your faculty coordinator.' });
  const correct = qs.filter(q => +answers[q.id] === q.answer_idx).length;
  const score = Math.round((correct / qs.length) * 100);
  const passed = score >= 60;
  db.prepare(`UPDATE applications SET skill_score=?, stage=?, updated_at=datetime('now') WHERE id=?`)
    .run(score, passed ? 'ai_interview' : 'rejected', a.id);
  res.json({ score, passed });
});

// AI interview (MVP: structured questions recorded for review; AI scoring is a planned integration)
const AI_QUESTIONS = [
  'Describe a project or coursework you are most proud of, and your specific contribution.',
  'Why do you want this particular role, and what do you hope to learn in the first 3 months?',
  'Tell us about a time you had to learn something difficult quickly. How did you approach it?',
];
app.get('/api/applications/:id/ai-interview', requireAuth('student'), (req, res) => {
  const a = db.prepare('SELECT * FROM applications WHERE id=? AND student_id=?').get(req.params.id, req.session.user.id);
  if (!a || a.stage !== 'ai_interview') return res.status(400).json({ error: 'The AI interview is not the current step.' });
  res.json({ questions: AI_QUESTIONS });
});
app.post('/api/applications/:id/ai-interview', requireAuth('student'), (req, res) => {
  const a = db.prepare('SELECT * FROM applications WHERE id=? AND student_id=?').get(req.params.id, req.session.user.id);
  if (!a || a.stage !== 'ai_interview') return res.status(400).json({ error: 'The AI interview is not the current step.' });
  const answers = req.body?.answers || [];
  if (answers.length !== AI_QUESTIONS.length || answers.some(x => !x || x.trim().length < 30)) {
    return res.status(400).json({ error: 'Answer every question with at least a short paragraph (30+ characters).' });
  }
  const ins = db.prepare('INSERT INTO ai_answers (application_id, question, answer) VALUES (?,?,?)');
  AI_QUESTIONS.forEach((q, i) => ins.run(a.id, q, answers[i]));
  db.prepare(`UPDATE applications SET stage='company_test', ai_summary='Interview answers recorded, pending company review.', updated_at=datetime('now') WHERE id=?`).run(a.id);
  res.json({ ok: true, stage: 'company_test' });
});

// ---------- applications: company side ----------
app.get('/api/company/applicants', requireAuth('company'), (req, res) => {
  const comp = db.prepare('SELECT * FROM companies WHERE owner_user_id=?').get(req.session.user.id);
  const rows = db.prepare(`SELECT a.*, u.name AS student_name, u.email AS student_email, u.major, j.title, j.id AS job_id
    FROM applications a JOIN users u ON u.id=a.student_id JOIN jobs j ON j.id=a.job_id
    WHERE j.company_id=? ORDER BY a.updated_at DESC`).all(comp?.id || -1);
  res.json({ applicants: rows });
});

app.get('/api/company/applicants/:id', requireAuth('company'), (req, res) => {
  const comp = db.prepare('SELECT * FROM companies WHERE owner_user_id=?').get(req.session.user.id);
  const a = db.prepare(`SELECT a.*, u.name AS student_name, u.email AS student_email, u.major, j.title, j.company_id
    FROM applications a JOIN users u ON u.id=a.student_id JOIN jobs j ON j.id=a.job_id WHERE a.id=?`).get(req.params.id);
  if (!a || a.company_id !== comp?.id) return res.status(404).json({ error: 'Applicant not found.' });
  const aiAnswers = db.prepare('SELECT question, answer FROM ai_answers WHERE application_id=?').all(a.id);
  res.json({ applicant: a, aiAnswers });
});

app.post('/api/company/applicants/:id/advance', requireAuth('company'), (req, res) => {
  const comp = db.prepare('SELECT * FROM companies WHERE owner_user_id=?').get(req.session.user.id);
  const a = db.prepare(`SELECT a.*, j.company_id, j.id AS jid FROM applications a JOIN jobs j ON j.id=a.job_id WHERE a.id=?`).get(req.params.id);
  if (!a || a.company_id !== comp?.id) return res.status(404).json({ error: 'Applicant not found.' });
  if (['hired', 'rejected'].includes(a.stage)) return res.status(400).json({ error: 'This application is already final.' });
  if (['applied', 'skill_test', 'ai_interview'].includes(a.stage)) return res.status(400).json({ error: 'The candidate must finish platform verification steps first.' });

  const to = nextStage(a.stage);
  if (to === 'hired') return hire(a, res);
  db.prepare(`UPDATE applications SET stage=?, updated_at=datetime('now') WHERE id=?`).run(to, a.id);
  res.json({ stage: to });
});

app.post('/api/company/applicants/:id/reject', requireAuth('company'), (req, res) => {
  const comp = db.prepare('SELECT * FROM companies WHERE owner_user_id=?').get(req.session.user.id);
  const a = db.prepare(`SELECT a.*, j.company_id FROM applications a JOIN jobs j ON j.id=a.job_id WHERE a.id=?`).get(req.params.id);
  if (!a || a.company_id !== comp?.id) return res.status(404).json({ error: 'Applicant not found.' });
  if (a.stage === 'hired') return res.status(400).json({ error: 'A hired candidate cannot be rejected. Contact the admin.' });
  db.prepare(`UPDATE applications SET stage='rejected', updated_at=datetime('now') WHERE id=?`).run(a.id);
  res.json({ stage: 'rejected' });
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

// ---------- static (production build) ----------
const dist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(dist));
app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`LinkWork server on http://localhost:${PORT}`));
