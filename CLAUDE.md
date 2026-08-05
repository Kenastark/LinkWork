# LinkWork

Faculty-verified internship and entry-level hiring platform. React 18 + Vite 6
client, Express 4 + SQLite server. Full architecture in PROJECT.md. Visual
design system in BRANDING.md, token layer in tokens.css.

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
  .hero, .meeting-stage and .btn.dark. Text uses migrate to `--text-1`;
  background and border uses stay. Dark mode cannot ship until this split is
  done (BRANDING.md task 2).
- Colour law: blue dominates. `var(--seal)` (#c89b3c) means faculty-verified and
  nothing else; after task 2 it resolves in exactly two rules. Warm decorative
  fills use --warm-100 / --warm-300 / --warm-fg, which are NOT the seal. Green
  means status only, never a button or a link. The `#fff` literals painted on
  dark plates are correct; leave them alone.
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
