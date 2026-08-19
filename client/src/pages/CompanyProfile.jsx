import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import { useTranslatedTexts } from '../useTranslatedTexts.js';
import Card from '../components/Card.jsx';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';

export default function CompanyProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api.get(`/api/companies/${id}`).then(setData).catch(e => setError(e.message));
  useEffect(() => { load(); }, [id]);

  const [description, name] = useTranslatedTexts([
    data?.company?.description || '', data?.company?.name || '',
  ]);

  if (error) return <main className="container"><div className="alert error" role="alert">{error}</div></main>;
  if (!data) return <main className="container" />;
  const { company, jobs, following } = data;

  const toggleFollow = async () => {
    setBusy(true);
    try {
      await api.post(`/api/companies/${id}/${following ? 'unfollow' : 'follow'}`);
      await load();
    } finally { setBusy(false); }
  };

  return (
    <main className="container" style={{ maxWidth: 780 }}>
      <Card>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="company-mono" style={{ width: 64, height: 64, fontSize: 26 }}>{company.name.charAt(0).toUpperCase()}</span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: 26 }}>{name}</h1>
            {company.website && <a className="ext-link" href={company.website} target="_blank" rel="noreferrer">{company.website}</a>}
          </div>
          {user.role === 'student' && (
            <Button variant={following ? 'secondary' : ''} disabled={busy} onClick={toggleFollow}>
              {following ? 'Following ✓' : 'Follow'}
            </Button>
          )}
        </div>
        {company.description && <p className="muted" style={{ marginTop: 16 }}>{description}</p>}
      </Card>

      <h3 style={{ margin: '24px 0 12px', fontSize: 18 }}>Open positions ({jobs.length})</h3>
      {jobs.length === 0 ? (
        <Card><p className="muted">No open positions right now.</p></Card>
      ) : jobs.map(j => (
        <Card key={j.id} className="job-card">
          <span className="id-tag">JOB-{String(j.id).padStart(4, '0')}</span>
          <div className="job-row">
            <div>
              <h3><Link to={`/jobs/${j.id}`} style={{ color: 'inherit' }}>{j.title}</Link></h3>
              <div className="meta">
                {j.faculty_verified ? <Badge variant="faculty">★ Faculty partnership · {j.faculty_name || 'University-wide'}</Badge> : <Badge variant="verified">✓ Platform-committed hire</Badge>}
                <Badge variant="pending">{j.job_type === 'internship' ? 'Internship' : 'Entry level'}</Badge>
              </div>
            </div>
            <Link to={`/jobs/${j.id}`} className="btn sm">View & apply</Link>
          </div>
        </Card>
      ))}
    </main>
  );
}
