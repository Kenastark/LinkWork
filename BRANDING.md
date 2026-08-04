# LinkWork Branding and Design System

**Implementation brief. Written to be handed to Claude Code and executed against the existing repo.**

Companion file: `tokens.css` (paste-ready token layer).

---

## 0. How to use this document

This is not a redesign from scratch. LinkWork already works: Express + SQLite, React 18 + Vite 6, one hand-written `client/src/styles.css` with design tokens, 21 route components, EN/HU/FR i18n. The stack stays exactly as it is. What changes is the visual layer.

Give Claude Code this document plus `tokens.css` and work through §11 in order. Each task names the files it touches and how to tell when it is done.

**Constraints that must hold. State these to Claude Code up front.**

- Do not introduce Next.js, Tailwind, shadcn/ui, or any CSS-in-JS. The single stylesheet plus tokens is the system.
- Do not touch `server/`. This is a client-side change only.
- Do not add a component library. The eight existing components in `client/src/components/` get restyled, not replaced.
- Every new user-facing string on the homepage goes through `t()` in `client/src/i18n.jsx` with `en`, `hu`, and `fr` entries. The homepage is currently fully translated and a rebuild that hard-codes English silently breaks two languages.
- Ship each task in its own commit so a regression is bisectable.

---

## 1. Brand strategy

### The one-line positioning

> LinkWork is the hiring platform where every posting is a commitment, and every hire is on the record.

### What the brand is actually about

Most job platforms sell *volume*: more listings, more matches, more reach. LinkWork sells the opposite. It sells **scarcity that can be verified**. There are fewer postings here, and that is the product.

The competitor is not Indeed or LinkedIn. The competitor is the void students apply into. Everything in the visual system should reinforce one idea: this is a **register**, not a feed. Records are checked before they go in, and they come out when they are fulfilled.

### Personality, ranked

Ranking matters more than the list, because when two traits conflict the higher one wins.

1. **Verifiable.** Every claim on screen should look like it could be audited.
2. **Precise.** Tight spacing, tabular numbers, exact language. No rounding, no hedging.
3. **Institutional.** University-backed and unembarrassed about it. Credibility is the asset.
4. **Modern.** Reads like Linear or Stripe, not like a student portal from 2011.
5. **Human.** Students are anxious and companies are busy. Warmth in copy, never in chrome.

Where the brief says "should feel more like an AI company than a university portal", the resolution is: **AI-company execution, institution-grade content.** The polish, motion, and restraint come from Linear and Stripe. The substance stays academic. It should not feel like a startup pretending to have a university behind it. It has one.

### Voice

- Sentence case everywhere, including buttons and headings. Title Case reads corporate.
- Active voice. "Verify your student ID", not "Student ID verification".
- Name things by what the person controls. "Take the skill test", not "Assessment module".
- Numbers over adjectives. "Six partner companies, 41 open roles, 12 hires recorded" beats "a growing community".
- Never claim what the product does not do yet. The existing `/coming-soon?feature=X` pattern is a brand asset. Keep it and be proud of it: honesty is the whole thesis.

### The three things a visitor must understand in eight seconds

1. Every posting here is real, and there is a mechanism behind that claim.
2. It is run with the University of Debrecen, not adjacent to it.
3. It is for students of that university, and it is free to them.

---

## 2. The signature: the ledger record

Every strong identity has one element it is remembered by. For LinkWork it is already in the product, just under-used.

```
JOB-0042  ⟷  STU-0007        hired · 14 May 2026
```

The match ledger row. It is the proof the job was real, it is unique to this product, and it already has a typeface (IBM Plex Mono) and a shape. Promote it from a detail on the applications page to **the structural motif of the whole brand**.

Where it appears:

| Surface | Treatment |
|---|---|
| Hero | A live ledger of recent hires, records writing themselves in one at a time. This is the hero, in place of a stock illustration. |
| Job cards | `JOB-0042` as a mono corner tag on every card, always visible. |
| Student dashboard | `STU-0007` as identity, shown at the top like a matriculation number. |
| Pipeline | The seven stages as a chain of linked nodes, the `Chain` component. |
| Section eyebrows | Mono, uppercase, wide-tracked, the same family as the IDs. Ties the whole page to the ledger. |
| Empty states | An empty ruled register with a caption, not a shrugging illustration. |
| Favicon | The link glyph. |

