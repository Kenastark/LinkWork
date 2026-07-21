const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'linkwork.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS universities (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  domains TEXT NOT NULL -- comma-separated allowed email domains
);
CREATE TABLE IF NOT EXISTS faculties (
  id INTEGER PRIMARY KEY,
  university_id INTEGER NOT NULL REFERENCES universities(id),
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('student','company','admin')),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  university_id INTEGER REFERENCES universities(id),
  faculty_id INTEGER REFERENCES faculties(id),
  major TEXT,
  doc_status TEXT DEFAULT 'none' CHECK (doc_status IN ('none','submitted','verified','rejected')),
  doc_note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY,
  owner_user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  website TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  university_id INTEGER NOT NULL REFERENCES universities(id),
  faculty_id INTEGER REFERENCES faculties(id),
  title TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('internship','entry_level')),
  description TEXT NOT NULL,
  requirements TEXT,
  positions INTEGER NOT NULL DEFAULT 1,
  filled INTEGER NOT NULL DEFAULT 0,
  faculty_verified INTEGER NOT NULL DEFAULT 0, -- 1 = negotiated bilaterally with faculty
  status TEXT DEFAULT 'open' CHECK (status IN ('open','closed')),
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES jobs(id),
  student_id INTEGER NOT NULL REFERENCES users(id),
  stage TEXT NOT NULL DEFAULT 'applied' CHECK (stage IN
    ('applied','skill_test','ai_interview','company_test','hr_interview','tech_interview','hired','rejected')),
  skill_score INTEGER,
  ai_summary TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(job_id, student_id)
);
CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES jobs(id),
  student_id INTEGER NOT NULL REFERENCES users(id),
  hired_at TEXT DEFAULT (datetime('now')),
  UNIQUE(job_id, student_id)
);
CREATE TABLE IF NOT EXISTS skill_questions (
  id INTEGER PRIMARY KEY,
  major TEXT NOT NULL,
  question TEXT NOT NULL,
  options TEXT NOT NULL, -- JSON array
  answer_idx INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS ai_answers (
  id INTEGER PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id),
  question TEXT NOT NULL,
  answer TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS job_alerts (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id),
  faculty_id INTEGER REFERENCES faculties(id),
  job_type TEXT CHECK (job_type IN ('internship','entry_level') OR job_type IS NULL),
  keyword TEXT,
  notify_email INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

// ---------- Migrations (add columns to tables that may already exist on disk) ----------
function addColumnIfMissing(table, column, ddl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
  if (!cols.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
}
addColumnIfMissing('users', 'terms_accepted_at', 'terms_accepted_at TEXT');
addColumnIfMissing('users', 'privacy_policy_version', 'privacy_policy_version TEXT');
addColumnIfMissing('ai_answers', 'confidence_score', 'confidence_score INTEGER');
addColumnIfMissing('ai_answers', 'confidence_rationale', 'confidence_rationale TEXT');
addColumnIfMissing('ai_answers', 'scored_at', 'scored_at TEXT');

// ---------- Seed ----------
function seed() {
  const uniCount = db.prepare('SELECT COUNT(*) c FROM universities').get().c;
  if (uniCount > 0) return;

  const uni = db.prepare('INSERT INTO universities (name, domains) VALUES (?, ?)')
    .run('University of Debrecen', 'mailbox.unideb.hu,unideb.hu');
  const uniId = uni.lastInsertRowid;

  const facNames = ['Faculty of Informatics', 'Faculty of Engineering', 'Faculty of Economics and Business', 'Faculty of Science and Technology'];
  const facIds = {};
  for (const f of facNames) {
    facIds[f] = db.prepare('INSERT INTO faculties (university_id, name) VALUES (?, ?)').run(uniId, f).lastInsertRowid;
  }

  const hash = (p) => bcrypt.hashSync(p, 10);

  // Admin
  db.prepare(`INSERT INTO users (role, email, password_hash, name) VALUES ('admin','admin@linkwork.app',?, 'Platform Admin')`)
    .run(hash('admin1234'));

  // Demo student (verified)
  const student = db.prepare(`INSERT INTO users (role,email,password_hash,name,university_id,faculty_id,major,doc_status)
    VALUES ('student','demo.student@mailbox.unideb.hu',?,?,?,?,?,'verified')`)
    .run(hash('student1234'), 'Anna Kovács', uniId, facIds['Faculty of Informatics'], 'Computer Science');

  // Demo company (approved)
  const compUser = db.prepare(`INSERT INTO users (role,email,password_hash,name) VALUES ('company','hr@datatech.hu',?, 'DataTech HR')`)
    .run(hash('company1234'));
  const comp = db.prepare(`INSERT INTO companies (owner_user_id,name,website,description,status)
    VALUES (?,?,?,?, 'approved')`)
    .run(compUser.lastInsertRowid, 'DataTech Hungary Kft.', 'https://datatech.example', 'Debrecen-based software company building logistics platforms.');

  // Jobs
  const insJob = db.prepare(`INSERT INTO jobs (company_id,university_id,faculty_id,title,job_type,description,requirements,positions,faculty_verified)
    VALUES (?,?,?,?,?,?,?,?,?)`);
  insJob.run(comp.lastInsertRowid, uniId, facIds['Faculty of Informatics'],
    'Software Engineering Intern', 'internship',
    'Join our backend team for a 6-month paid internship working on real logistics APIs. Mentored by senior engineers, with a path to a junior role.',
    'Basic Python or Java, SQL fundamentals, coursework in data structures.',
    2, 1);
  insJob.run(comp.lastInsertRowid, uniId, facIds['Faculty of Economics and Business'],
    'Junior Business Analyst', 'entry_level',
    'Entry-level analyst role supporting our product team with market and pricing analysis.',
    'Excel, basic statistics, strong written English.',
    1, 0);

  // Skill questions per major (starter bank)
  const q = db.prepare('INSERT INTO skill_questions (major,question,options,answer_idx) VALUES (?,?,?,?)');
  const bank = {
    'Computer Science': [
      ['Which data structure gives O(1) average lookup by key?', ['Linked list', 'Hash map', 'Binary tree', 'Stack'], 1],
      ['What does SQL SELECT DISTINCT do?', ['Sorts rows', 'Removes duplicate rows', 'Joins tables', 'Deletes rows'], 1],
      ['Which HTTP method is idempotent by definition?', ['POST', 'PUT', 'PATCH', 'CONNECT'], 1],
      ['Big-O of binary search on a sorted array?', ['O(n)', 'O(n log n)', 'O(log n)', 'O(1)'], 2],
      ['In Git, which command creates a new branch and switches to it?', ['git merge -b', 'git checkout -b', 'git push -u', 'git init -b'], 1],
    ],
    'Business Administration': [
      ['Which statement shows a company\'s financial position at a point in time?', ['Income statement', 'Balance sheet', 'Cash flow statement', 'Equity statement'], 1],
      ['A price elasticity of demand greater than 1 means demand is…', ['Inelastic', 'Unit elastic', 'Elastic', 'Fixed'], 2],
      ['SWOT stands for Strengths, Weaknesses, Opportunities and…', ['Trends', 'Threats', 'Targets', 'Tactics'], 1],
      ['Net profit margin equals…', ['Revenue / Assets', 'Net income / Revenue', 'Gross profit / Equity', 'EBIT / Debt'], 1],
      ['Which is a fixed cost for a factory?', ['Raw materials', 'Hourly wages', 'Monthly rent', 'Shipping per unit'], 2],
    ],
  };
  for (const [major, questions] of Object.entries(bank)) {
    for (const [question, options, answer] of questions) {
      q.run(major, question, JSON.stringify(options), answer);
    }
  }

  console.log('Seeded database with University of Debrecen, demo accounts, and jobs.');
}
seed();

module.exports = db;
