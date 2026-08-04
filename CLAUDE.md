# LinkWork

Faculty-verified internship and entry-level hiring platform. React 18 + Vite 6
client, Express 4 + SQLite server. Full architecture in PROJECT.md. Visual
design system in BRANDING.md, token layer in tokens.css.

## Hard constraints

- Never introduce Next.js, Tailwind, shadcn/ui, styled-components, or any
  CSS-in-JS. The single hand-written client/src/styles.css plus CSS custom
  properties IS the design system.
- Never add a UI component library. The components in client/src/components/
  get restyled, never replaced with a dependency.
- Never modify anything under server/. Client-side work only unless I say
  otherwise.
- Every user-facing string on the homepage goes through t() in
  client/src/i18n.jsx with en, hu AND fr entries. Hard-coding English
  silently breaks two languages.
- Colour law: blue dominates, gold (#c89b3c) is a verification seal only and
  never a fill or heading colour, green means status only and never a button
  or link.
- Sentence case everywhere, including buttons and headings.
- Animate only transform and opacity. Respect prefers-reduced-motion.
- Keep tokens.css in the repo root as the reference source of truth. Do not
  @import it and do not move it into client/src/.

## Working agreement

- One task per session. Do not start the next task without being asked.
- Show me the plan before writing code.
- Run `npm run build` before declaring a task done.