**Rule: mono is reserved for things that are on the record.** IDs, counts, dates, scores, stage names, eyebrows. Never for body copy, never for buttons. That reservation is what makes it read as data rather than as decoration.

**The one aesthetic risk, and the justification.** Ledger sections carry a faint ruled-register texture (`.ruled` in `tokens.css`, a 40px repeating hairline). It is a paper-record cue sitting underneath an otherwise glassy modern interface. That tension, register underneath, software on top, is exactly what the product is. Use it on the ledger and stats sections only. If it appears on more than two sections it stops being a signature and becomes wallpaper.

---

## 3. Logo

### Concept

A **link with a verification notch**. Two rounded chain links interlocking, where the overlap of the two forms a checkmark negative space.

The meaning is direct: LinkWork is the link between a company and a student, and the link is checked. The two links also map onto the `JOB ⟷ STU` pairing, so the mark and the ledger row are the same idea at two scales.

### Construction

- 24 unit grid, 2 unit safe area on all sides.
- Stroke weight 3 units at 24, scaling linearly. Rounded caps and joins.
- The two links overlap by 4 units. The notch is cut from the overlap, never drawn on top, so it survives monochrome and single-colour printing.
- Optical balance: the right link sits 0.5 units lower than the left. Do not centre them mechanically.

### Source

Replace `client/src/components/LinkMark.jsx` with this. It inherits `currentColor` so it works on any surface, and takes an optional `sealed` prop that turns the notch gold for faculty-verified contexts only.

```jsx
export default function LinkMark({ size = 24, sealed = false, title = "LinkWork" }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      role="img" aria-label={title}
      fill="none" xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.5 7.25H7a4.75 4.75 0 0 0 0 9.5h2.5"
        stroke="currentColor" strokeWidth="3"
        strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M14.5 7.75H17a4.75 4.75 0 0 1 0 9.5h-2.5"
        stroke="currentColor" strokeWidth="3"
        strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M9.75 12.4 11.4 14.2 14.6 10.3"
        stroke={sealed ? "var(--seal)" : "currentColor"}
        strokeWidth="2.4"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}
```

### Lockups

- **Full:** mark, 10px gap, "LinkWork" in Plus Jakarta Sans 700, `--ls-tight`. Mark height equals cap height, not line height.
- **Stacked:** for the video end card and the A4 submission. Mark above, wordmark below, gap equal to half the mark height.
- **Icon:** mark alone in a `--r-lg` squircle filled `--blue-700`, mark in white, mark at 62% of tile width.
- **Favicon:** mark alone, stroke bumped to 3.4 for 16px legibility. Ship 16, 32, 180 (apple-touch) and an SVG.
- **Dark mode:** mark in `--n-0`, wordmark in `--n-0`. Never in `--blue-700` on dark.

### Animation

One use only, on first page load: the two links draw in from their outer ends over 560ms with `--ease-out`, then the notch strokes in over 200ms. Total under 800ms. Uses `stroke-dasharray`. Disabled entirely under `prefers-reduced-motion`. Do not loop it, do not repeat it on route changes.

### Misuse

Do not rotate it, do not fill the links, do not put the mark inside a circle, do not recolour the notch gold outside faculty-verified contexts, do not place the full lockup on a photo without a solid or glass plate behind it.

---

## 4. Colour

Full values in `tokens.css`. This section is the usage law.

### The roles

| Role | Token | Value | Used for |
|---|---|---|---|
| Primary | `--brand` | `#003b7a` | Primary buttons, links, active nav, focus emphasis, chart series 1 |
| Primary dark | `--blue-800` | `#002855` | Pressed states, dark section fills, footer |
| Accent | `--accent` | `#4f8ef7` | Focus rings, hover glow, gradient mesh, dark-mode primary |
| Seal | `--seal` | `#c89b3c` | Faculty-verified badge, partnership marks, awards. Nothing else. |
| Success | `--success-500` | `#17a673` | Passed, verified, hired |
| Warning | `--warning-500` | `#f2a93b` | Pending review, action needed |
| Danger | `--danger-500` | `#d9534f` | Rejected, destructive actions |
| Canvas | `--bg-canvas` | `#f7f9fc` | Page background |
| Surface | `--surface` | `#ffffff` | Cards, panels, nav |
| Text | `--text-1` | `#0f172a` | Headings and body |
| Muted | `--text-3` | `#64748b` | Meta, captions, mono IDs |

