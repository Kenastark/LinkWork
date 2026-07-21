import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { api.get('/api/my-applications/stats').then(d => setStats(d.stats)); }, []);

  const submitDocs = async () => {
    await api.post('/api/student/submit-docs', { note: 'Student ID and enrollment certificate submitted' });
    const me = await api.get('/api/auth/me');
    setUser(me.user);
    setMsg('Documents submitted. The admin will verify them shortly — you can apply once verified.');
  };

  return (
    <main className="container">
      <h2 style={{ fontSize: 30, marginBottom: 4 }}>Hello, {user.name.split(' ')[0]}</h2>
      <p className="muted" style={{ marginBottom: 20 }}>
        <span className="id-tag">STU-{String(user.id).padStart(4, '0')}</span> · {user.major} · University of Debrecen
      </p>

      {msg && <div className="alert ok">{msg}</div>}

      {user.doc_status === 'none' && (
        <div className="alert info">
          <b>One step before you can apply:</b> submit your student documents (student ID + enrollment certificate) so the admin can verify your identity.{' '}
          <button className="btn sm" style={{ marginLeft: 8 }} onClick={submitDocs}>Submit documents</button>
        </div>
      )}
      {user.doc_status === 'submitted' && <div className="alert info">Your documents are under review. You can browse openings meanwhile.</div>}
      {user.doc_status === 'rejected' && <div className="alert error">Your documents were rejected. <button className="btn sm danger" style={{ marginLeft: 8 }} onClick={submitDocs}>Resubmit</button></div>}
      {user.doc_status === 'verified' && <div className="alert ok">Identity verified <span className="badge verified">✓ Verified student</span></div>}

      <h3 style={{ margin: '24px 0 12px', fontSize: 18 }}>Your applications</h3>
      {!stats ? null : (
        <div className="grid cols-3">
          <div className="card"><span className="id-tag">ONGOING</span><h3 style={{ fontSize: 34 }}>{stats.ongoing}</h3></div>
          <div className="card"><span className="id-tag">OFFERS</span><h3 style={{ fontSize: 34, color: 'var(--verify)' }}>{stats.offers}</h3></div>
          <div className="card"><span className="id-tag">REJECTED</span><h3 style={{ fontSize: 34, color: 'var(--danger)' }}>{stats.rejected}</h3></div>
        </div>
      )}
    </main>
  );
}
