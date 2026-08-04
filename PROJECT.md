# LinkWork — Full Project Documentation

> A faculty-verified internship and entry-level hiring platform, piloting at the University of Debrecen.
> **Every posting here is real.**

This document explains the whole project: what it is, how it is built, how the data is
modelled, every API route, every page, and where the deliberate gaps are. For a short
elevator-pitch version, see [README.md](README.md).

---

## 1. The problem and the idea

Ordinary job boards are full of *ghost jobs* — roles already filled internally, roles posted
for appearances, roles kept open to build a CV pipeline. Students burn weeks applying into a
void.

LinkWork inverts the trust model:

- A posting only exists because a company **committed to hiring from LinkWork**. Most openings
  are negotiated bilaterally between a **faculty coordinator** and company leadership.
- Companies are **reviewed by a platform admin** before they can post at all.
- Students register with their **official university email** and are **identity-verified once**
  by the admin before they can apply.
- Everyone goes through the **same pipeline with the same bar** — the skill test doesn't care
  who you know.
- When a hire happens, `JOB-XXXX ⟷ STU-XXXX` is written to a **match ledger** and the posting is
  taken down. That record is the proof the job was real.

The trust chain the product is built around:

```
Faculty coordinator ⟷ Company ⟷ Posting ⟷ Verified student
```

Students only ever see openings posted for **their own university** (enforced server-side, not
just in the UI).

---

## 2. Stack and architecture

| Layer | Choice |
|---|---|
| Server | Node.js + Express 4 |
| Database | SQLite via `better-sqlite3` (synchronous, WAL mode, FKs on) |
| Auth | `express-session` cookie sessions + `bcryptjs` password hashing |
| Uploads | `multer` (profile photos only) |
| Client | React 18 + Vite 6 + React Router 6 |
| Styling | One hand-written stylesheet + design tokens. No UI framework, no CSS-in-JS |
| Optional AI | `@anthropic-ai/sdk` (AI interview scoring — scaffolded, admin-only) |
| Optional i18n | Google Cloud Translation API for dynamic DB text, DB-cached |

Architecturally it is deliberately small and boring: a **single Express process** that serves
both the JSON API (`/api/*`) and, in production, the built React SPA from `client/dist`. There
is no ORM, no migration framework (migrations are hand-rolled `ALTER TABLE` guards), no build
step on the server, and no external service is required to run the app.

**Two run modes:**

- **Dev** — Vite dev server on `:5173` proxies `/api` and `/uploads` to Express on `:3001`
  ([client/vite.config.js](client/vite.config.js)).
- **Production-style** — `npm start` builds the client, then Express serves `client/dist` plus a
  catch-all route (`/^\/(?!api).*/`) that returns `index.html` so client-side routing works.

---

## 3. Repository layout

```
LinkWork/
├── package.json              root scripts (dev / build / start), server deps
├── README.md                 short overview
├── PROJECT.md                this document
├── .env.example              optional API keys (Anthropic, Google Translate)
├── server/
│   ├── index.js              the entire HTTP API (~850 lines) + static serving
│   ├── db.js                 schema, migrations, idempotent bootstrap, seed data
│   ├── notify.js             notification writer + all email/notification templates
│   ├── anthropic.js          AI interview scoring (feature-flagged, admin-only)
│   ├── translate.js          Google Translate wrapper with DB cache
│   ├── linkwork.db           SQLite file (gitignored, auto-created + seeded)
│   └── uploads/photos/       profile photos (gitignored)
└── client/
    ├── index.html            fonts (Work Sans, IBM Plex Mono), root div
    ├── vite.config.js        dev proxy to :3001
    └── src/
        ├── main.jsx          React root + BrowserRouter
        ├── App.jsx           auth context, nav, all routes, footer
        ├── api.js            tiny fetch wrapper (throws on non-2xx)
        ├── i18n.jsx          static UI translations (en / hu / fr)
        ├── useTranslatedTexts.js  hook for translating dynamic DB text
        ├── stages.js         shared pipeline stage labels/order helpers
        ├── menuConfig.js     account dropdown items per role
        ├── styles.css        design tokens + every component style
        ├── components/       Button, Card, Badge, Field, Chain, LinkMark,
        │                     DateTimePicker, ErrorBoundary
        └── pages/            21 route components (see §7)
```

