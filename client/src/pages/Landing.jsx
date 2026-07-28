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

// Category icons — hand-drawn inline SVG (no external asset / flaticon dependency).
const FEATURE_ICONS = {
  track: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="2.4" /><circle cx="12" cy="12" r="2.4" /><circle cx="19" cy="12" r="2.4" opacity="0.5" />
    </svg>
  ),
  offers: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="4" y="12" width="4" height="7" rx="1.2" /><rect x="10" y="8" width="4" height="11" rx="1.2" /><rect x="16" y="4" width="4" height="15" rx="1.2" />
    </svg>
  ),
  transparent: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2c.6 4.1 2.3 5.8 6.4 6.4C14.3 9 12.6 10.7 12 14.8 11.4 10.7 9.7 9 5.6 8.4 9.7 7.8 11.4 6.1 12 2Z" />
      <path d="M19 3.5c.2 1.3.7 1.8 2 2-1.3.2-1.8.7-2 2-.2-1.3-.7-1.8-2-2 1.3-.2 1.8-.7 2-2Z" />
    </svg>
  ),
};
const CARD_ICONS = {
  doc: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h6" />
    </svg>
  ),
  bell: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  ),
};

function FeatureRow({ tone, icon, title, body, ctaTo, ctaLabel, art, reverse }) {
  return (
    <section className={`feature-row feature-${tone}${reverse ? ' reverse' : ''}`}>
      <div className="container feature-grid">
        <div className="feature-copy">
          <span className="feature-badge">{icon}</span>
          <h2>{title}</h2>
          <p>{body}</p>
          <Link to={ctaTo} className="btn secondary">{ctaLabel}</Link>
        </div>
        <div className="feature-art-wrap">{art}</div>
      </div>
    </section>
  );
}

// Product-preview mockups — real LinkWork content, echoing the reference's panel + card + floating tags.
const TrackArt = (
  <div className="feature-panel panel-purple">
    <div className="mock-card">
      <span className="mock-mono">JOB-0042</span>
      <h4>Software Engineering Intern</h4>
      <p>DataTech Hungary · Faculty of Informatics</p>
      <ul className="mock-track">
        <li className="done"><span className="dot" />Application received</li>
        <li className="done"><span className="dot" />Skill test passed</li>
        <li className="current"><span className="dot" />AI interview in review</li>
        <li><span className="dot" />Company review</li>
        <li><span className="dot" />Offer</li>
      </ul>
    </div>
    <span className="feature-tag tag-a">🔔 Application update</span>
  </div>
);
const OffersArt = (
  <div className="feature-panel panel-blue">
    <div className="mock-card">
      <span className="mock-mono">JOB-0037</span>
      <h4>Data Analyst Intern</h4>
      <p>Voltix Electronics · Debrecen</p>
      <div className="mock-tags">
        <span className="mock-chip strong">280K HUF / mo</span>
        <span className="mock-chip">Hybrid</span>
        <span className="mock-chip">Internship</span>
        <span className="mock-chip">6 months</span>
      </div>
    </div>
    <span className="feature-tag tag-b">💰 Salary shown upfront</span>
    <span className="feature-tag tag-c">🏠 Remote-friendly</span>
  </div>
);
const TransparentArt = (
  <div className="feature-panel panel-green">
    <div className="mock-card">
      <span className="mock-mono">GreenField AgroTech Zrt.</span>
      <h4 style={{ marginTop: 6 }}>What to expect</h4>
      <ul className="mock-facts">
        <li><b>★ Faculty-verified</b> partnership</li>
        <li><b>~3 days</b> average response time</li>
        <li><b>5 steps</b>, all shown before you apply</li>
      </ul>
      <div className="mock-tags">
        <span className="mock-chip">Mentorship</span>
        <span className="mock-chip">Paid</span>
      </div>
    </div>
    <span className="feature-tag tag-a">✓ Committed to hire</span>
  </div>
);

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

      <FeatureRow
        tone="purple"
        reverse
        icon={FEATURE_ICONS.track}
        title="Track your application"
        body="Finally, real-time, step-by-step visibility. Apply now, and you'll be notified as soon as we have any updates on the progress of your application!"
        ctaTo={user ? '/my-applications' : '/auth?mode=student'}
        ctaLabel="View my applications"
        art={TrackArt}
      />

      <FeatureRow
        tone="blue"
        icon={FEATURE_ICONS.offers}
        title="Offers that hide nothing"
        body="Salary, remote work… Don't go into the unknown when choosing your future job."
        ctaTo={user ? '/student' : '/auth?mode=student'}
        ctaLabel="Find an internship"
        art={OffersArt}
      />

      <FeatureRow
        tone="green"
        reverse
        icon={FEATURE_ICONS.transparent}
        title="Transparent companies"
        body="Recruitment process, response time, benefits… You deserve real answers, not to waste time."
        ctaTo={user ? '/companies' : '/auth'}
        ctaLabel="View companies"
        art={TransparentArt}
      />

      <section className="land-job">
        <div className="container">
          <h2 className="land-title">Prepare to <em>Land your job!</em></h2>
          <div className="land-grid">
            <div className="land-card stat land-lav">
              <b>{stats ? stats.open_jobs : '—'}</b>
              <p>Verified roles are open right now — <b>be the next hire.</b></p>
            </div>
            <div className="land-card action land-peri">
              <div className="land-card-top">
                <h4>Make yourself visible to companies</h4>
                <span className="land-ic">{CARD_ICONS.doc}</span>
              </div>
              <Link to={user ? '/profile' : '/auth?mode=student'} className="btn dark">Upload my CV</Link>
            </div>
            <div className="land-card stat land-cream">
              <b>{stats ? stats.approved_companies : '—'}</b>
              <p>Companies are committed to hiring here. <b>Want the roles that match your major?</b></p>
            </div>
            <div className="land-card action land-coral">
              <div className="land-card-top">
                <h4>Be alerted quickly</h4>
                <span className="land-ic">{CARD_ICONS.bell}</span>
              </div>
              <Link to={user ? '/alerts' : '/auth?mode=student'} className="btn dark">Create my alert</Link>
            </div>
          </div>
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
