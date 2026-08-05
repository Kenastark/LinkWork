# LinkWork Branding and Design System

**Implementation brief. Written to be handed to Claude Code and executed against this repo.**

Token layer: the `:root` block at the top of `client/src/styles.css`. It was delivered as a root-level `tokens.css`, which task 1 copied in and deleted. There is no companion file; do not recreate one.

**This document cites `styles.css` rules by selector, never by line number.** Line numbers were used through task 3 and had to be remapped after every single one of those tasks, because any edit to the stylesheet moves every rule below it. The selector is what you actually search for, it never rots, and it is unambiguous — so `grep -n '^\.btn:disabled' client/src/styles.css` replaces a number that was wrong by the next commit. Line numbers are still used for `App.jsx`, `Landing.jsx`, `i18n.jsx` and `server/index.js`, which stylesheet work does not touch; re-verify those too if the task at hand edits them.

**Revision 4. This is the version to implement.** Revision 1 was written from `PROJECT.md` alone. Revision 2 was written with the source open. Revision 3 absorbed a line-by-line audit. Revision 4 is the result of machine-verifying every factual claim in this document against `5cce7d7`: all 27 file paths, all 46 cited line numbers, every count, the proposed SQL executed against the real schema, and the Task 1 swap built end to end. Section 14 is the verification log. Four more claims failed and are corrected in section 1.

**Before starting anything, read the branch and rollback strategy at the head of section 11.** All ten tasks run on a `rebrand` branch, never on `main`.

---

## 1. What revision 1 got wrong

Read this first. Two of these would have broken the build.

**1. The compatibility layer covered 4 tokens out of 28.** `styles.css` defines 28 custom properties and references them 297 times across 598 rules. Revision 1's `tokens.css` aliased only `--ink`, `--verify`, `--gold` and `--paper`. Swapping it in would have left `--line`, `--card`, `--radius`, `--space-1` through `--space-6`, `--shadow-sm/md/lg`, `--ease`, `--ink-soft`, `--verify-tint`, `--verify-bright`, `--danger`, `--danger-tint` and `--gold-tint` undefined, which silently destroys every border, shadow, radius and transition in the app. Fixed. Revision 2 covers all 28 and is verified: `npm run build` succeeds and a merged scan reports zero undefined variables.

**2. `--ink` is two things, and that blocks dark mode.** It is the heading and body text colour, and it is also the fill for `.nav`, `footer.site`, `.hero`, `.meeting-stage` and `.btn.dark`. One token cannot invert for text and stay dark for surfaces. So `--ink` now maps to `--surface-dark`, a fixed navy in both themes, and text that reads `var(--ink)` has to migrate to `var(--text-1)` before dark mode can be switched on. Dark mode moved from Task 1 to Task 9 as a result.

**3. The landing page is not a stub.** `Landing.jsx` is 438 lines across eight built sections: hero with a three-node verification chain, an overlapping stats band, a "match pitch" with a hand-built job-card mockup, three alternating feature rows with CSS art, How it works, a four-card "Prepare to land your job" grid, a testimonial with a real photo, and a monochrome logo strip with six custom-drawn company marks. All of it runs through `t()`, and `i18n.jsx` carries 327 translated strings across `en`, `hu` and `fr`. Revision 1 proposed replacing this with eleven new sections. That would throw away real work and roughly 100 translated strings per locale. Section 8 is now an evolution plan, not a rebuild.

**4. The hero ledger needs a server route that does not exist.** `/api/stats` returns four fields: `open_jobs`, `hires`, `approved_companies`, and six company names. It returns no hire records, so the signature hero cannot be built from it. Revision 1 also said "never touch `server/`". Section 8 now carves out one scoped, ten-line addition.

**5. Component variant names were invented.** There is no `.btn.primary`. The base `.btn` is the primary button, and the variants that exist are `.secondary`, `.danger`, `.ghost`, `.dark` and the `.sm` size. Section 7 uses the real names.

**6. The Task 2 acceptance criterion was unachievable.** "No hex outside the token block" cannot pass: 44 of the 79 hex occurrences are `#fff` painted on dark navy plates, which is correct and should stay. Rewritten to something real.

**7. Existing bug found.** `styles.css` references `var(--brand-fg)` twice — in `.logo-lockup:hover` and its descriptor rule — and it is never defined anywhere, so both resolve to nothing and inherit. `tokens.css` now defines `--brand-fg`, which fixes it as a side effect. *(Wrong. See item A.)*

**8. `.id-tag` and scoped `.eyebrow` already exist.** Revision 1's `tokens.css` redefined `.id-tag` and added `.container`, `body`, `h1`-`h4`, `p`, `a` and `:focus-visible` rules that would have been overridden by the existing rules further down the file. Dead code that looks live is worse than no code. All of it is stripped. `tokens.css` is now tokens plus four verified-absent utility classes.

### Corrected again in revision 3

Found by auditing revision 2 against the source. Verified independently before accepting.

**A. `--brand-fg` is not a bug.** `Landing.jsx:415` sets it inline per company: `style={{ '--brand-fg': colors.fg }}`. The hover colouring works today. Revision 2 called it an undefined-variable bug and claimed fixing it was a free win. Wrong. The `:root` value in `tokens.css` is now a harmless fallback and is commented as such.

**B. `claude-opus-4-8` is a valid, current model.** `Claude Opus 4.8` is a real model ID and returns from `/v1/models`. Revision 1 and revision 2 both flagged it as suspect. Both were wrong. Item 2 of section 13 is deleted. `claude-opus-5` is the newer model in that tier if you want to upgrade when the feature is enabled.

**C. The base `.eyebrow` rule breaks Task 1.** Only `.hero .eyebrow` and `.how .eyebrow` are styled today. `Landing.jsx` lines 294, 377 and 408 render bare `.eyebrow` spans carrying `style={{ color: 'var(--verify)' }}`. A base rule would silently drop them from 16px to 11px uppercase mono, which contradicts Task 1's own acceptance criterion of "only typefaces and colour change". The rule is removed from `tokens.css` and moves to Task 8, where the three call sites get fixed in the same commit.

**D. Counts in revision 2 were unreliable.** Verified figures: 30 uses of `var(--ink)`, not 31. 46 uses of `var(--verify)`. 99 hex literals, not 79. Seven `font-weight: 900` declarations, not nine, and the list named three selectors already at 800 while omitting `.logo-mark-initial`. `.modal-backdrop` was listed as an `--ink` surface use; it is a hard-coded `rgba(22,35,63,.5)` and stays old navy after the swap unless separately fixed. Section 6 also missed `.nav-bell .dot` at 10px.

**E. The gold rule was unresolvable.** See section 5. Resolved by separating the seal token from decorative warm tints.

**F. Two token files would diverge.** Task 1 copied `tokens.css` into `styles.css` while `CLAUDE.md` required `tokens.css` stay in root, with nothing saying which wins after Task 2 edits a value. Task 1 now deletes `tokens.css` after the copy. `client/src/styles.css` is canonical from that point.

**G. The hero ledger did not survive contact with the data.** `seed()` in `server/db.js` creates zero rows in `matches`, so `hires` is 0 on any fresh install. Revision 2's hero copy asserted "12 hires recorded" and specified four records writing in. On a fresh deploy that is an empty box under a false number. See section 8 for the resolution, which is not to cut it.


### Corrected again in revision 4

Found by machine-verifying revision 3 against `5cce7d7`. All four break implementation as written.