> Note: an empty stray directory named `{server` exists at the repo root — an artifact of a
> mistyped shell command. It is safe to delete.

---

## 4. Data model

All tables live in [server/db.js](server/db.js). SQLite, foreign keys enforced.

### Identity and organisation

| Table | Purpose |
|---|---|
| `universities` | Name + comma-separated allowed email domains. Domain match is what gates student sign-up. |
| `faculties` | Belongs to a university. 13 University of Debrecen faculties are seeded. |
| `majors` | Belongs to a faculty. `min_level` optionally requires Bachelor's/Master's/PhD (e.g. Data Science requires a Master's). |
| `users` | One table for all three roles (`student` / `company` / `admin`). Students carry `university_id`, `faculty_id`, `major`, `education_level`, `doc_status`. Also `phone`, `photo_path`, `terms_accepted_at`, `privacy_policy_version`. |
| `companies` | One row per company user (`owner_user_id`). `status` is `pending` until an admin approves. |

### Jobs and applications

| Table | Purpose |
|---|---|
| `jobs` | Owned by a company, scoped to a `university_id` (+ optional faculty). `job_type` = `internship` \| `entry_level`. `positions` / `filled` drive auto-closing. `faculty_verified = 1` earns the gold ★ badge. Plus `location`, `work_mode` (`on_site`/`hybrid`/`remote`), `salary_huf`. |
| `applications` | `UNIQUE(job_id, student_id)`. Holds the current `stage`, plus `skill_score`, `ai_score`, `company_test_score`, `ai_summary`. |
| `matches` | The **hire ledger**: `job_id ⟷ student_id` + `hired_at`. Written once, at hire. |
| `company_follows` | Students following companies (powers the Alerts page). |

### Assessment

| Table | Purpose |
|---|---|
| `skill_questions` | MCQ bank keyed by major name. Seeded with 10-question banks for CS, Software Engineering, Mechanical Eng., Electrical Eng., Mathematics, Physics, Business Administration. |
| `skill_test_attempts` | Max 2 per application; stores the exact question IDs served and the score. |
| `ai_answers` | Written interview answers, per `attempt` (1 or 2). Carries `company_score` (0–10, set by the company) and `confidence_score`/`confidence_rationale`/`scored_at` (set by the Anthropic scorer, if enabled). |
| `company_test_questions` | The company's own test. `company_id IS NULL` = the **shared sample bank** used by every company today. `type` is `mcq` or `essay` (the seeded sample is MCQ-only, so it can be auto-scored). |
| `company_test_answers` | `UNIQUE(application_id, question_id)`, upserted on submit. |

### Interviews, notifications, misc

| Table | Purpose |
|---|---|
| `interviews` | One per `application_id` + `kind` (`hr_interview` / `tech_interview`). `status`: `awaiting_pick → scheduled → completed/cancelled`. Carries a generated `room_id` (UUID) and, after the fact, an interviewer `score` (0–10) and `feedback`. |
| `interview_slots` | Candidate time options proposed by HR (ISO 8601 UTC + duration). |
| `interview_participants` | Extra invitees by email (e.g. a technical team member). |
| `notifications` | In-app inbox **and** the email scaffold: each row is a message we *would* email; `emailed_at` stays `NULL` until real delivery is wired up. |
| `translation_cache` | `sha256(text) + target_lang → translated_text`, so repeat views don't re-call (or re-pay for) the translation API. |

### Migrations and bootstrap

`db.js` runs, in order, on every boot:

1. `CREATE TABLE IF NOT EXISTS` for the whole schema.
2. `addColumnIfMissing(...)` calls — a hand-rolled migration list that `ALTER TABLE`s columns
   onto databases created by earlier versions.
3. **Idempotent test viewer** — ensures the `viewer@linkwork.test` company account exists (see §9).
4. **Idempotent sample company test** — seeds the shared MCQ bank if empty, and deletes any
   legacy essay questions.
5. **`seed()`** — runs only if `universities` is empty: University of Debrecen, 13 faculties and
   their majors, the admin, one demo student, six demo companies, ten jobs, and the skill-question
   banks.

Deleting `server/linkwork.db*` resets everything and reseeds on next boot.

---

## 5. The hiring pipeline

This is the core domain logic. An `applications.stage` moves along:

```
applied → skill_test → ai_interview → company_test → hr_interview → tech_interview → hired
                                                                                    ↘ rejected
```

An application is actually **created at `skill_test`** — `applied` exists in the enum but the
apply route skips straight past it.

**Who controls each transition:**

| Stage | Advanced by | Rule |
|---|---|---|
| `skill_test` | Student (automatic) | 5 random MCQs from the student's major bank. Attempt 1 scores, then the student may **either continue with that score or take one retake** with different questions. If they retake, the final score is the **average of both attempts** and there is no third try. **≥ 60 % passes**; below that the application is auto-`rejected`. |
| `ai_interview` | Student (automatic) | 3 structured written questions (30–1000 chars each). One optional retake with a **different** question set; both rounds are stored and shown to the company. Continuing moves the stage to `company_test`. |
| `company_test` | Student takes it, company advances | **Locked** until the company scores the AI interview (`applications.ai_score IS NOT NULL`). MCQs are auto-scored on submit; **the score is deliberately hidden from the student** and only exposed to the company. |
| `hr_interview` | Company | Company must have a **scheduled** interview of this kind before it can advance. |
| `tech_interview` | Company | Same gate. |
| `hired` | Company | Runs the `hire()` transaction. |

**Guard rails enforced server-side:**

- A company can never advance a candidate out of `applied`/`skill_test`/`ai_interview` — those
  are platform-verification steps the student owns.
- `stageComplete()` blocks advancing before the current stage's requirement is met (test taken,
  interview scheduled), with a specific error message per stage from `stageGateMessage()`.
