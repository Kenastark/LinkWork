# LinkWork

**Every posting here is real.** A faculty-verified internship and entry-level hiring platform, piloting at the University of Debrecen.

Regular job boards are full of ghost jobs — roles already filled internally, or posted only for appearances. LinkWork only lists openings that companies have **committed to filling from the platform**, most of them negotiated bilaterally between faculty coordinators and company leadership. When a hire happens, the job ID and candidate ID are matched on a public ledger and the posting is taken down — proof the job was real.

## How it works

```
Faculty coordinator ⟷ Company ⟷ Posting ⟷ Verified student
```

1. **Companies** register with a work email and are reviewed by the platform admin before they can post. Posting = committing to hire from LinkWork. Faculty-negotiated openings carry a gold **★ Faculty partnership** badge.
2. **Students** register with their official university email (e.g. `@mailbox.unideb.hu`), submit student documents, and get identity-verified once by the admin.
3. **Applying starts the chain:** skill test based on the student's major (60% pass bar) → structured AI interview → company test → HR interview → technical interview → **hired**.
4. **On hire**, a match record `JOB-XXXX ⟷ STU-XXXX` is written to the ledger. When all positions are filled, the posting closes automatically.

Students only see openings for their own university. Same test, same bar, for everyone — it doesn't matter who you know.

## Run it

```bash
npm install
npm --prefix client install
npm run dev        # server on :3001, client on :5173 (proxied)
# or production-style:
npm start          # builds client, serves everything on :3001
```

### Demo accounts (seeded)

| Role    | Email                             | Password     |
|---------|-----------------------------------|--------------|
| Student | demo.student@mailbox.unideb.hu    | student1234  |
| Company | hr@datatech.hu                    | company1234  |
| Admin   | admin@linkwork.app                | admin1234    |

Delete `server/linkwork.db` to reset and reseed.

## Stack

- **Server:** Node + Express, SQLite (better-sqlite3), session auth, bcrypt
- **Client:** React 18 + Vite + React Router, custom design system (no UI framework)
- **Design:** deep navy + verification green, University of Debrecen gold reserved for faculty-partnership badges; Bricolage Grotesque / Instrument Sans / IBM Plex Mono

## Push to GitHub

```bash
# create an empty repo named linkwork on github.com, then:
git remote add origin git@github.com:<your-username>/linkwork.git
git push -u origin main
```

## Roadmap

- [ ] Real file upload for student documents (currently a submit/verify status flow)
- [ ] AI-scored interviews via the Anthropic API (answers are currently recorded for company review)
- [ ] Email verification links + notifications at each pipeline stage
- [ ] Faculty coordinator role: propose/endorse partnerships in-app instead of only offline
- [ ] Public (read-only) match ledger page for transparency
- [ ] Multi-university support UI (schema already supports it)
- [ ] Larger skill-question banks per major, timed tests, anti-cheating measures
- [ ] Company-side test builder for the "company test" stage
