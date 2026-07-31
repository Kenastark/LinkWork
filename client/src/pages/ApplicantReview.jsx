import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import DateTimePicker from '../components/DateTimePicker.jsx';
import { STAGE_LABEL, KIND_LABEL, reached, formatSlot } from '../stages.js';

const DETAIL_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'ai', label: 'AI interview' },
  { key: 'company_test', label: 'Company test' },
  { key: 'hr', label: 'HR interview' },
  { key: 'tech', label: 'Technical' },
];
function defaultTabForStage(stage) {
  return { ai_interview: 'ai', company_test: 'company_test', hr_interview: 'hr', tech_interview: 'tech' }[stage] || 'overview';
}
const ADVANCE_GATE = {
  company_test: 'The candidate must submit the company test before you can advance them.',
  hr_interview: 'Schedule (and hold) the HR interview before advancing.',
  tech_interview: 'Schedule (and hold) the technical interview before hiring.',
};

// ---- tabs ----
function OverviewTab({ applicant }) {
  const rows = [
    ['Current stage', STAGE_LABEL[applicant.stage]],
    ['Skill test', applicant.skill_score != null ? `${applicant.skill_score}%` : '—'],
    ['AI interview', applicant.ai_score != null ? `${applicant.ai_score}/100` : 'Not scored'],
    ['Company test', applicant.company_test_score != null ? `${applicant.company_test_score}%` : 'Not taken'],
  ];
  return (
    <div>
      <h3 style={{ fontSize: 17, marginBottom: 10 }}>Overview</h3>
      <table className="ledger">
        <tbody>{rows.map(([k, v]) => <tr key={k}><td style={{ fontWeight: 600, width: 220 }}>{k}</td><td>{v}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function AiInterviewTab({ applicant, aiAnswers, onChange }) {
  const [scores, setScores] = useState(() => Object.fromEntries(aiAnswers.map(a => [a.id, a.company_score ?? ''])));
  const [saved, setSaved] = useState('');
  const [err, setErr] = useState('');

  const save = async () => {
    setErr(''); setSaved('');
    try {
      const r = await api.post(`/api/company/applicants/${applicant.id}/ai-scores`, { scores });
      setSaved(r.ai_score != null ? `Saved. Section score: ${r.ai_score}/100.` : 'Saved.');
      onChange();
    } catch (e) { setErr(e.message); }
  };

  if (aiAnswers.length === 0) return <><h3 style={{ fontSize: 17 }}>AI interview</h3><p className="muted" style={{ marginTop: 8 }}>The candidate hasn't completed the AI interview yet.</p></>;

  return (
    <div>
      <div className="job-row">
        <h3 style={{ fontSize: 17 }}>AI interview — score the answers</h3>
        {applicant.ai_score != null && <span className="badge verified">Section score: {applicant.ai_score}/100</span>}
      </div>
      <p className="muted" style={{ fontSize: 13, margin: '6px 0 4px' }}>Placeholder recorded answers — the live AI-graded video interview ships later. Rate each answer 0–10.</p>
      {err && <div className="alert error">{err}</div>}
      {saved && <div className="alert ok">{saved}</div>}
      {[1, 2].filter(round => aiAnswers.some(qa => qa.attempt === round)).map(round => (
        <div key={round}>
          {aiAnswers.some(qa => qa.attempt === 2) && <p className="id-tag" style={{ marginTop: 16 }}>ROUND {round}</p>}
          {aiAnswers.filter(qa => qa.attempt === round).map(qa => (
            <div key={qa.id} style={{ marginTop: 12, borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{qa.question}</p>
              <p className="muted" style={{ marginTop: 4 }}>{qa.answer}</p>
              <label className="score-input">Score
                <input type="number" min="0" max="10" value={scores[qa.id]} onChange={e => setScores(s => ({ ...s, [qa.id]: e.target.value }))} />
                <span className="muted">/ 10</span>
              </label>
            </div>
          ))}
        </div>
      ))}
      <button className="btn" style={{ marginTop: 14 }} onClick={save}>Save scores</button>
    </div>
  );
}

function CompanyTestTab({ companyTest }) {
  const { questions, answers, score } = companyTest;
  const answerFor = (qid) => answers.find(a => a.question_id === qid);
  const taken = score != null;
  return (
    <div>
      <div className="job-row">
        <h3 style={{ fontSize: 17 }}>Company test</h3>
        {taken ? <span className="badge verified">Score: {score}%</span> : <span className="badge pending">Not taken yet</span>}
      </div>
      <p className="muted" style={{ fontSize: 13, margin: '6px 0 10px' }}>Sample multiple-choice test (you'll be able to upload your own questions later). Auto-scored on submit.</p>
      {!taken && <p className="muted">The candidate hasn't submitted the company test yet.</p>}
      {taken && questions.map((q, i) => {
        const ans = answerFor(q.id);
        return (
          <div key={q.id} style={{ marginTop: 12, borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
            <p style={{ fontWeight: 600, fontSize: 14 }}>{i + 1}. {q.question}</p>
            <div style={{ marginTop: 6 }}>
              {q.options.map((opt, oi) => {
                const chosen = ans && ans.answer_idx === oi;
                const correct = q.answer_idx === oi;
                return (
                  <p key={oi} style={{ fontSize: 13.5, color: correct ? 'var(--verify)' : chosen ? 'var(--danger)' : 'var(--ink-soft)', fontWeight: chosen || correct ? 600 : 400 }}>
                    {correct ? '✓' : chosen ? '✕' : '•'} {opt}{chosen ? ' (their answer)' : ''}
                  </p>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InterviewTab({ applicant, interviews, kind, onChange }) {
  const [proposed, setProposed] = useState([]);
  const [picker, setPicker] = useState(false);
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');

  const iv = interviews.find(x => x.kind === kind);
  const atThisStage = applicant.stage === kind;

  const send = async () => {
    setErr('');
    try { await api.post('/api/company/interviews', { application_id: applicant.id, slots: proposed }); setProposed([]); setPicker(false); onChange(); }
    catch (e) { setErr(e.message); }
  };
  const addParticipant = async () => {
    if (!email.trim()) return;
    setErr('');
    try { await api.post(`/api/company/interviews/${iv.id}/participants`, { email: email.trim() }); setEmail(''); onChange(); }
    catch (e) { setErr(e.message); }
  };
  const removeParticipant = async (pid) => {
    try { await api.delete(`/api/company/interviews/${iv.id}/participants/${pid}`); onChange(); } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <h3 style={{ fontSize: 17 }}>{KIND_LABEL[kind]}</h3>
      {err && <div className="alert error" style={{ marginTop: 10 }}>{err}</div>}
      {!iv && !atThisStage && (
        <p className="muted" style={{ marginTop: 8 }}>
          {reached(applicant.stage, kind) ? 'This interview stage has passed.' : `This step becomes available when the candidate reaches the ${KIND_LABEL[kind].toLowerCase()} stage.`}
        </p>
      )}
      {iv && (
        <div className="card" style={{ marginTop: 12, boxShadow: 'none' }}>
          <div className="job-row">
            <span className={'badge ' + (iv.status === 'scheduled' ? 'verified' : 'pending')}>{iv.status === 'scheduled' ? 'Scheduled' : 'Awaiting candidate'}</span>
          </div>
          {iv.status === 'scheduled' && iv.chosen_slot ? (
            <>
              <p style={{ marginTop: 8, fontWeight: 600 }}>{formatSlot(iv.chosen_slot.start_at, iv.chosen_slot.duration_min)}</p>
              <Link to={`/meeting/${iv.id}`} className="btn sm" style={{ marginTop: 10 }}>Join meeting</Link>
            </>
          ) : (
            <div className="slot-list">
              {iv.slots.map(s => <div className="slot-row" key={s.id}><span className="slot-when">{formatSlot(s.start_at, s.duration_min)}</span></div>)}
              <p className="muted" style={{ fontSize: 13 }}>Proposed — waiting for the candidate to pick one.</p>
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <p className="filter-label">Participants {kind === 'tech_interview' ? '(add technical team members)' : '(add colleagues)'}</p>
            <div className="participant-chips">
              {iv.participants.length === 0 && <span className="muted" style={{ fontSize: 13 }}>Just you so far.</span>}
              {iv.participants.map(p => <span className="participant-chip" key={p.id}>{p.email}<button onClick={() => removeParticipant(p.id)} aria-label={`Remove ${p.email}`}>✕</button></span>)}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <input type="email" placeholder="colleague@company.com" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addParticipant(); } }} />
              <button className="btn sm secondary" onClick={addParticipant}>Add</button>
            </div>
          </div>
        </div>
      )}
      {!iv && atThisStage && (
        <div style={{ marginTop: 14 }}>
          {!picker && proposed.length === 0 && <button className="btn sm" onClick={() => setPicker(true)}>Propose {KIND_LABEL[kind].toLowerCase()} times</button>}
          {(picker || proposed.length > 0) && (
            <>
              {proposed.length > 0 && (
                <div className="slot-list">
                  {proposed.map((s, i) => (
                    <div className="slot-row" key={i}>
                      <span className="slot-when">{formatSlot(s.start_at, s.duration_min)}</span>
                      <button className="btn sm ghost" onClick={() => setProposed(p => p.filter((_, x) => x !== i))}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
              {picker
                ? <DateTimePicker onAdd={(slot) => { setProposed(p => [...p, slot]); setPicker(false); }} />
                : <button className="btn sm secondary" onClick={() => setPicker(true)}>+ Add another time</button>}
              {proposed.length > 0 && !picker && (
                <button className="btn" style={{ marginTop: 12 }} onClick={send}>Send {proposed.length} time{proposed.length > 1 ? 's' : ''} to candidate</button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---- reject confirmation modal ----
function RejectModal({ name, role, onCancel, onConfirm, busy }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3 style={{ fontSize: 20 }}>Reject this candidate?</h3>
        <p style={{ marginTop: 10 }}>Are you sure you want to reject <b>{name}</b> for the <b>{role}</b> position?</p>
        <div className="alert error" style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>⚠️</span>
          <span>This action <b>cannot be reversed</b> and is final. The candidate will be notified that they were not selected.</span>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
          <button className="btn secondary" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn danger" onClick={onConfirm} disabled={busy}>{busy ? 'Rejecting…' : 'Yes, reject'}</button>
        </div>
      </div>
    </div>
  );
}

export default function ApplicantReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [tab, setTab] = useState('overview');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [confirmReject, setConfirmReject] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = (resetTab = false) => api.get(`/api/company/applicants/${id}`)
    .then(d => { setDetail(d); if (resetTab) setTab(defaultTabForStage(d.applicant.stage)); })
    .catch(e => setError(e.message));
  useEffect(() => { load(true); /* eslint-disable-next-line */ }, [id]);

  if (error) return <main className="container"><div className="alert error">{error}</div><Link to="/company" className="btn secondary" style={{ marginTop: 12 }}>Back to dashboard</Link></main>;
  if (!detail) return <main className="container" />;

  const a = detail.applicant;
  const canAct = ['company_test', 'hr_interview', 'tech_interview'].includes(a.stage);

  const advance = async () => {
    setError(''); setOk(''); setBusy(true);
    try {
      const r = await api.post(`/api/company/applicants/${a.id}/advance`);
      setOk(r.stage === 'hired' ? 'Candidate hired. The match is recorded on the ledger.' : `Advanced to ${STAGE_LABEL[r.stage]}.`);
      await load(true);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const doReject = async () => {
    setError(''); setOk(''); setBusy(true);
    try {
      await api.post(`/api/company/applicants/${a.id}/reject`);
      setConfirmReject(false);
      await load();
      setOk('Candidate rejected. They have been notified.');
    } catch (e) { setError(e.message); setConfirmReject(false); } finally { setBusy(false); }
  };

  return (
    <main className="container">
      <Link to="/company" className="btn sm ghost" style={{ marginBottom: 12 }}>← Back to applicants</Link>

      <div className="card">
        <div className="job-row">
          <div>
            <h2 style={{ fontSize: 24 }}>{a.student_name}</h2>
            <p className="muted">{a.title} · {a.student_email} · {a.major}</p>
          </div>
          <span className={'badge ' + (a.stage === 'hired' ? 'verified' : a.stage === 'rejected' ? 'danger' : 'pending')}>{STAGE_LABEL[a.stage]}</span>
        </div>

        {error && <div className="alert error" style={{ marginTop: 14 }}>{error}</div>}
        {ok && <div className="alert ok" style={{ marginTop: 14 }}>{ok}</div>}

        <div className="tabs" style={{ marginTop: 16 }}>
          {DETAIL_TABS.map(dt => <button key={dt.key} className={tab === dt.key ? 'active' : ''} onClick={() => setTab(dt.key)}>{dt.label}</button>)}
        </div>

        <div style={{ marginTop: 16 }}>
          {tab === 'overview' && <OverviewTab applicant={a} />}
          {tab === 'ai' && <AiInterviewTab applicant={a} aiAnswers={detail.aiAnswers} onChange={() => load()} />}
          {tab === 'company_test' && <CompanyTestTab companyTest={detail.companyTest} />}
          {tab === 'hr' && <InterviewTab applicant={a} interviews={detail.interviews || []} kind="hr_interview" onChange={() => load()} />}
          {tab === 'tech' && <InterviewTab applicant={a} interviews={detail.interviews || []} kind="tech_interview" onChange={() => load()} />}
        </div>
      </div>

      {canAct && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Decision</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn" onClick={advance} disabled={busy || !detail.can_advance} title={detail.can_advance ? '' : ADVANCE_GATE[a.stage]}>
              {a.stage === 'tech_interview' ? 'Hire ✓' : 'Advance to next stage →'}
            </button>
            <button className="btn danger" onClick={() => setConfirmReject(true)} disabled={busy}>Reject candidate</button>
          </div>
          {!detail.can_advance && <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>{ADVANCE_GATE[a.stage]}</p>}
        </div>
      )}

      {a.stage === 'hired' && <div className="alert ok" style={{ marginTop: 16 }}>This candidate has been hired. The match is on the ledger.</div>}
      {a.stage === 'rejected' && <div className="alert error" style={{ marginTop: 16 }}>This candidate was not selected. They have been notified.</div>}

      {confirmReject && (
        <RejectModal name={a.student_name} role={a.title} busy={busy}
          onCancel={() => setConfirmReject(false)} onConfirm={doReject} />
      )}
    </main>
  );
}
