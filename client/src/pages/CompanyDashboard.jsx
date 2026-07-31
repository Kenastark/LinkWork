import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { STAGE_LABEL } from '../stages.js';

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [meta, setMeta] = useState(null);
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
                <thead><tr><th>Candidate</th><th>Role</th>{showCompanyCol && <th>Company</th>}<th>Skill score</th><th>Stage</th><th>Actions</th></tr></thead>
                <tbody>
                  {applicants.map(a => (
                    <tr key={a.id}>
                      <td><b>{a.student_name}</b><br /><span className="muted">{a.major}</span></td>
                      <td>{a.title}</td>
                      {showCompanyCol && <td>{a.company_name}</td>}
                      <td>{a.skill_score != null ? `${a.skill_score}%` : '—'}</td>
                      <td><span className={'badge ' + (a.stage === 'hired' ? 'verified' : a.stage === 'rejected' ? 'danger' : 'pending')}>{STAGE_LABEL[a.stage]}</span></td>
                      <td>
                        <button className="btn sm" onClick={() => navigate(`/company/applicants/${a.id}`)}>Review</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
