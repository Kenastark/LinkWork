import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import DateTimePicker from '../components/DateTimePicker.jsx';

const STAGE_LABEL = {
  applied: 'Applied', skill_test: 'Skill test', ai_interview: 'AI interview',
  company_test: 'Company test', hr_interview: 'HR interview', tech_interview: 'Technical interview',
  hired: 'Hired', rejected: 'Not selected',
};

const KIND_LABEL = { hr_interview: 'HR interview', tech_interview: 'Technical interview' };

export function formatSlot(startAt, durationMin) {
  const d = new Date(startAt);
  return `${d.toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · ${durationMin} min`;
}

const STAGE_ORDER = ['applied', 'skill_test', 'ai_interview', 'company_test', 'hr_interview', 'tech_interview', 'hired'];
const reached = (stage, target) => STAGE_ORDER.indexOf(stage) >= STAGE_ORDER.indexOf(target);

// One interview stage (HR or technical): propose slots, manage participants,
// see the chosen time + join link. Proposing is only enabled when the candidate
// is currently at this stage.
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
          {reached(applicant.stage, kind)
            ? 'This interview stage has passed.'
            : `This step becomes available when the candidate reaches the ${KIND_LABEL[kind].toLowerCase()} stage.`}
        </p>
      )}

      {iv && (
        <div className="card" style={{ marginTop: 12, boxShadow: 'none' }}>
          <div className="job-row">
            <span className={'badge ' + (iv.status === 'scheduled' ? 'verified' : 'pending')}>
              {iv.status === 'scheduled' ? 'Scheduled' : 'Awaiting candidate'}
            </span>
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
              {iv.participants.map(p => (
                <span className="participant-chip" key={p.id}>{p.email}<button onClick={() => removeParticipant(p.id)} aria-label={`Remove ${p.email}`}>✕</button></span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <input type="email" placeholder="colleague@company.com" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addParticipant(); } }} />
              <button className="btn sm secondary" onClick={addParticipant}>Add</button>
            </div>
          </div>
        </div>
      )}

      {!iv && atThisStage && (
        <div style={{ marginTop: 14 }}>
          {!picker && proposed.length === 0 && (
            <button className="btn sm" onClick={() => setPicker(true)}>Propose {KIND_LABEL[kind].toLowerCase()} times</button>
          )}
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

// AI interview tab: recorded answers grouped by round, each with a 0-10 score input;
// overall section score = average scaled to 0-100. (Live AI-graded video is later.)
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
                <input type="number" min="0" max="10" value={scores[qa.id]}
                  onChange={e => setScores(s => ({ ...s, [qa.id]: e.target.value }))} />
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

// Company test tab: view the student's MCQ answers (right/wrong), essay responses, and score.
function CompanyTestTab({ companyTest }) {
  const { questions, answers, score } = companyTest;
  const answerFor = (qid) => answers.find(a => a.question_id === qid);
  const taken = score != null;

  return (
    <div>
      <div className="job-row">
        <h3 style={{ fontSize: 17 }}>Company test</h3>
        {taken ? <span className="badge verified">MCQ score: {score}%</span> : <span className="badge pending">Not taken yet</span>}
      </div>
      <p className="muted" style={{ fontSize: 13, margin: '6px 0 10px' }}>Sample test (you'll be able to upload your own MCQ/essay questions later). MCQs are auto-scored; written answers are shown for your review.</p>
      {!taken && <p className="muted">The candidate hasn't submitted the company test yet.</p>}
      {taken && questions.map((q, i) => {
        const ans = answerFor(q.id);
        return (
          <div key={q.id} style={{ marginTop: 12, borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
            <p style={{ fontWeight: 600, fontSize: 14 }}>{i + 1}. {q.question}</p>
            {q.type === 'mcq' ? (
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
            ) : (
              <p className="muted" style={{ marginTop: 4 }}>{ans?.answer_text || '—'}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

const ADVANCE_GATE = {
  company_test: 'Complete: the candidate must submit the company test first.',
  hr_interview: 'Complete: schedule (and hold) the HR interview first.',
  tech_interview: 'Complete: schedule (and hold) the technical interview first.',
};

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

// At-a-glance scores across the whole pipeline.
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
        <tbody>
          {rows.map(([k, v]) => <tr key={k}><td style={{ fontWeight: 600, width: 200 }}>{k}</td><td>{v}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}

export default function CompanyDashboard() {
  const [tab, setTab] = useState('jobs');
  const [detailTab, setDetailTab] = useState('overview');
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [meta, setMeta] = useState(null);
  const [detail, setDetail] = useState(null); // {applicant, aiAnswers}
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = () => {
    api.get('/api/jobs').then(d => setJobs(d.jobs)).catch(() => {});
    api.get('/api/company/applicants').then(d => setApplicants(d.applicants)).catch(() => {});
    api.get('/api/meta').then(setMeta);
  };
  useEffect(load, []);

  const postJob = async (e) => {
    e.preventDefault();
    setError(''); setOk('');
    const fd = Object.fromEntries(new FormData(e.target));
    fd.university_id = meta.universities[0].id;
    fd.faculty_verified = fd.faculty_verified === 'on';
    try {
      await api.post('/api/jobs', fd);
      setOk('Posting published. Students at the university can now see and apply to it.');
      e.target.reset(); load(); setTab('jobs');
    } catch (err) { setError(err.message); }
  };

  // Opening (Review, or after an advance) jumps to the current stage's tab.
  const openDetail = async (id) => {
    try {
      const d = await api.get(`/api/company/applicants/${id}`);
      setDetail(d); setDetailTab(defaultTabForStage(d.applicant.stage));
    } catch (e) { setError(e.message); }
  };
  // Refreshing after an in-tab action keeps the current tab.
  const refreshDetail = async () => {
    if (!detail) return;
    try { setDetail(await api.get(`/api/company/applicants/${detail.applicant.id}`)); }
    catch (e) { setError(e.message); }
  };

  const act = async (id, action) => {
    setError(''); setOk('');
    try {
      const r = await api.post(`/api/company/applicants/${id}/${action}`);
      if (r.stage === 'hired') setOk(`Candidate hired. The match is recorded on the ledger${r.job_closed ? ' and the posting has been closed' : ''}.`);
      load();
      // Keep the review panel open on the new stage so the next step (e.g. proposing
      // HR/technical interview times) is visible immediately instead of closing.
      openDetail(id);
    } catch (e) { setError(e.message); }
  };

  const uniFaculties = meta?.faculties || [];
  // Test-reviewer view: applications span multiple companies, so show which one each belongs to.
  const showCompanyCol = new Set(applicants.map(a => a.company_name)).size > 1;

  return (
    <main className="container">
      <h2 style={{ fontSize: 30, marginBottom: 20 }}>Company dashboard</h2>
      {error && <div className="alert error">{error}</div>}
      {ok && <div className="alert ok">{ok}</div>}

      <div className="tabs">
        <button className={tab === 'jobs' ? 'active' : ''} onClick={() => setTab('jobs')}>My postings ({jobs.length})</button>
        <button className={tab === 'applicants' ? 'active' : ''} onClick={() => setTab('applicants')}>Applicants ({applicants.length})</button>
        <button className={tab === 'post' ? 'active' : ''} onClick={() => setTab('post')}>Post an opening</button>
      </div>

      {tab === 'jobs' && (
        jobs.length === 0
          ? <div className="card"><p className="muted">No postings yet. Publish your first opening — remember, posting on LinkWork means committing to hire from it.</p></div>
          : jobs.map(j => (
            <div className="card" key={j.id}>
              <div className="job-row">
                <div>
                  <span className="id-tag">JOB-{String(j.id).padStart(4, '0')}</span>
                  <h3>{j.title}</h3>
                  <p className="muted">{j.filled} hired of {j.positions} position{j.positions > 1 ? 's' : ''}</p>
                  <div className="meta">
                    {j.faculty_verified ? <span className="badge faculty">★ Faculty partnership</span> : <span className="badge verified">✓ Platform-committed</span>}
                    <span className={'badge ' + (j.status === 'open' ? 'verified' : 'pending')}>{j.status === 'open' ? 'Open' : 'Filled & closed'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
      )}

      {tab === 'applicants' && (
        applicants.length === 0
          ? <div className="card"><p className="muted">No applicants yet. Candidates appear here after they pass identity verification and start your posting's chain.</p></div>
          : <div className="card">
              <table className="ledger">
                <thead><tr><th>Candidate</th>{showCompanyCol && <th>Company</th>}<th>Role</th><th>Skill score</th><th>Stage</th><th>Actions</th></tr></thead>
                <tbody>
                  {applicants.map(a => (
                    <tr key={a.id}>
                      <td><b>{a.student_name}</b><br /><span className="muted">{a.major} · <span className="id-tag">STU-{String(a.student_id).padStart(4, '0')}</span></span></td>
                      {showCompanyCol && <td>{a.company_name}</td>}
                      <td>{a.title}</td>
                      <td>{a.skill_score != null ? `${a.skill_score}%` : '—'}</td>
                      <td><span className={'badge ' + (a.stage === 'hired' ? 'verified' : a.stage === 'rejected' ? 'danger' : 'pending')}>{STAGE_LABEL[a.stage]}</span></td>
                      <td>
                        <button className="btn sm ghost" onClick={() => openDetail(a.id)}>Review</button>
                        {['company_test', 'hr_interview', 'tech_interview'].includes(a.stage) && (
                          <>
                            <button className="btn sm" style={{ margin: '0 6px' }} onClick={() => act(a.id, 'advance')}
                              disabled={!a.can_advance}
                              title={a.can_advance ? '' : ADVANCE_GATE[a.stage]}>
                              {a.stage === 'tech_interview' ? 'Hire ✓' : 'Advance →'}
                            </button>
                            <button className="btn sm danger" onClick={() => act(a.id, 'reject')}>Reject</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      )}

      {detail && (
        <div className="card" style={{ borderColor: 'var(--verify)' }}>
          <div className="job-row">
            <div>
              <h3>{detail.applicant.student_name} — {detail.applicant.title}</h3>
              <p className="muted">{detail.applicant.student_email} · {detail.applicant.major} · <span className="badge pending">{STAGE_LABEL[detail.applicant.stage]}</span></p>
            </div>
            <button className="btn sm ghost" onClick={() => setDetail(null)}>Close</button>
          </div>

          <div className="tabs" style={{ marginTop: 16 }}>
            {DETAIL_TABS.map(dt => (
              <button key={dt.key} className={detailTab === dt.key ? 'active' : ''} onClick={() => setDetailTab(dt.key)}>{dt.label}</button>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            {detailTab === 'overview' && <OverviewTab applicant={detail.applicant} />}
            {detailTab === 'ai' && <AiInterviewTab applicant={detail.applicant} aiAnswers={detail.aiAnswers} onChange={refreshDetail} />}
            {detailTab === 'company_test' && <CompanyTestTab companyTest={detail.companyTest} />}
            {detailTab === 'hr' && <InterviewTab applicant={detail.applicant} interviews={detail.interviews || []} kind="hr_interview" onChange={refreshDetail} />}
            {detailTab === 'tech' && <InterviewTab applicant={detail.applicant} interviews={detail.interviews || []} kind="tech_interview" onChange={refreshDetail} />}
          </div>
        </div>
      )}

      {tab === 'post' && meta && (
        <form className="card" onSubmit={postJob} style={{ maxWidth: 640 }}>
          <h3>Post an opening</h3>
          <p className="muted" style={{ marginBottom: 18 }}>By posting, your company commits to hiring for this role from LinkWork. The posting closes automatically once all positions are filled.</p>
          <label className="field">Role title<input name="title" required /></label>
          <div className="grid cols-2">
            <label className="field">Type
              <select name="job_type" required defaultValue="internship">
                <option value="internship">Internship</option>
                <option value="entry_level">Entry level</option>
              </select>
            </label>
            <label className="field">Positions<input name="positions" type="number" min="1" defaultValue="1" required /></label>
          </div>
          <label className="field">Target faculty <span className="hint">(optional — leave blank for university-wide)</span>
            <select name="faculty_id" defaultValue="">
              <option value="">University-wide</option>
              {uniFaculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </label>
          <div className="grid cols-2">
            <label className="field">Location<input name="location" placeholder="e.g. Debrecen" defaultValue="Debrecen" required /></label>
            <label className="field">Work mode
              <select name="work_mode" required defaultValue="on_site">
                <option value="on_site">On-site</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </select>
            </label>
          </div>
          <label className="field">Monthly gross salary (HUF) <span className="hint">(optional — leave blank to keep undisclosed)</span>
            <input name="salary_huf" type="number" min="0" step="10000" placeholder="e.g. 300000" />
          </label>
          <label className="field">Role description<textarea name="description" required /></label>
          <label className="field">Requirements<textarea name="requirements" /></label>
          <label className="field" style={{ display: 'flex', gap: 10, alignItems: 'center', fontWeight: 500 }}>
            <input type="checkbox" name="faculty_verified" style={{ width: 'auto', margin: 0 }} />
            This opening was negotiated with a faculty coordinator (faculty partnership)
          </label>
          <button className="btn">Publish posting</button>
        </form>
      )}
    </main>
  );
}