- A `hired` candidate cannot be rejected.
- Applying requires `doc_status === 'verified'` **and** a matching `university_id`.

**The hire transaction** ([server/index.js](server/index.js) `hire()`):

1. Refuse if `filled >= positions`.
2. Set the application to `hired`.
3. Insert the `matches` ledger row.
4. Increment `jobs.filled`; if it reaches `positions`, set the job to `closed`.
5. If the job closed, **auto-reject every other still-active application** for that posting.
6. Notify the student.

All of it inside one `db.transaction`.

---

## 6. HTTP API

Every route is in [server/index.js](server/index.js). All responses are JSON; errors are
`{ error: "human-readable sentence" }` with a 4xx status. Auth is a session cookie;
`requireAuth(role?)` returns 401 when signed out and 403 on the wrong role.

### Meta and auth

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/meta` | public | Universities, faculties, majors — powers the sign-up dropdowns. |
| POST | `/api/auth/register-student` | public | Validates email domain → university, faculty ∈ university, major ∈ faculty, `min_level` vs `education_level`, 8+ char password, terms accepted. |
| POST | `/api/auth/register-company` | public | Rejects free-mail domains (gmail, outlook, …). Creates a `pending` company. |
| POST | `/api/auth/login` | public | |
| POST | `/api/auth/logout` | public | |
| GET | `/api/auth/me` | public | Re-reads the user from the DB so role/verification changes take effect without re-login. |
| POST | `/api/auth/profile` | any | Name/phone; company users also update company name/website/description. |
| POST | `/api/auth/upload-photo` | any | multipart; PNG/JPEG/WebP, 4 MB cap. |
| POST | `/api/auth/change-password` | any | Verifies the current password first. |

### Discovery

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/stats` | public | Landing-page counters: open jobs, hires, approved companies, six recent company names. |
| GET | `/api/companies` | any | Approved companies + open-job counts. |
| GET | `/api/companies/:id` | any | Company + its open jobs + whether the current student follows it. |
| POST | `/api/companies/:id/follow` · `/unfollow` | student | |
| GET | `/api/my-follows` | student | |
| GET | `/api/jobs` | any | **Role-scoped:** students see open jobs for *their* university (faculty-verified first); companies see only their own postings; admins see everything. |
| GET | `/api/jobs/:id` | any | Job + company + faculty + university, plus the student's own application if any. |
| POST | `/api/jobs` | company | Requires `companies.status = 'approved'`. |
| POST | `/api/translate` | any | Batch-translates dynamic text; silently returns the originals on any failure. |

