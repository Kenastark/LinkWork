import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

function timeAgo(iso) {
  const then = new Date(iso + 'Z').getTime();
  if (isNaN(then)) return '';
  const s = Math.floor((Date.now() - then) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Notifications() {
  const [items, setItems] = useState([]);

  const load = () => api.get('/api/notifications').then(d => setItems(d.notifications)).catch(() => {});
  useEffect(() => { load(); }, []);

  const markAll = async () => { await api.post('/api/notifications/read-all'); load(); };
  const open = async (n) => {
    if (!n.read_at) { await api.post(`/api/notifications/${n.id}/read`); load(); }
  };

  const unread = items.filter(n => !n.read_at).length;

  return (
    <main className="container" style={{ maxWidth: 720 }}>
      <div className="job-row" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 30 }}>Notifications</h2>
        {unread > 0 && <button className="btn sm secondary" onClick={markAll}>Mark all read</button>}
      </div>

      {items.length === 0 ? (
        <div className="card"><p className="muted">Nothing yet. Updates about your interviews and application progress will appear here.</p></div>
      ) : items.map(n => (
        <div key={n.id} className={`notif-item${n.read_at ? '' : ' unread'}`} onClick={() => open(n)}>
          <div className="notif-subject">{n.subject}</div>
          <div className="notif-body">{n.body}</div>
          <div className="notif-time">
            {timeAgo(n.created_at)}
            {n.link && <> · <Link to={n.link} onClick={e => e.stopPropagation()}>Open</Link></>}
          </div>
        </div>
      ))}
    </main>
  );
}
