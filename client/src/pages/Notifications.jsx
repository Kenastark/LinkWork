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
  const [tab, setTab] = useState('notifications');
  const [items, setItems] = useState([]);
  const [openId, setOpenId] = useState(null); // which notification is expanded

  const load = () => api.get('/api/notifications').then(d => setItems(d.notifications)).catch(() => {});
  useEffect(() => { load(); }, []);

  const markAll = async () => { await api.post('/api/notifications/read-all'); load(); };

  // Opening (expanding) a notification marks it as read.
  const toggle = async (n) => {
    const opening = openId !== n.id;
    setOpenId(opening ? n.id : null);
    if (opening && !n.read_at) {
      setItems(list => list.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x));
      try { await api.post(`/api/notifications/${n.id}/read`); } catch { /* non-blocking */ }
    }
  };

  const unread = items.filter(n => !n.read_at).length;

  return (
    <main className="container" style={{ maxWidth: 720 }}>
      <h2 style={{ fontSize: 30, marginBottom: 16 }}>Inbox</h2>

      <div className="tabs">
        <button className={tab === 'notifications' ? 'active' : ''} onClick={() => setTab('notifications')}>
          Notifications{unread > 0 ? ` (${unread})` : ''}
        </button>
        <button className={tab === 'messages' ? 'active' : ''} onClick={() => setTab('messages')}>
          Messages
        </button>
      </div>

      {tab === 'notifications' && (
        <>
          {unread > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button className="btn sm secondary" onClick={markAll}>Mark all read</button>
            </div>
          )}
          {items.length === 0 ? (
            <div className="card"><p className="muted">Nothing yet. Updates about your interviews and application progress will appear here.</p></div>
          ) : items.map(n => (
            <div key={n.id} className={`notif-item${n.read_at ? '' : ' unread'}`} onClick={() => toggle(n)} role="button" tabIndex={0}>
              <div className="notif-subject">
                {!n.read_at && <span className="notif-unread-dot" aria-label="Unread" />}
                {n.subject}
              </div>
              {openId === n.id && <div className="notif-body">{n.body}</div>}
              <div className="notif-time">
                {timeAgo(n.created_at)}
                {openId === n.id && n.link && <> · <Link to={n.link} onClick={e => e.stopPropagation()}>Open</Link></>}
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 'messages' && (
        <div className="card">
          <span className="badge pending">Coming soon</span>
          <p className="muted" style={{ marginTop: 12 }}>
            Direct two-way messaging with companies is on the way — you'll be able to hear from a
            company and reply right here, alongside your notifications. For now, interview and
            application updates arrive in the Notifications tab.
          </p>
        </div>
      )}
    </main>
  );
}
