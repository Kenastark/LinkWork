import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';

export default function JobAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState('');

  const load = () => api.get('/api/job-alerts').then(d => setAlerts(d.alerts));
  useEffect(() => { load(); api.get('/api/meta').then(setMeta); }, []);

  const uniFaculties = meta?.faculties?.filter(f => f.university_id === user.university_id) || [];

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const fd = Object.fromEntries(new FormData(e.target));
    fd.notify_email = fd.notify_email === 'on';
    try {
      await api.post('/api/job-alerts', fd);
      e.target.reset();
      load();
    } catch (err) { setError(err.message); }
  };

  const remove = async (id) => { await api.post(`/api/job-alerts/${id}/delete`); load(); };

  return (
    <main className="container" style={{ maxWidth: 640 }}>
      <h2 style={{ fontSize: 30, marginBottom: 20 }}>Job alerts</h2>
      {error && <div className="alert error">{error}</div>}

      <form className="card" onSubmit={submit}>
        <h3>Create an alert</h3>
        <p className="muted" style={{ margin: '8px 0 18px' }}>Get notified when a matching opening is posted.</p>
        <label className="field">Faculty <span className="hint">(optional)</span>
          <select name="faculty_id" defaultValue="">
            <option value="">Any faculty</option>
            {uniFaculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </label>
        <label className="field">Job type <span className="hint">(optional)</span>
          <select name="job_type" defaultValue="">
            <option value="">Any type</option>
            <option value="internship">Internship</option>
            <option value="entry_level">Entry level</option>
          </select>
        </label>
        <label className="field">Keyword <span className="hint">(optional)</span><input name="keyword" placeholder="e.g. backend" /></label>
        <label className="field" style={{ display: 'flex', gap: 10, alignItems: 'center', fontWeight: 500 }}>
          <input type="checkbox" name="notify_email" style={{ width: 'auto', margin: 0 }} />
          Notify me by email
        </label>
        <button className="btn">Create alert</button>
      </form>

      <h3 style={{ margin: '24px 0 12px', fontSize: 18 }}>Your alerts ({alerts.length})</h3>
      {alerts.length === 0 ? (
        <div className="card"><p className="muted">No alerts yet.</p></div>
      ) : alerts.map(a => (
        <div className="card" key={a.id}>
          <div className="job-row">
            <p className="muted">
              {a.faculty_id ? uniFaculties.find(f => f.id === a.faculty_id)?.name || 'A faculty' : 'Any faculty'}
              {' · '}{a.job_type ? (a.job_type === 'internship' ? 'Internship' : 'Entry level') : 'Any type'}
              {a.keyword ? ` · "${a.keyword}"` : ''}
              {a.notify_email ? ' · email on' : ''}
            </p>
            <button className="btn sm danger" onClick={() => remove(a.id)}>Delete</button>
          </div>
        </div>
      ))}
    </main>
  );
}