**H. `Field.jsx` is dead code.** Nothing imports it. Revision 3's Task 4 called the restructure "the risky one" and named five pages whose call sites needed updating. There are no call sites. Forms use 40 raw `<label className="field">` blocks across six pages, and no per-field error state exists anywhere in the app. Task 4 is rescoped to CSS. See section 7.

**I. `Button`, `Card` and `Badge` are barely used either.** Three pages import them in total: `Alerts.jsx`, `Companies.jsx`, `CompanyProfile.jsx`. Every other page writes `className="btn"` directly. The component files are four-line `className` joiners. This does not change the design work, but it changes where the work happens: Task 4 is a stylesheet task, not a component task.

**J. There is no `<main>` in `App.jsx`.** Revision 3 said to put the skip-link `id` on `main.container` there. `App.jsx` renders no `<main>` at all; 30 separate per-page `<main className="container">` elements exist instead. The skip link needs a target that exists on every route, so wrap the `<Routes>` block at line 227 in `<div id="content" tabIndex={-1}>`.

**K. Seeded matches must also close the postings.** A real hire does three writes (`server/index.js` 785 to 788): insert the match, increment `jobs.filled`, and set `status='closed'` when the posting is full. Revision 3 said to seed `matches` rows and stopped there. Seeding only the insert leaves `open_jobs` at 10 while the ledger claims postings were filled, which reproduces the exact ghost-posting problem the product exists to solve, on the landing page, in the demo.

---

## 2. Brand strategy

### Positioning

> LinkWork is the hiring platform where every posting is a commitment, and every hire is on the record.

### What the brand is about

Most job platforms sell volume: more listings, more matches, more reach. LinkWork sells the opposite. It sells **scarcity that can be verified**. There are fewer postings here, and that is the product.

The competitor is not Indeed. The competitor is the void students apply into. Everything in the visual system reinforces one idea: this is a **register**, not a feed. Records are checked before they go in, and they come out when they are fulfilled.

### Personality, ranked

Ranking matters more than the list, because when two traits conflict the higher one wins.

1. **Verifiable.** Every claim on screen should look like it could be audited.
2. **Precise.** Tight spacing, tabular numbers, exact language.
3. **Institutional.** University-backed and unembarrassed about it.
4. **Modern.** Reads like Linear or Stripe, not a student portal from 2011.
5. **Human.** Students are anxious and companies are busy. Warmth in copy, never in chrome.

Where the brief asks for something that feels "more like an AI company than a university portal", the resolution is **AI-company execution, institution-grade content**. It should not look like a startup pretending to have a university behind it. It has one.

### Voice

- Sentence case everywhere, including buttons and headings.
- Active voice. "Verify your student ID", not "Student ID verification".
- Name things by what the person controls. "Take the skill test", not "Assessment module".
- Numbers over adjectives.
- Never claim what the product does not do yet. The existing `/coming-soon?feature=X` pattern is a brand asset. Keep it.

---

## 3. The signature: the ledger record

```
JOB-0042  ⟷  STU-0007        hired · 14 May 2026
```

The match ledger row is already in the product, already in IBM Plex Mono, and no competitor can copy it because no competitor has the ledger. Promote it from a detail on `/my-applications` to the structural motif of the brand.

| Surface | Treatment | Status in repo |
|---|---|---|
| Hero | Recent hires writing themselves in, one at a time | New. Needs the route in §8. |
| Job cards | `JOB-0042` mono corner tag | `.id-tag` exists, used 18 times in JSX |
| Student dashboard | `STU-0007` as identity | Exists |
| Pipeline | Seven linked stages | `Chain.jsx` exists |
| Section eyebrows | Mono, uppercase, wide-tracked | `.hero .eyebrow` and `.how .eyebrow` exist, base class added |
| Admin ledger | `table.ledger` with `.match-ids` | Exists |
| Empty states | Empty ruled register with a caption | New |
| 404 | `JOB-????  ⟷  ---` | New |

**Rule: mono is reserved for things that are on the record.** IDs, counts, dates, scores, stage names, eyebrows. Never body copy, never buttons. That reservation is what makes it read as data rather than decoration.

**The one aesthetic risk.** Ledger sections carry a faint ruled-register texture (`.ruled`, a 40px repeating hairline). A paper-record cue underneath an otherwise glassy interface. That tension is what the product is. Two sections per page maximum, or it becomes wallpaper.

---

## 4. Logo

### Concept

A **chain link on the diagonal**: two hooks reaching past each other, joined by a bar. It reads as one link of a chain, which is the `JOB ⟷ STU` pairing at glyph scale — the mark and the ledger row are the same idea twice.

**The glyph is the original pre-rebrand artwork and did not change in the rebrand. Only the plate was recoloured.** Two replacement glyphs were designed and rejected on review; see the note below before proposing a third.

### What ships

`LinkMark.jsx` renders the glyph inside a `.brand-mark` wrapper: a circular plate with a blue gradient and inset highlights, defaulting to `size={42}`. `App.jsx` calls it twice, at default size in the nav and at `size={28}` in the footer. `public/favicon.svg` repeats the same glyph on the same gradient, plus rasterised PNGs at 16, 32 and 180.

The circular plate is load-bearing. It survives on the dark nav, it carries the brand colour, and it is what makes the mark legible at 16px. Do not remove it.

### Source

```jsx
export default function LinkMark({ size = 42, sealed = false }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size }}>
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          className="lk-notch" pathLength="1" d="M9.5 14.5 14.5 9.5"
          stroke={sealed ? 'var(--seal)' : '#fff'} strokeWidth="2.4" strokeLinecap="round"
        />
        <path
          className="lk-link-b" pathLength="1" d="M11 6.5 12.8 4.7a4 4 0 0 1 5.7 5.7L16.6 12.2"
          stroke="#fff" strokeWidth="2.4" strokeLinecap="round"
        />
        <path
          className="lk-link-a" pathLength="1" d="M13 17.5 11.2 19.3a4 4 0 0 1-5.7-5.7l1.9-1.8"
          stroke="#fff" strokeWidth="2.4" strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
```

Colour lives entirely in the plate. `.brand-mark` runs `--accent → --brand → --blue-900`; `.avatar-initials` runs `--accent → --brand`; `favicon.svg` hard-codes the same three stops as `#4f8ef7`, `#003b7a`, `#001b3a` because an SVG asset cannot read custom properties. Those four are the only places the mark's colour is defined — change them together or the avatars drift from the logo.

### Two rejected glyphs

Recorded so the work is not repeated.

1. **Two arcs with a checkmark cut from the overlap.** The original §4 concept. Built and rejected: as two open arcs facing each other horizontally it read as brackets, not a chain, and the checkmark in the middle made the centre unreadable below about 28px.
2. **Interlocking capsules on a 45° diagonal.** Two 10.5 × 6 capsules, ring centres 4.5 apart, rotated -45°, with a gap punched at one ring crossing so the second threads through the first. Geometrically correct and it did read as a chain, but the original mark was better and more distinctive.

The lesson both times: the glyph carries a lot at 16px and every added element costs legibility.

### Construction

24 unit grid. Stroke 2.4 at 24, scaling linearly. Rounded caps. Glyph rendered at `size * 0.56` inside the plate. Do not restyle the geometry to match a spec elsewhere in this document — the paths above are the source of truth.

### Lockups

