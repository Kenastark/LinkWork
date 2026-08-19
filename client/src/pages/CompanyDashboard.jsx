import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { STAGE_ORDER } from '../stages.js';
import { useTranslatedTexts } from '../useTranslatedTexts.js';
import { useI18n } from '../i18n.jsx';

// A static, non-interactive reminder of the recruitment pipeline.
function RecruitmentSteps() {
  const { t } = useI18n();
  return (
    <div className="rec-steps">
      <span className="rec-steps-label">{t('companyDashboard.recruitmentProcess')}</span>
      <div className="rec-steps-flow">
        {STAGE_ORDER.map((s, i) => (
          <div className="rec-step" key={s}>
            <span className="rec-step-dot">{i + 1}</span>
            <span className="rec-step-name">{t(`stage.${s}`)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const { t } = useI18n();
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
      setOk(t('companyDashboard.postingPublished'));
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

  const translatedJobTitles = useTranslatedTexts(jobs.map(j => j.title));
  const translatedApplicantTitles = useTranslatedTexts(shownApplicants.map(a => a.title));
  const translatedClosedTitles = useTranslatedTexts(closed.map(p => p.title));
  const translatedUniFacultyNames = useTranslatedTexts(uniFaculties.map(f => f.name));
  const postingFilterJobTitle = postingFilterJob ? translatedJobTitles[jobs.indexOf(postingFilterJob)] : null;

  return (
    <main className="container">
      <h1 style={{ fontSize: 30, marginBottom: 16 }}>{t('companyDashboard.title')}</h1>
      <RecruitmentSteps />
      {error && <div className="alert error" role="alert">{error}</div>}
      {ok && <div className="alert ok" role="status">{ok}</div>}

      <div className="tabs">
        <button className={tab === 'jobs' ? 'active' : ''} onClick={() => setTab('jobs')}>{t('companyDashboard.tabPostings', { n: jobs.length })}</button>
        <button className={tab === 'applicants' ? 'active' : ''} onClick={() => setTab('applicants')}>{t('companyDashboard.tabApplicants', { n: applicants.length })}</button>
        <button className={tab === 'closed' ? 'active' : ''} onClick={() => setTab('closed')}>{t('companyDashboard.tabClosed', { n: closed.length })}</button>
        <button className={tab === 'post' ? 'active' : ''} onClick={() => setTab('post')}>{t('companyDashboard.tabPost')}</button>
      </div>

      {tab === 'jobs' && (
        jobs.length === 0
          ? <div className="card"><p className="muted">{t('companyDashboard.noPostings')}</p></div>
          : jobs.map((j, i) => (
            <div className="card job-card" key={j.id}>
              <span className="id-tag">JOB-{String(j.id).padStart(4, '0')}</span>
              <div className="job-row">
                <div>
                  <h2 style={{ fontSize: 20 }}>{translatedJobTitles[i]}</h2>
                  <p className="muted">{t(j.positions === 1 ? 'companyDashboard.hiredOfOne' : 'companyDashboard.hiredOfOther', { filled: j.filled, total: j.positions })}</p>
                  <div className="meta">
                    {j.faculty_verified ? <span className="badge faculty">{t('companyDashboard.facultyPartnership')}</span> : <span className="badge verified">{t('companyDashboard.platformCommitted')}</span>}
                    <span className={'badge ' + (j.status === 'open' ? 'verified' : 'pending')}>{j.status === 'open' ? t('companyDashboard.statusOpen') : t('companyDashboard.statusClosed')}</span>
                    <span className="badge pending">{t(applicantCount(j.id) === 1 ? 'companyDashboard.applicantOne' : 'companyDashboard.applicantOther', { n: applicantCount(j.id) })}</span>
                  </div>
                </div>
                <button className="btn sm" onClick={() => viewPostingApplicants(j.id)} disabled={applicantCount(j.id) === 0}>
                  {t('companyDashboard.viewApplicants')}
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
                  {t('companyDashboard.postingChip', { title: postingFilterJobTitle })}
                </span>
              </div>
            )}
            <div className="applicant-controls">
              <input placeholder={t('companyDashboard.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} />
              <label className="applicant-sort">{t('companyDashboard.sortByLabel')}
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="applied">{t('companyDashboard.sortApplied')}</option>
                  <option value="role">{t('companyDashboard.sortRole')}</option>
                  <option value="name">{t('companyDashboard.sortName')}</option>
                </select>
              </label>
            </div>
          </div>

          {shownApplicants.length === 0 ? (
            <div className="card"><p className="muted">{applicants.length === 0 ? t('companyDashboard.noApplicantsYet') : t('companyDashboard.noApplicantsMatch')}</p></div>
          ) : (
            <div className="card">
              <table className="ledger">
                <thead><tr><th>{t('companyDashboard.candidateHeader')}</th><th>{t('companyDashboard.roleHeader')}</th>{showCompanyCol && <th>{t('companyDashboard.companyHeader')}</th>}<th>{t('companyDashboard.skillScoreHeader')}</th><th>{t('companyDashboard.stageHeader')}</th><th>{t('companyDashboard.actionsHeader')}</th></tr></thead>
                <tbody>
                  {shownApplicants.map((a, i) => (
                    <tr key={a.id}>
                      <td><b>{a.student_name}</b><br /><span className="muted">{a.major}</span></td>
                      <td>{translatedApplicantTitles[i]}</td>
                      {showCompanyCol && <td>{a.company_name}</td>}
                      <td>{a.skill_score != null ? `${a.skill_score}%` : '—'}</td>
                      <td><span className={'badge ' + (a.stage === 'hired' ? 'verified' : a.stage === 'rejected' ? 'danger' : 'pending')}>{t(`stage.${a.stage}`)}</span></td>
                      <td><button className="btn sm" onClick={() => navigate(`/company/applicants/${a.id}`)}>{t('companyDashboard.review')}</button></td>
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
          ? <div className="card"><p className="muted">{t('companyDashboard.noClosedYet')}</p></div>
          : closed.map((p, i) => (
            <div className="card" key={p.id}>
              <div className="job-row">
                <div>
                  <span className="id-tag">JOB-{String(p.id).padStart(4, '0')}</span>
                  <h3>{translatedClosedTitles[i]}</h3>
                  <p className="muted">{t(p.positions === 1 ? 'companyDashboard.filledOfOne' : 'companyDashboard.filledOfOther', { filled: p.filled, total: p.positions })}</p>
                </div>
                <span className="badge pending">{t('companyDashboard.statusClosed')}</span>
              </div>
              <div style={{ marginTop: 12 }}>
                {p.hires.length === 0 ? (
                  <p className="muted">{t('companyDashboard.noCandidateSelected')}</p>
                ) : (
                  <>
                    <p className="filter-label">{t(p.hires.length === 1 ? 'companyDashboard.selectedCandidateOne' : 'companyDashboard.selectedCandidateOther')}</p>
                    {p.hires.map(h => (
                      <div key={h.student_id} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
                        <b>{h.student_name}</b>
                        <span className="muted">{h.major}</span>
                        <span className="badge verified mono">JOB-{String(p.id).padStart(4, '0')} ⟷ STU-{String(h.student_id).padStart(4, '0')}</span>
                      </div>
                    ))}
                    <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>{t('companyDashboard.recordedOnLedger')}</p>
                  </>
                )}
              </div>
            </div>
          ))
      )}

      {tab === 'post' && meta && (
        <form className="card" onSubmit={postJob} style={{ maxWidth: 640 }}>
          <h3>{t('companyDashboard.postTitle')}</h3>
          <p className="muted" style={{ marginBottom: 18 }}>{t('companyDashboard.postIntro')}</p>
          <label className="field">{t('companyDashboard.roleTitleLabel')}<input name="title" required /></label>
          <div className="grid cols-2">
            <label className="field">{t('companyDashboard.typeLabel')}
              <select name="job_type" required defaultValue="internship">
                <option value="internship">{t('findInternship.typeInternship')}</option>
                <option value="entry_level">{t('findInternship.typeEntryLevel')}</option>
              </select>
            </label>
            <label className="field">{t('companyDashboard.positionsLabel')}<input name="positions" type="number" min="1" defaultValue="1" required /></label>
          </div>
          <label className="field">{t('companyDashboard.targetFacultyLabel')} <span className="hint">{t('companyDashboard.targetFacultyHint')}</span>
            <select name="faculty_id" defaultValue="">
              <option value="">{t('findInternship.universityWide')}</option>
              {uniFaculties.map((f, i) => <option key={f.id} value={f.id}>{translatedUniFacultyNames[i]}</option>)}
            </select>
          </label>
          <div className="grid cols-2">
            <label className="field">{t('companyDashboard.locationLabel')}<input name="location" placeholder={t('companyDashboard.locationPlaceholder')} defaultValue="Debrecen" required /></label>
            <label className="field">{t('companyDashboard.workModeLabel')}
              <select name="work_mode" required defaultValue="on_site">
                <option value="on_site">{t('findInternship.modeOnSite')}</option>
                <option value="hybrid">{t('findInternship.modeHybrid')}</option>
                <option value="remote">{t('findInternship.modeRemote')}</option>
              </select>
            </label>
          </div>
          <label className="field">{t('companyDashboard.salaryLabel')} <span className="hint">{t('companyDashboard.salaryHint')}</span>
            <input name="salary_huf" type="number" min="0" step="10000" placeholder={t('companyDashboard.salaryPlaceholder')} />
          </label>
          <label className="field">{t('companyDashboard.descriptionLabel')}<textarea name="description" required /></label>
          <label className="field">{t('companyDashboard.requirementsLabel')}<textarea name="requirements" /></label>
          <label className="field" style={{ display: 'flex', gap: 10, alignItems: 'center', fontWeight: 500 }}>
            <input type="checkbox" name="faculty_verified" style={{ width: 'auto', margin: 0 }} />
            {t('companyDashboard.facultyVerifiedCheckbox')}
          </label>
          <button className="btn">{t('companyDashboard.publishPosting')}</button>
        </form>
      )}
    </main>
  );
}
