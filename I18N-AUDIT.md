# i18n build-time migration — Phase 1 audit

Audit only. No code changed. 188 keys in `translations.en` (verified by
counting section-by-section below; sections sum to 188), all present with
matching keys in `hu` and `fr` (spot-checked; not exhaustively diffed key-by-key
across all three locales in this pass).

## 1. Key inventory + fragment flags

Fragment-flagged keys are ones whose English value is a sentence fragment,
meant to be concatenated with a sibling key at render time (not a standalone
sentence). 7 pairs (14 keys) are flagged. Everything else is a complete,
independently-renderable string (including title/body pairs like
`problem.card1Title`/`problem.card1Body` — those are two separate UI elements,
not one concatenated sentence, so they're not flagged).

### nav.* (18 keys — none flagged)
findAJob, findInternship, exploreCompanies, resources, dashboard, admin,
applications, inbox, signIn, mySpace, signOut, register, joinAsStudent,
joinAsCompany, skipToContent, openMenu, closeMenu, menu

### theme.* (4 keys — none flagged)
label, light, dark, system

### brand.* (4 keys — none flagged)
label, blue, green, switchTo

### footer.* (13 keys — none flagged)
forStudents, hireTalent, welcomeHiringSuite, employerBranding, pricing,
testimonials, needHelp, haveAccount, about, privacyPolicy, termsOfService,
followUs, tagline

### hero.* (12 keys — 2 flagged)
eyebrow, **title** ⚑, **titleEm** ⚑, lede, ctaJoinStudent, ctaHireStudents,
chainFacultyTitle, chainFacultyBody, chainCompanyTitle, chainCompanyBody,
chainYouTitle, chainYouBody

- `hero.title` / `hero.titleEm` — rendered as `<h1>{t('hero.title')}
  <em>{t('hero.titleEm')}</em></h1>` ([Landing.jsx:523](client/src/pages/Landing.jsx#L523)).
  Each half reads as a complete sentence in isolation ("Real companies. Open
  roles." / "Actual hires.") but they are two halves of one visual heading —
  flagged because the split is render-site concatenation, not two independent
  strings.

### stats.* (3 keys — none flagged)
openPostings, hires, companies

### matchPitch.* (6 keys — none flagged)
eyebrow, title, subtitle, body, ctaBrowse, ctaGetStarted

### feature.* (8 keys — none flagged)
trackTitle, trackBody, trackCta, offersTitle, offersBody, transparentTitle,
transparentBody, transparentCta

### mock.* (25 keys — 6 flagged)
trackRole, trackCompany, trackStep1, trackStep2, trackStep3, trackStep4,
trackStep5, trackTag, offersRole, offersCompany, chipHybrid, chipInternship,
chip6Months, tagSalary, tagRemote, whatToExpect, **factVerified** ⚑,
**factVerifiedRest** ⚑, **factResponse** ⚑, **factResponseRest** ⚑,
**factSteps** ⚑, **factStepsRest** ⚑, chipMentorship, chipPaid, tagCommitted

- `mock.factVerified` / `mock.factVerifiedRest` — `<li><b>{t('mock.factVerified')}</b>
  {t('mock.factVerifiedRest')}</li>` ([Landing.jsx:217](client/src/pages/Landing.jsx#L217)).
  "★ Faculty-verified" + "partnership" — Rest is a bare noun fragment.
- `mock.factResponse` / `mock.factResponseRest` — same pattern, [Landing.jsx:218](client/src/pages/Landing.jsx#L218).
  "~3 days" + "average response time".
- `mock.factSteps` / `mock.factStepsRest` — `<li><b>{t('mock.factSteps')}</b>{t('mock.factStepsRest')}</li>`
  ([Landing.jsx:219](client/src/pages/Landing.jsx#L219)), no space between —
  `factStepsRest` literally starts with a comma (`, all shown before you apply`).
  Clearest fragment in the file.

### landJob.* (10 keys — 6 flagged)
**titleLight** ⚑, **titleBold** ⚑, **card1Pre** ⚑, **card1Bold** ⚑,
card2Title, card2Cta, **card3Pre** ⚑, **card3Bold** ⚑, card4Title, card4Cta

- `landJob.titleLight` / `landJob.titleBold` — `<span>{t('landJob.titleLight')}</span><span>{t('landJob.titleBold')}</span>`
  ([Landing.jsx:681](client/src/pages/Landing.jsx#L681)), no space — "Prepare
  yourself to" + "Land your job!" only reads as one sentence together.
- `landJob.card1Pre` / `landJob.card1Bold` — `<p>{t('landJob.card1Pre')}<b>{t('landJob.card1Bold')}</b></p>`
  ([Landing.jsx:685](client/src/pages/Landing.jsx#L685)). Pre ends mid-sentence
  with a trailing space baked into the string.
- `landJob.card3Pre` / `landJob.card3Bold` — same pattern,
  [Landing.jsx:696](client/src/pages/Landing.jsx#L696).

### how.* (9 keys — none flagged)
eyebrow, title, subtitle, step1Title, step1Body, step2Title, step2Body,
step3Title, step3Body

### testimonials.* (7 keys — none flagged)
eyebrow, title, quote1, author1, quote2, author2, stat100Label

### companyShowcase.* (3 keys — none flagged)
eyebrow, title, punch

### stage.* (8 keys — none flagged)
applied, skill_test, ai_interview, company_test, hr_interview, tech_interview,
hired, rejected

### chain.* (5 keys — none flagged, but see note)
label, position, stateCurrent, stateDone, stateFailed

- `chain.position` uses `{n}`/`{total}`/`{label}`/`{state}` **interpolation**,
  not concatenation — `t('chain.position', { n, total, label, state: t(state) })`
  ([Chain.jsx:27](client/src/components/Chain.jsx#L27)). This is a different
  pattern from the Pre/Bold fragment pairs: it exists specifically because hu
  and fr order the ordinal and count differently from en (see the code
  comment at [i18n.jsx:652-654](client/src/i18n.jsx#L652-L654)). Not flagged
  as a fragment, but worth calling out for Phase 2+ since it's the one spot
  doing runtime string-templating rather than plain lookup — a build-time
  approach needs to keep this interpolation capability.

### ledger.* (6 keys — none flagged)
facultyVerified, mono, monoNoCount, empty, panelTitle, unavailable

### notFound.* (4 keys — none flagged)
title, body, home, jobs

### problem.* (9 keys — none flagged)
eyebrow, title, card1Title, card1Body, card2Title, card2Body, card3Title,
card3Body, punch

### trust.* (10 keys — none flagged)
eyebrow, title, n1Title, n1Body, n2Title, n2Body, n3Title, n3Body, n4Title,
n4Body

### ledgerSection.* (5 keys — none flagged)
eyebrow, title, body, punch, empty
(`punch` contains an embedded `\n` but each line is a complete clause; it's a
single string rendered as one block, not split across two `t()` calls.)

### faq.* (14 keys — none flagged)
eyebrow, title, q1, a1, q2, a2, q3, a3, q4, a4, q5, a5, q6, a6

### cta.* (5 keys — none flagged)
title, body, student, company, browse

**Total flagged: 14 keys / 7 pairs** — `hero.title`/`titleEm`,
`mock.factVerified`/`factVerifiedRest`, `mock.factResponse`/`factResponseRest`,
`mock.factSteps`/`factStepsRest`, `landJob.titleLight`/`titleBold`,
`landJob.card1Pre`/`card1Bold`, `landJob.card3Pre`/`card3Bold`.

---

## 2. Call sites of `t(...)`, grouped by file

153 total call sites (excluding the `t` definition itself in i18n.jsx).

| File | Call sites |
|---|---|
| [Landing.jsx](client/src/pages/Landing.jsx) | 97 |
| [App.jsx](client/src/App.jsx) | 46 |
| [Chain.jsx](client/src/components/Chain.jsx) | 5 |
| [NotFound.jsx](client/src/pages/NotFound.jsx) | 4 |
| [LedgerRecord.jsx](client/src/components/LedgerRecord.jsx) | 1 |

**App.jsx** — nav (all `nav.*`), theme toggle (`theme.*`), brand toggle
(`brand.*`), account menu, mobile sheet, footer (all `footer.*`). Purely
static/dynamic-key lookups, e.g. `t(\`theme.${theme}\`)`, `t(\`brand.${brand}\`)`.

**Chain.jsx** — `chain.label`, `chain.position` (interpolated), dynamic
`t(\`stage.${s}\`)` per pipeline stage, `stage.rejected`, `chain.stateFailed`.

**LedgerRecord.jsx** — single call: `ledger.facultyVerified`, gating an
sr-only span on the seal icon.

**Landing.jsx** — every section of the homepage: hero, stats, matchPitch,
feature cards (via props `title`/`body`/`ctaLabel` passed `t(...)` results),
mock preview cards, how-it-works, testimonials, companyShowcase, landJob
promo cards, problem, trust, ledgerSection, faq (including dynamic keys
`t(\`trust.${n}Title\`)`, `t(\`faq.${q}\`)`, `t(\`faq.a${i + 1}\`)`, and
`t(title)`/`t(body)` where `title`/`body` are themselves key strings passed
through an array of `{title, body}` objects), cta.

**NotFound.jsx** — `notFound.title`, `notFound.body`, `notFound.home`,
`notFound.jobs`.

Two call sites pass a **key stored in a variable** rather than a literal:
`t(title)` / `t(body)` in the problem-cards map ([Landing.jsx:357-358](client/src/pages/Landing.jsx#L357-L358))
where `title`/`body` come from an array of key-name strings. A build-time
extraction tool that only pattern-matches literal `t('...')` calls will miss
these — worth flagging for whichever extraction approach Phase 2+ picks.

---

## 3. Pages under client/src/pages/ that do NOT use `t()` or `useI18n`

19 of 24 page files:

AdminDashboard.jsx, Alerts.jsx, ApplicantReview.jsx, Auth.jsx, ComingSoon.jsx,
Companies.jsx, CompanyDashboard.jsx, CompanyProfile.jsx, Dashboard.jsx,
FindInternship.jsx, JobDetail.jsx, Meeting.jsx, MyApplications.jsx,
Notifications.jsx, Privacy.jsx, Profile.jsx, Resources.jsx, Settings.jsx,
Terms.jsx

These are the untranslated-page backlog for Phase 6.

---

## 4. Pages that DO use `t()`

Confirmed exactly as expected — **5 files**, matching the brief:

- [App.jsx](client/src/App.jsx) (not a page, but the shared chrome — nav/footer/account menu)
- [Landing.jsx](client/src/pages/Landing.jsx)
- [Chain.jsx](client/src/components/Chain.jsx) (component, not a page)
- [LedgerRecord.jsx](client/src/components/LedgerRecord.jsx) (component, not a page)
- [NotFound.jsx](client/src/pages/NotFound.jsx)

**Note on framing**: the brief calls App.jsx, Chain.jsx, LedgerRecord.jsx,
NotFound.jsx, Landing.jsx "pages" — only Landing.jsx and NotFound.jsx are
actually under `client/src/pages/`. App.jsx is the root layout/router shell,
and Chain.jsx/LedgerRecord.jsx are shared components under
`client/src/components/`. Reality matches the *file list* given, just not the
"pages" label for two of them — flagging per the instruction to note where
BRANDING.md-style docs/briefs are imprecise about this codebase.

---

## 5. `useTranslatedTexts()` call sites

Confirmed: exactly 3 files, as expected.

- **[JobDetail.jsx:110](client/src/pages/JobDetail.jsx#L110)**
  ```js
  const [description, requirements, companyDescription] = useTranslatedTexts([
    job?.description || '', job?.requirements || '', job?.company_description || '',
  ]);
  ```
  Translates: `job.description`, `job.requirements`, `job.company_description`.

- **[CompanyProfile.jsx:20](client/src/pages/CompanyProfile.jsx#L20)**
  ```js
  const [description] = useTranslatedTexts([data?.company?.description || '']);
  ```
  Translates: `company.description`.

- **[Companies.jsx:15](client/src/pages/Companies.jsx#L15)**
  ```js
  const snippets = useTranslatedTexts(companies.map(c => snippet(c.description)));
  ```
  Translates: a truncated (110-char) snippet of each `company.description` in
  the list, one call covering an array of all companies' snippets at once.

All three route through [server/translate.js](server/translate.js) via
`POST /api/translate`, which calls the Google Cloud Translation API and caches
results in the `translation_cache` SQLite table — this is runtime translation
of dynamic DB content, a separate mechanism from the static `t()` lookup
table and out of scope for the build-time migration of `i18n.jsx`.

---

## 6. JobDetail.jsx — untranslated `job.title` / `job.company_name`

Confirmed bug, exact lines:

```
203:      <h1 style={{ fontSize: 30 }}>{job.title}</h1>
204:      <p className="muted">{job.company_name} · {job.university_name}{job.faculty_name ? ` · ${job.faculty_name}` : ''}</p>
```

and again further down:

```
233:          <span className="company-mono">{(job.company_name || '?').charAt(0).toUpperCase()}</span>
235:            <h2 style={{ fontSize: 20 }}>{job.company_name}</h2>
```

`job.title` and `job.company_name` are rendered directly at
[JobDetail.jsx:203-204](client/src/pages/JobDetail.jsx#L203-L204) and again at
[JobDetail.jsx:233-235](client/src/pages/JobDetail.jsx#L233-L235), with no
`useTranslatedTexts` wrapper — unlike `description`/`requirements`/
`company_description`, which already go through it three lines earlier at
[JobDetail.jsx:110](client/src/pages/JobDetail.jsx#L110). Confirmed as the
known bug to fix in Phase 2.

---

## 7. server/ — no changes needed for this migration

Confirmed. The build-time migration is scoped to the static string table in
`client/src/i18n.jsx` and its `t()` consumers (sections 1-4 above). Nothing
under `server/` participates in that lookup path:

- `server/translate.js` and the `/api/translate` route
  ([server/index.js:252](server/index.js#L252)) serve the *separate*
  `useTranslatedTexts()` mechanism (section 5) — dynamic, DB-sourced content
  translated at runtime via Google Cloud Translation API, cached in
  `translation_cache`. This is orthogonal to moving the static `t()` table
  from a runtime JS object to a build-time extraction/bundling approach.
- No other server route reads, writes, or serves `client/src/i18n.jsx` or its
  contents.

Per CLAUDE.md, `server/` is otherwise off-limits to modify anyway except the
one `/api/ledger/recent` route already carved out for a different task — not
relevant here.