- **Full:** plate, 12px gap, "LinkWork" in Plus Jakarta Sans 800. This is the existing `.brand` rule.
- **Stacked:** for the video end card and the A4 submission.
- **Icon:** the plate alone.
- **Favicon:** plate and glyph, same as the icon. Ship 16, 32, 180 and the SVG. **A plateless favicon was tried and reverted.** With no plate the glyph must tint itself, and no single value survives both light and dark browser chrome: `--blue-700` is 1.50:1 on dark, `--blue-300` is 2.34:1 on white. On the plate it is always white on blue.

### Animation

One use, on first load: the two hooks draw in from their outer ends over 560ms, then the connecting bar strokes in over 200ms. 760ms total, via `stroke-dasharray`. Do not loop, do not repeat on route change — the nav and footer sit outside `<Routes>` and never remount, which is what guarantees this.

Two implementation traps, both hit during Task 3:

- **Each hook's outer end is its path midpoint, not an endpoint.** The path runs inner → outer bend → inner, so a plain `stroke-dashoffset` sweep draws from an inner end. The dash must grow symmetrically out of the midpoint: `dasharray: L 1` with `dashoffset: L/2 - 0.5`, L going 0 → 1.
- **The resting state must be fully drawn.** The global `prefers-reduced-motion` rule kills animations with `animation: none !important`. Put the undrawn state in the base rule instead of the keyframes and reduced-motion users get a permanently blank plate.

### Misuse

Do not rotate it, do not fill the hooks, do not remove the plate, do not recolour the bar gold outside faculty-verified contexts, do not place the lockup on a photo without a plate behind it.

`sealed` tints the connecting bar with `var(--seal)`. It is implemented but unpassed; Task 6 is the first caller.

---

## 5. Colour

Values in the token layer at the top of `client/src/styles.css`. This is the usage law.

### Roles

| Role | Token | Value | Used for |
|---|---|---|---|
| Primary | `--brand` | `#003b7a` | Primary buttons, links, active nav, chart series 1 |
| Primary dark | `--blue-800` | `#002855` | Pressed states, dark fills |
| Accent | `--accent` | `#4f8ef7` | Focus rings, hover glow, mesh, dark-mode primary |
| Seal | `--seal` | `#c89b3c` | Faculty-verified only |
| Success | `--success-500` | `#17a673` | Passed, verified, hired |
| Warning | `--warning-500` | `#f2a93b` | Pending review |
| Danger | `--danger-500` | `#d9534f` | Rejected, destructive |
| Dark plate | `--surface-dark` | `#0d1b31` | Nav, footer, hero, meeting stage |
| Canvas | `--bg-canvas` | `#f7f9fc` | Page background |
| Surface | `--surface` | `#ffffff` | Cards, panels |
| Text | `--text-1` | `#0f172a` | Headings and body |
| Muted | `--text-3` | `#64748b` | Meta, captions, mono IDs |

### Rules

1. **Blue dominates.** Roughly 70% of coloured surface area is blue or neutral. If a screenshot looks multicoloured, something is miscoded.
2. **Gold is a seal, not a colour, and the rule is about the token rather than the hue.**

   Stated flatly, "gold is never a background" contradicted the code and contradicted section 8. Eight rules painted gold backgrounds — `.badge.faculty`, `.match-mock-badge` (a solid `var(--gold)` fill), `.match-mock-logo`, `.mm-chip.gold`, `.note-tint-b`, `.land-gold` (`#f2c94c`), `.alert.info` and `.pref-chip:hover` — while section 8 also says the match mock and the testimonial notes stay untouched. Both cannot be true.

   The resolution: **`--seal` is reserved, warm decorative tints are not.** The token layer defines `--warm-100`, `--warm-300` and `--warm-fg` for the decorative cases. After Task 2, `var(--seal)` resolves in exactly two places: `.badge.faculty` and the faculty-verified job card top rule. Everything else migrates:

   | Rule | Was | Becomes | Why |
   |---|---|---|---|
   | `.badge.faculty` | `--gold-tint` | `--seal-subtle-bg` | This is the seal |
   | job card top rule | new | 1px `--seal` | This is the seal |
   | `.match-mock-badge` | solid `--gold` | `--brand` fill, white text | "New roles 6" is a count, not a verification |
   | `.match-mock-logo` | `--gold-tint` | `--warm-100` / `--warm-fg` | Decorative company monogram |
   | `.mm-chip.gold` | `--gold-tint` | `--warm-100` / `--warm-fg` | Decorative chip |
   | `.note-tint-b` | `--gold-tint` | `--warm-100` | Decorative sticky note |
   | `.land-gold` | `#f2c94c` | `--warm-300` | Decorative card fill |
   | `.alert.info` | `--gold-tint` | `--brand-subtle-bg` / `--brand-subtle-fg` | Info should be blue; gold implies verification |
   | `.pref-chip:hover` | `--gold-tint` | `--brand-subtle-bg` | Hover is an interaction, not a seal |

   After that migration the flat rule holds and is enforceable: gold means verified, nothing else.
3. **Green is status, not brand.** The biggest behavioural change here. `--verify` currently paints every primary button and link. After the swap it resolves to blue, and green survives as `--success-500` for "this passed" and "this is verified" only.
4. **`#fff` on dark plates is correct.** The 44 occurrences on `.nav`, `.hero` and `footer.site` are intentional. Do not tokenise them into `--surface`, which would invert them in dark mode.
5. **Never use colour alone to carry meaning.** Every status colour ships with an icon or a label. Faculty-verified is a gold star *and* the words "Faculty verified".

### Contrast floor

Verify with a checker, not by eye.

- `--text-1` on `--surface`: 16.1:1
- `--text-3` on `--surface`: 4.76:1, so muted text never drops below 14px
- `--text-on-brand` on `--brand`: 11.4:1
- Gold: `--gold-500` on white is 2.6:1 and **fails**. Badge text uses `--gold-700` on `--gold-100`. Gold is for the glyph and the border. After the section 5 migration this applies to exactly one rule, `.badge.faculty` (already correct at `#7c5a00`). `.alert.info`, `.mm-chip.gold` and `.match-mock-logo` leave the gold pairing entirely, so do not carry it over to them.

---

## 6. Typography

### The pairing

**Plus Jakarta Sans, display.** Headings and the wordmark. Geometric with a humanist warmth, genuinely distinctive at large sizes where Inter goes generic. 700 and 800 only, never below 17px.

**Inter, body and UI.** Body copy, buttons, fields, tables, nav. Built to be read at 13 to 17px in dense interfaces, with real tabular figures. The workhorse, and it should be invisible.

**IBM Plex Mono, data.** Already in the build. IDs, stage names, counts, dates, scores, eyebrows. The ledger voice. Keeping it means the 18 existing `.id-tag` uses need no rework.

Replaces Work Sans, which currently serves as both display and body. Load variable weights with `display=swap` and preconnect. If three families becomes a performance problem, drop Plus Jakarta and set headings in Inter 800 with `--ls-tightest`. Never drop the mono.

Plus Jakarta Sans tops out at 800. `styles.css` used weight 900 in exactly seven places — `.hero h1`, `.match-mock-logo`, `.overlap-band .stat b`, `.note-stat b`, `.logo-mark-initial`, `.logo-word b` and `.land-card.stat b` — and **task 2 mapped all seven to 800**. `.avatar-initials`, `.account-menu-name` and `.brand` were already at 800. Never reintroduce a 900, or the browser will synthesise a fake bold.

