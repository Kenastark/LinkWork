import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';

const BRAND_PALETTE = [
  { bg: '#e3f3ec', fg: '#147d5b' }, // verify
  { bg: '#fbf3dd', fg: '#7c5a00' }, // gold
  { bg: '#e6ecf7', fg: '#2b4a8c' }, // blue
  { bg: '#f3e8f5', fg: '#7a3d8c' }, // plum
  { bg: '#fbe9e2', fg: '#a24a2b' }, // terracotta
  { bg: '#e4f0f0', fg: '#1c6b6b' }, // teal
];
function brandColors(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return BRAND_PALETTE[hash % BRAND_PALETTE.length];
}

function Icon({ d }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function MatchIllustration() {
  return (
    <svg viewBox="0 0 380 340" width="100%" style={{ display: 'block' }} role="img" aria-label="Illustration of matched job cards">
      <defs>
        <linearGradient id="blob1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--verify-tint)" />
          <stop offset="100%" stopColor="var(--gold-tint)" />
        </linearGradient>
        <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--verify-bright)" />
          <stop offset="100%" stopColor="var(--verify)" />
        </linearGradient>
      </defs>
      <ellipse cx="190" cy="175" rx="175" ry="150" fill="url(#blob1)" />
      <g transform="translate(60,190) rotate(-8)">
        <rect width="220" height="110" rx="18" fill="#fff" stroke="var(--line)" strokeWidth="1.5" />
        <rect x="20" y="20" width="90" height="12" rx="6" fill="var(--line)" />
        <rect x="20" y="42" width="140" height="9" rx="4.5" fill="var(--line)" />
        <rect x="20" y="60" width="110" height="9" rx="4.5" fill="var(--line)" />
        <rect x="20" y="82" width="64" height="16" rx="8" fill="var(--gold-tint)" />
      </g>
      <g transform="translate(90,60) rotate(6)">
        <rect width="220" height="120" rx="18" fill="url(#cardGrad)" />
        <rect x="20" y="22" width="110" height="13" rx="6.5" fill="rgba(255,255,255,.85)" />
        <rect x="20" y="46" width="150" height="9" rx="4.5" fill="rgba(255,255,255,.5)" />
        <rect x="20" y="64" width="70" height="18" rx="9" fill="rgba(255,255,255,.28)" />
        <rect x="98" y="64" width="60" height="18" rx="9" fill="rgba(255,255,255,.28)" />
        <rect x="20" y="90" width="80" height="18" rx="9" fill="#fff" />
      </g>
      <circle cx="300" cy="240" r="26" fill="var(--gold)" opacity="0.9" />
      <circle cx="300" cy="240" r="26" fill="none" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

const HOW_STEPS = [
  { icon: '1', title: 'Verify who you are', body: 'Sign up with your university email, submit your student documents, and get verified once — then apply to anything.' },
  { icon: '2', title: 'Prove what you know', body: 'A skill test based on your major and a structured interview qualify you before the company ever sees your file. Same test, same bar, for everyone.' },
  { icon: '3', title: 'The hire goes on the ledger', body: 'When a company hires, the job ID and candidate ID are matched publicly and the posting is taken down. Proof the job was real.' },
];

function HowItWorks() {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') { setRevealed(true); return; }
    const el = ref.current;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setRevealed(true); observer.disconnect(); }
    }, { threshold: 0.2 });
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="how">
      <div className="container">
        <span className="eyebrow">The chain</span>
        <h2>How it works</h2>
        <p className="sub">
          It shouldn't matter whether you know someone inside the company. On LinkWork, everyone
          walks the same chain — and when a posting closes, the hire is recorded openly.
        </p>
        <div className={`how-flow${revealed ? ' revealed' : ''}`} ref={ref}>
          {HOW_STEPS.map(s => (
            <div className="how-step" key={s.icon}>
              <div className="how-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => { api.get('/api/stats').then(setStats).catch(() => {}); }, []);

  return (
    <>
      <section className="hero">
        <div className="container">
          <div>
            <div className="eyebrow">University of Debrecen · Pilot</div>
            <h1>Real companies. Open roles. <em>Actual hires.</em></h1>
            <p className="lede">
              LinkWork only lists internships and entry-level roles that companies have committed to
              filling — most of them negotiated directly with your faculty. No fake listings, no
              pre-filled positions. If you see it here, someone is getting hired for it.
            </p>
            <div className="cta-row">
              {user ? (
                <>
                  <Link to="/student" className="btn">Find an internship</Link>
                  <Link to="/companies" className="btn secondary" style={{ borderColor: '#fff', color: '#fff' }}>Explore companies</Link>
                </>
              ) : (
                <>
                  <Link to="/auth?mode=student" className="btn">Join with your university email</Link>
                  <Link to="/auth?mode=company" className="btn secondary" style={{ borderColor: '#fff', color: '#fff' }}>Hire students</Link>
                </>
              )}
            </div>
          </div>

          <div className="hero-chain" aria-label="How verification flows">
            <div className="hnode">
              <div className="hicon"><Icon d="M12 3 2 8l10 5 10-5-10-5Zm-6 7.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5" /></div>
              <div><b>Faculty</b><span>Your coordinator negotiates real openings with companies</span></div>
            </div>
            <div className="hlink" />
            <div className="hnode">
              <div className="hicon"><Icon d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" /></div>
              <div><b>Company</b><span>Commits to hiring from LinkWork — verified by the admin</span></div>
            </div>
            <div className="hlink" />
            <div className="hnode">
              <div className="hicon"><Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /></div>
              <div><b>You</b><span>Verified profile, merit-based tests, and a real shot at the role</span></div>
            </div>
          </div>
        </div>
      </section>

      {stats && (
        <div className="container">
          <div className="overlap-band">
            <div className="stat"><b>{stats.open_jobs}</b><span>Verified postings open right now</span></div>
            <div className="stat"><b>{stats.hires}</b><span>Students hired through the chain</span></div>
            <div className="stat"><b>{stats.approved_companies}</b><span>Companies committed to hiring here</span></div>
          </div>
        </div>
      )}

      <section className="match-pitch">
        <div className="container match-pitch-grid">
          <div>
            <span className="eyebrow" style={{ color: 'var(--verify)' }}>Built for students, not recruiters</span>
            <h2>Finally, a job search that works for you.</h2>
            <h3 style={{ marginTop: 18, fontSize: 22 }}>Looking for the right role?</h3>
            <p className="muted" style={{ marginTop: 10, fontSize: 16.5, maxWidth: '46ch' }}>
              Every posting on LinkWork is scoped to your university and, often, your faculty — so you're
              only ever looking at roles you're actually eligible for. A skill test based on your major and
              a structured interview qualify you before a company ever opens your file. No cover-letter
              guessing games, no ghost listings — just real openings matched to what you're studying.
            </p>
            <Link to={user ? '/student' : '/auth?mode=student'} className="btn" style={{ marginTop: 22 }}>
              {user ? 'Browse openings' : 'Get started'}
            </Link>
          </div>
          <div className="match-pitch-art"><MatchIllustration /></div>
        </div>
      </section>

      <HowItWorks />

      {/* Illustrative placeholder testimonials — replace with real student quotes before public launch. */}
      <section className="testimonials">
        <div className="container testimonials-grid">
          <div className="testimonials-photo">
            <img src="/images/students-testimonial.jpg" alt="A multicultural group of students studying together" />
          </div>
          <div>
            <span className="eyebrow" style={{ color: 'var(--verify)' }}>From the chain</span>
            <h2 style={{ fontSize: 32, marginBottom: 24 }}>Students are already in the chain.</h2>
            <div className="notes-grid">
              <div className="note note-tint-a">
                <p>"I didn't have to wonder if the internship was already filled before I even applied. Applied, tested, hired — no guessing games."</p>
                <span>— Computer Science student</span>
              </div>
              <div className="note note-stat">
                <b>{stats ? stats.open_jobs : '—'}</b>
                <span>Verified postings open right now</span>
              </div>
              <div className="note note-stat note-tint-b">
                <b>{stats ? stats.approved_companies : '—'}</b>
                <span>Companies committed to hiring here</span>
              </div>
              <div className="note note-tint-c">
                <p>"The skill test gave me a real shot without needing an inside connection at the company."</p>
                <span>— Business Administration student</span>
              </div>
              <div className="note note-stat note-tint-a" style={{ gridColumn: 'span 2' }}>
                <b>100%</b>
                <span>Faculty-verified process — same test, same bar, for everyone</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {stats?.companies?.length > 0 && (
        <section className="company-showcase">
          <div className="container">
            <span className="eyebrow" style={{ color: 'var(--verify)' }}>Trusted employers</span>
            <h2>Companies hiring on LinkWork</h2>
            <div className="showcase-grid">
              {stats.companies.map(c => {
                const colors = brandColors(c.name);
                return (
                  <Link to={user ? '/companies' : '/auth'} key={c.name} className="showcase-card" style={{ '--brand-bg': colors.bg, '--brand-fg': colors.fg }}>
                    <span className="showcase-mono">{c.name.charAt(0).toUpperCase()}</span>
                    <span className="showcase-wordmark">{c.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* TODO: hero image section — content pending user description */}
    </>
  );
}
