import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import Chain from '../components/Chain.jsx';
import { formatSlot, KIND_LABEL } from '../stages.js';

// Student-side interview block: shows proposed slots to pick from, or the
// scheduled time + a Join button once a slot has been chosen.
function InterviewBlock({ applicationId }) {
  const [interviews, setInterviews] = useState([]);
  const [err, setErr] = useState('');

  const load = () => api.get(`/api/applications/${applicationId}/interviews`).then(d => setInterviews(d.interviews)).catch(() => {});
  useEffect(() => { load(); }, [applicationId]);

  const pick = async (ivId, slotId) => {
    setErr('');
    try { await api.post(`/api/interviews/${ivId}/pick-slot`, { slot_id: slotId }); load(); }
    catch (e) { setErr(e.message); }
  };

  if (interviews.length === 0) return null;

  return (
    <div style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
      {err && <div className="alert error">{err}</div>}
      {interviews.map(iv => (
        <div key={iv.id} style={{ marginBottom: 12 }}>
          <p style={{ fontWeight: 700, fontSize: 14.5 }}>{KIND_LABEL[iv.kind]}</p>
          {iv.status === 'scheduled' && iv.chosen_slot ? (
            <>
              <p className="muted" style={{ margin: '6px 0' }}>Scheduled for <b style={{ color: 'var(--ink)' }}>{formatSlot(iv.chosen_slot.start_at, iv.chosen_slot.duration_min)}</b></p>
              <Link to={`/meeting/${iv.id}`} className="btn sm">Join meeting</Link>
            </>
          ) : (
            <>
              <p className="muted" style={{ margin: '6px 0' }}>Pick your preferred time for the interview:</p>
              <div className="slot-list">
                {iv.slots.map(s => (
                  <div className="slot-row pickable" key={s.id} onClick={() => pick(iv.id, s.id)}>
                    <span className="slot-when">{formatSlot(s.start_at, s.duration_min)}</span>
                    <span className="btn sm">Choose</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

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
          {['skill_test', 'ai_interview', 'company_test'].includes(a.stage) && (
            <Link to={`/jobs/${a.job_id}`} className="btn sm">
              Continue → {a.stage === 'skill_test' ? 'Take the skill test' : a.stage === 'ai_interview' ? 'AI interview' : 'Company test'}
            </Link>
          )}
          {['hr_interview', 'tech_interview', 'hired'].includes(a.stage) && <InterviewBlock applicationId={a.id} />}
          {a.stage === 'hired' && <span className="badge verified" style={{ marginTop: 12 }}>✓ Hired — congratulations! Match recorded: JOB-{String(a.job_id).padStart(4, '0')} ⟷ STU-{String(user.id).padStart(4, '0')}</span>}
        </div>
      ))}
    </main>
  );
}