### Scale

| Token | Size | Weight | Line height | Tracking | Use |
|---|---|---|---|---|---|
| `--fs-5xl` | 52 to 88 | 800 | 1.06 | -0.035em | Hero h1 only |
| `--fs-4xl` | 44 to 68 | 800 | 1.06 | -0.035em | Page h1 |
| `--fs-3xl` | 36 to 48 | 700 | 1.22 | -0.02em | Section h2 |
| `--fs-2xl` | 28 to 36 | 700 | 1.22 | -0.02em | Card cluster headings |
| `--fs-xl` | 22 to 26 | 600 | 1.22 | -0.02em | h3 |
| `--fs-lg` | 18 to 20 | 500 | 1.5 | -0.011em | Lead paragraph |
| `--fs-md` | 17 | 400 | 1.65 | -0.011em | Long-form body |
| `--fs-base` | 16 | 400 | 1.5 | -0.011em | UI body |
| `--fs-sm` | 14 | 400 to 500 | 1.5 | -0.011em | Secondary, table cells |
| `--fs-xs` | 12 | 500 | 1.5 | 0.08em | ID tags, meta |
| `--fs-micro` | 11 | 500 | 1.5 | 0.16em | Mono eyebrows |

Nothing below 12px ships. `styles.css` currently has eight declarations under 12px. Six are 11 or 11.5px mono or uppercase labels where tracking carries legibility and may stay, subject to a 200% zoom check: `.account-chevron`, `.account-menu-email`, `.chain .node small`, `.logo-word i`, `table.ledger th`, `.dtp-stepper-label` and `.rec-steps-label`. One is a real failure: `.nav-bell .dot` (994) at 10px is the unread notification count, which is information rather than decoration. Raise it to 11px and grow the dot to 16px minimum.

### Detail rules

- Figures in tables, stats and scores get `font-variant-numeric: tabular-nums`. The `.tabular` utility is in the token layer.
- Headings get `text-wrap: balance`, paragraphs `text-wrap: pretty`.
- Never letterspace lowercase body text.
- **Hungarian runs 15 to 20% longer than English.** Buttons and nav items must not be fixed-width, and headings must survive a 25% length increase. `i18n.jsx` already carries full `hu` and `fr`, so this is testable today: switch locale and look.

---

## 7. Components

Eight components exist in `client/src/components/`. All are thin wrappers over CSS classes, which is why almost all of this work happens in `styles.css`.

### Button

`Button.jsx` emits `className="btn {variant} {size}"`. The base `.btn` **is** the primary button. Real variants:

| Class | Current | Becomes |
|---|---|---|
| `.btn` | `--verify` green fill | `--brand` blue fill, `--text-on-brand` |
| `.btn.secondary` | transparent, `--ink` border | transparent, `--brand` text, `--border-strong` border |
| `.btn.ghost` | transparent, `--verify` text | transparent, `--text-2` text |
| `.btn.danger` | `--danger` fill | unchanged, now `--danger-500` |
| `.btn.dark` | `--ink` fill | `--surface-dark` fill |
| `.btn.sm` | 7px 14px | unchanged |
| `.btn.seal` | does not exist | new: `--seal-subtle-bg`, `--gold-700`, 1px `--seal`. Faculty-verified filter only. |

Heights 36 / 44 / 52 via padding. Radius stays `--radius-sm`. Hover lifts 1px, active returns to 0, focus-visible shows the ring, disabled is 45% opacity with `cursor: not-allowed` and **keeps its shape** rather than turning grey (`.btn:disabled` currently sets `#a9b6ad`, which reads as broken).

Loading: the label stays and a 14px spinner takes the leading icon slot. Never let the button change width mid-action.

Note `.lang-trigger.btn.ghost` overrides ghost with white-on-dark for the nav. Keep that override.

### Card

Line 167. `--surface`, `--radius`, 1px `--border`, `--shadow-1`, `--space-5` padding. It already transitions shadow and transform but no hover rule ever fires. Add hover only when the card is a link: `--shadow-2` and `translateY(-2px)`. Cards that are not links do not move.

### Badge

Line 180. Variants `.faculty`, `.verified`, `.pending`, `.danger`, `.mono`. Add `.warning`. Keep the pill shape and 6px glyph gap. `.verified` moves from `--verify-tint` to `--success-50` with `--success-700` text, because it is a status and not an action. `.pending` moves to `--warning-50` and `--warning-700`.

### Field

**`Field.jsx` is dead code.** Nothing imports it. Forms are written as raw markup: 40 instances of `<label className="field">Label<input ... /></label>` across `Auth.jsx` (18), `CompanyDashboard.jsx` (10), `Profile.jsx` (8), `Settings.jsx` (2), `JobDetail.jsx` (1) and `ApplicantReview.jsx` (1).

So the useful work is entirely in `styles.css`, in the `label.field` rules and the shared `input, select, textarea` rule. Do not restructure the component and do not touch 40 call sites: there is no per-field error state in this app today (errors surface as a page-level `.alert error`), so adding one is a new feature, not a rebrand.

What to do: restyle `label.field` and the `input, select, textarea` block per the focus and error rules below, and add a `.field-error` class so the state exists when someone wants it. Leave `Field.jsx` in place, unused, or delete it as dead code in the same commit. Either is fine; pretending it is load-bearing is not.

If you later want real per-field errors, this is the component to build them into, and it needs `cloneElement` so the message lands outside the `<label>`:

```jsx
import { cloneElement, useId } from 'react';

export default function Field({ label, hint, error, children, ...props }) {
  const id = useId();
  const errId = `${id}-err`;
  const control = error && children
    ? cloneElement(children, { 'aria-invalid': true, 'aria-describedby': errId })
    : children;
  return (
    <div className="field" {...props}>
      <label htmlFor={children?.props?.id}>
        {label} {hint && <span className="hint">{hint}</span>}
      </label>
      {control}
      {error && <p className="field-error" id={errId}>{error}</p>}
    </div>
  );
}
```

That is future work. It is not Task 4.

Focus: border to `--brand` plus the ring. Error: `--danger-500` border with a message below in `--fs-sm` `--danger-700` and a 14px icon. Never rely on the red border alone. Keep `font-size: 15px` on inputs or larger so iOS does not zoom on focus.

### Chain

`Chain.jsx` plus the `.chain` rules. This is the most important component in the product and it is in better shape than revision 1 assumed. It already numbers the stages, already uses `role="list"`, and already fills connectors behind completed nodes.

What to add:

- **Animate the connector fill.** Currently `.chain .connector.done` swaps background instantly. Fill left to right over `--d-slow` with `--ease-out`. This is the moment a student learns they advanced, and it is worth doing well.
- **`aria-current="step"`** on the current node, plus a visually hidden "Stage 3 of 7, AI interview, in progress". Right now a screen reader gets seven list items with a number and a label and no indication of position.
- **The rejected treatment.** `.chain .node.failed` is defined in CSS but `Chain.jsx` never applies it. Either wire it up or delete the rule. Currently rejection renders as a separate badge with the track left neutral. Turning the track `--danger-500` from the failure point onward is clearer.
- **Vertical below 640px.** Seven nodes at `min-width: 86px` need 602px plus connectors. On a 375px screen this wraps into an unreadable tangle today.
- **The `applied` stage never appears.** `server/index.js` creates applications at `skill_test`, so node 1 is permanently complete and never current. Either drop it from `ORDER` and show six stages, or label it so users understand it is automatic. Six is more honest.
- **Duplicate label maps.** `Chain.jsx` has its own `LABELS` and `ORDER` that duplicate `STAGE_LABEL` and `STAGE_ORDER` in `stages.js`, with `tech_interview` spelled "Technical" in one and "Technical interview" in the other. Import from `stages.js` and delete the local copies.
- **Nothing in `Chain.jsx` is translated.** Stage labels are hard-coded English while the rest of the chrome is trilingual.

