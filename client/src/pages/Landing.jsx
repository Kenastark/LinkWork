import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

function Icon({ d }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default function Landing() {
  const [stats, setStats] = useState(null);

  useEffect(() => { api.get('/api/stats').then(setStats).catch(() => {}); }, []);

  return (
    <>
      <section className="hero">
        <div className="container">
          <div>
            <div className="eyebrow">University of Debrecen · Pilot</div>
            <h1>Every posting here is <em>real</em>.</h1>
            <p className="lede">
              LinkWork lists only internships and entry-level roles that companies have committed to
              filling from this platform — most of them negotiated directly with your faculty.
              No ghost jobs. No pre-filled positions. If you see it, someone will be hired for it.
            </p>
            <div className="cta-row">
              <Link to="/auth?mode=student" className="btn">Join with your university email</Link>
              <Link to="/auth?mode=company" className="btn secondary" style={{ borderColor: '#fff', color: '#fff' }}>Hire students</Link>
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

      <section className="how">
        <div className="container">
          <h2>Merit, on the record</h2>
          <p className="sub">
            It shouldn't matter whether you know someone inside the company. On LinkWork, everyone
            walks the same chain — and when a posting closes, the hire is recorded openly.
          </p>
          <div className="grid cols-3">
            <div className="card">
              <span className="id-tag">STEP 01</span>
              <h3>Verify who you are</h3>
              <p className="muted">Sign up with your university email, submit your student documents, and get verified once — then apply to anything.</p>
            </div>
            <div className="card">
              <span className="id-tag">STEP 02</span>
              <h3>Prove what you know</h3>
              <p className="muted">A skill test based on your major and a structured interview qualify you before the company ever sees your file. Same test, same bar, for everyone.</p>
            </div>
            <div className="card">
              <span className="id-tag">STEP 03</span>
              <h3>The hire goes on the ledger</h3>
              <p className="muted">When a company hires, the job ID and candidate ID are matched publicly and the posting is taken down. Proof the job was real.</p>
            </div>
          </div>
        </div>
      </section>

      {stats && (
        <section className="trust-stats">
          <div className="container">
            <h2>Proof, not promises</h2>
            <div className="grid cols-3">
              <div className="stat-tile"><b>{stats.open_jobs}</b><span>Verified postings open right now</span></div>
              <div className="stat-tile"><b>{stats.hires}</b><span>Students hired through the chain</span></div>
              <div className="stat-tile"><b>{stats.approved_companies}</b><span>Companies committed to hiring here</span></div>
            </div>
          </div>
        </section>
      )}

      {stats?.companies?.length > 0 && (
        <section className="company-showcase">
          <div className="container">
            <h2>Companies hiring on LinkWork</h2>
            <div className="showcase-row">
              {stats.companies.map(c => (
                <Link to="/auth" key={c.name} className="showcase-item">
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
