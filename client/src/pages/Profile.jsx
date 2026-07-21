import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setOk(''); setBusy(true);
    const fd = Object.fromEntries(new FormData(e.target));
    try {
      const d = await api.post('/api/auth/profile', fd);
      setUser(d.user);
      setOk('Profile updated.');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <main className="container" style={{ maxWidth: 560 }}>
      <h2 style={{ fontSize: 30, marginBottom: 20 }}>Profile</h2>
      {error && <div className="alert error">{error}</div>}
      {ok && <div className="alert ok">{ok}</div>}

      <form className="card" onSubmit={submit}>
        <label className="field">Full name<input name="name" defaultValue={user.name} required /></label>
        <label className="field">Email <span className="hint">(read-only)</span><input value={user.email} disabled /></label>

        {user.role === 'student' && (
          <>
            <label className="field">Major <span className="hint">(read-only — verified at signup)</span><input value={user.major || ''} disabled /></label>
            <label className="field">Identity status <span className="hint">(read-only)</span>
              <input value={user.doc_status} disabled />
            </label>
          </>
        )}

        {user.role === 'company' && (
          <>
            <label className="field">Company name<input name="company_name" defaultValue={user.company_name || ''} /></label>
            <label className="field">Website<input name="website" type="url" defaultValue={user.website || ''} placeholder="https://" /></label>
            <label className="field">What does your company do?<textarea name="description" defaultValue={user.description || ''} /></label>
          </>
        )}

        <button className="btn" disabled={busy}>Save changes</button>
      </form>
    </main>
  );
}
