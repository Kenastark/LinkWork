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
CREATE TABLE IF NOT EXISTS majors (
  id INTEGER PRIMARY KEY,
  faculty_id INTEGER NOT NULL REFERENCES faculties(id),
  name TEXT NOT NULL,
  min_level TEXT -- NULL = any level; otherwise the minimum of Bachelor's/Master's/PhD required
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
CREATE TABLE IF NOT EXISTS skill_test_attempts (
  id INTEGER PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id),
  attempt_number INTEGER NOT NULL CHECK (attempt_number IN (1,2)),
  question_ids TEXT NOT NULL, -- JSON array of skill_questions.id
  score INTEGER, -- NULL until submitted
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(application_id, attempt_number)
);
CREATE TABLE IF NOT EXISTS ai_answers (
  id INTEGER PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id),
  question TEXT NOT NULL,
  answer TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS company_follows (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id),
  company_id INTEGER NOT NULL REFERENCES companies(id),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(student_id, company_id)
);
CREATE TABLE IF NOT EXISTS translation_cache (
  id INTEGER PRIMARY KEY,
  text_hash TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  source_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(text_hash, target_lang)
);
CREATE TABLE IF NOT EXISTS interviews (
  id INTEGER PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id),
  kind TEXT NOT NULL CHECK (kind IN ('hr_interview','tech_interview')),
  status TEXT NOT NULL DEFAULT 'awaiting_pick' CHECK (status IN ('awaiting_pick','scheduled','completed','cancelled')),
  chosen_slot_id INTEGER,
  room_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS interview_slots (
  id INTEGER PRIMARY KEY,
  interview_id INTEGER NOT NULL REFERENCES interviews(id),
  start_at TEXT NOT NULL,       -- ISO 8601 UTC
  duration_min INTEGER NOT NULL DEFAULT 45
);
CREATE TABLE IF NOT EXISTS interview_participants (
  id INTEGER PRIMARY KEY,
  interview_id INTEGER NOT NULL REFERENCES interviews(id),
  email TEXT NOT NULL,
  added_at TEXT DEFAULT (datetime('now')),
  UNIQUE(interview_id, email)
);
-- In-app notification log. Doubles as the scaffold for future email delivery:
-- each row is a message we WOULD email (subject/body written now); 'emailed_at'
-- stays NULL until real sending is wired up.
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  read_at TEXT,
  emailed_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
