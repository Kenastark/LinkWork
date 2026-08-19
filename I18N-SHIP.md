# i18n build-time migration — Phase 7 ship notes

Final phase. Closes out the `i18n-buildtime` branch: legal-text exclusion,
a full hard-coded-string sweep, and this doc.

---

## 1. Legal-text exclusion

**Finding, not a fix I invented:** `Terms.jsx`/`Privacy.jsx` already used
`t()` going into this phase (brought in during phase 6a). But
`scripts/i18n-no-mt.json` was empty (`[]`) at that time, so when phase 6c's
locale regeneration ran, all 23 `terms.*`/`privacy.*` keys went through
`scripts/translate-i18n.js`'s Google Translate call like everything else —
committed in `126fdb3`, never hand-reviewed. Confirmed by checking
`scripts/i18n-overrides.json` (zero `terms.*`/`privacy.*` entries — the
hand-written override path was never used for these keys).

Per your direction, fixed as follows — no machine-translated legal text
remains anywhere in the repo:

- Added all 23 `terms.*`/`privacy.*` keys to `scripts/i18n-no-mt.json`, so
  any future re-run of `translate-i18n.js` writes English text for these
  keys instead of calling the translation API.
- Deleted all 23 `terms.*`/`privacy.*` entries from `client/src/locales/hu.json`
  and `client/src/locales/fr.json` outright (not just excluded going
  forward — removed the already-generated MT strings).
- No changes needed in `Terms.jsx`/`Privacy.jsx` themselves: `i18n.jsx`'s
  `t()` already falls back to `translations.en[key]` when
  `translations[lang]?.[key]` is missing (`i18n.jsx:663`). With the hu/fr
  entries gone, both pages render English text under every language
  selection automatically, using the existing lookup logic rather than a
  new code path.

If real legal translations are commissioned later: add them to
`scripts/i18n-overrides.json` (or directly to the locale JSON files) — the
no-mt list means the authoring script will never overwrite them with MT
output.

---

## 2. Automated verification

- **Build:** `npm run build` — passes. Vite output: 68 modules, `dist/assets/index-*.js`
  410.07 kB (gzip 121.25 kB), `dist/assets/index-*.css` 57.39 kB (gzip
  12.51 kB), built in 531 ms. No warnings.
- **Key counts** (`translations.en` in `client/src/i18n.jsx`, counted with the
  same extraction regex `translate-i18n.js` uses):

  | | before phase 7 | after phase 7 |
  |---|---|---|
  | `en` keys | 577 | 577 (unchanged — no new pages added) |
  | `hu` keys | 577 | 554 (−23, the scrubbed legal keys) |
  | `fr` keys | 577 | 554 (−23, the scrubbed legal keys) |
  | `terms.*`/`privacy.*` in `i18n-no-mt.json` | 0 | 23 |

  The hu/fr drop is intentional: those 23 keys now resolve through the
  English fallback in `t()` rather than living as translated strings in the
  locale files. Verified no stale keys exist in the other direction either
  (`hu.json`/`fr.json` keys not present in `en` — 0 in both).
- **Page coverage:** all 21 files under `client/src/pages/` import `useI18n`
  (confirmed by direct check, not just reading commit messages) — matches
  the phase 6 claim in the `i18n.jsx:19-23` comment that every page is
  covered.
- **`server/` scope:** confirmed no `server/` files appear in this phase's
  diff (`git status --porcelain -- server/` empty). Nothing in this
  migration ever needed a server change — the static `t()` table and its
  locale JSON files are entirely client-side; `server/translate.js` /
  `/api/translate` serve the separate runtime `useTranslatedTexts()`
  mechanism for DB content and were untouched.

---

## 3. Final sweep — hard-coded English strings found, not fixed

Per your instruction, reporting these rather than fixing them silently.
Found by grepping `client/src` for JSX text content, `aria-label`/`title`/
`alt`/`placeholder` attributes, and error/status strings, then hand-checking
every hit.

### Homepage regression (flagging as most important — contradicts the
"100% translated" hard constraint in CLAUDE.md)

