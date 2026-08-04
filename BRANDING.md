# LinkWork Branding and Design System

**Implementation brief. Written to be handed to Claude Code and executed against this repo.**

Companion file: `tokens.css`.

**Revision 2.** Rewritten after reading the actual source at commit `214dcc9`. Revision 1 was written from `PROJECT.md` alone and got several things wrong. Section 1 lists what changed and why, because the corrections are the most useful part of this document.

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

**7. Existing bug found.** `styles.css` lines 383 and 393 reference `var(--brand-fg)`, which is never defined anywhere. The `.logo-lockup:hover` colour and its descriptor currently resolve to nothing and inherit. `tokens.css` now defines `--brand-fg`, which fixes it as a side effect.

**8. `.id-tag` and scoped `.eyebrow` already exist.** Revision 1's `tokens.css` redefined `.id-tag` (line 191) and added `.container`, `body`, `h1`-`h4`, `p`, `a` and `:focus-visible` rules that would have been overridden by the existing rules further down the file. Dead code that looks live is worse than no code. All of it is stripped. `tokens.css` is now tokens plus four verified-absent utility classes.

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

A **link with a verification notch**. Two rounded chain links interlocking, where the overlap forms a checkmark. The link is checked. The two links also map onto the `JOB ⟷ STU` pairing, so the mark and the ledger row are the same idea at two scales.

### What exists now

`LinkMark.jsx` renders a broken-chain glyph inside a `.brand-mark` wrapper: a circular plate with a green gradient and inset highlights, defaulting to `size={42}`. `App.jsx` calls it twice, at default size in the nav and at `size={28}` in the footer. `public/favicon.svg` repeats the same glyph on the same green gradient.

Keep the circular plate. It works, it is already load-bearing in the nav, and it gives the mark a container that survives on the dark nav. Change the glyph and recolour the plate.

### Source

```jsx
// The LinkWork mark: two links, checked. The notch is cut from the overlap,
// so the glyph survives in monochrome and at favicon scale.
export default function LinkMark({ size = 42, sealed = false }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size }}>
      <svg
        width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24"
        fill="none" aria-hidden="true"
      >
        <path
          d="M9.5 7.25H7a4.75 4.75 0 0 0 0 9.5h2.5"
          stroke="#fff" strokeWidth="2.6"
          strokeLinecap="round" strokeLinejoin="round"
        />
        <path
          d="M14.5 7.75H17a4.75 4.75 0 0 1 0 9.5h-2.5"
          stroke="#fff" strokeWidth="2.6"
          strokeLinecap="round" strokeLinejoin="round"
        />
        <path
          d="M9.6 12.35 11.35 14.3 14.75 10.1"
          stroke={sealed ? 'var(--seal)' : '#fff'}
          strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
```

The `.brand-mark` gradient in `styles.css` line 70 currently runs `--verify-bright → --verify → #0f5a41`. Change it to `--blue-400 → --blue-700 → --blue-900` and update the `#0f5a41` literal. `public/favicon.svg` carries the same three stops hard-coded (`#1ca878`, `#147d5b`, `#0f5a41`); update those to `#4f8ef7`, `#003b7a`, `#001b3a` and replace the glyph paths to match.

`.avatar-initials` (line 85) uses the same green gradient. Update it too, or avatars stay green while everything else turns blue.

### Construction

24 unit grid, 2 unit safe area. Stroke 2.6 at 24, scaling linearly. Rounded caps and joins. The links overlap by 4 units and the notch is cut from the overlap. Optical balance: the right link sits 0.5 units lower than the left. Do not centre them mechanically.

### Lockups

- **Full:** plate, 12px gap, "LinkWork" in Plus Jakarta Sans 800. This is the existing `.brand` rule.
- **Stacked:** for the video end card and the A4 submission.
- **Icon:** the plate alone.
- **Favicon:** glyph alone, stroke bumped to 3.0 for 16px legibility. Ship 16, 32, 180 and the SVG.

### Animation

