import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { STAGE_LABEL, STAGE_ORDER } from '../stages.js';

// A static, non-interactive reminder of the recruitment pipeline.
function RecruitmentSteps() {
  return (
    <div className="rec-steps">
      <span className="rec-steps-label">Recruitment process</span>
      <div className="rec-steps-flow">
        {STAGE_ORDER.map((s, i) => (
          <div className="rec-step" key={s}>
            <span className="rec-step-dot">{i + 1}</span>
            <span className="rec-step-name">{STAGE_LABEL[s]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [closed, setClosed] = useState([]);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  // Applicants tab controls
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('applied');       // applied | role | name
  const [postingFilter, setPostingFilter] = useState(null); // job id or null

  const load = () => {
    api.get('/api/jobs').then(d => setJobs(d.jobs)).catch(() => {});
    api.get('/api/company/applicants').then(d => setApplicants(d.applicants)).catch(() => {});
    api.get('/api/company/closed-positions').then(d => setClosed(d.positions)).catch(() => {});
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

  const applicantCount = (jobId) => applicants.filter(a => a.job_id === jobId).length;
  const viewPostingApplicants = (jobId) => { setPostingFilter(jobId); setSortBy('applied'); setSearch(''); setTab('applicants'); };

  const uniFaculties = meta?.faculties || [];
  const showCompanyCol = new Set(applicants.map(a => a.company_name)).size > 1;

  // Filtered + sorted applicants for the Applicants tab.
  const shownApplicants = useMemo(() => {
    let list = applicants;
    if (postingFilter) list = list.filter(a => a.job_id === postingFilter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(a =>
      a.student_name.toLowerCase().includes(q) ||
      (a.title || '').toLowerCase().includes(q) ||
      (a.major || '').toLowerCase().includes(q));
    const sorted = [...list];
    if (sortBy === 'role') sorted.sort((x, y) => (x.title || '').localeCompare(y.title || ''));
    else if (sortBy === 'name') sorted.sort((x, y) => x.student_name.localeCompare(y.student_name));
    else sorted.sort((x, y) => x.id - y.id); // order applied (earliest first)
    return sorted;
  }, [applicants, postingFilter, search, sortBy]);

  const postingFilterJob = postingFilter ? jobs.find(j => j.id === postingFilter) : null;

  return (
    <main className="container">
      <h2 style={{ fontSize: 30, marginBottom: 16 }}>Company dashboard</h2>
      <RecruitmentSteps />
      {error && <div className="alert error">{error}</div>}
      {ok && <div className="alert ok">{ok}</div>}

      <div className="tabs">
        <button className={tab === 'jobs' ? 'active' : ''} onClick={() => setTab('jobs')}>My postings ({jobs.length})</button>
        <button className={tab === 'applicants' ? 'active' : ''} onClick={() => setTab('applicants')}>Applicants ({applicants.length})</button>
        <button className={tab === 'closed' ? 'active' : ''} onClick={() => setTab('closed')}>Closed positions ({closed.length})</button>
        <button className={tab === 'post' ? 'active' : ''} onClick={() => setTab('post')}>Post an opening</button>
      </div>

      {tab === 'jobs' && (
        jobs.length === 0
          ? <div className="card"><p className="muted">No postings yet. Publish your first opening — remember, posting on LinkWork means committing to hire from it.</p></div>
          : jobs.map(j => (
            <div className="card job-card" key={j.id}>
              <span className="id-tag">JOB-{String(j.id).padStart(4, '0')}</span>
              <div className="job-row">
                <div>
                  <h3>{j.title}</h3>
                  <p className="muted">{j.filled} hired of {j.positions} position{j.positions > 1 ? 's' : ''}</p>
                  <div className="meta">
                    {j.faculty_verified ? <span className="badge faculty">★ Faculty partnership</span> : <span className="badge verified">✓ Platform-committed</span>}
                    <span className={'badge ' + (j.status === 'open' ? 'verified' : 'pending')}>{j.status === 'open' ? 'Open' : 'Filled & closed'}</span>
                    <span className="badge pending">{applicantCount(j.id)} applicant{applicantCount(j.id) === 1 ? '' : 's'}</span>
                  </div>
                </div>
                <button className="btn sm" onClick={() => viewPostingApplicants(j.id)} disabled={applicantCount(j.id) === 0}>
                  View applicants
                </button>
              </div>
            </div>
          ))
      )}

      {tab === 'applicants' && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            {postingFilterJob && (
              <div style={{ marginBottom: 12 }}>
                <span className="pref-chip" onClick={() => setPostingFilter(null)}>
                  Posting: {postingFilterJob.title} ✕
                </span>
              </div>
            )}
            <div className="applicant-controls">
              <input placeholder="Search name, role, or major…" value={search} onChange={e => setSearch(e.target.value)} />
              <label className="applicant-sort">Sort by
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="applied">Order applied</option>
                  <option value="role">Role</option>
                  <option value="name">Candidate name</option>
                </select>
              </label>
            </div>
          </div>

          {shownApplicants.length === 0 ? (
            <div className="card"><p className="muted">{applicants.length === 0 ? 'No applicants yet. Candidates appear here after they pass identity verification and start your posting’s chain.' : 'No applicants match your search.'}</p></div>
          ) : (
            <div className="card">
              <table className="ledger">
                <thead><tr><th>Candidate</th><th>Role</th>{showCompanyCol && <th>Company</th>}<th>Skill score</th><th>Stage</th><th>Actions</th></tr></thead>
                <tbody>
                  {shownApplicants.map(a => (
                    <tr key={a.id}>
                      <td><b>{a.student_name}</b><br /><span className="muted">{a.major}</span></td>
                      <td>{a.title}</td>
                      {showCompanyCol && <td>{a.company_name}</td>}
                      <td>{a.skill_score != null ? `${a.skill_score}%` : '—'}</td>
                      <td><span className={'badge ' + (a.stage === 'hired' ? 'verified' : a.stage === 'rejected' ? 'danger' : 'pending')}>{STAGE_LABEL[a.stage]}</span></td>
                      <td><button className="btn sm" onClick={() => navigate(`/company/applicants/${a.id}`)}>Review</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'closed' && (
        closed.length === 0
          ? <div className="card"><p className="muted">No closed positions yet. When a posting is filled, it moves here with the candidate that was selected — recorded on the public hire ledger.</p></div>
          : closed.map(p => (
            <div className="card" key={p.id}>
              <div className="job-row">
                <div>
                  <span className="id-tag">JOB-{String(p.id).padStart(4, '0')}</span>
                  <h3>{p.title}</h3>
                  <p className="muted">{p.filled} of {p.positions} position{p.positions > 1 ? 's' : ''} filled · Closed</p>
                </div>
                <span className="badge pending">Filled &amp; closed</span>
              </div>
              <div style={{ marginTop: 12 }}>
                {p.hires.length === 0 ? (
                  <p className="muted">No candidate was selected for this position.</p>
                ) : (
                  <>
                    <p className="filter-label">Selected candidate{p.hires.length > 1 ? 's' : ''}</p>
                    {p.hires.map(h => (
                      <div key={h.student_id} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
                        <b>{h.student_name}</b>
                        <span className="muted">{h.major}</span>
                        <span className="badge verified mono">JOB-{String(p.id).padStart(4, '0')} ⟷ STU-{String(h.student_id).padStart(4, '0')}</span>
                      </div>
                    ))}
                    <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>Recorded on the public hire ledger — proof the role was real and filled.</p>
                  </>
                )}
              </div>
            </div>
          ))
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
