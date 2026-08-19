import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useI18n } from '../i18n.jsx';

const KIND_KEY = { hr_interview: 'meeting.kindHrInterview', tech_interview: 'meeting.kindTechInterview' };

// Placeholder meeting room. Scheduling is fully live; the actual audio/video call
// is a later phase (a provider such as Jitsi/Zoom/Daily will render here).
export default function Meeting() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const { t } = useI18n();

  useEffect(() => { api.get(`/api/interviews/${id}/room`).then(setData).catch(e => setError(e.message)); }, [id]);

  if (error) return <main className="container"><div className="alert error" role="alert">{error}</div></main>;
  if (!data) return <main className="container" />;

  const { interview, role_title, company_name, student_name, when } = data;

  return (
    <main className="container" style={{ maxWidth: 820 }}>
      <span className="id-tag">ROOM-{interview.room_id.slice(0, 8).toUpperCase()}</span>
      <h1 style={{ fontSize: 26, margin: '4px 0 2px' }}>{t(KIND_KEY[interview.kind])} — {role_title}</h1>
      <p className="muted">{company_name} · {student_name}{when ? ` · ${when}` : ''}</p>

      <div className="meeting-stage" style={{ marginTop: 18 }}>
        <span className="badge pending">{t('meeting.liveVideoComingSoon')}</span>
        <h3 style={{ color: '#fff', fontSize: 22 }}>{t('meeting.roomReadyTitle')}</h3>
        <p style={{ maxWidth: '46ch', color: '#c4cddd' }}>
          {t('meeting.roomReadyBody')}
        </p>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 16 }}>{t('meeting.inThisMeeting')}</h3>
        <div className="participant-chips" style={{ marginTop: 8 }}>
          <span className="participant-chip">{t('meeting.hostLabel', { name: company_name })}</span>
          <span className="participant-chip">{t('meeting.candidateLabel', { name: student_name })}</span>
          {interview.participants.map(p => <span className="participant-chip" key={p.id}>{p.email}</span>)}
        </div>
        {interview.participants.length === 0 && (
          <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>{t('meeting.moreParticipantsHint')}</p>
        )}
      </div>

      <Link to="/" className="btn secondary" style={{ marginTop: 16 }}>{t('meeting.leaveRoom')}</Link>
    </main>
  );
}