### LedgerRecord

New. `.ledger-record` is already styled in the token layer's additive utilities.

```
JOB-0042  ⟷  STU-0007     Junior Data Engineer · DataTech    14 May 2026  ★
```

Mono for IDs and date, Inter `--fs-sm` for the role line, gold star only if faculty verified. Hairline divider between records. Rows do not hover or link on the public page. They are records, not controls.

### Job card

`.job-row` plus `Card`. Add the `JOB-0042` mono tag top right in `--text-3`. Faculty-verified cards get a 1px `--seal` top border, 2px inset, plus the existing `.badge.faculty`. That top rule is the only place gold touches a card.

### Stat

`.overlap-band .stat` and `.note-stat`. Both currently use `--font-display` at weight 900 in `--verify` green. Move to `--font-mono` at `--fs-3xl` weight 600 with `tabular-nums`, in `--brand`. Mono is the ledger voice and these numbers come from the ledger.

Counters animate from 0 over 1200ms, once, on scroll into view, only when motion is allowed. `Landing.jsx` already fetches `/api/stats`; if it fails, render the last known value or hide the block. Never render a spinning zero.

### Nav

`.nav` is a solid `--ink` sticky bar. Keep it dark, repaint to `--surface-dark`.

Add: transparent over the hero on `/` only, becoming `.glass` with `--shadow-2` past 24px of scroll over `--d-base`. A sliding 2px underline on the active route. A mobile sheet below 860px with trapped focus and Escape to close.

Keep everything already built: role-aware items, the notification bell with unread badge, the EN/HU/FR switcher, the account dropdown, and the wider `min(1400px, 98vw)` nav track.

### Empty, loading, error

- **Empty:** an empty ruled register block, a heading naming what is missing, one sentence on how to fill it, one primary action. "No applications yet. Find a role for your faculty and apply, and it will show up here." Never a shrugging illustration.
- **Loading:** skeletons matching real layout dimensions, `--n-100` with a 1.2s shimmer. No spinners except inside buttons.
- **Error:** state what failed and what to do, then a retry. "Could not load open roles. Check your connection and try again." No apology, no exclamation mark. `ErrorBoundary.jsx` currently says "Something went wrong" with an inline `borderColor: 'var(--danger)'`; keep the token reference, rewrite the copy.
- **404:** a ledger record with a null ID, `JOB-????  ⟷  ---`, and "That record does not exist." Then links home and to the job list. Note there is currently **no 404 route**: `App.jsx` has no catch-all, so an unknown path renders the shell with an empty main. Add the route.

---

## 8. Landing page

**Evolve `Landing.jsx`, do not rebuild it.** Eight sections exist, all translated across three locales. Rewriting from scratch discards roughly 100 strings per locale and the six hand-drawn company logo marks.

### What stays

`MatchIllustration`, the three `FeatureRow` art panels (`TrackArt`, `OffersArt`, `TransparentArt`), `HowItWorks`, the testimonial, and the `.logo-strip`. These are genuinely good and they are already trilingual. They get repainted by the token swap and otherwise left alone.

One thing to fix: `BRAND_PALETTE` in `Landing.jsx` lines 7 to 13 hard-codes six colour pairs including the old green `#147d5b` and gold `#7c5a00`. Those tint the company logo lockups. Replace the green pair with a blue pair from the new scale and keep the other five as deliberately varied company colours, since a logo strip where every company is the same blue looks fake.

### What changes

**1. Hero.** The brief asks the hero to communicate "every internship opportunity is real". The way to do that is not to assert it in bigger type. It is to show the receipts.

But revision 2's version of this did not survive contact with the data, and the objection is worth stating in full because it is the strongest argument against the signature.

> `seed()` creates zero rows in `matches`. On a fresh install `hires` is 0, so four records writing in at 400ms intervals renders an empty ruled box. The hero copy asserted "12 hires recorded", a number nothing produces. And the privacy note pushes toward dropping `STU-0007`, at which point the row reads `JOB-0042 ⟷ ---`, which is the 404 design from section 7. The signature and the null state collapse into the same image.

Every part of that is correct. The resolution is three changes, not deletion.

**Seed the matches.** Add three or four rows to `matches` in `seed()`, tied to existing seeded jobs and the demo student, with `hired_at` spread over the last two months. This is not dishonest: `seed()` already invents six companies, ten jobs and a demo student, and the `hire()` mechanism the ledger displays is entirely real. Seeding demo hires demonstrates a working mechanism with demo data, exactly like every other seeded row. What would be dishonest is asserting a number in copy that no query produces, which is what revision 2 did.

**Never hard-code the count.** The mono line under the records reads from `/api/stats`, so it says whatever is true. `3 hires recorded · 0 postings unaccounted for`. The second half is the actual claim and it is true at any n, including zero. A short ledger is the argument, not an embarrassment: the list is short because filled postings come down.

**Design for n = 0 first.** Build the empty state before the populated one. At zero records the panel shows the ruled register, the `0 postings unaccounted for` line, and one sentence: "Nothing has been hired here yet. When it is, it appears here and the posting comes down." That reads as a promise rather than a bug, and it is the state a brand-new university partner would see. If it does not look intentional at zero, the design is wrong.

**On the privacy collapse.** The public hero does not need the `⟷` pairing. Show the filled posting: `JOB-0042 · Junior Data Engineer · DataTech · 14 May` with the seal where applicable. That is a record of a real posting that is gone because it was filled, it makes the same argument, and it is nothing like the 404's null pairing. `STU-0007` stays on the private ledger where the student and the hiring company can see it. This resolves the privacy question and the visual collision in one move, and it means the public route never returns a student ID at all.

If you would rather not touch `db.js`, cutting the ledger panel and keeping the existing three-node `.hero-chain` is a legitimate fallback. It costs the identity its signature, and the section 8 ledger section then has to carry it alone.

Keep the existing `.overlap-band` stats. Move the numbers to mono per §7.

**2. The problem.** New short section between the hero and the match pitch. Three cards: roles already filled internally, roles posted to look like the company is growing, roles kept open to farm CVs. One line each, then: "You cannot tell which is which from the outside. That is the whole problem."

This is the strongest argument the product has and the page does not currently make it.

**3. Trust chain.** Promote the hero's three nodes into their own section with four nodes, and say what is actually checked at each: the faculty coordinator negotiates the partnership directly, the company is reviewed by an admin before it can post, the posting exists because the company committed to hire, the student is verified once against an official university email.

**4. Ledger section.** New, with `.ruled`. Two sentences on the mechanism, real `LedgerRecord` rows, then: "When a posting is filled, it comes down. That is why the list is short."

**5. FAQ.** New, before the footer. Six items: who can join, what verification involves, what the gold star means, what it costs, whether other universities are coming, what happens to your data. Accordion, one open at a time, `<button aria-expanded>` driving a `<div role="region">`. Two-sentence answers.

**6. Closing CTA.** New. `--blue-800` fill with `.mesh` at low opacity, one heading, one white button.

