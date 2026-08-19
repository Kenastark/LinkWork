import { useRef, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import { useI18n } from '../i18n.jsx';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileInput = useRef(null);
  const { t } = useI18n();

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setOk(''); setBusy(true);
    const fd = Object.fromEntries(new FormData(e.target));
    try {
      const d = await api.post('/api/auth/profile', fd);
      setUser(d.user);
      setOk(t('profile.updated'));
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
      if (!res.ok) throw new Error(d.error || t('profile.uploadPhotoError'));
      setUser(d.user);
      setOk(t('profile.photoUpdated'));
    } catch (err) { setError(err.message); }
    finally { setPhotoBusy(false); if (fileInput.current) fileInput.current.value = ''; }
  };

  return (
    <main className="container" style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 30, marginBottom: 20 }}>{t('profile.title')}</h1>
      {error && <div className="alert error" role="alert">{error}</div>}
      {ok && <div className="alert ok" role="status">{ok}</div>}

      <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        {user.photo_path
          ? <img src={user.photo_path} alt={t('profile.photoAlt')} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
          : <span className="company-mono" style={{ width: 64, height: 64, fontSize: 22 }}>{user.name.charAt(0).toUpperCase()}</span>}
        <div>
          <p style={{ fontWeight: 600 }}>{t('profile.photoLabel')}</p>
          <label className="btn sm secondary" style={{ marginTop: 6, cursor: 'pointer', display: 'inline-flex' }}>
            {photoBusy ? t('profile.uploading') : t('profile.uploadPhoto')}
            <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadPhoto} disabled={photoBusy} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      <form className="card" onSubmit={submit}>
        <label className="field">{t('profile.fullNameLabel')}<input name="name" defaultValue={user.name} required /></label>
        <label className="field">{t('profile.emailLabel')} <span className="hint">{t('profile.readOnlyHint')}</span><input value={user.email} disabled /></label>
        <label className="field">{t('profile.phoneLabel')}<input name="phone" type="tel" defaultValue={user.phone || ''} placeholder="+36 ..." /></label>

        {user.role === 'student' && (
          <>
            <label className="field">{t('profile.majorLabel')} <span className="hint">{t('profile.majorReadOnlyHint')}</span><input value={user.major || ''} disabled /></label>
            <label className="field">{t('profile.identityStatusLabel')} <span className="hint">{t('profile.readOnlyHint')}</span>
              <input value={user.doc_status} disabled />
            </label>
          </>
        )}

        {user.role === 'company' && (
          <>
            <label className="field">{t('profile.companyNameLabel')}<input name="company_name" defaultValue={user.company_name || ''} /></label>
            <label className="field">{t('profile.websiteLabel')}<input name="website" type="url" defaultValue={user.website || ''} placeholder="https://" /></label>
            <label className="field">{t('profile.companyDescLabel')}<textarea name="description" defaultValue={user.description || ''} /></label>
          </>
        )}

        <button className="btn" disabled={busy}>{t('profile.saveChanges')}</button>
      </form>
    </main>
  );
}