### Rules

1. **Blue dominates.** Roughly 70% of the coloured surface area in any view should be blue or neutral. If a screenshot looks multicoloured, something is miscoded.
2. **Gold is a seal, not a colour.** It appears as a badge, a hairline rule under a partnership block, or the logo notch on verified surfaces. It is never a button fill, never a heading colour, never a background. On a typical page it should account for well under 1% of pixels. This scarcity is what makes the gold star mean something.
3. **Green is status, not brand.** This is the migration's biggest behavioural change. In the current build `--verify` green is the primary action colour. After this change, primary actions are blue and green means only "this passed" or "this is verified". `tokens.css` aliases `--verify` to blue so nothing breaks, but audit every green surface: if it is a button or a link, it is meant to be blue now.
4. **Warning and danger never appear together in one component.** Pick the more urgent one.
5. **Never use colour alone to carry meaning.** Every status colour ships with an icon or a text label. Faculty-verified is a gold star *and* the words "Faculty verified".

### Contrast floor

All of these must pass, verified with a checker, not by eye:

- `--text-1` on `--surface`: 16.1:1
- `--text-3` on `--surface`: 4.76:1, so muted text never goes below 14px
- `--text-on-brand` on `--brand`: 11.4:1
- `--seal-700` on `--seal-subtle-bg` for badge text. Never `--seal-500` on white for text, it fails at 2.6:1. Gold is for the glyph and the border, text next to it uses `--gold-700`.

---

## 5. Typography

### The pairing and why

Three families, three jobs. Each earns its place.

**Plus Jakarta Sans, display.** Headings and the wordmark. Geometric with a slightly humanist warmth and genuinely distinctive at large sizes, where Inter goes generic. It is confident without being severe, which matches an institution that wants to look modern rather than austere. Used at 700 and 800 only, and never below 17px.

**Inter, body and UI.** Everything functional: body copy, buttons, form fields, tables, nav. Inter exists to be read at 13 to 17px in dense interfaces, has real tabular figures, and carries optical sizing. This is the workhorse and it should be invisible.

**IBM Plex Mono, data.** Retained from the current build, and promoted. IDs, stage names, counts, dates, scores, eyebrows. It is the ledger voice. Keeping it also means the existing `JOB-0042` tags need no rework, only more prominence.

Why not one family: a single face means the ledger records look like copy, and the entire signature collapses. Why not four: three is already at the loading budget.

Replaces Work Sans. Load variable weights, `display=swap`, preconnect to `fonts.gstatic.com`. If the third family becomes a performance problem, drop **Plus Jakarta Sans** and set headings in Inter at 800 with `--ls-tightest`. Never drop the mono.

### Scale

| Token | Size | Weight | Line height | Tracking | Use |
|---|---|---|---|---|---|
| `--fs-5xl` | 52 to 88 | 800 | 1.06 | -0.035em | Hero h1 only |
| `--fs-4xl` | 44 to 68 | 800 | 1.06 | -0.035em | Page h1 |
| `--fs-3xl` | 36 to 48 | 700 | 1.22 | -0.02em | Section h2 |
| `--fs-2xl` | 28 to 36 | 700 | 1.22 | -0.02em | Card cluster headings |
| `--fs-xl` | 22 to 26 | 600 | 1.22 | -0.02em | h3 |
| `--fs-lg` | 18 to 20 | 500 | 1.5 | -0.011em | Lead paragraph, subheads |
| `--fs-md` | 17 | 400 | 1.65 | -0.011em | Long-form body |
| `--fs-base` | 16 | 400 | 1.5 | -0.011em | UI body |
| `--fs-sm` | 14 | 400 to 500 | 1.5 | -0.011em | Secondary, table cells |
| `--fs-xs` | 12 | 500 | 1.5 | 0.08em (mono) | ID tags, meta |
| `--fs-micro` | 11 | 500 | 1.5 | 0.16em | Mono eyebrows, uppercase |

