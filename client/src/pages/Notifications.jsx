import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useI18n } from '../i18n.jsx';

function timeAgo(iso, t) {
  const then = new Date(iso + 'Z').getTime();
  if (isNaN(then)) return '';
  const s = Math.floor((Date.now() - then) / 1000);
  if (s < 60) return t('notifications.justNow');
  if (s < 3600) return t('notifications.minutesAgo', { n: Math.floor(s / 60) });
  if (s < 86400) return t('notifications.hoursAgo', { n: Math.floor(s / 3600) });
  return t('notifications.daysAgo', { n: Math.floor(s / 86400) });
}

export default function Notifications() {
  const [tab, setTab] = useState('notifications');
  const [items, setItems] = useState([]);
  const [openId, setOpenId] = useState(null); // which notification is expanded
  const { t } = useI18n();

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
      <h1 style={{ fontSize: 30, marginBottom: 16 }}>{t('notifications.title')}</h1>

      <div className="tabs">
        <button className={tab === 'notifications' ? 'active' : ''} onClick={() => setTab('notifications')}>
          {t('notifications.tabNotifications')}{unread > 0 ? ` (${unread})` : ''}
        </button>
        <button className={tab === 'messages' ? 'active' : ''} onClick={() => setTab('messages')}>
          {t('notifications.tabMessages')}
        </button>
      </div>

      {tab === 'notifications' && (
        <>
          {unread > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button className="btn sm secondary" onClick={markAll}>{t('notifications.markAllRead')}</button>
            </div>
          )}
          {items.length === 0 ? (
            <div className="card"><p className="muted">{t('notifications.empty')}</p></div>
          ) : items.map(n => (
            <div key={n.id} className={`notif-item${n.read_at ? '' : ' unread'}`} onClick={() => toggle(n)} role="button" tabIndex={0}>
              <div className="notif-subject">
                {!n.read_at && <span className="notif-unread-dot" aria-label={t('notifications.unreadAriaLabel')} />}
                {n.subject}
              </div>
              {openId === n.id && <div className="notif-body">{n.body}</div>}
              <div className="notif-time">
                {timeAgo(n.created_at, t)}
                {openId === n.id && n.link && <> · <Link to={n.link} onClick={e => e.stopPropagation()}>{t('notifications.open')}</Link></>}
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 'messages' && (
        <div className="card">
          <span className="badge pending">{t('notifications.comingSoon')}</span>
          <p className="muted" style={{ marginTop: 12 }}>
            {t('notifications.messagesBody')}
          </p>
        </div>
      )}
    </main>
  );
}
