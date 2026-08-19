import { useState } from 'react';
import { api } from '../api.js';
import { useI18n } from '../i18n.jsx';

export default function Settings() {
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const { t } = useI18n();

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setOk(''); setBusy(true);
    const fd = Object.fromEntries(new FormData(e.target));
    try {
      await api.post('/api/auth/change-password', fd);
      setOk(t('settings.passwordUpdated'));
      e.target.reset();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <main className="container" style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 30, marginBottom: 20 }}>{t('settings.title')}</h1>
      {error && <div className="alert error" role="alert">{error}</div>}
      {ok && <div className="alert ok" role="status">{ok}</div>}

      <form className="card" onSubmit={submit}>
        <h3>{t('settings.changePasswordTitle')}</h3>
        <p className="muted" style={{ margin: '8px 0 18px' }}>{t('settings.staySignedIn')}</p>
        <label className="field">{t('settings.currentPasswordLabel')}<input name="current_password" type="password" required autoComplete="current-password" /></label>
        <label className="field">{t('settings.newPasswordLabel')} <span className="hint">{t('settings.newPasswordHint')}</span><input name="new_password" type="password" minLength={8} required autoComplete="new-password" /></label>
        <button className="btn" disabled={busy}>{t('settings.updateButton')}</button>
      </form>
    </main>
  );
}
