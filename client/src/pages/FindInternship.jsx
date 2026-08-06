import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';

const WORK_MODES = [['on_site', 'On-site'], ['hybrid', 'Hybrid'], ['remote', 'Fully remote']];
const JOB_TYPES = [['internship', 'Internship'], ['entry_level', 'Entry level']];
const SALARY_MINS = [[0, 'Any salary'], [250000, '250K+ HUF/mo'], [400000, '400K+ HUF/mo'], [500000, '500K+ HUF/mo']];

function formatHuf(n) { return `${Math.round(n / 1000)}K HUF/mo`; }

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
    ...facultyIds.map(id => ({ key: `fac-${id}`, label: faculties.find(f => f.id === id)?.name || 'Faculty', clear: () => toggle(facultyIds, setFacultyIds, id) })),
    ...locations.map(l => ({ key: `loc-${l}`, label: l, clear: () => toggle(locations, setLocations, l) })),
    ...workModes.map(w => ({ key: `wm-${w}`, label: WORK_MODES.find(x => x[0] === w)[1], clear: () => toggle(workModes, setWorkModes, w) })),
    ...jobTypes.map(t => ({ key: `type-${t}`, label: JOB_TYPES.find(x => x[0] === t)[1], clear: () => toggle(jobTypes, setJobTypes, t) })),
    ...(salaryMin ? [{ key: 'sal', label: SALARY_MINS.find(x => x[0] === salaryMin)[1], clear: () => setSalaryMin(0) }] : []),
    ...(verifiedOnly ? [{ key: 'verified', label: 'Faculty partnerships only', clear: () => setVerifiedOnly(false) }] : []),
  ];

  return (
    <main className="container">
      <h2 style={{ fontSize: 30, marginBottom: 4 }}>Find an internship</h2>
      <p className="muted" style={{ marginBottom: 20 }}>Openings for your university ({filtered.length} of {jobs.length})</p>

      <div className="filter-layout">
        <aside className="filter-sidebar">
          <div className="card filter-prefs">
            <h3 style={{ fontSize: 17, marginBottom: 12 }}>Your preferences</h3>
            {activeChips.length === 0
              ? <p className="muted" style={{ fontSize: 13.5 }}>No filters applied — every open posting is shown.</p>
              : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {activeChips.map(c => (
                    <span key={c.key} className="pref-chip" onClick={c.clear}>{c.label} ✕</span>
                  ))}
                </div>
              )}
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 10 }}>Edit preferences</h3>

            <FilterSection title="Role" icon="💼" open={!!openSections.role} onToggle={() => toggleSection('role')}>
              <input placeholder="Search by title…" value={keyword} onChange={e => setKeyword(e.target.value)} style={{ marginBottom: 12 }} />
              <p className="filter-label">Faculty</p>
              {faculties.map(f => (
                <label key={f.id} className="filter-check">
                  <input type="checkbox" checked={facultyIds.includes(f.id)} onChange={() => toggle(facultyIds, setFacultyIds, f.id)} />
                  {f.name}
                </label>
              ))}
            </FilterSection>

            <FilterSection title="Location" icon="📍" open={!!openSections.location} onToggle={() => toggleSection('location')}>
              {jobLocations.map(l => (
                <label key={l} className="filter-check">
                  <input type="checkbox" checked={locations.includes(l)} onChange={() => toggle(locations, setLocations, l)} />
                  {l}
                </label>
              ))}
              <p className="filter-label" style={{ marginTop: 10 }}>Work mode</p>
              {WORK_MODES.map(([val, label]) => (
                <label key={val} className="filter-check">
                  <input type="checkbox" checked={workModes.includes(val)} onChange={() => toggle(workModes, setWorkModes, val)} />
                  {label}
                </label>
              ))}
            </FilterSection>

            <FilterSection title="Contract and salary" icon="💳" open={!!openSections.contract} onToggle={() => toggleSection('contract')}>
              {JOB_TYPES.map(([val, label]) => (
                <label key={val} className="filter-check">
                  <input type="checkbox" checked={jobTypes.includes(val)} onChange={() => toggle(jobTypes, setJobTypes, val)} />
                  {label}
                </label>
              ))}
              <p className="filter-label" style={{ marginTop: 10 }}>Minimum salary</p>
              <select value={salaryMin} onChange={e => setSalaryMin(Number(e.target.value))}>
                {SALARY_MINS.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
            </FilterSection>

            <FilterSection title="Company and culture" icon="🏛" open={!!openSections.culture} onToggle={() => toggleSection('culture')}>
              <label className="filter-check">
                <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} />
                Faculty partnerships only
              </label>
            </FilterSection>
          </div>
        </aside>

        <div className="filter-results">
          {filtered.length === 0 ? (
            <div className="card"><p className="muted">No openings match your filters right now. Try clearing a filter or check back soon.</p></div>
          ) : filtered.map(j => (
            <div className="card job-card" key={j.id}>
              <span className="id-tag">JOB-{String(j.id).padStart(4, '0')}</span>
              <div className="job-row">
                <div>
                  <h3><Link to={`/jobs/${j.id}`} style={{ color: 'inherit' }}>{j.title}</Link></h3>
                  <p className="muted">{j.company_name} · {j.positions - j.filled} of {j.positions} position{j.positions > 1 ? 's' : ''} open</p>
                  <div className="meta">
                    {j.faculty_verified ? (
                      <span className="badge faculty">★ Faculty partnership · {j.faculty_name || 'University-wide'}</span>
                    ) : (
                      <span className="badge verified">✓ Platform-committed hire</span>
                    )}
                    <span className="badge pending">{j.job_type === 'internship' ? 'Internship' : 'Entry level'}</span>
                    {j.location && <span className="badge pending">📍 {j.location}</span>}
                    {j.work_mode && <span className="badge pending">{WORK_MODES.find(w => w[0] === j.work_mode)?.[1] || j.work_mode}</span>}
                    {j.salary_huf ? <span className="badge pending">{formatHuf(j.salary_huf)}</span> : null}
                  </div>
                </div>
                <Link to={`/jobs/${j.id}`} className="btn sm">View & apply</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