One use, on first load: the two links draw in from their outer ends over 560ms, then the notch strokes in over 200ms. Total under 800ms, via `stroke-dasharray`. Disabled under `prefers-reduced-motion`. Do not loop, do not repeat on route change.

### Misuse

Do not rotate it, do not fill the links, do not recolour the notch gold outside faculty-verified contexts, do not place the lockup on a photo without a plate behind it.

---

## 5. Colour

Values in `tokens.css`. This is the usage law.

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
2. **Gold is a seal, not a colour.** A badge, a hairline rule under a partnership block, or the logo notch on verified surfaces. Never a button fill, never a heading, never a background. Well under 1% of pixels. That scarcity is what makes the gold star mean something.
3. **Green is status, not brand.** The biggest behavioural change here. `--verify` currently paints every primary button and link. After the swap it resolves to blue, and green survives as `--success-500` for "this passed" and "this is verified" only.
4. **`#fff` on dark plates is correct.** The 44 occurrences on `.nav`, `.hero` and `footer.site` are intentional. Do not tokenise them into `--surface`, which would invert them in dark mode.
5. **Never use colour alone to carry meaning.** Every status colour ships with an icon or a label. Faculty-verified is a gold star *and* the words "Faculty verified".

### Contrast floor

Verify with a checker, not by eye.

- `--text-1` on `--surface`: 16.1:1
- `--text-3` on `--surface`: 4.76:1, so muted text never drops below 14px
- `--text-on-brand` on `--brand`: 11.4:1
- Gold: `--gold-500` on white is 2.6:1 and **fails**. Badge text uses `--gold-700` on `--gold-100`. Gold is for the glyph and the border. This applies to the existing `.badge.faculty` (already correct at `#7c5a00`) and to `.alert.info`, `.mm-chip.gold` and `.match-mock-logo`, which reuse the same pairing.

---

## 6. Typography

### The pairing

**Plus Jakarta Sans, display.** Headings and the wordmark. Geometric with a humanist warmth, genuinely distinctive at large sizes where Inter goes generic. 700 and 800 only, never below 17px.

**Inter, body and UI.** Body copy, buttons, fields, tables, nav. Built to be read at 13 to 17px in dense interfaces, with real tabular figures. The workhorse, and it should be invisible.

**IBM Plex Mono, data.** Already in the build. IDs, stage names, counts, dates, scores, eyebrows. The ledger voice. Keeping it means the 18 existing `.id-tag` uses need no rework.

Replaces Work Sans, which currently serves as both display and body. Load variable weights with `display=swap` and preconnect. If three families becomes a performance problem, drop Plus Jakarta and set headings in Inter 800 with `--ls-tightest`. Never drop the mono.

Note `styles.css` uses weight 900 in nine places (`.hero h1`, `.land-card.stat b`, `.logo-word b`, `.note-stat b`, `.overlap-band .stat b`, `.match-mock-logo`, `.avatar-initials`, `.account-menu-name`, `.brand`). Plus Jakarta Sans tops out at 800. Map all 900s to 800 in Task 2 or they will silently synthesise.

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

Nothing below 12px ships. `styles.css` currently has `11px`, `11.5px` and `12px` in eleven places; the 11s are mono uppercase labels where tracking carries legibility, so they may stay, but check each at 200% zoom.

### Detail rules

- Figures in tables, stats and scores get `font-variant-numeric: tabular-nums`. The `.tabular` utility is in `tokens.css`.
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

Heights 36 / 44 / 52 via padding. Radius stays `--radius-sm`. Hover lifts 1px, active returns to 0, focus-visible shows the ring, disabled is 45% opacity with `cursor: not-allowed` and **keeps its shape** rather than turning grey (line 146 currently sets `#a9b6ad`, which reads as broken).

Loading: the label stays and a 14px spinner takes the leading icon slot. Never let the button change width mid-action.

Note `.lang-trigger.btn.ghost` (line 127) overrides ghost with white-on-dark for the nav. Keep that override.