Sizes above `--fs-lg` use `clamp()` and scale fluidly. Nothing below 12px ships. Body copy caps at `--measure` (68ch).

### Detail rules

- All figures in tables, stats, and scores set `font-variant-numeric: tabular-nums`. Numbers that jitter while a counter animates look broken.
- Headings get `text-wrap: balance`, paragraphs get `text-wrap: pretty`.
- Never letterspace lowercase body text. Only mono uppercase gets tracking.
- Hungarian runs roughly 15 to 20% longer than English and German-style compounds are common. Buttons and nav items must not be fixed-width, and headings need to survive a 25% length increase without reflowing into four lines. Test the `hu` locale on every layout before calling a task done.

---

## 6. Space, shape, depth, motion

### Spacing

4px base. Use the `--s-*` tokens, never raw pixels. Section rhythm is `--section-y`, which is `clamp(64px, 9vw, 128px)`. Gutters are `--gutter`.

Vertical rhythm inside a section: heading, 12px, lead paragraph, 40px, content. Cards in a grid use a 24px gap at desktop and 16px at mobile.

### Radius

`--r-sm` 10 for inputs and small badges, `--r-md` 14 for buttons, `--r-lg` 20 for cards, `--r-xl` 28 for feature panels and modals, `--r-2xl` 36 for hero surfaces, `--r-pill` for filter chips and status pills.

The rule for nested corners: inner radius equals outer radius minus the padding. A 20px card with 12px padding holds a 8px inner element. Concentric corners are one of the things that separates considered UI from assembled UI.

### Elevation

Five levels, and shadows are **blue-tinted** (`rgba(0, 40, 85, ...)`), never neutral black. Grey shadows on a cool canvas read as dirt.

| Level | Token | Applied to |
|---|---|---|
| 0 | `--shadow-0` | Flat sections, table rows |
| 1 | `--shadow-1` | Resting cards, inputs |
| 2 | `--shadow-2` | Hovered cards, dropdowns, sticky nav once scrolled |
| 3 | `--shadow-3` | Modals, popovers |
| 4 | `--shadow-4` | Hero feature panel, the one element allowed to float |

### Glass

`.glass` in `tokens.css`. Three places only: the sticky top nav after scroll, the hero ledger panel, and modal backdrops. Glass on everything is the single fastest way to make a 2026 interface look dated in 2027. Always ship a solid fallback via `@supports not (backdrop-filter: blur(1px))`.

### Motion

Durations: `--d-instant` 120ms for colour and background, `--d-fast` 200ms for hovers and small transforms, `--d-base` 320ms for panels and dropdowns, `--d-slow` 560ms for entrance sequences.

Easing: `--ease-out` for anything entering or responding to a user action. `--ease-in-out` for anything moving between two states. `--ease-spring` on exactly one thing, the verification check when a badge is awarded.

Principles:

1. **One orchestrated moment per page.** On the homepage it is the hero ledger writing itself. Everything else is a 200ms hover.
2. **Motion follows causality.** A dropdown opens from its trigger, not from the centre of the screen.
3. **Never animate more than transform and opacity.** Layout-affecting animation on a page with a live stats fetch will jank.
4. **Scroll reveals are 16px of travel and 320ms.** Anything more looks like a template.
5. `prefers-reduced-motion` kills all of it, already handled in `tokens.css`. Verify it actually works by toggling the OS setting, not by reading the media query.

---

## 7. Components

Restyle the eight existing components in `client/src/components/`. Do not add a dependency.

### Button

| Variant | Fill | Text | Border | Use |
|---|---|---|---|---|
| Primary | `--brand` | `--text-on-brand` | none | One per view. The main action. |
| Secondary | `--surface` | `--brand` | 1px `--border-strong` | Alternative actions |
| Ghost | transparent | `--text-2` | none | Tertiary, nav, cancel |
| Danger | `--danger-500` | white | none | Reject, delete. Always behind a confirm. |
| Seal | `--seal-subtle-bg` | `--gold-700` | 1px `--seal` | Faculty-verified filter only |

Heights 36 / 44 / 52. Radius `--r-md`. Padding `0 var(--s-5)`. Weight 600, size `--fs-sm` at 36, `--fs-base` above.

