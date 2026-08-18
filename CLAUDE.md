# LinkWork

Faculty-verified internship and entry-level hiring platform. React 18 + Vite 6
client, Express 4 + SQLite server. Full architecture in PROJECT.md. Visual
design system in BRANDING.md, token layer at the top of client/src/styles.css.

## Git workflow

- All rebrand work happens on the `rebrand` branch. Never commit to `main`.
- One commit per task, message format: `rebrand: task N, <name>`.
- Do not start a task without being asked, and do not commit until I have
  reviewed the diff.
- `server/linkwork.db`, `client/dist` and `node_modules` are gitignored. Never
  add them.

## Hard constraints

- Never introduce Next.js, Tailwind, shadcn/ui, styled-components, or any
  CSS-in-JS. The single hand-written client/src/styles.css plus CSS custom
  properties IS the design system.
- Never add a UI component library. The components in client/src/components/
  get restyled, never replaced with a dependency.
- Do not modify anything under server/ EXCEPT the single /api/ledger/recent
  route specified in BRANDING.md section 8. Ask before any other server change.
- Every user-facing string on the homepage goes through t() in
  client/src/i18n.jsx with en, hu AND fr entries. The homepage is currently
  100% translated; adding an untranslated section is a regression, not a
  partial win.
- `--ink` is BOTH heading text and the dark plate behind .nav, footer.site,
  .hero, .meeting-stage and .btn.dark. Text uses resolve to `--text-1`;
  background and border uses stay on `--ink`/`--surface-dark`. This split is
  done (BRANDING.md task 2) and dark mode is shipped (task 9): the resolver
  in client/index.html defaults to `'system'`, and `[data-theme="dark"]` in
  styles.css is live in both brands. Never reintroduce `var(--ink)` in a
  `color:` declaration — that is what would put body text back on a
  mismatched canvas.
- Colour law: blue dominates in the blue brand (green dominates in the green
  brand — see the brand toggle work). `var(--seal)` (#c89b3c in light,
  `--gold-300` in dark) means faculty-verified and nothing else, in both
  brands; it resolves in exactly three rules (`.badge.faculty`, `.btn.seal`,
  `.ledger-record .lr-seal`). Warm decorative
  fills use --warm-100 / --warm-300 / --warm-fg, which are NOT the seal. The
  status ramp (`--success-*`) means passed/verified/hired only, never a
  button or a link, in both brands — under the green brand this is enforced
  by a teal shift (`--success-700`/`--success-fill` become `#0f766e` light /
  `#4fd6c4` dark) so status doesn't read as the same colour as the green
  brand's own buttons and links. Never touch `--success-*` for the blue
  brand. The `#fff` literals painted on dark plates are correct; leave them
  alone.
- Sentence case everywhere, including buttons and headings.
- Animate only transform and opacity. Respect prefers-reduced-motion.
- client/src/styles.css is the single canonical token layer. tokens.css was a
  delivery artifact and is deleted in task 1; do not recreate it, do not @import
  anything, and never keep two copies of a token in sync by hand.
- `--brand-fg` is set inline per company in Landing.jsx:415. The :root value is
  a fallback. Do not "fix" it.

## Working agreement

- One task per session. Do not start the next task without being asked.
- Show me the plan before writing code.
- Run `npm run build` before declaring a task done.
- State how you verified each acceptance criterion. Never claim a build passes
  without running it.
- Tell me when BRANDING.md is wrong about this codebase. It was written by
  reading the source, but it will still be wrong somewhere.