-- Company test: the company's own MCQ/essay test that the student takes at the
-- company_test stage. Companies will upload their own later; for now a shared
-- sample bank (company_id NULL) is seeded and used for every company test.
CREATE TABLE IF NOT EXISTS company_test_questions (
  id INTEGER PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),   -- NULL = shared sample bank
  type TEXT NOT NULL CHECK (type IN ('mcq','essay')),
  question TEXT NOT NULL,
  options TEXT,          -- JSON array for mcq
  answer_idx INTEGER,    -- correct option index for mcq
  position INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS company_test_answers (
  id INTEGER PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id),
  question_id INTEGER NOT NULL REFERENCES company_test_questions(id),
  answer_idx INTEGER,    -- chosen option for mcq
  answer_text TEXT,      -- essay response
  UNIQUE(application_id, question_id)
);
`);
db.exec('DROP TABLE IF EXISTS job_alerts');

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
addColumnIfMissing('users', 'phone', 'phone TEXT');
addColumnIfMissing('users', 'photo_path', 'photo_path TEXT');
addColumnIfMissing('ai_answers', 'attempt', 'attempt INTEGER NOT NULL DEFAULT 1');
addColumnIfMissing('users', 'education_level', 'education_level TEXT');
addColumnIfMissing('majors', 'min_level', "min_level TEXT");
addColumnIfMissing('jobs', 'location', 'location TEXT');
addColumnIfMissing('jobs', 'work_mode', "work_mode TEXT"); // on_site | hybrid | remote
addColumnIfMissing('jobs', 'salary_huf', 'salary_huf INTEGER'); // gross HUF/month, NULL = undisclosed
// TEST-ONLY: a company flagged here can view every submitted application, not just
// applications to its own postings. In production no company has this flag — each
// company sees only applications to its own jobs (enforced in server/index.js).
addColumnIfMissing('companies', 'can_view_all_applicants', 'can_view_all_applicants INTEGER NOT NULL DEFAULT 0');
addColumnIfMissing('ai_answers', 'company_score', 'company_score INTEGER');       // company's 0-10 score per AI interview answer
addColumnIfMissing('applications', 'company_test_score', 'company_test_score INTEGER'); // MCQ % on the company test, NULL until taken
addColumnIfMissing('applications', 'ai_score', 'ai_score INTEGER');               // overall AI interview section score (avg of company_score), 0-100

// ---------- Idempotent test viewer account (runs on every boot, not just first seed) ----------
// A dedicated company login for testing the applicant-review flow across ALL companies'
// applications. Safe to keep in dev/demo; must not be created in a real production deploy.
(function ensureTestViewer() {
  const email = 'viewer@linkwork.test';
  let u = db.prepare('SELECT id FROM users WHERE email=?').get(email);
  if (!u) {
    const r = db.prepare(`INSERT INTO users (role,email,password_hash,name) VALUES ('company',?,?,?)`)
      .run(email, bcrypt.hashSync('viewer1234', 10), 'Test Reviewer');
    u = { id: r.lastInsertRowid };
  }
  const comp = db.prepare('SELECT id FROM companies WHERE owner_user_id=?').get(u.id);
  if (!comp) {
    db.prepare(`INSERT INTO companies (owner_user_id,name,website,description,status,can_view_all_applicants)
      VALUES (?,?,?,?, 'approved', 1)`)
      .run(u.id, 'LinkWork Test Reviewer', null, 'Internal test account — sees all applications across every company.');
  } else {
    db.prepare('UPDATE companies SET can_view_all_applicants=1 WHERE id=?').run(comp.id);
  }
})();

// ---------- Idempotent shared sample company test bank (runs on every boot) ----------
// Placeholder until companies upload their own tests. MCQ only — auto-scored on submit.
(function ensureSampleCompanyTest() {
  // Remove any legacy essay questions (and their answers) — the sample test is MCQ-only now.
  const essays = db.prepare(`SELECT id FROM company_test_questions WHERE company_id IS NULL AND type='essay'`).all().map(r => r.id);
  if (essays.length) {
    const del = db.prepare('DELETE FROM company_test_answers WHERE question_id=?');
    essays.forEach(id => del.run(id));
    db.prepare(`DELETE FROM company_test_questions WHERE company_id IS NULL AND type='essay'`).run();
  }
  const existing = db.prepare(`SELECT COUNT(*) c FROM company_test_questions WHERE company_id IS NULL AND type='mcq'`).get().c;
  if (existing > 0) return;
  const ins = db.prepare('INSERT INTO company_test_questions (company_id, type, question, options, answer_idx, position) VALUES (NULL, \'mcq\', ?,?,?,?)');
  const mcq = [
    ['Which best describes a REST API?', ['A styling framework', 'An architectural style for networked applications', 'A database engine', 'A version control system'], 1],
    ['In a team, you disagree with a decision that has already been made. What is the most professional first step?', ['Ignore it and do your own thing', 'Raise your concern respectfully with reasoning, then commit to the team decision', 'Complain to other teammates', 'Do nothing and hope it works out'], 1],
    ['What does "version control" (e.g. Git) primarily help teams do?', ['Design logos', 'Track and merge changes to code over time', 'Host live meetings', 'Write documentation only'], 1],
    ['A stakeholder gives you an ambiguous task. What is the best approach?', ['Guess and start building immediately', 'Ask clarifying questions to align on the goal before starting', 'Wait until someone else clarifies', 'Decline the task'], 1],
  ];
  let pos = 0;
  mcq.forEach(([q, opts, idx]) => ins.run(q, JSON.stringify(opts), idx, pos++));
})();

// ---------- Seed ----------
function seed() {
  const uniCount = db.prepare('SELECT COUNT(*) c FROM universities').get().c;
  if (uniCount > 0) return;

  const uni = db.prepare('INSERT INTO universities (name, domains) VALUES (?, ?)')
    .run('University of Debrecen', 'mailbox.unideb.hu,unideb.hu');
  const uniId = uni.lastInsertRowid;

  const facultyMajors = {
    'Faculty of Agriculture and Food Sciences and Environmental Management': ['Agricultural Engineering', 'Food Science', 'Environmental Management'],
    'Faculty of Humanities': ['History', 'English Language and Literature', 'Philosophy'],
    'Faculty of Dentistry': ['Dentistry'],
    'Faculty of Economics and Business': ['Business Administration', 'Economics', 'Finance and Accounting'],
    'Faculty of Medicine': ['Medicine'],
    'Faculty of Informatics': ['Computer Science', 'Software Engineering', 'Information Technology', 'Business Informatics', ['Data Science', "Master's"]],
    'Faculty of Law': ['Law'],
    'Faculty of Music': ['Music Performance', 'Music Theory'],
    'Faculty of Pharmacy': ['Pharmacy'],
    'Faculty of Science and Technology': ['Mathematics', 'Physics', 'Biology', 'Chemistry', 'Environmental Science'],
    'Faculty of Public Health': ['Public Health', 'Health Sciences'],
    'Faculty of Engineering': ['Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering'],
    'Faculty of Child and Special Needs Education': ['Early Childhood Education', 'Special Needs Education'],
  };

  const facIds = {};
  const insMajor = db.prepare('INSERT INTO majors (faculty_id, name, min_level) VALUES (?, ?, ?)');
  for (const [facName, majors] of Object.entries(facultyMajors)) {
    const facId = db.prepare('INSERT INTO faculties (university_id, name) VALUES (?, ?)').run(uniId, facName).lastInsertRowid;
    facIds[facName] = facId;
    for (const m of majors) {
      const [name, minLevel] = Array.isArray(m) ? m : [m, null];
      insMajor.run(facId, name, minLevel);
    }
  }

  const hash = (p) => bcrypt.hashSync(p, 10);

  // Admin
  db.prepare(`INSERT INTO users (role, email, password_hash, name) VALUES ('admin','admin@linkwork.app',?, 'Platform Admin')`)
    .run(hash('admin1234'));

  // Demo student (verified)
  db.prepare(`INSERT INTO users (role,email,password_hash,name,university_id,faculty_id,major,doc_status,education_level)
    VALUES ('student','demo.student@mailbox.unideb.hu',?,?,?,?,?,'verified',?)`)
    .run(hash('student1234'), 'Anna Kovács', uniId, facIds['Faculty of Informatics'], 'Computer Science', "Bachelor's");

  // Demo companies (approved)
  const mkCompany = (email, contactName, name, website, description) => {
    const compUser = db.prepare(`INSERT INTO users (role,email,password_hash,name) VALUES ('company',?,?,?)`)
      .run(email, hash('company1234'), contactName);
    const comp = db.prepare(`INSERT INTO companies (owner_user_id,name,website,description,status) VALUES (?,?,?,?, 'approved')`)
      .run(compUser.lastInsertRowid, name, website, description);
    return comp.lastInsertRowid;
  };

  const dataTechId = mkCompany('hr@datatech.hu', 'DataTech HR', 'DataTech Hungary Kft.', 'https://datatech.example',
    'Debrecen-based software company building logistics platforms.');
  const voltixId = mkCompany('careers@voltix.hu', 'Voltix Recruiting', 'Voltix Electronics Kft.', 'https://voltix.example',
    'Designs and manufactures embedded electronics and power systems for industrial clients.');
  const precisaId = mkCompany('jobs@precisa.hu', 'Precisa Engineering HR', 'Precisa Engineering Kft.', 'https://precisa.example',
    'Precision mechanical engineering and manufacturing for the automotive supply chain.');
  const greenFieldId = mkCompany('hr@greenfieldagro.hu', 'GreenField People Team', 'GreenField AgroTech Zrt.', 'https://greenfieldagro.example',
    'Agricultural technology company building data-driven tools for sustainable farming.');
  const nyugatComId = mkCompany('recruiting@nyugatcom.hu', 'NyugatCom Recruiting', 'NyugatCom Legal Partners', 'https://nyugatcom.example',
    'A regional law firm advising businesses across Eastern Hungary.');
  const publicHealthId = mkCompany('careers@dphi.hu', 'DPHI Recruiting', 'Debrecen Public Health Initiative', 'https://dphi.example',
    'A public health research and policy organization serving the Debrecen region.');

  // Jobs
  const insJob = db.prepare(`INSERT INTO jobs (company_id,university_id,faculty_id,title,job_type,description,requirements,positions,faculty_verified,location,work_mode,salary_huf)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);

  insJob.run(dataTechId, uniId, facIds['Faculty of Informatics'],
    'Software Engineering Intern', 'internship',
    'Join our backend team for a 6-month paid internship working on real logistics APIs. Mentored by senior engineers, with a path to a junior role.',
    'Basic Python or Java, SQL fundamentals, coursework in data structures.',
    2, 1, 'Debrecen', 'hybrid', 280000);
  insJob.run(dataTechId, uniId, facIds['Faculty of Economics and Business'],
    'Junior Business Analyst', 'entry_level',
    'Entry-level analyst role supporting our product team with market and pricing analysis.',
    'Excel, basic statistics, strong written English.',
    1, 0, 'Debrecen', 'on_site', 520000);
  insJob.run(dataTechId, uniId, facIds['Faculty of Informatics'],
    'Frontend Developer Intern', 'internship',
    'Build and ship features in our React-based logistics dashboard alongside a small product team.',
    'JavaScript fundamentals, some exposure to React or another component-based framework.',
    2, 0, 'Debrecen', 'remote', 260000);
  insJob.run(dataTechId, uniId, facIds['Faculty of Informatics'],
    'Junior Software Engineer', 'entry_level',
    'Full-time role building backend services for our logistics platform. Great for a recent graduate.',
    'Software Engineering coursework, Git, basic understanding of REST APIs.',
    1, 1, 'Debrecen', 'hybrid', 550000);
  insJob.run(voltixId, uniId, facIds['Faculty of Engineering'],
    'Embedded Systems Intern', 'internship',
    'Work with our hardware team on firmware for industrial power monitoring devices.',
    'C fundamentals, basic circuits knowledge, coursework in electrical engineering.',
    1, 1, 'Debrecen', 'on_site', 300000);
  insJob.run(precisaId, uniId, facIds['Faculty of Engineering'],
    'Mechanical Design Intern', 'internship',
    'Support our design team with CAD modeling and tolerance analysis for automotive components.',
    'CAD software experience (SolidWorks or similar), coursework in mechanical engineering.',
    2, 0, 'Budapest', 'on_site', 290000);
  insJob.run(greenFieldId, uniId, facIds['Faculty of Agriculture and Food Sciences and Environmental Management'],
    'Agricultural Data Analyst Intern', 'internship',
    'Analyze sensor and yield data to help our farming partners make better decisions.',
    'Comfort with spreadsheets or basic scripting, interest in agriculture or environmental science.',
    1, 1, 'Debrecen', 'hybrid', 270000);
  insJob.run(greenFieldId, uniId, facIds['Faculty of Science and Technology'],
    'Data Science Intern', 'internship',
    'Build statistical models on agricultural datasets alongside our data team.',
    'Mathematics or statistics coursework, basic Python.',
    1, 0, 'Budapest', 'remote', 320000);
  insJob.run(nyugatComId, uniId, facIds['Faculty of Law'],
    'Legal Research Assistant', 'entry_level',
    'Support our commercial law team with research, drafting, and client documentation.',
    'Law coursework, strong written Hungarian and English.',
    1, 1, 'Debrecen', 'on_site', 480000);
  insJob.run(publicHealthId, uniId, facIds['Faculty of Public Health'],
    'Public Health Research Intern', 'internship',
    'Assist with data collection and analysis for a regional public health study.',
    'Public health or health sciences coursework, attention to detail.',
    1, 0, 'Debrecen', 'hybrid', 250000);

  // Skill questions per major (10-question banks for STEM majors + Business Administration)
  const q = db.prepare('INSERT INTO skill_questions (major,question,options,answer_idx) VALUES (?,?,?,?)');
  const bank = {
    'Computer Science': [
      ['Which data structure gives O(1) average lookup by key?', ['Linked list', 'Hash map', 'Binary tree', 'Stack'], 1],
      ['What does SQL SELECT DISTINCT do?', ['Sorts rows', 'Removes duplicate rows', 'Joins tables', 'Deletes rows'], 1],
      ['Which HTTP method is idempotent by definition?', ['POST', 'PUT', 'PATCH', 'CONNECT'], 1],
      ['Big-O of binary search on a sorted array?', ['O(n)', 'O(n log n)', 'O(log n)', 'O(1)'], 2],
      ['In Git, which command creates a new branch and switches to it?', ['git merge -b', 'git checkout -b', 'git push -u', 'git init -b'], 1],
      ['What is the average-case time complexity of quicksort?', ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], 1],
      ['Which HTTP status code category indicates a client error?', ['2xx', '3xx', '4xx', '5xx'], 2],
      ['In OOP, what does "encapsulation" mean?', ['Inheriting from multiple classes', 'Bundling data and methods within a class', 'Overriding a method', 'Compiling code ahead of time'], 1],
      ['Which of these sorting algorithms is stable?', ['Quicksort', 'Heapsort', 'Merge sort', 'Selection sort'], 2],
      ['What does REST stand for in web APIs?', ['Remote State Transfer', 'Representational State Transfer', 'Reliable Service Transmission', 'Recursive State Tree'], 1],
    ],
    'Software Engineering': [
      ['What does "DRY" stand for in software engineering?', ["Don't Repeat Yourself", 'Design Rapidly Yearly', 'Data Recovery Yield', 'Direct Runtime Yield'], 0],
      ['Which design pattern ensures a class has only one instance?', ['Factory', 'Singleton', 'Observer', 'Adapter'], 1],
      ['What is a primary purpose of a code review?', ['Slow down releases', 'Catch bugs and share knowledge before merging', 'Replace testing entirely', 'Assign blame for bugs'], 1],
      ['Which of these is a version control system?', ['Git', 'Docker', 'Jenkins', 'Kubernetes'], 0],
      ['What does CI/CD stand for?', ['Code Inspection / Code Delivery', 'Continuous Integration / Continuous Deployment', 'Client Integration / Client Deployment', 'Continuous Iteration / Continuous Debugging'], 1],
      ['In Agile, what is a "sprint"?', ['A single line of code', 'A fixed time-boxed period to complete a set amount of work', 'A production outage', 'A type of code review'], 1],
      ['What is "technical debt"?', ['Money owed to a hosting provider', 'The implied cost of rework from choosing a quick fix over a better approach', 'A bug tracking ticket', 'Server maintenance downtime'], 1],
      ['Which testing type verifies individual functions in isolation?', ['Unit testing', 'Load testing', 'Acceptance testing', 'Smoke testing'], 0],
      ['What does an API gateway do?', ['Compiles source code', 'Routes and manages requests to backend services', 'Stores user passwords', 'Renders the frontend UI'], 1],
      ['Which of these is NOT one of the SOLID principles?', ['Single responsibility', 'Open/closed', 'Liskov substitution', 'Duplication'], 3],
    ],
    'Mechanical Engineering': [
      ['What is the SI unit of force?', ['Joule', 'Newton', 'Watt', 'Pascal'], 1],
      ["Which law states force equals mass times acceleration?", ["Newton's First Law", "Newton's Second Law", "Newton's Third Law", "Law of Conservation of Energy"], 1],
      ['What does "torque" measure?', ['Linear force', 'Rotational force', 'Heat transfer', 'Fluid pressure'], 1],
      ['In thermodynamics, what does the First Law describe?', ['Entropy always increases', 'Conservation of energy', 'Heat flows from cold to hot', 'Pressure is constant'], 1],
      ['Which material property describes resistance to permanent deformation?', ['Density', 'Yield strength', 'Thermal conductivity', 'Viscosity'], 1],
      ['What is the purpose of a gear train?', ['To generate electricity', 'To transmit and modify rotational motion or torque', 'To cool an engine', 'To measure pressure'], 1],
      ['Which of these is a type of mechanical stress?', ['Voltage stress', 'Shear stress', 'Current stress', 'Frequency stress'], 1],
      ['What does CAD stand for?', ['Computer-Aided Design', 'Central Assembly Drawing', 'Component Analysis Diagram', 'Calibrated Angular Drive'], 0],
      ["In fluid mechanics, what does Bernoulli's principle relate?", ['Temperature and volume', 'Pressure and velocity of a fluid', 'Mass and charge', 'Force and torque'], 1],
      ['Which manufacturing process removes material to shape a part?', ['Casting', 'Machining', 'Forging', 'Extrusion'], 1],
    ],
    'Electrical Engineering': [
      ["What does Ohm's Law state?", ['P = VI', 'V = IR', 'E = mc²', 'F = ma'], 1],
      ['Which unit measures electrical resistance?', ['Volt', 'Ohm', 'Ampere', 'Watt'], 1],
      ['What does AC stand for in electrical current?', ['Alternating Current', 'Active Circuit', 'Applied Charge', 'Ampere Constant'], 0],
      ['Which component stores electrical charge?', ['Resistor', 'Capacitor', 'Diode', 'Transistor'], 1],
      ['What is the purpose of a transformer?', ['To store energy', 'To step voltage up or down', 'To convert AC to light', 'To measure current'], 1],
      ['Which law states current entering a node equals current leaving it?', ["Kirchhoff's Voltage Law", "Kirchhoff's Current Law", "Ohm's Law", "Faraday's Law"], 1],
      ['What does a diode do?', ['Amplifies a signal', 'Allows current to flow in one direction only', 'Stores charge', 'Converts AC to mechanical motion'], 1],
      ['Which of these is a unit of power?', ['Coulomb', 'Watt', 'Farad', 'Henry'], 1],
      ['In digital logic, what does an AND gate output when both inputs are 1?', ['0', '1', 'Undefined', 'It depends on voltage'], 1],
      ['What does PCB stand for?', ['Power Control Board', 'Printed Circuit Board', 'Parallel Current Bus', 'Primary Circuit Breaker'], 1],
    ],
    'Mathematics': [
      ['What is the derivative of x²?', ['x', '2x', 'x²', '2'], 1],
      ['Which theorem relates the sides of a right triangle?', ['Fermat\'s theorem', 'Pythagorean theorem', 'Bayes\' theorem', 'Euler\'s theorem'], 1],
      ['What is the value of π rounded to two decimal places?', ['3.12', '3.14', '3.16', '3.18'], 1],
      ['What is the integral of a constant function f(x) = c?', ['0', 'c', 'cx + C', 'x + C'], 2],
      ['Which branch of mathematics deals with rates of change?', ['Algebra', 'Calculus', 'Geometry', 'Combinatorics'], 1],
      ['What is a prime number?', ['Any odd number', 'A number greater than 1 with no divisors other than 1 and itself', 'Any number divisible by 2', 'A number less than 10'], 1],
      ['What is the determinant of a matrix used for?', ['To sort its rows', 'To determine if it is invertible', 'To compute its trace', 'To transpose it'], 1],
      ['What does "standard deviation" measure?', ['The average of a data set', 'The spread of data around the mean', 'The most frequent value', 'The total sum of values'], 1],
      ['Which of these is an irrational number?', ['4', '0.5', '√2', '3/4'], 2],
      ['What is the sum of the interior angles of a triangle?', ['90 degrees', '180 degrees', '270 degrees', '360 degrees'], 1],
    ],
    'Physics': [
      ['What is the SI unit of energy?', ['Newton', 'Joule', 'Watt', 'Pascal'], 1],
      ['Which law states energy cannot be created or destroyed?', ["Newton's First Law", 'Conservation of energy', "Ohm's Law", "Boyle's Law"], 1],
      ['What is the speed of light in a vacuum, approximately?', ['300 km/s', '30,000 km/s', '300,000 km/s', '3,000,000 km/s'], 2],
      ['What does "velocity" measure that "speed" does not?', ['Magnitude', 'Direction', 'Time', 'Mass'], 1],
      ['Which force keeps planets in orbit around the sun?', ['Friction', 'Gravity', 'Magnetism', 'Tension'], 1],
      ['What is the unit of electric charge?', ['Volt', 'Ohm', 'Coulomb', 'Watt'], 2],
      ['In wave physics, what does "frequency" measure?', ['Wave height', 'Number of oscillations per second', 'Wave speed', 'Wavelength'], 1],
      ["What does Newton's Third Law state?", ['Objects in motion stay in motion', 'For every action there is an equal and opposite reaction', 'Force equals mass times acceleration', 'Energy is conserved'], 1],
      ['Which particle has a negative charge?', ['Proton', 'Neutron', 'Electron', 'Photon'], 2],
      ['What does "kinetic energy" primarily depend on?', ['Mass and velocity', 'Charge and voltage', 'Temperature and pressure', 'Frequency and wavelength'], 0],
    ],
    'Business Administration': [
      ['Which statement shows a company\'s financial position at a point in time?', ['Income statement', 'Balance sheet', 'Cash flow statement', 'Equity statement'], 1],
      ['A price elasticity of demand greater than 1 means demand is…', ['Inelastic', 'Unit elastic', 'Elastic', 'Fixed'], 2],
      ['SWOT stands for Strengths, Weaknesses, Opportunities and…', ['Trends', 'Threats', 'Targets', 'Tactics'], 1],
      ['Net profit margin equals…', ['Revenue / Assets', 'Net income / Revenue', 'Gross profit / Equity', 'EBIT / Debt'], 1],
      ['Which is a fixed cost for a factory?', ['Raw materials', 'Hourly wages', 'Monthly rent', 'Shipping per unit'], 2],
      ['What is "market segmentation"?', ['Setting a single price for all customers', 'Dividing a market into distinct groups of buyers', 'Merging two companies', 'Reducing production costs'], 1],
      ['Which pricing strategy sets an initially high price then lowers it over time?', ['Penetration pricing', 'Price skimming', 'Cost-plus pricing', 'Loss-leader pricing'], 1],
      ['What does ROI stand for?', ['Rate of Inflation', 'Return on Investment', 'Revenue over Income', 'Risk of Insolvency'], 1],
      ['In accounting, what does "liquidity" refer to?', ['Total company revenue', 'How quickly an asset can be converted to cash', 'The number of shareholders', 'Long-term debt levels'], 1],
      ['Which of these is a leadership style, not a core management function?', ['Planning', 'Organizing', 'Transformational', 'Controlling'], 2],
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