States: hover lifts 1px and moves to `--brand-hover` over `--d-fast`; active returns to 0 and `--brand-active`; focus-visible shows `--focus-ring`; disabled is 45% opacity with `cursor: not-allowed` and **keeps its shape**, never turns grey.

Loading: the label stays in place and a 14px spinner replaces the leading icon slot. Never let the button change width mid-action.

### Card

`--surface`, `--r-lg`, 1px `--border`, `--shadow-1`, padding `--s-6`. Hover, only if the card is a link: `--shadow-2` and `translateY(-2px)` over `--d-fast`. Cards that are not links do not move.

### Badge

Pill, `--fs-xs`, weight 600, padding `2px var(--s-3)`, 6px glyph gap.

| Badge | Background | Text | Glyph |
|---|---|---|---|
| Faculty verified | `--seal-subtle-bg` | `--gold-700` | Gold star |
| Verified student | `--success-50` | `--success-700` | Check |
| Pending | `--warning-50` | `--warning-700` | Clock |
| Rejected | `--danger-50` | `--danger-700` | Cross |
| Remote / Hybrid / On site | `--brand-subtle-bg` | `--brand-subtle-fg` | none |

### Field

Label `--fs-sm` 500 `--text-2`, 6px gap, input 44px, `--r-sm`, 1px `--border-strong`, `--surface`, 16px text so iOS does not zoom on focus.

Focus: border to `--brand`, plus `--focus-ring`. Error: border `--danger-500`, message below in `--fs-sm` `--danger-700` with a 14px icon, wired via `aria-describedby`. Never rely on the red border alone. Helper text sits below the label, not below the input, so it is read before the field is filled.

### Chain (the pipeline)

The most important component in the product. Seven stages, horizontal on desktop, vertical on mobile below 640px.

- Node: 28px circle. Complete is `--brand` filled with a white check. Current is `--surface` with a 2px `--brand` ring and a soft `--accent` glow. Upcoming is `--n-200` filled. Rejected turns the whole track `--danger-500` from that node onward.
- Connector: 2px, `--brand` behind completed nodes, `--border` ahead of them. When a stage completes, the connector fills left to right over `--d-slow` with `--ease-out`. This is the second orchestrated moment in the product and it is worth doing well, because it is the moment a student learns they advanced.
- Label: mono `--fs-micro` uppercase, `--text-3`, `--brand` on the current node.
- Numbering: the stages are genuinely sequential, so number them 1 to 7. Do not number anything else in the product.
- Accessibility: `role="list"`, `aria-current="step"` on the active node, and a visually hidden "Stage 3 of 7, AI interview, in progress".

### Ledger record

New component, `components/LedgerRecord.jsx`.

```
┌────────────────────────────────────────────────┐
│  JOB-0042  ⟷  STU-0007          14 May 2026    │
│  Junior Data Engineer · DataTech Kft.       ★  │
└────────────────────────────────────────────────┘
```

Mono for the IDs and date, Inter `--fs-sm` for the role line, gold star only if the job was faculty verified. Hairline `--border-hair` divider between consecutive records. Rows never hover or link on the public page. They are records, not controls.

### Job card

Company logo 40px squircle, role title `--fs-lg` 600, company name `--fs-sm` `--text-2`, then a chip row (work mode, job type, location, salary if set). `JOB-0042` mono tag top right at `--text-3`. Faculty-verified card gets a 1px `--seal` top border, 2px inset, and the gold star badge. That top rule is the only place gold touches a card.

### Stat

Number in mono, `--fs-3xl`, 600, tabular. Label below in `--fs-sm` `--text-2`. Counters animate from 0 over 1200ms with `--ease-out`, once, when scrolled into view, and only if motion is allowed. If `/api/stats` fails, render the last known value or hide the block. Never render a spinning zero.

### Nav

Transparent over the hero, then on scroll past 24px it becomes `.glass` with `--shadow-2` and a `--border-hair` bottom edge, transitioning over `--d-base`. Height 68px desktop, 60px mobile. Active route gets `--brand` text plus a 2px underline that slides between items over `--d-fast`. Mobile is a full-height sheet sliding from the right, with focus trapped and Escape closing it.

