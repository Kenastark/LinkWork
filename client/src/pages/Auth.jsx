import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';

export default function Auth() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('mode') || 'login');
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const { setUser } = useAuth();
  const nav = useNavigate();

  useEffect(() => { api.get('/api/meta').then(setMeta); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    const fd = Object.fromEntries(new FormData(e.target));
    try {
      let d;
      if (mode === 'login') d = await api.post('/api/auth/login', fd);
      else if (mode === 'student') d = await api.post('/api/auth/register-student', fd);
      else d = await api.post('/api/auth/register-company', fd);
      setUser(d.user);
      nav({ student: '/student', company: '/company', admin: '/admin' }[d.user.role]);
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  };

  const uniFaculties = meta?.faculties?.filter(f => f.university_id === meta?.universities?.[0]?.id) || [];

  return (
    <main className="container" style={{ maxWidth: 560 }}>
      <div className="tabs">
        <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button>
        <button className={mode === 'student' ? 'active' : ''} onClick={() => setMode('student')}>Student sign-up</button>
        <button className={mode === 'company' ? 'active' : ''} onClick={() => setMode('company')}>Company sign-up</button>
      </div>

      {error && <div className="alert error">{error}</div>}
      {notice && <div className="alert info">{notice}</div>}

      <form className="card" onSubmit={submit}>
        {mode === 'login' && (
          <>
            <h3>Welcome back</h3>
            <p className="muted" style={{ marginBottom: 18 }}>Demo accounts — student: demo.student@mailbox.unideb.hu / student1234 · company: hr@datatech.hu / company1234 · admin: admin@linkwork.app / admin1234</p>
            <label className="field">Email<input name="email" type="email" required autoComplete="email" /></label>
            <label className="field">Password<input name="password" type="password" required autoComplete="current-password" /></label>
          </>
        )}

        {mode === 'student' && (
          <>
            <h3>Join as a student</h3>
            <p className="muted" style={{ marginBottom: 18 }}>Only official university addresses are accepted — this keeps every profile real.</p>
            <label className="field">Full name<input name="name" required /></label>
            <label className="field">University email <span className="hint">(e.g. you@mailbox.unideb.hu)</span><input name="email" type="email" required /></label>
            <label className="field">Faculty
              <select name="faculty_id" required defaultValue="">
                <option value="" disabled>Select your faculty</option>
                {uniFaculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </label>
            <label className="field">Major <span className="hint">(your skill test is based on this)</span>
              <select name="major" required defaultValue="">
                <option value="" disabled>Select your major</option>
                {(meta?.majors || []).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            <label className="field">Password <span className="hint">(8+ characters)</span><input name="password" type="password" minLength={8} required autoComplete="new-password" /></label>
            <label className="field" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontWeight: 400 }}>
              <input type="checkbox" name="terms_accepted" required style={{ width: 'auto', margin: '3px 0 0' }} />
              <span>I agree to the <Link to="/terms" target="_blank">Terms of Service</Link> and <Link to="/privacy" target="_blank">Privacy Policy</Link>.</span>
            </label>
          </>
        )}

        {mode === 'company' && (
          <>
            <h3>Hire from LinkWork</h3>
            <p className="muted" style={{ marginBottom: 18 }}>Register with your work email. The admin reviews every company before it can post — and posting means committing to hire from this platform.</p>
            <label className="field">Company name<input name="company_name" required /></label>
            <label className="field">Your name<input name="contact_name" required /></label>
            <label className="field">Work email<input name="email" type="email" required /></label>
            <label className="field">Website<input name="website" type="url" placeholder="https://" /></label>
            <label className="field">What does your company do?<textarea name="description" /></label>
            <label className="field">Password <span className="hint">(8+ characters)</span><input name="password" type="password" minLength={8} required autoComplete="new-password" /></label>
            <label className="field" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontWeight: 400 }}>
              <input type="checkbox" name="terms_accepted" required style={{ width: 'auto', margin: '3px 0 0' }} />
              <span>I agree to the <Link to="/terms" target="_blank">Terms of Service</Link> and <Link to="/privacy" target="_blank">Privacy Policy</Link>.</span>
            </label>
          </>
        )}

        <button className="btn" disabled={busy}>
          {mode === 'login' ? 'Sign in' : mode === 'student' ? 'Create student account' : 'Submit for review'}
        </button>
      </form>
    </main>
  );
}
