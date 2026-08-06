import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';

const KIND_LABEL = { hr_interview: 'HR interview', tech_interview: 'Technical interview' };

// Placeholder meeting room. Scheduling is fully live; the actual audio/video call
// is a later phase (a provider such as Jitsi/Zoom/Daily will render here).
export default function Meeting() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api.get(`/api/interviews/${id}/room`).then(setData).catch(e => setError(e.message)); }, [id]);

  if (error) return <main className="container"><div className="alert error" role="alert">{error}</div></main>;
  if (!data) return <main className="container" />;

  const { interview, role_title, company_name, student_name, when } = data;

  return (
    <main className="container" style={{ maxWidth: 820 }}>
      <span className="id-tag">ROOM-{interview.room_id.slice(0, 8).toUpperCase()}</span>
      <h1 style={{ fontSize: 26, margin: '4px 0 2px' }}>{KIND_LABEL[interview.kind]} — {role_title}</h1>
      <p className="muted">{company_name} · {student_name}{when ? ` · ${when}` : ''}</p>

      <div className="meeting-stage" style={{ marginTop: 18 }}>
        <span className="badge pending">Live video — coming soon</span>
        <h3 style={{ color: '#fff', fontSize: 22 }}>Your meeting room is ready</h3>
        <p style={{ maxWidth: '46ch', color: '#c4cddd' }}>
          Scheduling is live. The in-browser audio and video call will run right here on this page
          once the video provider is connected — no downloads, no external app.
        </p>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 16 }}>In this meeting</h3>
        <div className="participant-chips" style={{ marginTop: 8 }}>
          <span className="participant-chip">{company_name} (host)</span>
          <span className="participant-chip">{student_name} (candidate)</span>
          {interview.participants.map(p => <span className="participant-chip" key={p.id}>{p.email}</span>)}
        </div>
        {interview.participants.length === 0 && (
          <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>The hiring team can add more participants (e.g. technical interviewers) from the applicant's card.</p>
        )}
      </div>

      <Link to="/" className="btn secondary" style={{ marginTop: 16 }}>Leave room</Link>
    </main>
  );
}