Keep everything already built: role-aware items, notification bell with unread badge, EN/HU/FR switcher, account dropdown from `menuConfig.js`.

### Empty, loading, error

- **Empty:** an empty ruled register block, a heading naming what is missing, one sentence on how to fill it, and one primary action. "No applications yet. Find a role for your faculty and apply, and it will show up here." Never an illustration of a person shrugging.
- **Loading:** skeletons matching the real layout's dimensions, `--n-100` with a 1.2s shimmer. No spinners except inside buttons.
- **Error:** state what failed and what to do. "Could not load open roles. Check your connection and try again." Then a retry button. No apology, no exclamation mark. The existing `ErrorBoundary` gets the same treatment.
- **404:** a ledger record with a null ID, `JOB-????  ⟷  ---`, and the line "That record does not exist." Then links home and to the job list. This is the one place to be a little clever, and it stays on-concept.

---

## 8. Landing page

Rebuild `client/src/pages/Landing.jsx`. Keep the live `/api/stats` fetch, keep every string in `i18n.jsx`.

### Structure

```
┌──────────────────────────────────────────────────────────┐
│  NAV (transparent over hero)                             │
├──────────────────────────────────────────────────────────┤
│  HERO                                                    │
│  eyebrow: UNIVERSITY OF DEBRECEN · PILOT                 │
│  h1: Every internship here is real.                      │
│  lead + two CTAs        │  LEDGER PANEL (glass, floats)  │
│                         │  records writing in, one by one│
│  ambient mesh behind, gold hairline at section base      │
├──────────────────────────────────────────────────────────┤
│  THE PROBLEM      three cards, ghost job taxonomy        │
├──────────────────────────────────────────────────────────┤
│  THE TRUST CHAIN  faculty → company → posting → student  │
├──────────────────────────────────────────────────────────┤
│  HOW HIRING WORKS the 7-stage Chain, numbered            │
├──────────────────────────────────────────────────────────┤
│  TWO AUDIENCES    students left, companies right         │
├──────────────────────────────────────────────────────────┤
│  THE LEDGER       .ruled texture, real records, stats    │
├──────────────────────────────────────────────────────────┤
│  PARTNERS         monochrome logo strip, gold hairline   │
├──────────────────────────────────────────────────────────┤
│  TESTIMONIAL      one, with a real name and faculty      │
├──────────────────────────────────────────────────────────┤
│  FAQ              six items, accordion                   │
├──────────────────────────────────────────────────────────┤
│  CTA              --blue-800 fill, mesh, single action   │
├──────────────────────────────────────────────────────────┤
│  FOOTER                                                  │
└──────────────────────────────────────────────────────────┘
```

### Hero

The brief asks the hero to communicate "every internship opportunity is real". The way to do that is not to assert it in bigger type. It is to **show the receipts in the hero itself**.

The right panel is a glass ledger card that writes in four recent hire records, one every 400ms, mono, each with its date and its gold star if faculty verified. Under them, a single mono line: `12 hires recorded · 0 postings unaccounted for`. It is the product's own database used as the hero image, and no competitor can copy it because no competitor has the ledger.

Copy:

- Eyebrow: `UNIVERSITY OF DEBRECEN · PILOT`
- h1: **Every internship here is real.**
- Lead: "Companies commit to hiring before they can post. The university verifies who you are. When someone is hired, it goes on the record and the posting comes down."
- Primary CTA: "Find a role" → `/auth`
- Secondary CTA: "Post an opening" → `/auth`
- Below CTAs, `--fs-sm` `--text-3`: "Free for students. Sign up with your unideb.hu email."

Fallback if stats fail: render four seeded example records with a small "example" label. Never an empty hero.

### The problem

Three cards, and the copy should be specific enough to sting: roles already filled internally, roles posted to look like the company is growing, roles kept open to farm CVs. One line each. Then a single closing line: "You cannot tell which is which from the outside. That is the whole problem."

### Trust chain

Four nodes. Under each, what is actually checked:

1. **Faculty coordinator.** Negotiates the partnership with company leadership directly.
2. **Company.** Reviewed by a platform admin before it can post anything.
3. **Posting.** Exists only because the company committed to hire from it.
4. **Student.** Verified once by the university against an official email.

### How hiring works

