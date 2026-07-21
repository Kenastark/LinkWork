import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function FindInternship() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => { api.get('/api/jobs').then(d => setJobs(d.jobs)); }, []);

  return (
    <main className="container">
      <h2 style={{ fontSize: 30, marginBottom: 4 }}>Find an internship</h2>
      <p className="muted" style={{ marginBottom: 20 }}>Openings for your university ({jobs.length})</p>

      {jobs.length === 0 ? (
        <div className="card"><p className="muted">No open positions right now. Your faculty coordinators are negotiating new openings — check back soon.</p></div>
      ) : jobs.map(j => (
        <div className="card" key={j.id}>
          <div className="job-row">
            <div>
              <span className="id-tag">JOB-{String(j.id).padStart(4, '0')}</span>
              <h3><Link to={`/jobs/${j.id}`} style={{ color: 'inherit' }}>{j.title}</Link></h3>
              <p className="muted">{j.company_name} · {j.positions - j.filled} of {j.positions} position{j.positions > 1 ? 's' : ''} open</p>
              <div className="meta">
                {j.faculty_verified ? (
                  <span className="badge faculty">★ Faculty partnership · {j.faculty_name || 'University-wide'}</span>
                ) : (
                  <span className="badge verified">✓ Platform-committed hire</span>
                )}
                <span className="badge pending">{j.job_type === 'internship' ? 'Internship' : 'Entry level'}</span>
              </div>
            </div>
            <Link to={`/jobs/${j.id}`} className="btn sm">View & apply</Link>
          </div>
        </div>
      ))}
    </main>
  );
}