### i18n

Every new string needs `en`, `hu` and `fr` entries in `i18n.jsx`. The file is organised as three flat key-value blocks at lines 12, 134 and 256. Add keys to all three in the same commit, or the homepage regresses from fully translated to partially translated, which is worse than not adding the section.

---

## 9. Accessibility

- WCAG 2.2 AA. 4.5:1 under 24px, 3:1 for large text and UI boundaries.
- Every interactive element keyboard reachable with a visible focus ring. The existing `:focus-visible` rule uses a green outline; retoken it to `--focus-ring-color`.
- Add a skip link. `.skip-link` is in the token layer. There is **no single `<main>` to point it at**: `App.jsx` renders none, and 30 per-page `<main className="container">` elements exist instead. Wrap the `<Routes>` block in `App.jsx` (line 227) in `<div id="content" tabIndex={-1}>` and target that.
- Targets 44x44 on touch. `.dtp-nav` is 30x30 and `.dtp-arrow` is 52x26. Both fail.
- One `<h1>` per page. Never skip a level for styling.
- Icon-only buttons need `aria-label`. The nav bell has one. Decorative SVGs need `aria-hidden="true"`.
- Live regions on the notification count and on stage changes.
- Modals trap focus and close on Escape. `.modal` exists in the CSS with neither.
- `prefers-reduced-motion` is handled by a top-level `@media (prefers-reduced-motion: reduce)` rule with `animation: none; transition: none`. That is correct and blunt. Verify it by toggling the OS setting, not by reading the media query. The hero ledger must still show all four records immediately.
- Test at 200% zoom and 320px width. The `.chain` at seven nodes and the `.filter-layout` 300px sidebar are the likely failures.
- Run axe DevTools on `/`, `/auth`, `/student`, `/jobs/:id`, `/my-applications`, `/company`. Zero criticals.

---

## 10. Dark mode

Gated behind Task 2. Until text uses of `--ink` migrate to `--text-1`, headings stay navy on a navy canvas.

`data-theme` on `<html>`, three states: `light`, `dark`, `system`. Persist under `linkwork-theme`. Read it in an inline script in `client/index.html` **before** React mounts, otherwise the page flashes light on every load.

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem('linkwork-theme') || 'system';
      var d = t === 'dark' || (t === 'system' &&
        matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.setAttribute('data-theme', d ? 'dark' : 'light');
    } catch (e) {}
  })();
</script>
```

Notes that matter here:

- `--blue-700` is unreadable on a dark canvas, so `--brand` becomes `--blue-400` in dark. Already handled in the `[data-theme="dark"]` block.
- Gold moves to `--gold-300` so the seal does not vanish.
- Shadows become neutral black. Blue-tinted shadows are invisible on dark.
- Surfaces get lighter as they get closer: `--bg-canvas` → `--surface` → `--surface-alt`.
- The 44 `#fff` literals are on dark plates and are correct in both themes. Leave them.
- The nav, footer and hero stay dark in both themes. That is what `--surface-dark` is for.
- `.mesh` opacity drops in dark, already handled.

Toggle goes in `ACCOUNT_MENU` in `menuConfig.js`, available signed out too. Note `ACCOUNT_MENU` entries are all `{ label, path, roles }`; a toggle is an action, not a route, so the shape needs an optional `action` field and `App.jsx` needs to render those as buttons.

---

## 11. Implementation plan

### Branch and rollback

None of this happens on `main`. `main` stays your known-good, demo-able state for the whole rebrand, which matters because the DEIK.AI deadlines are fixed and a half-finished repaint is worse than no repaint.

Before Task 1:

```bash
git checkout main
git pull
git tag pre-rebrand          # a permanent marker for "before any of this"
git push origin pre-rebrand
git switch -c rebrand
git push -u origin rebrand
```

Then one commit per task on `rebrand`, message format `rebrand: task N, <name>`. Ten tasks, ten commits, each one independently revertable.

Four levels of undo, in increasing severity:

| Situation | Command |
|---|---|
| Claude Code made a mess mid-task | `git restore . && git clean -fd client/` |
| One completed task was wrong | `git revert <sha>` |
| The whole rebrand is going badly | `git switch main` |
| Start over from scratch | `git switch main && git branch -D rebrand` |

`server/linkwork.db`, `client/dist` and `node_modules` are all gitignored, so switching branches never touches your seeded data or your build output. You can move between `main` and `rebrand` freely without re-seeding.

When everything passes Task 10, open a PR from `rebrand` into `main`, or merge locally with `git merge --no-ff rebrand` so the whole rebrand stays one revertable merge commit in `main`'s history.

Optional, and worth it for the three risky tasks only (1, 2 and 8): branch each off `rebrand` as `rebrand/01-tokens` and merge back with `--no-ff`. For the other seven the extra ceremony costs more than it saves.

### Task 1: Fonts and token layer — DONE

**Files:** `client/index.html`, `client/src/styles.css`, `tokens.css` (deleted)

The Work Sans link was replaced with preconnect plus Plus Jakarta Sans (700, 800), Inter (400, 500, 600) and IBM Plex Mono (400, 500), `display=swap`. The theme script from §10 was added inline in `<head>`, ahead of the module script. Lines 1 to 31 of `styles.css` were replaced with the full token layer; every rule from old line 32 onward is byte-for-byte unchanged. `tokens.css` was deleted from the repo root.

**One deviation from the brief, and it matters.** §11 said to add the §10 theme script; §10 says dark mode is gated behind Task 2. Shipping both together makes dark mode live for any visitor whose OS prefers dark, in exactly the state §10 warns about: `--ink` still resolves to `--surface-dark`, so body text renders `#0d1b31` on a `#070d1a` canvas, plus 23 other `color: var(--ink)` rules. The resolver therefore defaults to `'light'`, not `'system'`. No toggle exists yet, so nothing can have written the `linkwork-theme` key. **Task 9 restores the `'system'` default; do not do it earlier.**

**Verified on `rebrand`:** `npm run build` passes. CSS 32.09 kB → 38.84 kB (gzip 6.94 → 8.97), JS unchanged. A scan of the merged file reports 91 distinct `var(--x)` referenced against 172 defined and **zero undefined**, including `--brand-fg` and the five `var()` calls in JSX inline styles. Both halves of the splice were diff-checked rather than eyeballed. No bare `.eyebrow` selector exists in source or in the compiled bundle, so the three bare spans in `Landing.jsx` keep inherited body size; that rule returns in Task 8 alongside its call sites.

### Task 2: Colour and weight audit — DONE

**Files:** `client/src/styles.css`, `client/src/pages/Landing.jsx`

1. **The `--ink` split.** 30 uses. The 23 text uses moved to `var(--text-1)`. Seven background or border uses stay and are now the only `var(--ink)` left in the file: `.nav`, `.btn.secondary` border, `.btn.secondary:hover` background, `.hero`, `.btn.dark`, `footer.site`, `.meeting-stage`. `.btn.secondary` was both and was split. This pass is what unblocks dark mode. **Still open:** `.modal-backdrop` hard-codes `rgba(22,35,63,.5)` with no variable, so it remains the old navy; retint it to match `--surface-dark` when convenient.