The seven stages, numbered, with the honest framing underneath: "Everyone goes through the same pipeline with the same bar. The skill test does not care who you know."

### Two audiences

Left, students: verified once, see only roles open to your university, take the test, track every stage, know where you stand. Right, companies: candidates verified before they reach you, structured scoring at every stage, no CV pile.

### Ledger

`.ruled` background. Explain the mechanism in two sentences, then show real `LedgerRecord` rows, then the three stats from `/api/stats`. Close with the line that makes the point: "When a posting is filled, it comes down. That is why the list is short."

### FAQ

Who can join, what verification involves, what the gold star means, what it costs, whether other universities are coming, what happens to your data. Accordion, one open at a time, `<button aria-expanded>` driving a `<div role="region">`. Answers are two sentences, not paragraphs.

### CTA and footer

`--blue-800` fill with the mesh at low opacity, one heading, one primary button in white with `--blue-800` text. Keep the existing three-column footer and the eight social glyphs pointing at `/coming-soon`.

---

## 9. Accessibility

Non-negotiable, and easy to verify.

- WCAG 2.2 AA. 4.5:1 for text under 24px, 3:1 for large text and UI boundaries.
- Every interactive element reachable by keyboard in a logical order, with a visible `--focus-ring`. Never `outline: none` without a replacement.
- A "Skip to content" link, first in tab order, revealed on focus.
- Targets 44x44 minimum on touch. Chips and icon buttons need padding to reach it even when the glyph is 20px.
- One `<h1>` per page. Never skip a heading level for styling.
- Every icon-only button carries an `aria-label`. Every decorative SVG carries `aria-hidden="true"`.
- Live regions on the notification bell count and on stage changes, so a screen reader announces advancement.
- Modals trap focus, close on Escape, and return focus to the trigger.
- `prefers-reduced-motion` removes all transitions, the counter animation, and the hero sequence. The hero must still show all four records, immediately, with no motion.
- Test at 200% browser zoom and at 320px width. No horizontal scroll at either.
- Run axe DevTools on `/`, `/auth`, `/student`, `/jobs/:id`, `/my-applications`, `/company`. Zero criticals before a task is done.

---

## 10. Dark mode

`data-theme` on `<html>`, three states: `light`, `dark`, `system`. Persist the choice in `localStorage` under `linkwork-theme`. Read it in a small inline script in `client/index.html` **before** React mounts, otherwise the page flashes light on every load.

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

Dark mode notes that matter:

- `--blue-700` is unreadable on a dark canvas. In dark, `--brand` becomes `--blue-400`. `tokens.css` already handles this, but check any hard-coded blue in existing CSS.
- Gold moves to `--gold-300` so the seal does not vanish.
- Shadows become neutral black in dark. Blue-tinted shadows are invisible there.
- Surfaces get lighter as they get closer, never darker. `--bg-canvas` → `--surface` → `--surface-alt`.
- Dial back `.mesh` opacity by roughly a third in dark or it blooms.

Put the toggle in the account dropdown from `menuConfig.js`, available signed out too.

---

## 11. Implementation plan

Work in order. Each task is one commit.

### Task 1: Fonts and token layer

**Files:** `client/index.html`, `client/src/styles.css`

Replace the Work Sans link with preconnect plus Plus Jakarta Sans (700, 800), Inter (400, 500, 600), IBM Plex Mono (400, 500), all `display=swap`. Add the anti-flash theme script from §10. Replace the token block at the top of `styles.css` with the entire contents of `tokens.css`, keeping the legacy alias block.

**Done when:** the app builds, every page still renders without layout breakage, and the only visible change is that greens have become blues and type has changed. Nothing should be unstyled.

### Task 2: Colour audit

**Files:** `client/src/styles.css`

Find every hard-coded hex in the stylesheet and replace it with a token. Then find every use of the old `--verify` green and decide, per use: primary action (blue) or status (green). Buttons and links go blue. Verified and passed states go `--success-500`.

**Done when:** `grep -E '#[0-9a-fA-F]{3,6}' client/src/styles.css` returns only the token definitions.

### Task 3: Logo

**Files:** `client/src/components/LinkMark.jsx`, `client/public/`