### Student pipeline

| Method | Path | Notes |
|---|---|---|
| POST | `/api/student/submit-docs` | Sets `doc_status = 'submitted'` (status flow, not a real file upload yet). |
| POST | `/api/jobs/:id/apply` | Verified students only, own university only, one application per job. |
| GET | `/api/my-applications` · `/stats` | List, and ongoing/offers/rejected counts. |
| GET/POST | `/api/applications/:id/skill-test` | `?retake=1` on GET serves attempt 2 with different questions. |
| POST | `/api/applications/:id/skill-test/continue` | Accept attempt 1's score instead of retaking. |
| GET/POST | `/api/applications/:id/ai-interview` | `?retake=1` serves the round-2 question set. |
| POST | `/api/applications/:id/ai-interview/continue` | Moves to `company_test`. |
| GET/POST | `/api/applications/:id/company-test` | GET reports `locked` until the AI interview is scored; never returns the score. |
| GET | `/api/applications/:id/interviews` | |
| POST | `/api/interviews/:id/pick-slot` | Student chooses a proposed time → status `scheduled`, notifies the company. |

### Company side

| Method | Path | Notes |
|---|---|---|
| GET | `/api/company/applicants` | Own postings' applicants, each with a `can_advance` flag. |
| GET | `/api/company/applicants/:id` | Full review payload: applicant, AI answers, interviews, company test (questions + answers + score), `can_advance`. |
| POST | `/api/company/applicants/:id/advance` · `/reject` | Gated as described in §5; both notify the student. |
| POST | `/api/company/applicants/:id/ai-scores` | Per-answer 0–10 scores; overall `ai_score` = average × 10. First time it is set, the student is notified that the company test is unlocked. |
| GET | `/api/company/closed-positions` | Filled postings with the hires selected — the company-facing ledger view. |
| POST | `/api/company/interviews` | Propose 1–6 slots (15–180 min each) for a candidate at an interview stage; creates the room UUID and notifies the student. |
| POST/DELETE | `/api/company/interviews/:id/participants[/:pid]` | Invite/remove extra interviewers by email. |
| POST | `/api/company/interviews/:id/feedback` | Interviewer's 0–10 score + written comments. |

### Shared and admin

| Method | Path | Notes |
|---|---|---|
| GET | `/api/interviews/:id/room` | Meeting room data. Allowed for the student, the owning company, and invited participants only. |
| GET | `/api/notifications` | Last 50 + unread count. |
| POST | `/api/notifications/:id/read` · `/read-all` | |
| GET | `/api/admin/overview` | Companies, students, matches, and headline stats. |
| POST | `/api/admin/companies/:id/status` | `approved` \| `rejected`. |
| POST | `/api/admin/students/:id/doc-status` | `verified` \| `rejected`. |
| POST | `/api/admin/applications/:id/score-ai-interview` | Anthropic scoring. Admin-only, not surfaced anywhere in the product yet. |

---

## 7. Frontend

### Shell

[client/src/App.jsx](client/src/App.jsx) owns everything global:

- **Auth context** (`useAuth()`) — loads `/api/auth/me` once on mount, renders nothing while
  `user === undefined` (loading) to avoid a flash of the signed-out nav.
