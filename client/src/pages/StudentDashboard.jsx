import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import Chain from '../components/Chain.jsx';

export default function StudentDashboard() {
  const { user, setUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [tab, setTab] = useState('openings');
  const [msg, setMsg] = useState('');

  const load = () => {
    api.get('/api/jobs').then(d => setJobs(d.jobs));
    api.get('/api/my-applications').then(d => setApps(d.applications));
  };
  useEffect(load, []);

  const submitDocs = async () => {
    await api.post('/api/student/submit-docs', { note: 'Student ID and enrollment certificate submitted' });
    const me = await api.get('/api/auth/me');
    setUser(me.user);
    setMsg('Documents submitted. The admin will verify them shortly — you can apply once verified.');
  };

  return (
    <main className="container">
      <h2 style={{ fontSize: 30, marginBottom: 4 }}>Hello, {user.name.split(' ')[0]}</h2>
      <p className="muted" style={{ marginBottom: 20 }}>
        <span className="id-tag">STU-{String(user.id).padStart(4, '0')}</span> · {user.major} · University of Debrecen
      </p>

      {msg && <div className="alert ok">{msg}</div>}

      {user.doc_status === 'none' && (
        <div className="alert info">
          <b>One step before you can apply:</b> submit your student documents (student ID + enrollment certificate) so the admin can verify your identity.{' '}
          <button className="btn sm" style={{ marginLeft: 8 }} onClick={submitDocs}>Submit documents</button>
        </div>
      )}
      {user.doc_status === 'submitted' && <div className="alert info">Your documents are under review. You can browse openings meanwhile.</div>}
      {user.doc_status === 'rejected' && <div className="alert error">Your documents were rejected. <button className="btn sm danger" style={{ marginLeft: 8 }} onClick={submitDocs}>Resubmit</button></div>}
      {user.doc_status === 'verified' && <div className="alert ok">Identity verified <span className="badge verified">✓ Verified student</span></div>}

      <div className="tabs">
        <button className={tab === 'openings' ? 'active' : ''} onClick={() => setTab('openings')}>Openings for your university ({jobs.length})</button>
        <button className={tab === 'apps' ? 'active' : ''} onClick={() => setTab('apps')}>My applications ({apps.length})</button>
      </div>

      {tab === 'openings' && (
        jobs.length === 0 ? (
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
        ))
      )}

      {tab === 'apps' && (
        apps.length === 0 ? (
          <div className="card"><p className="muted">You haven't applied to anything yet. Every opening you see is real — pick one and start the chain.</p></div>
        ) : apps.map(a => (
          <div className="card" key={a.id}>
            <span className="id-tag">JOB-{String(a.job_id).padStart(4, '0')}</span>
            <h3>{a.title}</h3>
            <p className="muted">{a.company_name}{a.skill_score != null ? ` · Skill test: ${a.skill_score}%` : ''}</p>
            <Chain stage={a.stage} />
            {!['hired', 'rejected'].includes(a.stage) && ['skill_test', 'ai_interview'].includes(a.stage) && (
              <Link to={`/jobs/${a.job_id}`} className="btn sm">Continue → {a.stage === 'skill_test' ? 'Take the skill test' : 'AI interview'}</Link>
            )}
            {a.stage === 'hired' && <span className="badge verified">✓ Hired — congratulations! Match recorded: JOB-{String(a.job_id).padStart(4, '0')} ⟷ STU-{String(user.id).padStart(4, '0')}</span>}
          </div>
        ))
      )}
    </main>
  );
}