Drop in the SVG from §3. Add the `sealed` prop. Generate favicon 16/32/180 plus SVG. Add the draw-in animation, gated on `prefers-reduced-motion`.

**Done when:** the mark renders correctly at 16, 24, 40 and 96px, in light and dark, and the animation runs once on load and not on route changes.

### Task 4: Core components

**Files:** `components/Button.jsx`, `Card.jsx`, `Badge.jsx`, `Field.jsx`

Apply §7. Add the loading state to Button and the error state to Field.

**Done when:** every variant and state renders correctly in both themes, and keyboard focus is visible on all of them.

### Task 5: Chain

**Files:** `components/Chain.jsx`, `stages.js`

Apply §7. Add the connector fill animation, numbering, and the full ARIA treatment.

**Done when:** all seven stages render, the current stage is visually and programmatically identifiable, a rejected application turns the track red from the right node onward, and it stacks vertically below 640px.

### Task 6: LedgerRecord and Job card

**Files:** new `components/LedgerRecord.jsx`, plus the job card markup wherever it currently lives

Apply §7. The faculty-verified gold top rule goes on the job card here.

**Done when:** a verified and an unverified card sit side by side and the difference is obvious without reading the badge text.

### Task 7: Nav, footer, theme toggle

**Files:** `client/src/App.jsx`, `menuConfig.js`, `styles.css`

Scroll-triggered glass nav, sliding active underline, mobile sheet with focus trap. Theme toggle in the account dropdown, wired to `localStorage`.

**Done when:** the nav transitions cleanly on scroll, the mobile sheet traps focus and closes on Escape, and the theme survives a hard reload with no flash.

### Task 8: Landing page

**Files:** `client/src/pages/Landing.jsx`, `client/src/i18n.jsx`, `styles.css`

Rebuild per §8. Every string added to `i18n.jsx` with `en`, `hu`, `fr`. Keep the `/api/stats` fetch and add the failure fallback.

**Done when:** all eleven sections render, the hero ledger sequence runs once, stats animate on scroll into view, the page works with the API returning a 500, and `hu` and `fr` are fully translated with no layout break.

### Task 9: States

**Files:** `pages/`, `components/ErrorBoundary.jsx`, `pages/ComingSoon.jsx`

Empty, loading, error and 404 per §7.

**Done when:** every list view has a designed empty state, no spinner appears outside a button, and the 404 renders the null ledger record.

### Task 10: Accessibility and QA pass

Work §9 top to bottom. Then:

- [ ] Chrome, Firefox, Safari, plus iOS Safari and Android Chrome
- [ ] 320, 375, 768, 1024, 1440, 1920
- [ ] Light and dark on every page
- [ ] EN, HU, FR on every page
- [ ] 200% zoom, no horizontal scroll
- [ ] `prefers-reduced-motion` on, nothing moves, everything is still readable
- [ ] Keyboard only, every flow completable including apply and the skill test
- [ ] axe DevTools clean on the six key routes
- [ ] Lighthouse: performance 90+, accessibility 100
- [ ] The four seeded demo accounts still sign in and reach their dashboards

---

## 12. Do not

- Do not add Tailwind, Next.js, shadcn/ui, styled-components, or a component library. The brief suggests them, but they are wrong for a working React 18 + Vite app with a hand-written stylesheet, and a rewrite is not a rebrand.
- Do not use gold as a fill, a heading colour, or a background.
- Do not put glass on more than the nav, the hero panel, and modal backdrops.
- Do not animate anything except transform and opacity.
- Do not add stock illustrations or 3D renders. The ledger is the illustration.
- Do not use Title Case.
- Do not hard-code English on the homepage.
- Do not touch `server/`.

---

## 13. Two things to fix while you are in there

Neither is branding, both are one-line risks flagged in your own PROJECT.md §9.

1. `server/anthropic.js` pins model `claude-opus-4-8`. That is a valid, current ID (Claude Opus 4.8), so nothing is broken — but `claude-opus-5` is the newer model in the same tier, worth switching to whenever the scorer is actually enabled.
2. `viewer@linkwork.test` is recreated with `can_view_all_applicants` on **every boot**. If you demo from a deployed instance for DEIK.AI, that account exists on it, and it can read every application from every company. Gate the creation behind `NODE_ENV !== 'production'` before anything goes public.
