import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import Chain from '../components/Chain.jsx';

export default function MyApplications() {
  const { user } = useAuth();
  const [apps, setApps] = useState([]);

  useEffect(() => { api.get('/api/my-applications').then(d => setApps(d.applications)); }, []);

  return (
    <main className="container">
      <h2 style={{ fontSize: 30, marginBottom: 20 }}>My applications ({apps.length})</h2>

      {apps.length === 0 ? (
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
      ))}
    </main>
  );
}
