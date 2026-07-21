import { useRef, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileInput = useRef(null);

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

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(''); setOk(''); setPhotoBusy(true);
    const body = new FormData();
    body.append('photo', file);
    try {
      const res = await fetch('/api/auth/upload-photo', { method: 'POST', credentials: 'include', body });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Could not upload photo.');
      setUser(d.user);
      setOk('Photo updated.');
    } catch (err) { setError(err.message); }
    finally { setPhotoBusy(false); if (fileInput.current) fileInput.current.value = ''; }
  };

  return (
    <main className="container" style={{ maxWidth: 560 }}>
      <h2 style={{ fontSize: 30, marginBottom: 20 }}>Profile</h2>
      {error && <div className="alert error">{error}</div>}
      {ok && <div className="alert ok">{ok}</div>}

      <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        {user.photo_path
          ? <img src={user.photo_path} alt="Profile" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
          : <span className="company-mono" style={{ width: 64, height: 64, fontSize: 22 }}>{user.name.charAt(0).toUpperCase()}</span>}
        <div>
          <p style={{ fontWeight: 600 }}>Profile photo</p>
          <label className="btn sm secondary" style={{ marginTop: 6, cursor: 'pointer', display: 'inline-flex' }}>
            {photoBusy ? 'Uploading…' : 'Upload photo'}
            <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadPhoto} disabled={photoBusy} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      <form className="card" onSubmit={submit}>
        <label className="field">Full name<input name="name" defaultValue={user.name} required /></label>
        <label className="field">Email <span className="hint">(read-only)</span><input value={user.email} disabled /></label>
        <label className="field">Phone<input name="phone" type="tel" defaultValue={user.phone || ''} placeholder="+36 ..." /></label>

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
