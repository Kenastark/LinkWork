import { useEffect, useState } from 'react';
import { api } from '../api.js';

const STAGE_LABEL = {
  applied: 'Applied', skill_test: 'Skill test', ai_interview: 'AI interview',
  company_test: 'Company test', hr_interview: 'HR interview', tech_interview: 'Technical interview',
  hired: 'Hired', rejected: 'Not selected',
};

export default function CompanyDashboard() {
  const [tab, setTab] = useState('jobs');
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

  const openDetail = async (id) => {
    try { setDetail(await api.get(`/api/company/applicants/${id}`)); }
    catch (e) { setError(e.message); }
  };

  const act = async (id, action) => {
    setError(''); setOk('');
    try {
      const r = await api.post(`/api/company/applicants/${id}/${action}`);
      if (r.stage === 'hired') setOk(`Candidate hired. The match is recorded on the ledger${r.job_closed ? ' and the posting has been closed' : ''}.`);
      setDetail(null); load();
    } catch (e) { setError(e.message); }
  };

  const uniFaculties = meta?.faculties || [];

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
                <thead><tr><th>Candidate</th><th>Role</th><th>Skill score</th><th>Stage</th><th>Actions</th></tr></thead>
                <tbody>
                  {applicants.map(a => (
                    <tr key={a.id}>
                      <td><b>{a.student_name}</b><br /><span className="muted">{a.major} · <span className="id-tag">STU-{String(a.student_id).padStart(4, '0')}</span></span></td>
                      <td>{a.title}</td>
                      <td>{a.skill_score != null ? `${a.skill_score}%` : '—'}</td>
                      <td><span className={'badge ' + (a.stage === 'hired' ? 'verified' : a.stage === 'rejected' ? 'danger' : 'pending')}>{STAGE_LABEL[a.stage]}</span></td>
                      <td>
                        <button className="btn sm ghost" onClick={() => openDetail(a.id)}>Review</button>
                        {['company_test', 'hr_interview', 'tech_interview'].includes(a.stage) && (
                          <>
                            <button className="btn sm" style={{ margin: '0 6px' }} onClick={() => act(a.id, 'advance')}>
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
            <h3>{detail.applicant.student_name} — {detail.applicant.title}</h3>
            <button className="btn sm ghost" onClick={() => setDetail(null)}>Close</button>
          </div>
          <p className="muted">{detail.applicant.student_email} · {detail.applicant.major} · Skill test: {detail.applicant.skill_score ?? '—'}%</p>
          <h3 style={{ marginTop: 16, fontSize: 17 }}>AI interview answers</h3>
          {detail.aiAnswers.length === 0
            ? <p className="muted">Not completed yet.</p>
            : [1, 2].filter(round => detail.aiAnswers.some(qa => qa.attempt === round)).map(round => (
              <div key={round}>
                {detail.aiAnswers.some(qa => qa.attempt === 2) && (
                  <p className="id-tag" style={{ marginTop: 16 }}>ROUND {round}</p>
                )}
                {detail.aiAnswers.filter(qa => qa.attempt === round).map((qa, i) => (
                  <div key={i} style={{ marginTop: 12 }}>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{qa.question}</p>
                    <p className="muted">{qa.answer}</p>
                  </div>
                ))}
              </div>
            ))}
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
