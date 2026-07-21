import { useState } from 'react';
import { api } from '../api.js';

export default function Settings() {
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setOk(''); setBusy(true);
    const fd = Object.fromEntries(new FormData(e.target));
    try {
      await api.post('/api/auth/change-password', fd);
      setOk('Password updated.');
      e.target.reset();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <main className="container" style={{ maxWidth: 560 }}>
      <h2 style={{ fontSize: 30, marginBottom: 20 }}>Settings</h2>
      {error && <div className="alert error">{error}</div>}
      {ok && <div className="alert ok">{ok}</div>}

      <form className="card" onSubmit={submit}>
        <h3>Change password</h3>
        <p className="muted" style={{ margin: '8px 0 18px' }}>You'll stay signed in on this device.</p>
        <label className="field">Current password<input name="current_password" type="password" required autoComplete="current-password" /></label>
        <label className="field">New password <span className="hint">(8+ characters)</span><input name="new_password" type="password" minLength={8} required autoComplete="new-password" /></label>
        <button className="btn" disabled={busy}>Update password</button>
      </form>
    </main>
  );
}
