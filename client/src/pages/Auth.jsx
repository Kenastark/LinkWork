import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import { useI18n, splitT } from '../i18n.jsx';

const MODE_TITLE_KEY = { login: 'auth.modeSignIn', student: 'auth.modeStudentSignup', company: 'auth.modeCompanySignup' };

function splitParts(value, count) {
  const parts = [];
  let rest = value;
  for (let i = 0; i < count; i++) {
    const [a, b] = splitT(rest);
    parts.push(a);
    rest = b;
  }
  parts.push(rest);
  return parts;
}

export default function Auth() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('mode') || 'login');
  const [meta, setMeta] = useState(null);
  const [facultyId, setFacultyId] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const { setUser } = useAuth();
  const nav = useNavigate();
  const { t } = useI18n();

  useEffect(() => { api.get('/api/meta').then(setMeta); }, []);

  const EDU_LEVEL_RANK = { "Bachelor's": 0, "Master's": 1, PhD: 2, Other: 0 };
  const EDUCATION_LEVELS = ["Bachelor's", "Master's", 'PhD', 'Other'];
  const EDU_LEVEL_KEY = { "Bachelor's": 'auth.eduBachelors', "Master's": 'auth.eduMasters', PhD: 'auth.eduPhd', Other: 'auth.eduOther' };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const fd = Object.fromEntries(new FormData(e.target));
    if ((mode === 'student' || mode === 'company') && fd.password !== fd.confirm_password) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    delete fd.confirm_password;
    setBusy(true);
    try {
      let d;
      if (mode === 'login') d = await api.post('/api/auth/login', fd);
      else if (mode === 'student') d = await api.post('/api/auth/register-student', fd);
      else d = await api.post('/api/auth/register-company', fd);
      setUser(d.user);
      nav({ student: '/', company: '/company', admin: '/admin' }[d.user.role]);
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  };

  const uniFaculties = meta?.faculties?.filter(f => f.university_id === meta?.universities?.[0]?.id) || [];
  const facultyMajors = meta?.majors?.filter(m => m.faculty_id === Number(facultyId)
    && (!m.min_level || (EDU_LEVEL_RANK[educationLevel] ?? -1) >= EDU_LEVEL_RANK[m.min_level])) || [];

  const [termsPre, termsTos, termsMid, termsPrivacy, termsSuffix] = splitParts(t('auth.termsAgreement'), 4);

  return (
    <main className="container" style={{ maxWidth: 560 }}>
      {/* The visible headings live inside the card and change with the tab, so
          the page needs its own h1 for structure. */}
      <h1 className="sr-only">{t(MODE_TITLE_KEY[mode])}</h1>
      <div className="tabs">
        <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>{t('auth.modeSignIn')}</button>
        <button className={mode === 'student' ? 'active' : ''} onClick={() => setMode('student')}>{t('auth.modeStudentSignup')}</button>
        <button className={mode === 'company' ? 'active' : ''} onClick={() => setMode('company')}>{t('auth.modeCompanySignup')}</button>
      </div>

      {error && <div className="alert error" role="alert">{error}</div>}
      {notice && <div className="alert info">{notice}</div>}

      <form className="card" onSubmit={submit}>
        {mode === 'login' && (
          <>
            <h2 style={{ marginBottom: 18 }}>{t('auth.welcomeBack')}</h2>
            <label className="field">{t('auth.emailLabel')}<input name="email" type="email" required autoComplete="email" /></label>
            <label className="field">{t('auth.passwordLabel')}<input name="password" type="password" required autoComplete="current-password" /></label>
          </>
        )}

        {mode === 'student' && (
          <>
            <h3>{t('auth.joinAsStudentTitle')}</h3>
            <p className="muted" style={{ marginBottom: 18 }}>{t('auth.studentIntro')}</p>
            <label className="field">{t('auth.fullNameLabel')}<input name="name" required /></label>
            <label className="field">{t('auth.universityEmailLabel')} <span className="hint">{t('auth.universityEmailHint')}</span><input name="email" type="email" required /></label>
            <label className="field">{t('auth.educationLevelLabel')}
              <select name="education_level" required value={educationLevel} onChange={e => setEducationLevel(e.target.value)}>
                <option value="" disabled>{t('auth.selectEducationLevel')}</option>
                {EDUCATION_LEVELS.map(l => <option key={l} value={l}>{t(EDU_LEVEL_KEY[l])}</option>)}
              </select>
            </label>
            <label className="field">{t('auth.facultyLabel')}
              <select name="faculty_id" required value={facultyId} onChange={e => setFacultyId(e.target.value)}>
                <option value="" disabled>{t('auth.selectFaculty')}</option>
                {uniFaculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </label>
            <label className="field">{t('auth.majorLabel')} <span className="hint">{t('auth.majorHint')}</span>
              <select name="major" required defaultValue="" disabled={!facultyId}>
                <option value="" disabled>{facultyId ? t('auth.selectMajor') : t('auth.selectFacultyFirst')}</option>
                {facultyMajors.map(m => <option key={m.id} value={m.name}>{m.name}{m.min_level ? ` (${m.min_level}+)` : ''}</option>)}
              </select>
            </label>
            <label className="field">{t('auth.passwordLabel')} <span className="hint">{t('auth.passwordHint')}</span><input name="password" type="password" minLength={8} required autoComplete="new-password" /></label>
            <label className="field">{t('auth.confirmPasswordLabel')}<input name="confirm_password" type="password" minLength={8} required autoComplete="new-password" /></label>
            <label className="field" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontWeight: 400 }}>
              <input type="checkbox" name="terms_accepted" required style={{ width: 'auto', margin: '3px 0 0' }} />
              <span>{termsPre} <Link to="/terms" target="_blank">{termsTos}</Link> {termsMid} <Link to="/privacy" target="_blank">{termsPrivacy}</Link>{termsSuffix}</span>
            </label>
          </>
        )}

        {mode === 'company' && (
          <>
            <h3>{t('auth.hireTitle')}</h3>
            <p className="muted" style={{ marginBottom: 18 }}>{t('auth.companyIntro')}</p>
            <label className="field">{t('auth.companyNameLabel')}<input name="company_name" required /></label>
            <label className="field">{t('auth.contactNameLabel')}<input name="contact_name" required /></label>
            <label className="field">{t('auth.workEmailLabel')}<input name="email" type="email" required /></label>
            <label className="field">{t('auth.websiteLabel')}<input name="website" type="url" placeholder="https://" /></label>
            <label className="field">{t('auth.companyDescLabel')}<textarea name="description" /></label>
            <label className="field">{t('auth.passwordLabel')} <span className="hint">{t('auth.passwordHint')}</span><input name="password" type="password" minLength={8} required autoComplete="new-password" /></label>
            <label className="field">{t('auth.confirmPasswordLabel')}<input name="confirm_password" type="password" minLength={8} required autoComplete="new-password" /></label>
            <label className="field" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontWeight: 400 }}>
              <input type="checkbox" name="terms_accepted" required style={{ width: 'auto', margin: '3px 0 0' }} />
              <span>{termsPre} <Link to="/terms" target="_blank">{termsTos}</Link> {termsMid} <Link to="/privacy" target="_blank">{termsPrivacy}</Link>{termsSuffix}</span>
            </label>
          </>
        )}

        <button className="btn" disabled={busy}>
          {mode === 'login' ? t('auth.modeSignIn') : mode === 'student' ? t('auth.createStudentAccount') : t('auth.submitForReview')}
        </button>
      </form>
    </main>
  );
}