### Card

Line 167. `--surface`, `--radius`, 1px `--border`, `--shadow-1`, `--space-5` padding. It already transitions shadow and transform but no hover rule ever fires. Add hover only when the card is a link: `--shadow-2` and `translateY(-2px)`. Cards that are not links do not move.

### Badge

Line 180. Variants `.faculty`, `.verified`, `.pending`, `.danger`, `.mono`. Add `.warning`. Keep the pill shape and 6px glyph gap. `.verified` moves from `--verify-tint` to `--success-50` with `--success-700` text, because it is a status and not an action. `.pending` moves to `--warning-50` and `--warning-700`.

### Field

Line 154 plus `Field.jsx`. The component wraps everything in a `<label>`, which makes `aria-describedby` awkward because the error message would sit inside the label and get read as part of it.

Restructure: keep the `<label>` for the label text and hint, move `children` outside it into a wrapping `<div className="field">`, and use `React.cloneElement` to inject `aria-invalid` and `aria-describedby` into the control when an `error` prop is present.

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

`label.field` in the CSS becomes `.field` and `.field > label`. Grep for `<Field` before changing this: it is used across `Auth.jsx`, `Profile.jsx`, `Settings.jsx`, `CompanyDashboard.jsx` and `JobDetail.jsx`.

Focus: border to `--brand` plus the ring. Error: `--danger-500` border with a message below in `--fs-sm` `--danger-700` and a 14px icon. Never rely on the red border alone. Keep `font-size: 15px` on inputs or larger so iOS does not zoom on focus.

### Chain

`Chain.jsx` plus line 201. This is the most important component in the product and it is in better shape than revision 1 assumed. It already numbers the stages, already uses `role="list"`, and already fills connectors behind completed nodes.

What to add:

- **Animate the connector fill.** Currently `.chain .connector.done` swaps background instantly. Fill left to right over `--d-slow` with `--ease-out`. This is the moment a student learns they advanced, and it is worth doing well.
- **`aria-current="step"`** on the current node, plus a visually hidden "Stage 3 of 7, AI interview, in progress". Right now a screen reader gets seven list items with a number and a label and no indication of position.
- **The rejected treatment.** `.chain .node.failed` is defined in CSS but `Chain.jsx` never applies it. Either wire it up or delete the rule. Currently rejection renders as a separate badge with the track left neutral. Turning the track `--danger-500` from the failure point onward is clearer.
- **Vertical below 640px.** Seven nodes at `min-width: 86px` need 602px plus connectors. On a 375px screen this wraps into an unreadable tangle today.
- **The `applied` stage never appears.** `server/index.js` creates applications at `skill_test`, so node 1 is permanently complete and never current. Either drop it from `ORDER` and show six stages, or label it so users understand it is automatic. Six is more honest.
- **Duplicate label maps.** `Chain.jsx` has its own `LABELS` and `ORDER` that duplicate `STAGE_LABEL` and `STAGE_ORDER` in `stages.js`, with `tech_interview` spelled "Technical" in one and "Technical interview" in the other. Import from `stages.js` and delete the local copies.
- **Nothing in `Chain.jsx` is translated.** Stage labels are hard-coded English while the rest of the chrome is trilingual.

### LedgerRecord

New. `.ledger-record` is styled in `tokens.css`.

```
JOB-0042  ⟷  STU-0007     Junior Data Engineer · DataTech    14 May 2026  ★
```

Mono for IDs and date, Inter `--fs-sm` for the role line, gold star only if faculty verified. Hairline divider between records. Rows do not hover or link on the public page. They are records, not controls.

### Job card

`.job-row` (line 482) plus `Card`. Add the `JOB-0042` mono tag top right in `--text-3`. Faculty-verified cards get a 1px `--seal` top border, 2px inset, plus the existing `.badge.faculty`. That top rule is the only place gold touches a card.

### Stat

