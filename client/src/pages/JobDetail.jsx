import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import { useTranslatedTexts } from '../useTranslatedTexts.js';
import Chain from '../components/Chain.jsx';
import { useI18n, splitT } from '../i18n.jsx';

// The company's own MCQ/essay test, taken by the student at the company_test stage.
// MCQs are auto-scored on submit; written answers are stored for the company to read.
function CompanyTest({ applicationId, onDone }) {
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const { t } = useI18n();

  const reload = () => api.get(`/api/applications/${applicationId}/company-test`).then(setData).catch(e => setError(e.message));
  useEffect(() => { reload(); }, [applicationId]);

  if (error) return <div className="alert error" style={{ marginTop: 8 }}>{error}</div>;
  if (!data) return null;

  if (data.submitted) {
    return (
      <div className="alert ok" style={{ marginTop: 8 }}>
        {t('jobDetail.companyTestSubmitted')}
      </div>
    );
  }

  if (data.locked) {
    return (
      <div className="alert info" style={{ marginTop: 8 }}>
        {t('jobDetail.companyTestLocked')}
        <button className="btn sm secondary" style={{ marginTop: 10 }} onClick={reload}>{t('jobDetail.checkAgain')}</button>
      </div>
    );
  }

  const setMcq = (qid, idx) => setAnswers(a => ({ ...a, [qid]: { answer_idx: idx } }));
  const setEssay = (qid, text) => setAnswers(a => ({ ...a, [qid]: { answer_text: text } }));
  const complete = data.questions.every(q => {
    const ans = answers[q.id];
    return q.type === 'mcq' ? ans && ans.answer_idx != null : ans && (ans.answer_text || '').trim().length >= 30;
  });

  const submit = async () => {
    setError('');
    try {
      await api.post(`/api/applications/${applicationId}/company-test`, { answers });
      setData(d => ({ ...d, submitted: true }));
      onDone();
    } catch (e) { setError(e.message); }
  };

  return (
    <div style={{ marginTop: 10 }}>
      <p className="muted" style={{ marginBottom: 14 }}>{t('jobDetail.companyTestIntro')}</p>
      {data.questions.map((q, qi) => (
        <div key={q.id} style={{ marginBottom: 18 }}>
          <p style={{ fontWeight: 600 }}>{qi + 1}. {q.question}</p>
          {q.type === 'mcq' ? q.options.map((opt, oi) => (
            <label key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '6px 0', fontWeight: 400 }}>
              <input type="radio" style={{ width: 'auto', margin: 0 }} name={`ct${q.id}`}
                checked={answers[q.id]?.answer_idx === oi} onChange={() => setMcq(q.id, oi)} />
              {opt}
            </label>
          )) : (
            <textarea maxLength={1500} placeholder={t('jobDetail.writeYourAnswer')} value={answers[q.id]?.answer_text || ''}
              onChange={e => setEssay(q.id, e.target.value)} />
          )}
        </div>
      ))}
      <button className="btn" onClick={submit} disabled={!complete}>{t('jobDetail.submitCompanyTest')}</button>
    </div>
  );
}