2. **The green split.** 46 uses. Nine occurrences across five rules moved to the success family: `.badge.verified`, `.chain .node.done .dot`, `.chain .connector.done`, `.mock-track li.done .dot`, `.alert.ok`. The other 39 are primary actions and stay blue, including `table.ledger .match-ids`, which is **brand, not status** — ledger IDs are data, not a pass or fail.

   **The shade is `--success-700`, not `--success-500`, wherever the surface carries text or a glyph.** `--success-500` on `--success-50` is 2.81:1 and `#fff` on `--success-500` is 3.12:1, against a 5.10:1 pre-rebrand baseline; using it would have introduced a new AA failure on the chain checkmark. `--success-700` gives 5.42:1 and 6.01:1. `--success-500` survives only on `.mock-track li.done .dot`, a bare dot with no glyph.

   Eight rules were judged actions rather than status and stay blue: current chain node, unread notification row and dot, recruitment step dots, chosen interview slot, both mockup chip styles, and today's date in the picker. None mean "this passed" — they mean where you are, what needs attention, or what you selected.

3. **The gold migration.** All eight existing rules from the section 5 table. `var(--seal)` now resolves in **one** rule, `.badge.faculty`, on its border, because the section 5 contrast floor reserves gold for the glyph and the border. The second sanctioned use is the faculty-verified job card top rule, which does not exist yet and arrives in Task 6 — at which point the "exactly two" criterion becomes checkable. `--gold` and `--gold-tint` were left unreferenced and deleted from the compatibility layer.

4. **Weights.** All seven `font-weight: 900` declarations became 800. `BRAND_PALETTE` in `Landing.jsx` had its green pair replaced with `--blue-50` / `--blue-700`; the other five stay varied. Note only `.fg` is ever read (`Landing.jsx:415`), so the six `bg` values are dead and can go in Task 8.

**Four leftovers fixed that no `var()` search could reach,** all raw values: `.notif-item.unread:hover` green `#dcefe5`, `.match-mock-badge`'s gold glow `rgba(217,154,6,.4)` and its hard-coded old-ink `#16233f`, and `.pref-chip`'s green border `rgba(20,125,91,0.2)`. Two are `rgba()`, which is why a "no hex outside the token block" criterion would not have caught them either.

**Verified:** `npm run build` passes. Zero `var(--ink)` in any `color:` declaration, zero `font-weight: 900`, zero undefined custom properties. Every colour pairing checked with a contrast calculation. Landing page confirmed in a browser: completed pipeline steps green, in-progress step blue.

**Deferred to Task 8 by agreement:** `.match-mock-panel` still fades `#d8efe0` into `--verify-tint`, and `.panel-green` is still a green gradient. Both are decorative landing-page art that section 8 says to leave alone until that page is open. The `.mm-chip.green` and `.feature-green` class names are also now misnomers and get renamed with their call sites.

### Task 3: Logo and marks — DONE

**Files:** `client/src/components/LinkMark.jsx`, `client/public/favicon.svg`, `client/src/styles.css`, three new PNGs in `client/public/`

`.brand-mark` recoloured to `--accent → --brand → --blue-900`, removing `#0f5a41`, the last hard-coded green literal in the stylesheet. `.avatar-initials` retokened to `--accent → --brand`; it already resolved blue through the compatibility aliases, but the token names still read "verify". `favicon.svg` keeps its original structure and 2.4 stroke with only the three gradient stops changed. Draw-in animation added per §4.

**The glyph did not change.** §4 originally specified a replacement; it was built, rejected, replaced with a second design, and that was rejected too. §4 now documents the shipped mark and both rejected attempts.

PNGs at 16, 32 and 180 are generated into `client/public/` but **not referenced yet** — `index.html` gets wired up in a later task. They are rasterised from `favicon.svg` via headless Chrome, so no dependency is added.

**Verified:** build passes. Mark renders at 16, 28, 42 and 96px; nav and footer lockups checked in the running app; reduced motion confirmed to show the complete mark rather than a blank plate; draw direction confirmed by stretching the duration so a capture lands mid-animation; PNGs checked at all three sizes over light and dark chrome. No green gradient remains anywhere except `.match-mock-panel`, deferred to Task 8.

### Task 4: Button, Card, Badge, Field

**Files:** `client/src/styles.css`, and only incidentally the components.

This task is roughly 95% CSS. The component files are thin `className` joiners and barely used: `Button`, `Card` and `Badge` are imported by three pages in total (`Alerts.jsx`, `Companies.jsx`, `CompanyProfile.jsx`), every other page writes `className="btn"` directly, and `Field.jsx` is imported by nothing at all. Restyling `.btn`, `.card`, `.badge`, `label.field` and the input block in `styles.css` is what actually changes the app.

Per §7. Add `.btn.seal` and `.badge.warning` as new rules. Add `.field-error`. Do not restructure `Field.jsx` and do not touch the 40 raw `label.field` call sites.

**Done when:** every button variant, badge variant and input state renders correctly in light mode, focus is visible on all of them, and the `Auth.jsx`, `Profile.jsx`, `Settings.jsx` and `CompanyDashboard.jsx` forms all still submit unchanged.

### Task 5: Chain

**Files:** `client/src/components/Chain.jsx`, `stages.js`, `styles.css`, `i18n.jsx`

All seven items in §7. Import labels from `stages.js`, translate them, decide on `applied`, wire or delete `.failed`, add the connector animation and the ARIA treatment, stack vertically below 640px.

**Done when:** the chain is readable at 375px, the current stage is announced by a screen reader with its position, a rejected application is visually unambiguous, and stage labels change with the locale.

### Task 6: LedgerRecord and job card

**Files:** new `components/LedgerRecord.jsx`, `styles.css`, the job card markup

Per §7. The faculty-verified gold top rule goes here.

**Done when:** a verified and an unverified job card side by side differ obviously without reading the badge text.

### Task 7: Nav, footer, 404

**Files:** `client/src/App.jsx`, `styles.css`

Scroll-triggered glass nav on `/`, sliding active underline, mobile sheet with focus trap below 860px.

Three exact edits in `App.jsx`:
1. Wrap the `<Routes>` block (line 227 to 249) in `<div id="content" tabIndex={-1}>`. This is the skip-link target; there is no `<main>` in this file.
2. Add the skip link as the first child inside `<div className="shell">` (line 191).
3. Add `<Route path="*" element={<NotFound />} />` as the last route, immediately before `</Routes>` at line 249. There is no catch-all today, so an unknown URL currently renders the nav and footer with an empty middle.

**Done when:** the nav transitions cleanly, the mobile sheet traps focus and closes on Escape, `/does-not-exist` renders the 404, and Tab from page load reveals the skip link first.

### Task 8: Landing page

**Files:** `client/src/pages/Landing.jsx`, `i18n.jsx`, `styles.css`, `server/index.js`, `server/db.js`

Split into three commits.

- **8a:** the `/api/ledger/recent` route, plus three or four `matches` rows added to `seed()` in `server/db.js`. These are the only two server changes in this document.

  The de-identified query is verified working against the real schema and returns exactly the shape the panel needs:

  ```js
  app.get('/api/ledger/recent', (req, res) => {
    res.json({
      records: db.prepare(`
        SELECT m.job_id, m.hired_at, j.title, j.faculty_verified, c.name AS company
        FROM matches m
        JOIN jobs j ON j.id = m.job_id
        JOIN companies c ON c.id = j.company_id
        ORDER BY m.hired_at DESC LIMIT 6
      `).all(),
    });
  });
  ```

  Sample row: `{job_id: 1, hired_at: "2026-06-14 10:00:00", title: "Software Engineering Intern", faculty_verified: 1, company: "DataTech Hungary Kft."}`. No `student_id` leaves the server.

  **The seeded matches must mirror what a real hire does**, or the ledger will show filled postings still sitting open on `/student`. `server/index.js` lines 785 to 788 insert the match, increment `jobs.filled`, and set `status='closed'` once `filled >= positions`. Seed the same three writes per row, not just the `INSERT`. Otherwise `open_jobs` stays at 10 while the ledger claims three of them were filled, which is precisely the ghost-posting problem the product exists to solve.

  `seed()` only runs when `universities` is empty, so existing databases are unaffected. Delete `server/linkwork.db*` to see it.
