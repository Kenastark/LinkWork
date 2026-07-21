import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';

export default function Alerts() {
  const [follows, setFollows] = useState([]);

  const load = () => api.get('/api/my-follows').then(d => setFollows(d.follows));
  useEffect(load, []);

  const unfollow = async (companyId) => { await api.post(`/api/companies/${companyId}/unfollow`); load(); };

  return (
    <main className="container" style={{ maxWidth: 640 }}>
      <h2 style={{ fontSize: 30, marginBottom: 6 }}>Alerts</h2>
      <p className="muted" style={{ marginBottom: 20 }}>Follow companies from their profile page to see their new openings here.</p>

      {follows.length === 0 ? (
        <Card>
          <p className="muted">You're not following any companies yet.</p>
          <Link to="/companies" className="btn sm" style={{ marginTop: 12 }}>Explore companies</Link>
        </Card>
      ) : follows.map(f => (
        <Card key={f.follow_id}>
          <div className="job-row">
            <div>
              <h3><Link to={`/companies/${f.company_id}`} style={{ color: 'inherit' }}>{f.name}</Link></h3>
              <p className="muted">{f.open_jobs} open position{f.open_jobs === 1 ? '' : 's'}</p>
            </div>
            <Button size="sm" variant="danger" onClick={() => unfollow(f.company_id)}>Unfollow</Button>
          </div>
        </Card>
      ))}
    </main>
  );
}