`.overlap-band .stat` (line 336) and `.note-stat` (line 367). Both currently use `--font-display` at weight 900 in `--verify` green. Move to `--font-mono` at `--fs-3xl` weight 600 with `tabular-nums`, in `--brand`. Mono is the ledger voice and these numbers come from the ledger.

Counters animate from 0 over 1200ms, once, on scroll into view, only when motion is allowed. `Landing.jsx` already fetches `/api/stats`; if it fails, render the last known value or hide the block. Never render a spinning zero.

### Nav

`.nav` (line 57) is a solid `--ink` sticky bar. Keep it dark, repaint to `--surface-dark`.

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

`.hero-chain` currently shows three static nodes labelled Faculty, Company, You. Replace the right panel with a glass ledger card that writes in four recent hire records, one every 400ms, mono, each with its date and gold star where faculty verified. Under them one mono line: `12 hires recorded · 0 postings unaccounted for`.

This is the product's own database used as the hero image.

**This needs a route that does not exist.** Add exactly this to `server/index.js` next to `/api/stats`:

```js
app.get('/api/ledger/recent', (req, res) => {
  res.json({
    records: db.prepare(`
      SELECT m.job_id, m.student_id, m.hired_at,
             j.title, j.faculty_verified, c.name AS company
      FROM matches m
      JOIN jobs j ON j.id = m.job_id
      JOIN companies c ON c.id = j.company_id
      ORDER BY m.hired_at DESC LIMIT 6
    `).all(),
  });
});
```

This is the only sanctioned server change in this document, and `PROJECT.md` §10 already lists a public read-only ledger page as planned.

**Privacy check before you ship it.** The response exposes `STU-0007` alongside a job title and a company name. At pilot scale, with one demo student and ten jobs, that tuple identifies a real person to anyone who knows them. Decide deliberately: either the ledger is genuinely public and students consent to it at registration (which means a line in `Privacy.jsx` and `POLICY_VERSION` bumped), or the public route returns the job side and the company only, and the student ID appears solely to the student and the hiring company. The second is the safer default for a pilot.

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
- Every interactive element keyboard reachable with a visible focus ring. The existing `:focus-visible` (line 46) uses a green outline; retoken it to `--focus-ring-color`.
- Add a skip link. `.skip-link` is in `tokens.css`; it needs an `id` on `main.container` in `App.jsx`.
- Targets 44x44 on touch. `.dtp-nav` is 30x30 and `.dtp-arrow` is 52x26. Both fail.
- One `<h1>` per page. Never skip a level for styling.
- Icon-only buttons need `aria-label`. The nav bell has one. Decorative SVGs need `aria-hidden="true"`.
- Live regions on the notification count and on stage changes.
- Modals trap focus and close on Escape. `.modal` exists in the CSS with neither.
- `prefers-reduced-motion` is handled at line 47 with `animation: none; transition: none`. That is correct and blunt. Verify it by toggling the OS setting, not by reading the media query. The hero ledger must still show all four records immediately.
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

- `--blue-700` is unreadable on a dark canvas, so `--brand` becomes `--blue-400` in dark. Handled in `tokens.css`.
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

### Task 1: Fonts and token layer

**Files:** `client/index.html`, `client/src/styles.css`

Replace the Work Sans link with preconnect plus Plus Jakarta Sans (700, 800), Inter (400, 500, 600) and IBM Plex Mono (400, 500), `display=swap`. Add the theme script from §10. Replace **lines 1 to 31 only** of `styles.css` with the full contents of `tokens.css`. Leave every rule from line 32 onward untouched.

**Verified:** this exact swap has been tested. `npm run build` succeeds, and a merged scan of the resulting file reports zero undefined custom properties.

**Done when:** the build passes, every page renders fully styled, and the only visible changes are new typefaces and greens becoming blue.

### Task 2: Colour and weight audit

**Files:** `client/src/styles.css`, `client/src/pages/Landing.jsx`

Three passes.

