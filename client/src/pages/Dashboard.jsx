import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import { useI18n } from '../i18n.jsx';

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [msg, setMsg] = useState('');
  const { t } = useI18n();

  useEffect(() => { api.get('/api/my-applications/stats').then(d => setStats(d.stats)); }, []);

  const submitDocs = async () => {
    await api.post('/api/student/submit-docs', { note: 'Student ID and enrollment certificate submitted' });
    const me = await api.get('/api/auth/me');
    setUser(me.user);
    setMsg(t('dashboard.docsMsg'));
  };

  return (
    <main className="container">
      <h1 style={{ fontSize: 30, marginBottom: 4 }}>{t('dashboard.greeting', { name: user.name.split(' ')[0] })}</h1>
      <p className="muted" style={{ marginBottom: 20 }}>
        <span className="id-tag">STU-{String(user.id).padStart(4, '0')}</span> · {t('dashboard.idLine', { major: user.major })}
      </p>

      {msg && <div className="alert ok" role="status">{msg}</div>}

      {user.doc_status === 'none' && (
        <div className="alert info">
          <b>{t('dashboard.docsStepTitle')}</b> {t('dashboard.docsStepBody')}{' '}
          <button className="btn sm" style={{ marginLeft: 8 }} onClick={submitDocs}>{t('dashboard.submitDocuments')}</button>
        </div>
      )}
      {user.doc_status === 'submitted' && <div className="alert info">{t('dashboard.docsUnderReview')}</div>}
      {user.doc_status === 'rejected' && <div className="alert error" role="alert">{t('dashboard.docsRejected')} <button className="btn sm danger" style={{ marginLeft: 8 }} onClick={submitDocs}>{t('dashboard.resubmit')}</button></div>}
      {user.doc_status === 'verified' && <div className="alert ok" role="status">{t('dashboard.identityVerified')} <span className="badge verified">{t('dashboard.verifiedBadge')}</span></div>}

      <h3 style={{ margin: '24px 0 12px', fontSize: 18 }}>{t('dashboard.applicationsTitle')}</h3>
      {!stats ? null : (
        <div className="grid cols-3">
          <div className="card"><span className="id-tag">{t('dashboard.ongoing')}</span><h3 style={{ fontSize: 34 }}>{stats.ongoing}</h3></div>
          <div className="card"><span className="id-tag">{t('dashboard.offers')}</span><h3 style={{ fontSize: 34, color: 'var(--verify)' }}>{stats.offers}</h3></div>
          <div className="card"><span className="id-tag">{t('dashboard.rejected')}</span><h3 style={{ fontSize: 34, color: 'var(--danger)' }}>{stats.rejected}</h3></div>
        </div>
      )}
    </main>
  );
}