- **`MatchIllustration` in [Landing.jsx:87-116](client/src/pages/Landing.jsx#L87-L116)**,
  rendered live at [Landing.jsx:598](client/src/pages/Landing.jsx#L598) inside
  the `matchPitch` section. Entirely hard-coded, not routed through `t()` at
  all: "New roles", "Software Engineering Intern", "DataTech Hungary",
  "280K HUF/mo", "Internship", "Debrecen", "Hybrid", "Informatics",
  "Faculty-verified", "View & apply", "Skip", plus
  `aria-label="Example job posting card"`. This looks like a decorative
  mock-preview component that was never wired into the `mock.*` key set used
  by the *other* preview card elsewhere on the page (`mock.trackRole` etc. —
  those are correctly translated). Whether this predates phase 6 or was
  missed by it, it's live on the homepage today in all three languages
  showing only English.
- **[Landing.jsx:550](client/src/pages/Landing.jsx#L550)** —
  `aria-label="How verification flows"` on the hero chain, hard-coded.
- **[Landing.jsx:638](client/src/pages/Landing.jsx#L638)** —
  `alt="A multicultural group of students studying together"` on the
  testimonials photo, hard-coded.

### Shared chrome (`App.jsx`)

- **[App.jsx:270](client/src/App.jsx#L270)** — notification bell:
  `aria-label="Notifications"` and `title="Notifications"` hard-coded (note:
  `nav.inbox` exists as a translated key for the nav link elsewhere, but
  this bell icon's own labels don't use it).
- **[App.jsx:277](client/src/App.jsx#L277)** — unread-count live region,
  `` `${unread} unread` `` template, hard-coded English word "unread".
- **[App.jsx:295](client/src/App.jsx#L295)** — language switcher trigger,
  `title="Change language"` hard-coded.

### Components with no i18n wiring at all

- **`ErrorBoundary.jsx`** (wraps the app root in `main.jsx`) — "Something
  went wrong", "This page hit an unexpected error. Reloading usually fixes
  it.", "Reload" — all hard-coded. Only renders on an unhandled render
  error, so low traffic, but currently 0% translated.
- **`DateTimePicker.jsx`** (used only in `ApplicantReview.jsx`, the
  propose-interview-times flow) — hard-coded: "Previous month"/"Next month"
  aria-labels, "Time", the `Hour`/`Min` stepper labels and their generated
  `"{label} up"`/`"{label} down"` aria-labels, "Duration", the `"{d} minutes"`
  option text, "Add this slot", "Pick a day on the calendar first.". Also
  contains the `MONTHS` array (full English month names, rendered as text)
  and the `DOW` array (`Su`/`Mo`/`Tu`/…) — flagging these two since they're
  displayed words a reader sees, not decoration, even though they're
  data-shaped. `AM`/`PM` toggle labels are borderline — common as
  locale-invariant abbreviations, but also just English words if you want
  them in scope.

### Lower-priority / judgment calls

- **[ApplicantReview.jsx:230](client/src/pages/ApplicantReview.jsx#L230)** —
  `placeholder="colleague@company.com"` — an example email format rather
  than an instruction; flagging but this is the kind of thing that's
  arguably fine to leave as-is.

Nothing else turned up across the remaining pattern sweeps (common action
words — Save/Cancel/Submit/Close/etc. — `document.title` calls, `alert()`/
`window.confirm()`, error-message fallbacks, `<Field label=…>` literals):
all clear, already routed through `t()`.

---

## 4. Manual visual-check list

One line per page, per language. Check: no visible English leaking into
hu/fr (except Terms/Privacy, which are *expected* to show English in every
language per §1), no layout breakage from longer hu/fr strings, no missing-
key fallback text (`key.name` literal strings) rendering.

Legend: 🇬🇧 en · 🇭🇺 hu · 🇫🇷 fr

### Public / unauthenticated

- [ ] `/` (Landing) 🇬🇧 — includes checking `MatchIllustration` per §3 finding (expected still English)
- [ ] `/` (Landing) 🇭🇺
- [ ] `/` (Landing) 🇫🇷
- [ ] `/auth` (Auth — sign in + register tabs) 🇬🇧
- [ ] `/auth` (Auth) 🇭🇺
- [ ] `/auth` (Auth) 🇫🇷
- [ ] `/terms` (Terms) 🇬🇧
- [ ] `/terms` (Terms) 🇭🇺 — must render English body text (fallback, expected)
- [ ] `/terms` (Terms) 🇫🇷 — must render English body text (fallback, expected)
- [ ] `/privacy` (Privacy) 🇬🇧
- [ ] `/privacy` (Privacy) 🇭🇺 — must render English body text (fallback, expected)
- [ ] `/privacy` (Privacy) 🇫🇷 — must render English body text (fallback, expected)
- [ ] `/coming-soon` (ComingSoon) 🇬🇧
- [ ] `/coming-soon` (ComingSoon) 🇭🇺
- [ ] `/coming-soon` (ComingSoon) 🇫🇷
- [ ] `*` (NotFound) 🇬🇧
- [ ] `*` (NotFound) 🇭🇺
- [ ] `*` (NotFound) 🇫🇷

### Student

- [ ] `/jobs` (FindInternship) 🇬🇧
- [ ] `/jobs` (FindInternship) 🇭🇺
- [ ] `/jobs` (FindInternship) 🇫🇷
- [ ] `/jobs/:id` (JobDetail) 🇬🇧
- [ ] `/jobs/:id` (JobDetail) 🇭🇺
- [ ] `/jobs/:id` (JobDetail) 🇫🇷
- [ ] `/dashboard` (Dashboard) 🇬🇧
- [ ] `/dashboard` (Dashboard) 🇭🇺
- [ ] `/dashboard` (Dashboard) 🇫🇷
- [ ] `/my-applications` (MyApplications) 🇬🇧
- [ ] `/my-applications` (MyApplications) 🇭🇺
- [ ] `/my-applications` (MyApplications) 🇫🇷
- [ ] `/alerts` (Alerts) 🇬🇧
- [ ] `/alerts` (Alerts) 🇭🇺
- [ ] `/alerts` (Alerts) 🇫🇷
- [ ] `/companies` (Companies) 🇬🇧
- [ ] `/companies` (Companies) 🇭🇺
- [ ] `/companies` (Companies) 🇫🇷
- [ ] `/companies/:id` (CompanyProfile) 🇬🇧
- [ ] `/companies/:id` (CompanyProfile) 🇭🇺
- [ ] `/companies/:id` (CompanyProfile) 🇫🇷
- [ ] `/resources` (Resources) 🇬🇧
- [ ] `/resources` (Resources) 🇭🇺
- [ ] `/resources` (Resources) 🇫🇷

### Company

- [ ] `/company` (CompanyDashboard) 🇬🇧
- [ ] `/company` (CompanyDashboard) 🇭🇺
- [ ] `/company` (CompanyDashboard) 🇫🇷
- [ ] `/company/applicants/:id` (ApplicantReview) 🇬🇧 — includes the DateTimePicker propose-times panel per §3 finding (expected still English)
- [ ] `/company/applicants/:id` (ApplicantReview) 🇭🇺
- [ ] `/company/applicants/:id` (ApplicantReview) 🇫🇷

### Admin

- [ ] `/admin` (AdminDashboard) 🇬🇧
- [ ] `/admin` (AdminDashboard) 🇭🇺
- [ ] `/admin` (AdminDashboard) 🇫🇷

### Shared (any signed-in role)

- [ ] `/profile` (Profile) 🇬🇧
- [ ] `/profile` (Profile) 🇭🇺
- [ ] `/profile` (Profile) 🇫🇷
- [ ] `/settings` (Settings) 🇬🇧
- [ ] `/settings` (Settings) 🇭🇺
- [ ] `/settings` (Settings) 🇫🇷
- [ ] `/notifications` (Notifications) 🇬🇧
- [ ] `/notifications` (Notifications) 🇭🇺
- [ ] `/notifications` (Notifications) 🇫🇷
- [ ] `/meeting/:id` (Meeting) 🇬🇧
- [ ] `/meeting/:id` (Meeting) 🇭🇺
- [ ] `/meeting/:id` (Meeting) 🇫🇷
- [ ] Nav / footer / account menu / language switcher (App.jsx chrome, check on any page) 🇬🇧
- [ ] Nav / footer / account menu / language switcher 🇭🇺
- [ ] Nav / footer / account menu / language switcher 🇫🇷

### Not route-reachable in normal use — spot-check only if convenient

- [ ] Force a render error to see `ErrorBoundary` (all 3 languages will show
      English per §3 — confirm it doesn't crash further, not that it's
      translated)
