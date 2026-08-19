import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { useI18n } from '../i18n.jsx';

export default function Alerts() {
  const [follows, setFollows] = useState([]);
  const [error, setError] = useState('');
  const { t } = useI18n();

  const load = () => api.get('/api/my-follows').then(d => setFollows(d.follows)).catch(e => setError(e.message));
  useEffect(() => { load(); }, []);

  const unfollow = async (companyId) => {
    setError('');
    try { await api.post(`/api/companies/${companyId}/unfollow`); await load(); }
    catch (e) { setError(e.message); }
  };

  return (
    <main className="container" style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 30, marginBottom: 6 }}>{t('alerts.title')}</h1>
      <p className="muted" style={{ marginBottom: 20 }}>{t('alerts.subtitle')}</p>

      {error && <div className="alert error" role="alert">{error}</div>}

      {follows.length === 0 ? (
        <Card>
          <p className="muted">{t('alerts.empty')}</p>
          <Link to="/companies" className="btn sm" style={{ marginTop: 12 }}>{t('alerts.exploreCompanies')}</Link>
        </Card>
      ) : follows.map(f => (
        <Card key={f.follow_id}>
          <div className="job-row">
            <div>
              <h3><Link to={`/companies/${f.company_id}`} style={{ color: 'inherit' }}>{f.name}</Link></h3>
              <p className="muted">{t(f.open_jobs === 1 ? 'alerts.openPositionOne' : 'alerts.openPositionOther', { n: f.open_jobs })}</p>
            </div>
            <Button size="sm" variant="danger" onClick={() => unfollow(f.company_id)}>{t('alerts.unfollow')}</Button>
          </div>
        </Card>
      ))}
    </main>
  );
}
