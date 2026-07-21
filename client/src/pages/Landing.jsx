import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';

function Icon({ d }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
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
            <h1>No ghost jobs. Just <em>real</em> roles, <em>real</em> hires.</h1>
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

      <HowItWorks />

      {stats?.companies?.length > 0 && (
        <section className="company-showcase">
          <div className="container">
            <h2>Companies hiring on LinkWork</h2>
            <div className="showcase-row">
              {stats.companies.map(c => (
                <Link to={user ? '/companies' : '/auth'} key={c.name} className="showcase-item">
                  <span className="company-mono">{c.name.charAt(0).toUpperCase()}</span>
                  <span>{c.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TODO: hero image section — content pending user description */}
    </>
  );
}