const MODE_KEY = { on_site: 'jobDetail.modeOnSite', hybrid: 'jobDetail.modeHybrid', remote: 'jobDetail.modeRemote' };

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [test, setTest] = useState(null);       // {attemptNumber, questions}
  const [answers, setAnswers] = useState({});
  const [pendingResult, setPendingResult] = useState(null); // {attemptNumber, score, canRetake}
  const [result, setResult] = useState(null);   // finalized skill-test result
  const [aiAttempt, setAiAttempt] = useState(1);
  const [aiQs, setAiQs] = useState(null);
  const [aiAnswers, setAiAnswers] = useState([]);
  const [pendingAi, setPendingAi] = useState(null); // {canRetake} once a round is submitted and the Retake/Finish choice is open

  const load = () => api.get(`/api/jobs/${id}`).then(setData).catch(e => setError(e.message));
  useEffect(() => { load(); }, [id]);

  // Two stages park the student on a choice the server records but `stage` alone
  // cannot express: skill test attempt 1 scored (retake or continue?) and AI round 1
  // answered (retake or finish?). Both used to live only in this component's state,
  // so a reload offered a "start" button the server could only reject. Ask the server.
  const stage = data?.application?.stage;
  const applicationId = data?.application?.id;
  useEffect(() => {
    if (!applicationId || user.role !== 'student') return;
    let live = true;
    const probe = (path, apply) => api.get(path).then(s => { if (live && s.status === 'awaiting_choice') apply(s); }).catch(() => {});
    if (stage === 'skill_test') probe(`/api/applications/${applicationId}/skill-test?state=1`, setPendingResult);
    else if (stage === 'ai_interview') probe(`/api/applications/${applicationId}/ai-interview?state=1`, s => setPendingAi({ canRetake: s.canRetake }));
    return () => { live = false; };
  }, [applicationId, stage, user.role]);

  const job = data?.job;
  const [description, requirements, companyDescription, title, companyName] = useTranslatedTexts([
    job?.description || '', job?.requirements || '', job?.company_description || '',
    job?.title || '', job?.company_name || '',
  ]);

  if (error) return <main className="container"><div className="alert error" role="alert">{error}</div></main>;
  if (!data || !data.job) return <main className="container"><div className="alert error" role="alert">{t('jobDetail.notFound')}</div></main>;
  const { application } = data;
  const isStudent = user.role === 'student';

  const apply = async () => {
    setError('');
    try { await api.post(`/api/jobs/${id}/apply`); await load(); }
    catch (e) { setError(e.message); }
  };

  // ---------- skill test ----------
  const startTest = async () => {
    setError(''); setResult(null); setPendingResult(null);
    try { setTest(await api.get(`/api/applications/${application.id}/skill-test`)); setAnswers({}); }
    catch (e) { setError(e.message); }
  };

  const submitTest = async () => {
    setError('');
    try {
      const r = await api.post(`/api/applications/${application.id}/skill-test`, { answers });
      setTest(null);
      if (r.attemptNumber === 1) {
        setPendingResult(r);
      } else {
        setResult(r); await load();
      }
    } catch (e) { setError(e.message); }
  };

  const retakeTest = async () => {
    setError('');
    try {
      const t = await api.get(`/api/applications/${application.id}/skill-test?retake=1`);
      setTest(t); setAnswers({}); setPendingResult(null);
    } catch (e) { setError(e.message); }
  };

  const continueTest = async () => {
    setError('');
    try {
      const r = await api.post(`/api/applications/${application.id}/skill-test/continue`);
      setResult(r); setPendingResult(null); await load();
    } catch (e) { setError(e.message); }
  };

  // ---------- AI interview ----------
  const startAI = async () => {
    setError(''); setPendingAi(null);
    try {
      const d = await api.get(`/api/applications/${application.id}/ai-interview`);
      setAiAttempt(d.attempt); setAiQs(d.questions); setAiAnswers(d.questions.map(() => ''));
    } catch (e) { setError(e.message); }
  };

  const submitAI = async () => {
    setError('');
    try {
      const r = await api.post(`/api/applications/${application.id}/ai-interview`, { answers: aiAnswers, attempt: aiAttempt });
      setAiQs(null);
      if (r.canRetake) {
        setPendingAi({ canRetake: true });
      } else {
        await api.post(`/api/applications/${application.id}/ai-interview/continue`);
        await load();
      }
    } catch (e) { setError(e.message); }
  };

  const retakeAI = async () => {
    setError('');
    try {
      const d = await api.get(`/api/applications/${application.id}/ai-interview?retake=1`);
      setAiAttempt(d.attempt); setAiQs(d.questions); setAiAnswers(d.questions.map(() => '')); setPendingAi(null);
    } catch (e) { setError(e.message); }
  };

  const finishAI = async () => {
    setError('');
    try {
      await api.post(`/api/applications/${application.id}/ai-interview/continue`);
      setPendingAi(null); await load();
    } catch (e) { setError(e.message); }
  };

  const [schedulingPre, schedulingRest] = splitT(t('jobDetail.interviewSchedulingMsg'));
  const [schedulingLink, schedulingSuffix] = splitT(schedulingRest);

  return (
    <main className="container" style={{ maxWidth: 780 }}>
      <span className="id-tag">JOB-{String(job.id).padStart(4, '0')}</span>
      <h1 style={{ fontSize: 30 }}>{title}</h1>
      <p className="muted">{companyName} · {job.university_name}{job.faculty_name ? ` · ${job.faculty_name}` : ''}</p>
      <div className="meta" style={{ display: 'flex', gap: 8, margin: '10px 0 20px', flexWrap: 'wrap' }}>
        {job.faculty_verified
          ? <span className="badge faculty">{t('jobDetail.facultyBadge')}</span>
          : <span className="badge verified">{t('jobDetail.platformBadge')}</span>}
        <span className="badge pending">{job.job_type === 'internship' ? t('jobDetail.typeInternship') : t('jobDetail.typeEntryLevel')}</span>
        <span className="badge pending">{t('jobDetail.positionsOpen', { open: job.positions - job.filled, total: job.positions })}</span>
        {job.location && <span className="badge pending">📍 {job.location}</span>}
        {job.work_mode && <span className="badge pending">{MODE_KEY[job.work_mode] ? t(MODE_KEY[job.work_mode]) : job.work_mode}</span>}
        {job.salary_huf ? <span className="badge pending">{Math.round(job.salary_huf / 1000)}K HUF/mo</span> : null}
        {job.status === 'closed' && <span className="badge danger">{t('jobDetail.filledClosed')}</span>}
      </div>

      {error && <div className="alert error" role="alert">{error}</div>}
      {result && <div className={result.passed ? 'alert ok' : 'alert error'}>
        {t('jobDetail.finalScoreLabel')} <b>{result.finalScore}%</b>. {result.passed ? t('jobDetail.passedMessage') : t('jobDetail.failedMessage')}
      </div>}

      <div className="card">
        <h2 style={{ fontSize: 20 }}>{t('jobDetail.aboutRole')}</h2>
        <p style={{ marginTop: 8 }}>{description}</p>
        {job.requirements && <>
          <h2 style={{ fontSize: 20, marginTop: 18 }}>{t('jobDetail.skillsRequirements')}</h2>
          <p style={{ marginTop: 8 }}>{requirements}</p>
        </>}
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span className="company-mono">{(job.company_name || '?').charAt(0).toUpperCase()}</span>
          <div>
            <h2 style={{ fontSize: 20 }}>{companyName}</h2>
            {job.website && <a className="ext-link" href={job.website} target="_blank" rel="noreferrer">{job.website}</a>}
          </div>
        </div>
        {job.company_description && <p className="muted" style={{ marginTop: 12 }}>{companyDescription}</p>}
        {job.company_id != null && <Link to={`/companies/${job.company_id}`} className="btn sm ghost" style={{ marginTop: 14 }}>{t('jobDetail.viewCompanyProfile')}</Link>}
      </div>

      {isStudent && (
        <div className="card">
          <h3>{t('jobDetail.yourApplication')}</h3>
          {!application ? (
            job.status === 'open'
              ? <>
                  <p className="muted" style={{ margin: '8px 0 14px' }}>{t('jobDetail.applyIntro', { major: user.major })}</p>
                  <button className="btn" onClick={apply}>{t('jobDetail.applyStart')}</button>
                </>
              : <p className="muted">{t('jobDetail.filledTakenDown')}</p>
          ) : (
            <>
              <Chain stage={application.stage} />
              {application.stage === 'skill_test' && !test && !pendingResult && (
                <button className="btn" onClick={startTest}>{t('jobDetail.takeSkillTest', { major: user.major })}</button>
              )}
              {test && (
                <div style={{ marginTop: 10 }}>
                  {test.attemptNumber === 2 && <p className="muted" style={{ marginBottom: 12 }}>{t('jobDetail.retakeAttempt2')}</p>}
                  {test.questions.map((q, qi) => (
                    <div key={q.id} style={{ marginBottom: 18 }}>
                      <p style={{ fontWeight: 600 }}>{qi + 1}. {q.question}</p>
                      {q.options.map((opt, oi) => (
                        <label key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '6px 0', fontWeight: 400 }}>
                          <input type="radio" style={{ width: 'auto', margin: 0 }} name={`q${q.id}`}
                            checked={answers[q.id] === oi}
                            onChange={() => setAnswers(a => ({ ...a, [q.id]: oi }))} />
                          {opt}
                        </label>
                      ))}
                    </div>
                  ))}
                  <button className="btn" onClick={submitTest} disabled={Object.keys(answers).length < test.questions.length}>{t('jobDetail.submitAnswers')}</button>
                </div>
              )}
              {pendingResult && (
                <div style={{ marginTop: 10 }}>
                  <p className="muted" style={{ marginBottom: 14 }}>{t('jobDetail.attempt1ScoreLabel')} <b>{pendingResult.score}%</b>. {t('jobDetail.attempt1ScoreBody')}</p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn secondary" onClick={retakeTest}>{t('jobDetail.retakeTest')}</button>
                    <button className="btn" onClick={continueTest}>{t('jobDetail.continueScore')}</button>
                  </div>
                </div>
              )}

              {application.stage === 'ai_interview' && !aiQs && !pendingAi && (
                <button className="btn" onClick={startAI}>{t('jobDetail.startAiInterview')}</button>
              )}
              {aiQs && (
                <div style={{ marginTop: 10 }}>
                  <p className="muted" style={{ marginBottom: 14 }}>
                    {aiAttempt === 2 ? t('jobDetail.aiRetakeIntro') : t('jobDetail.aiFirstIntro')}
                  </p>
                  {aiQs.map((q, i) => (
                    <label className="field" key={i}>{q}
                      <textarea
                        maxLength={1000}
                        value={aiAnswers[i]}
                        onChange={e => setAiAnswers(a => a.map((x, xi) => xi === i ? e.target.value : x))}
                      />
                      <span className="char-count" style={{ color: (aiAnswers[i] || '').length >= 1000 ? 'var(--danger)' : 'var(--ink-soft)' }}>
                        {t('jobDetail.charCount', { n: (aiAnswers[i] || '').length })}
                      </span>
                    </label>
                  ))}
                  <button className="btn" onClick={submitAI}>{t('jobDetail.submitInterview')}</button>
                </div>
              )}
              {pendingAi && (
                <div style={{ marginTop: 10 }}>
                  <p className="muted" style={{ marginBottom: 14 }}>
                    {pendingAi.canRetake ? t('jobDetail.aiPendingRetakeMsg') : t('jobDetail.aiPendingFinishMsg')}
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {pendingAi.canRetake && <button className="btn secondary" onClick={retakeAI}>{t('jobDetail.retakeInterview')}</button>}
                    <button className="btn" onClick={finishAI}>{t('jobDetail.finishInterview')}</button>
                  </div>
                </div>
              )}

              {application.stage === 'company_test' && <CompanyTest applicationId={application.id} onDone={load} />}
              {['hr_interview', 'tech_interview'].includes(application.stage) && (
                <p className="muted">{schedulingPre} <Link to="/my-applications">{schedulingLink}</Link> {schedulingSuffix}</p>
              )}
              {application.stage === 'hired' && (
                <div className="alert ok" style={{ marginTop: 8 }}>
                  {t('jobDetail.hiredBadge')}{' '}
                  <span className="badge verified mono">JOB-{String(job.id).padStart(4, '0')} ⟷ STU-{String(user.id).padStart(4, '0')}</span>
                </div>
              )}
              {application.stage === 'rejected' && (
                <p className="muted">{t('jobDetail.rejectedMsg')}</p>
              )}
            </>
          )}
        </div>
      )}
    </main>
  );
}
