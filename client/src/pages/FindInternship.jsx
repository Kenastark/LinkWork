import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import { useTranslatedTexts } from '../useTranslatedTexts.js';
import { useI18n } from '../i18n.jsx';

const WORK_MODES = [['on_site', 'findInternship.modeOnSite'], ['hybrid', 'findInternship.modeHybrid'], ['remote', 'findInternship.modeRemote']];
const JOB_TYPES = [['internship', 'findInternship.typeInternship'], ['entry_level', 'findInternship.typeEntryLevel']];
const SALARY_MINS = [0, 250000, 400000, 500000];

function FilterSection({ title, icon, open, onToggle, children }) {
  return (
    <div className="filter-section">
      <button type="button" className="filter-section-head" onClick={onToggle}>
        <span>{icon} {title}</span>
        <span className={`filter-chevron${open ? ' open' : ''}`}>⌄</span>
      </button>
      {open && <div className="filter-section-body">{children}</div>}
    </div>
  );
}

export default function FindInternship() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [jobs, setJobs] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [openSections, setOpenSections] = useState({ role: true });
  const [keyword, setKeyword] = useState('');
  const [jobTypes, setJobTypes] = useState([]);
  const [facultyIds, setFacultyIds] = useState([]);
  const [locations, setLocations] = useState([]);
  const [workModes, setWorkModes] = useState([]);
  const [salaryMin, setSalaryMin] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const salaryLabel = (val) => val === 0 ? t('findInternship.salaryAny') : t('findInternship.salaryMinOption', { amount: Math.round(val / 1000) });
  const formatHuf = (n) => t('findInternship.salaryAmount', { amount: Math.round(n / 1000) });

  const translatedTitles = useTranslatedTexts(jobs.map(j => j.title));
  const translatedFacultyNames = useTranslatedTexts(faculties.map(f => f.name));
  const translatedJobFacultyNames = useTranslatedTexts(jobs.map(j => j.faculty_name || ''));
  const titleFor = (job) => translatedTitles[jobs.indexOf(job)] ?? job.title;
  const facultyNameFor = (id) => {
    const i = faculties.findIndex(f => f.id === id);
    return i === -1 ? null : translatedFacultyNames[i];
  };
  const jobFacultyNameFor = (job) => translatedJobFacultyNames[jobs.indexOf(job)] || null;

  useEffect(() => {
    api.get('/api/jobs').then(d => setJobs(d.jobs));
    api.get('/api/meta').then(d => setFaculties(d.faculties.filter(f => f.university_id === user.university_id)));
  }, [user.university_id]);

  const toggle = (list, setList, value) => setList(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
  const toggleSection = (key) => setOpenSections(s => ({ ...s, [key]: !s[key] }));

  const jobLocations = useMemo(() => [...new Set(jobs.map(j => j.location).filter(Boolean))].sort(), [jobs]);

  const filtered = useMemo(() => jobs.filter(j => {
    if (keyword && !j.title.toLowerCase().includes(keyword.toLowerCase())) return false;
    if (facultyIds.length && !facultyIds.includes(j.faculty_id)) return false;
    if (locations.length && !locations.includes(j.location)) return false;
    if (workModes.length && !workModes.includes(j.work_mode)) return false;
    if (jobTypes.length && !jobTypes.includes(j.job_type)) return false;
    if (salaryMin && (!j.salary_huf || j.salary_huf < salaryMin)) return false;
    if (verifiedOnly && !j.faculty_verified) return false;
    return true;
  }), [jobs, keyword, jobTypes, facultyIds, locations, workModes, salaryMin, verifiedOnly]);

  const activeChips = [
    ...(keyword ? [{ key: 'kw', label: `"${keyword}"`, clear: () => setKeyword('') }] : []),
    ...facultyIds.map(id => ({ key: `fac-${id}`, label: facultyNameFor(id) || t('findInternship.facultyFallback'), clear: () => toggle(facultyIds, setFacultyIds, id) })),
    ...locations.map(l => ({ key: `loc-${l}`, label: l, clear: () => toggle(locations, setLocations, l) })),
    ...workModes.map(w => ({ key: `wm-${w}`, label: t(WORK_MODES.find(x => x[0] === w)[1]), clear: () => toggle(workModes, setWorkModes, w) })),
    ...jobTypes.map(jt => ({ key: `type-${jt}`, label: t(JOB_TYPES.find(x => x[0] === jt)[1]), clear: () => toggle(jobTypes, setJobTypes, jt) })),
    ...(salaryMin ? [{ key: 'sal', label: salaryLabel(salaryMin), clear: () => setSalaryMin(0) }] : []),
    ...(verifiedOnly ? [{ key: 'verified', label: t('findInternship.facultyPartnershipsOnly'), clear: () => setVerifiedOnly(false) }] : []),
  ];

  return (
    <main className="container">
      <h1 style={{ fontSize: 30, marginBottom: 4 }}>{t('findInternship.title')}</h1>
      <p className="muted" style={{ marginBottom: 20 }}>{t('findInternship.subtitle', { shown: filtered.length, total: jobs.length })}</p>

      <div className="filter-layout">
        <aside className="filter-sidebar">
          <div className="card filter-prefs">
            <h2 style={{ fontSize: 17, marginBottom: 12 }}>{t('findInternship.yourPreferences')}</h2>
            {activeChips.length === 0
              ? <p className="muted" style={{ fontSize: 13.5 }}>{t('findInternship.noFiltersApplied')}</p>
              : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {activeChips.map(c => (
                    <span key={c.key} className="pref-chip" onClick={c.clear}>{c.label} ✕</span>
                  ))}
                </div>
              )}
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h2 style={{ fontSize: 15, marginBottom: 10 }}>{t('findInternship.editPreferences')}</h2>

            <FilterSection title={t('findInternship.sectionRole')} icon="💼" open={!!openSections.role} onToggle={() => toggleSection('role')}>
              <input placeholder={t('findInternship.searchPlaceholder')} value={keyword} onChange={e => setKeyword(e.target.value)} style={{ marginBottom: 12 }} />
              <p className="filter-label">{t('findInternship.facultyLabel')}</p>
              {faculties.map((f, i) => (
                <label key={f.id} className="filter-check">
                  <input type="checkbox" checked={facultyIds.includes(f.id)} onChange={() => toggle(facultyIds, setFacultyIds, f.id)} />
                  {translatedFacultyNames[i]}
                </label>
              ))}
            </FilterSection>

            <FilterSection title={t('findInternship.sectionLocation')} icon="📍" open={!!openSections.location} onToggle={() => toggleSection('location')}>
              {jobLocations.map(l => (
                <label key={l} className="filter-check">
                  <input type="checkbox" checked={locations.includes(l)} onChange={() => toggle(locations, setLocations, l)} />
                  {l}
                </label>
              ))}
              <p className="filter-label" style={{ marginTop: 10 }}>{t('findInternship.workModeLabel')}</p>
              {WORK_MODES.map(([val, key]) => (
                <label key={val} className="filter-check">
                  <input type="checkbox" checked={workModes.includes(val)} onChange={() => toggle(workModes, setWorkModes, val)} />
                  {t(key)}
                </label>
              ))}
            </FilterSection>

            <FilterSection title={t('findInternship.sectionContract')} icon="💳" open={!!openSections.contract} onToggle={() => toggleSection('contract')}>
              {JOB_TYPES.map(([val, key]) => (
                <label key={val} className="filter-check">
                  <input type="checkbox" checked={jobTypes.includes(val)} onChange={() => toggle(jobTypes, setJobTypes, val)} />
                  {t(key)}
                </label>
              ))}
              <p className="filter-label" style={{ marginTop: 10 }}>{t('findInternship.minSalaryLabel')}</p>
              <select value={salaryMin} onChange={e => setSalaryMin(Number(e.target.value))}>
                {SALARY_MINS.map(val => <option key={val} value={val}>{salaryLabel(val)}</option>)}
              </select>
            </FilterSection>

            <FilterSection title={t('findInternship.sectionCompany')} icon="🏛" open={!!openSections.culture} onToggle={() => toggleSection('culture')}>
              <label className="filter-check">
                <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} />
                {t('findInternship.facultyPartnershipsOnly')}
              </label>
            </FilterSection>
          </div>
        </aside>

        <div className="filter-results">
          {filtered.length === 0 ? (
            <div className="card"><p className="muted">{t('findInternship.noMatches')}</p></div>
          ) : filtered.map(j => (
            <div className="card job-card" key={j.id}>
              <span className="id-tag">JOB-{String(j.id).padStart(4, '0')}</span>
              <div className="job-row">
                <div>
                  <h3><Link to={`/jobs/${j.id}`} style={{ color: 'inherit' }}>{titleFor(j)}</Link></h3>
                  <p className="muted">{j.company_name} · {t(j.positions === 1 ? 'findInternship.positionsOpenOne' : 'findInternship.positionsOpenOther', { open: j.positions - j.filled, total: j.positions })}</p>
                  <div className="meta">
                    {j.faculty_verified ? (
                      <span className="badge faculty">{t('findInternship.facultyPartnershipBadge', { faculty: jobFacultyNameFor(j) || t('findInternship.universityWide') })}</span>
                    ) : (
                      <span className="badge verified">{t('findInternship.platformCommitted')}</span>
                    )}
                    <span className="badge pending">{j.job_type === 'internship' ? t('findInternship.typeInternship') : t('findInternship.typeEntryLevel')}</span>
                    {j.location && <span className="badge pending">📍 {j.location}</span>}
                    {j.work_mode && <span className="badge pending">{WORK_MODES.find(w => w[0] === j.work_mode) ? t(WORK_MODES.find(w => w[0] === j.work_mode)[1]) : j.work_mode}</span>}
                    {j.salary_huf ? <span className="badge pending">{formatHuf(j.salary_huf)}</span> : null}
                  </div>
                </div>
                <Link to={`/jobs/${j.id}`} className="btn sm">{t('findInternship.viewApply')}</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