1. **The `--ink` split.** Every `var(--ink)` used as a text colour becomes `var(--text-1)`. Every `var(--ink)` used as a background or border stays. There are 31 uses; the background ones are `.nav`, `footer.site`, `.hero`, `.meeting-stage`, `.btn.dark`, `.btn.secondary:hover`, `.modal-backdrop` and `.btn.secondary`'s border. This unblocks dark mode.
2. **The green split.** Every `--verify` use is either a primary action (stays, now blue) or a status (moves to `--success-500`). Statuses include `.badge.verified`, `.alert.ok`, `.mock-track li.done .dot`, and the `table.ledger .match-ids` colour. When unsure, list it and ask rather than guessing.
3. **Weight 900 to 800**, all nine occurrences, since Plus Jakarta Sans has no 900.

Also fix `BRAND_PALETTE` in `Landing.jsx` per §8.

**Done when:** no `var(--ink)` remains in a `color:` declaration; the nine 900s are gone; `npm run build` passes; and the landing page and `/my-applications` render correctly. Report the count of `--verify` uses moved to `--success-500`.

### Task 3: Logo and marks

**Files:** `client/src/components/LinkMark.jsx`, `client/public/favicon.svg`, `client/src/styles.css`

New glyph per §4. Recolour `.brand-mark` (line 68) and `.avatar-initials` (line 83). Update `favicon.svg` glyph and gradient. Generate 16, 32 and 180 PNGs. Add the draw-in animation gated on `prefers-reduced-motion`.

**Done when:** the mark renders correctly at 16, 28, 42 and 96px, the nav and footer lockups both look right, and no green gradient remains anywhere.

### Task 4: Button, Card, Badge, Field

**Files:** the four components plus `styles.css`

Per §7. The `Field` restructure is the risky one: grep every `<Field` usage first and update call sites in the same commit.

**Done when:** every variant renders in light mode, focus is visible on all of them, and the `Auth.jsx`, `Profile.jsx`, `Settings.jsx`, `CompanyDashboard.jsx` and `JobDetail.jsx` forms all still submit.

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

Scroll-triggered glass nav on `/`, sliding active underline, mobile sheet with focus trap below 860px. Add the catch-all 404 route. Add the skip link and the `id` on `main`.

**Done when:** the nav transitions cleanly, the mobile sheet traps focus and closes on Escape, an unknown URL renders the 404, and Tab from page load reveals the skip link first.

### Task 8: Landing page

**Files:** `client/src/pages/Landing.jsx`, `i18n.jsx`, `styles.css`, `server/index.js`

Split into three commits.

- **8a:** the `/api/ledger/recent` route, plus the privacy decision from §8 written down in the commit message.
- **8b:** the four new sections (problem, trust chain, ledger, FAQ, CTA) and the hero ledger panel, all strings in `en`, `hu` and `fr`. No animation yet.
- **8c:** motion. Hero records writing in at 400ms intervals, stat counters over 1200ms on scroll into view, section reveals at 16px and 320ms. Transform and opacity only.

**Done when:** every section renders at 375, 768 and 1440; the page works with both endpoints returning 500; `hu` and `fr` are complete with no layout break; and with reduced motion on, all four hero records are visible immediately with final stat values.

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

## 13. Three things to fix while you are in there

Not branding. All three are flagged in `PROJECT.md` §9 or found in the source.

1. **`viewer@linkwork.test` is recreated with `can_view_all_applicants` on every boot.** If you demo from a deployed instance for DEIK.AI, that account exists on it and can read every application from every company. Gate the creation in `server/db.js` behind `NODE_ENV !== 'production'` before anything goes public. Credit where due: `/api/stats` already excludes it from the public company list, so someone was thinking about this.
2. **`server/anthropic.js` pins model `claude-opus-4-8`,** which is not a current model ID. Check it against the live lineup before enabling the scorer, or the first real call fails.
3. **`SESSION_SECRET` falls back to `linkwork-dev-secret` and cookies are not `secure`.** Both need fixing behind HTTPS, and the fallback should throw rather than default in production.
