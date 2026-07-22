import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';

export default function FindInternship() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [jobTypes, setJobTypes] = useState([]); // ['internship','entry_level']
  const [facultyIds, setFacultyIds] = useState([]); // [id, ...]

  useEffect(() => {
    api.get('/api/jobs').then(d => setJobs(d.jobs));
    api.get('/api/meta').then(d => setFaculties(d.faculties.filter(f => f.university_id === user.university_id)));
  }, [user.university_id]);

  const toggle = (list, setList, value) => {
    setList(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
  };

  const filtered = useMemo(() => jobs.filter(j => {
    if (keyword && !j.title.toLowerCase().includes(keyword.toLowerCase())) return false;
    if (jobTypes.length && !jobTypes.includes(j.job_type)) return false;
    if (facultyIds.length && !facultyIds.includes(j.faculty_id)) return false;
    return true;
  }), [jobs, keyword, jobTypes, facultyIds]);

  const activeChips = [
    ...jobTypes.map(t => ({ key: `type-${t}`, label: t === 'internship' ? 'Internship' : 'Entry level', clear: () => toggle(jobTypes, setJobTypes, t) })),
    ...facultyIds.map(id => ({ key: `fac-${id}`, label: faculties.find(f => f.id === id)?.name || 'Faculty', clear: () => toggle(facultyIds, setFacultyIds, id) })),
    ...(keyword ? [{ key: 'kw', label: `"${keyword}"`, clear: () => setKeyword('') }] : []),
  ];

  return (
    <main className="container">
      <h2 style={{ fontSize: 30, marginBottom: 4 }}>Find an internship</h2>
      <p className="muted" style={{ marginBottom: 20 }}>Openings for your university ({filtered.length} of {jobs.length})</p>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="job-row">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {activeChips.length === 0
              ? <span className="muted">No filters applied</span>
              : activeChips.map(c => (
                <span key={c.key} className="badge verified" style={{ cursor: 'pointer' }} onClick={c.clear}>{c.label} ✕</span>
              ))}
          </div>
          <button className="btn sm secondary" onClick={() => setPanelOpen(o => !o)}>{panelOpen ? 'Hide filters' : 'Edit filters'}</button>
        </div>

        {panelOpen && (
          <div style={{ marginTop: 18, display: 'grid', gap: 18 }}>
            <div>
              <p style={{ fontWeight: 700, marginBottom: 8 }}>Role</p>
              <input placeholder="Search by title…" value={keyword} onChange={e => setKeyword(e.target.value)} style={{ marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 16 }}>
                {[['internship', 'Internship'], ['entry_level', 'Entry level']].map(([val, label]) => (
                  <label key={val} style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 400 }}>
                    <input type="checkbox" style={{ width: 'auto' }} checked={jobTypes.includes(val)} onChange={() => toggle(jobTypes, setJobTypes, val)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontWeight: 700, marginBottom: 8 }}>Faculty</p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {faculties.map(f => (
                  <label key={f.id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 400 }}>
                    <input type="checkbox" style={{ width: 'auto' }} checked={facultyIds.includes(f.id)} onChange={() => toggle(facultyIds, setFacultyIds, f.id)} />
                    {f.name}
                  </label>
                ))}
              </div>
            </div>
            <button className="btn sm" style={{ justifySelf: 'start' }} onClick={() => setPanelOpen(false)}>Save</button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card"><p className="muted">No openings match your filters right now. Try clearing a filter or check back soon.</p></div>
      ) : filtered.map(j => (
        <div className="card" key={j.id}>
          <div className="job-row">
            <div>
              <span className="id-tag">JOB-{String(j.id).padStart(4, '0')}</span>
              <h3><Link to={`/jobs/${j.id}`} style={{ color: 'inherit' }}>{j.title}</Link></h3>
              <p className="muted">{j.company_name} · {j.positions - j.filled} of {j.positions} position{j.positions > 1 ? 's' : ''} open</p>
              <div className="meta">
                {j.faculty_verified ? (
                  <span className="badge faculty">★ Faculty partnership · {j.faculty_name || 'University-wide'}</span>
                ) : (
                  <span className="badge verified">✓ Platform-committed hire</span>
                )}
                <span className="badge pending">{j.job_type === 'internship' ? 'Internship' : 'Entry level'}</span>
              </div>
            </div>
            <Link to={`/jobs/${j.id}`} className="btn sm">View & apply</Link>
          </div>
        </div>
      ))}
    </main>
  );
}
