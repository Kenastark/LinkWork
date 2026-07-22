import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import Chain from '../components/Chain.jsx';

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [test, setTest] = useState(null);       // {attemptNumber, questions}
  const [answers, setAnswers] = useState({});
  const [pendingResult, setPendingResult] = useState(null); // {attemptNumber, score, canRetake}
  const [result, setResult] = useState(null);   // finalized skill-test result
  const [aiAttempt, setAiAttempt] = useState(1);
  const [aiQs, setAiQs] = useState(null);
  const [aiAnswers, setAiAnswers] = useState([]);
  const [pendingAi, setPendingAi] = useState(false); // round 1 submitted, awaiting Retake/Finish choice

  const load = () => api.get(`/api/jobs/${id}`).then(setData).catch(e => setError(e.message));
  useEffect(() => { load(); }, [id]);

  if (error) return <main className="container"><div className="alert error">{error}</div></main>;
  if (!data || !data.job) return <main className="container"><div className="alert error">Couldn't load this posting. It may have been removed.</div></main>;
  const { job, application } = data;
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
    setError(''); setPendingAi(false);
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
        setPendingAi(true);
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
      setAiAttempt(d.attempt); setAiQs(d.questions); setAiAnswers(d.questions.map(() => '')); setPendingAi(false);
    } catch (e) { setError(e.message); }
  };

  const finishAI = async () => {
    setError('');
    try {
      await api.post(`/api/applications/${application.id}/ai-interview/continue`);
      setPendingAi(false); await load();
    } catch (e) { setError(e.message); }
  };

  return (
    <main className="container" style={{ maxWidth: 780 }}>
      <span className="id-tag">JOB-{String(job.id).padStart(4, '0')}</span>
      <h2 style={{ fontSize: 30 }}>{job.title}</h2>
      <p className="muted">{job.company_name} · {job.university_name}{job.faculty_name ? ` · ${job.faculty_name}` : ''}</p>
      <div className="meta" style={{ display: 'flex', gap: 8, margin: '10px 0 20px', flexWrap: 'wrap' }}>
        {job.faculty_verified
          ? <span className="badge faculty">★ Faculty partnership — negotiated directly with your university</span>
          : <span className="badge verified">✓ Platform-committed — the company will hire from LinkWork</span>}
        <span className="badge pending">{job.job_type === 'internship' ? 'Internship' : 'Entry level'}</span>
        <span className="badge pending">{job.positions - job.filled} of {job.positions} open</span>
        {job.status === 'closed' && <span className="badge danger">Filled & closed</span>}
      </div>

      {error && <div className="alert error">{error}</div>}
      {result && <div className={result.passed ? 'alert ok' : 'alert error'}>
        Final skill test score: <b>{result.finalScore}%</b>. {result.passed ? 'You passed — the AI interview is next.' : 'Below the 60% bar for this round. Keep building — new openings arrive regularly.'}
      </div>}

      <div className="card">
        <h3>About the role</h3>
        <p style={{ marginTop: 8 }}>{job.description}</p>
        {job.requirements && <>
          <h3 style={{ marginTop: 18 }}>Skills & requirements</h3>
          <p style={{ marginTop: 8 }}>{job.requirements}</p>
        </>}
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span className="company-mono">{(job.company_name || '?').charAt(0).toUpperCase()}</span>
          <div>
            <h3>{job.company_name}</h3>
            {job.website && <a href={job.website} target="_blank" rel="noreferrer">{job.website}</a>}
          </div>
        </div>
        {job.company_description && <p className="muted" style={{ marginTop: 12 }}>{job.company_description}</p>}
        {job.company_id != null && <Link to={`/companies/${job.company_id}`} className="btn sm ghost" style={{ marginTop: 14 }}>View company profile</Link>}
      </div>

      {isStudent && (
        <div className="card">
          <h3>Your application</h3>
          {!application ? (
            job.status === 'open'
              ? <>
                  <p className="muted" style={{ margin: '8px 0 14px' }}>Applying starts the verification chain: a skill test based on your major ({user.major}), a structured AI interview, then the company's own test and interviews.</p>
                  <button className="btn" onClick={apply}>Apply — start the chain</button>
                </>
              : <p className="muted">This posting has been filled and taken down. The match is on the record.</p>
          ) : (
            <>
              <Chain stage={application.stage} />
              {application.stage === 'skill_test' && !test && !pendingResult && (
                <button className="btn" onClick={startTest}>Take the skill test ({user.major})</button>
              )}
              {test && (
                <div style={{ marginTop: 10 }}>
                  {test.attemptNumber === 2 && <p className="muted" style={{ marginBottom: 12 }}>Retake — attempt 2 of 2, different questions.</p>}
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
                  <button className="btn" onClick={submitTest} disabled={Object.keys(answers).length < test.questions.length}>Submit answers</button>
                </div>
              )}
              {pendingResult && (
                <div style={{ marginTop: 10 }}>
                  <p className="muted" style={{ marginBottom: 14 }}>Attempt 1 score: <b>{pendingResult.score}%</b>. You can retake the test once with different questions — your final score will be the average of both attempts — or continue with this score now.</p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn secondary" onClick={retakeTest}>Retake test (new questions)</button>
                    <button className="btn" onClick={continueTest}>Continue with this score</button>
                  </div>
                </div>
              )}

              {application.stage === 'ai_interview' && !aiQs && !pendingAi && (
                <button className="btn" onClick={startAI}>Start the AI interview</button>
              )}
              {aiQs && (
                <div style={{ marginTop: 10 }}>
                  <p className="muted" style={{ marginBottom: 14 }}>
                    {aiAttempt === 2 ? 'Retake — a fresh set of questions.' : 'Answer in your own words. Your answers go on file for the company alongside your skill score.'}
                  </p>
                  {aiQs.map((q, i) => (
                    <label className="field" key={i}>{q}
                      <textarea value={aiAnswers[i]} onChange={e => setAiAnswers(a => a.map((x, xi) => xi === i ? e.target.value : x))} />
                    </label>
                  ))}
                  <button className="btn" onClick={submitAI}>Submit interview</button>
                </div>
              )}
              {pendingAi && (
                <div style={{ marginTop: 10 }}>
                  <p className="muted" style={{ marginBottom: 14 }}>Your answers are recorded. You can answer a second, different set of reflection questions — both rounds go on file for the company — or finish here.</p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn secondary" onClick={retakeAI}>Retake interview (new questions)</button>
                    <button className="btn" onClick={finishAI}>Finish interview</button>
                  </div>
                </div>
              )}

              {['company_test', 'hr_interview', 'tech_interview'].includes(application.stage) && (
                <p className="muted">You've cleared platform verification. The company runs the next steps — they'll contact you at your university email, and your progress updates here.</p>
              )}
              {application.stage === 'hired' && (
                <div className="alert ok" style={{ marginTop: 8 }}>
                  🎉 You were hired for this role. Match recorded on the ledger:{' '}
                  <span className="badge verified mono">JOB-{String(job.id).padStart(4, '0')} ⟷ STU-{String(user.id).padStart(4, '0')}</span>
                </div>
              )}
              {application.stage === 'rejected' && (
                <p className="muted">This application didn't go through this time. Every new posting is a clean slate — same test, same bar, for everyone.</p>
              )}
            </>
          )}
        </div>
      )}
    </main>
  );
}