- **Role-aware nav** — students get Find an internship / Explore companies / Resources /
  Applications; companies get Dashboard; admins get Admin. Signed-out visitors get the same
  labels pointed at `/auth`.
- **Notification bell** with an unread badge, refetched on every route change.
- **Language switcher** (EN / HU / FR) and the **account dropdown** (items per role from
  `menuConfig.js`); both close on outside click and on navigation via one shared hook.
- **Route table** — every guarded route redirects to `/auth` (or the role's home) rather than
  rendering an error.
- **Footer** with student/employer/about columns and eight inline SVG social glyphs, all pointing
  at `/coming-soon` until real accounts exist.

### Pages

| Route | Component | What it does |
|---|---|---|
| `/` | `Landing` | Marketing homepage: hero + the Faculty→Company→You chain, live `/api/stats` counters, feature rows with hand-built CSS mockups (job card, ledger track, transparency panel), monochrome company logo strip, How-it-works, testimonial. |
| `/auth` | `Auth` | Three tabs in one page: sign in, student sign-up, company sign-up. |
| `/student` | `FindInternship` | Job list with a faceted sidebar: keyword, faculty, location, work mode, job type, minimum salary, faculty-verified only. Filtering is client-side over the university-scoped list. |
| `/jobs/:id` | `JobDetail` | Job detail **and** the student's whole in-place pipeline: apply → skill test (+ retake/continue) → AI interview (+ retake) → company test. |
| `/companies` · `/companies/:id` | `Companies`, `CompanyProfile` | Directory and profile with open roles + follow/unfollow. |
| `/my-applications` | `MyApplications` | One card per application with the `Chain` stage visual, a "continue" link for student-owned stages, interview slot picking, join-meeting links, and the `JOB-XXXX ⟷ STU-XXXX` badge on hire. |
| `/dashboard` | `Dashboard` | Student home: `STU-XXXX` identity, document submit/verify status flow, ongoing/offers/rejected counts. |
| `/alerts` | `Alerts` | Followed companies. |
| `/company` | `CompanyDashboard` | Postings, applicant list, closed positions with their hires, and the post-an-opening form. |
| `/company/applicants/:id` | `ApplicantReview` | Tabbed review: Overview, AI interview (score each answer), Company test (answers vs. correct options), HR interview, Technical interview (propose slots, invite participants, leave score + feedback), plus advance/reject with a confirmation modal. |
| `/admin` | `AdminDashboard` | Approve/reject companies, verify/reject student documents, view the match ledger. |
| `/meeting/:id` | `Meeting` | Interview room placeholder — participants, scheduled time, room ID. |
| `/notifications` | `Notifications` | Inbox; mark one/all read. |
| `/profile`, `/settings` | `Profile`, `Settings` | Profile + photo; password change. |
| `/privacy`, `/terms` | `Privacy`, `Terms` | Policy pages (referenced by the registration consent checkbox and `POLICY_VERSION`). |
| `/resources`, `/coming-soon` | `Resources`, `ComingSoon` | Honest placeholders; `/coming-soon?feature=X` names the feature it is standing in for. |

### Internationalisation

Two complementary mechanisms:

1. **Static UI strings** — [client/src/i18n.jsx](client/src/i18n.jsx) holds a hand-written
   `en`/`hu`/`fr` dictionary via `t('key')`. Coverage is the shared chrome (nav, account menu,
   footer) plus the full homepage; other pages fall back to their hard-coded English.
2. **Dynamic DB text** — `useTranslatedTexts()` posts job/company descriptions to
   `/api/translate`, which uses Google Cloud Translation with a DB cache. It renders the original
   immediately and swaps in the translation when it resolves, so a missing key or a provider
   hiccup **never blocks or breaks a page**.

### Design system

Tokens at the top of [client/src/styles.css](client/src/styles.css):

- `--ink` deep academic navy `#16233f` — headings and nav
- `--verify` verification green `#147d5b` — the brand colour, links, primary actions
- `--gold` University of Debrecen gold `#d99a06` — **reserved exclusively for faculty-partnership badges**
- `--paper` cool paper background, plus a shadow/radius/spacing scale and one easing curve
- Typography: Work Sans (display + body), IBM Plex Mono (the `JOB-0042` / `STU-0007` ID tags)
- `prefers-reduced-motion` disables all animation; `:focus-visible` has a real outline

---

## 8. Configuration and running

### Environment variables (all optional — see [.env.example](.env.example))

| Variable | Effect if unset |
|---|---|
| `ANTHROPIC_API_KEY` | AI interview scoring is disabled and throws a clear error rather than silently no-op'ing. |
| `GOOGLE_TRANSLATE_API_KEY` | Translation is a no-op; original English is shown. |
| `SESSION_SECRET` | Falls back to the dev secret `linkwork-dev-secret`. **Must be set in production.** |
| `PORT` | Defaults to `3001`. |

### Commands

```bash
npm install
npm --prefix client install

npm run dev      # server :3001 + Vite :5173 (proxied), run concurrently
npm run build    # build the client only
npm start        # build the client, then serve everything from :3001
```

### Seeded demo accounts

| Role | Email | Password |
|---|---|---|
| Student | `demo.student@mailbox.unideb.hu` | `student1234` |
| Company | `hr@datatech.hu` | `company1234` |
| Admin | `admin@linkwork.app` | `admin1234` |
| Test reviewer | `viewer@linkwork.test` | `viewer1234` |

The other seeded companies (`careers@voltix.hu`, `jobs@precisa.hu`, `hr@greenfieldagro.hu`,
`recruiting@nyugatcom.hu`, `careers@dphi.hu`) all use `company1234`.

Delete `server/linkwork.db` to reset and reseed.

---

## 9. Things to know before deploying

These are intentional development conveniences, **not** production behaviour:

- **`companies.can_view_all_applicants`** — a test-only flag. A flagged company sees *every*
  submitted application across *every* company. The `viewer@linkwork.test` account is created with
  this flag on **every boot**. In production no company may carry it, and the account must not
  exist. Every company-side route checks `company_id === comp.id || comp.can_view_all_applicants`,
  so removing the flag is sufficient to restore proper scoping.
- **`SESSION_SECRET` defaults to a known string** and cookies are not set `secure`. Behind HTTPS
  both need fixing.
- **Passwords are seeded in plaintext in the source** (hashed at insert, but the values are public).
- **The company test is a shared sample bank.** Every company currently serves the same four MCQs
  because no company-side test builder exists yet.
- **Student documents are a status flow, not a file upload.** `submit-docs` just flips
  `doc_status` to `submitted`; the admin verifies without ever seeing a document.
- **Notifications are in-app only.** `notify()` writes the exact subject/body that would be
  emailed and leaves `emailed_at` NULL — wiring a provider is a one-function change in
  [server/notify.js](server/notify.js).
- **The meeting room is a placeholder.** Slots, participants, and a room UUID are real; there is no
  video yet.
- **The Anthropic scorer is not in any user-facing flow.** Today the *company* scores AI interview
  answers by hand (0–10 per answer). [server/anthropic.js](server/anthropic.js) is pinned to
  `claude-opus-4-8` (Claude Opus 4.8 — a valid, current model); `claude-opus-5` is the newer model
  in that tier if you want to upgrade when the feature is enabled.

---

## 10. Roadmap

- Real file upload for student documents
- Surface AI-scored interviews to companies (backend scaffolding already exists)
- Email verification links + email delivery at each pipeline stage
- A faculty coordinator role: propose/endorse partnerships in-app instead of only offline
- A public read-only match ledger page
- Multi-university support in the UI (the schema already supports it)
- Larger skill-question banks per major, timed tests, anti-cheating measures
- A company-side test builder for the `company_test` stage
- Live video for HR and technical interviews