- **8b:** the five new sections (problem, trust chain, ledger, FAQ, CTA), the hero ledger panel built empty-state first, and the base `.eyebrow` rule together with fixes to the three bare spans at `Landing.jsx` 294, 377 and 408 that currently carry inline `color: var(--verify)`. All strings in `en`, `hu` and `fr`. No animation yet.
- **8c:** motion. Hero records writing in at 400ms intervals, stat counters over 1200ms on scroll into view, section reveals at 16px and 320ms. Transform and opacity only.

**Done when:** every section renders at 375, 768 and 1440; the page works with both endpoints returning 500 **and** with `/api/ledger/recent` returning an empty array; `hu` and `fr` are complete with no layout break; the three eyebrow spans render at their intended size; and with reduced motion on, all records are visible immediately with final stat values.

### Task 9: Dark mode

**Files:** `client/index.html`, `App.jsx`, `menuConfig.js`, `styles.css`

Only after Task 2. Add the toggle, extend `ACCOUNT_MENU` to support actions, then walk every page in dark and fix what breaks. Expect the `.feature-panel` gradients, `.land-*` card fills, `.note-tint-*` and the `.mm-chip` colours to need dark variants; they are hard-coded pastels.

**Done when:** every page is legible in dark, the theme survives a hard reload with no flash, and no element renders dark-on-dark or light-on-light.

### Task 10: Accessibility and QA

Work §9 top to bottom, then:

- [ ] Chrome, Firefox, Safari, iOS Safari, Android Chrome
- [ ] 320, 375, 768, 1024, 1440, 1920
- [ ] Light and dark on every page
- [ ] EN, HU, FR on every page
- [ ] 200% zoom, no horizontal scroll
- [ ] Reduced motion on, nothing moves, everything readable
- [ ] Keyboard only, apply and skill test flows completable
- [ ] axe DevTools clean on the six key routes
- [ ] Lighthouse performance 90+, accessibility 100
- [ ] The four seeded demo accounts sign in and reach their dashboards

---

## 12. Do not

- Do not add Tailwind, Next.js, shadcn/ui, styled-components or a component library. The original brief suggests them; they are wrong for a working React 18 + Vite app with a 630-line hand-written stylesheet, and a rewrite is not a rebrand.
- Do not touch `server/` except for the one route in §8.
- Do not use gold as a fill, heading colour or background.
- Do not put glass on more than the nav, the hero panel and modal backdrops.
- Do not animate anything except transform and opacity.
- Do not add stock illustrations or 3D renders. The ledger is the illustration, and the six hand-drawn company marks already carry the logo strip.
- Do not use Title Case.
- Do not add a homepage string without all three locales.
- Do not tokenise the 44 `#fff` literals on dark plates.

---

## 13. Two things to fix while you are in there

Not branding. Both are flagged in `PROJECT.md` §9. A third item about the pinned Anthropic model appeared in revisions 1 and 2 and was wrong: `claude-opus-4-8` is a valid, current model ID. It has been removed.

1. **`viewer@linkwork.test` is recreated with `can_view_all_applicants` on every boot.** If you demo from a deployed instance for DEIK.AI, that account exists on it and can read every application from every company. Gate the creation in `server/db.js` behind `NODE_ENV !== 'production'` before anything goes public. Credit where due: `/api/stats` already excludes it from the public company list, so someone was thinking about this.
2. **`SESSION_SECRET` falls back to `linkwork-dev-secret` and cookies are not `secure`.** Both need fixing behind HTTPS, and the fallback should throw rather than default in production.

---

## 14. Verification log

Everything below was executed against `5cce7d7`, not inferred. If a claim in this document is not in this list, treat it as a design opinion rather than a verified fact.

**Paths.** All 27 files this document references exist at the stated paths.

**Rule citations.** `styles.css` rules are cited by selector, not line number. Line numbers were verified against the file at revision 4, then remapped after task 1, again after task 2 and again after task 3 — every stylesheet edit moves every rule below it, so the numbers were wrong by the next commit and the remap was pure overhead. Every citation already named its selector, so the number was carrying no information a `grep -n` would not recover. Dropped after task 3. Each selector in this document was confirmed to match exactly one rule in `styles.css` at the time of dropping.

**Counts.** Pre-rebrand baseline: 28 custom properties defined, all 28 referenced, 297 references, 363 selector blocks, 30 `var(--ink)` uses (23 text, 7 surface or border), 46 `var(--verify)` uses, 99 hex literals (87 outside `:root`, 44 of them `#fff`), 7 `font-weight: 900` declarations, 327 i18n strings across three locales at blocks starting on lines 12, 134 and 256.

**Post-task-2 state.** 7 `var(--ink)` uses remain, all backgrounds or the `.btn.secondary` border, none in a `color:` declaration. 39 `var(--verify)` uses remain, all primary actions. 9 occurrences across 5 rules on the success family. 1 `var(--seal)` rule, becoming 2 in task 6. 0 `font-weight: 900`. 0 undefined custom properties, 91 referenced against 172 defined.

**Task 1 swap.** Executed on `rebrand`, not just rehearsed. `npm run build` succeeds. A post-swap scan reports 91 distinct `var(--x)` referenced, 172 defined, none undefined. Output CSS goes from 32.09 kB to 38.84 kB. The theme resolver ships pinned to `'light'`; see Task 1 for why.

**Ledger SQL.** The `/api/ledger/recent` query in section 8 executes against the real schema and returns the documented shape. Inserting a match and re-running it returns a populated row.

**Seed state.** A fresh database gives `open_jobs: 10`, `hires: 0`, `approved_companies: 7`. `matches` appears exactly once in `db.js`, as `CREATE TABLE`. `seed()` writes no hires. This is why the ledger has to be designed for n = 0 first.

**Hire semantics.** `server/index.js` 782 to 793 does the three writes plus rejecting remaining applicants when a posting closes.

**Absences confirmed.** No `path="*"` route. No `<main>` in `App.jsx`. No `Escape` or focus-trap handling. `.glass`, `.mesh`, `.ruled`, `.sr-only`, `.skip-link`, `.ledger-record` and `.tabular` do not collide with any existing selector. `.eyebrow` and `.id-tag` do, which is why `.eyebrow` is deferred to Task 8.

**Component usage.** `Field.jsx` imported by nothing. `Button`, `Card`, `Badge` imported by three pages. `Chain` by two. `LinkMark` by one.

**Model ID.** `claude-opus-4-8` is Claude Opus 4.8, released 28 May 2026, confirmed against Anthropic's announcement. Earlier revisions flagged it in error.

**Not verified, and needing your eyes:** anything visual. Contrast ratios are calculated, not measured in a browser. Hungarian and French layout behaviour under the new type scale is untested. No screenshots were taken and no page was rendered.
