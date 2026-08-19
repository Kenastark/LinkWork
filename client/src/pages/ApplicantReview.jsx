import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import DateTimePicker from '../components/DateTimePicker.jsx';
import { reached, formatSlot } from '../stages.js';
import useFocusTrap from '../useFocusTrap.js';
import { useTranslatedTexts } from '../useTranslatedTexts.js';
import { useI18n, splitT } from '../i18n.jsx';

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

const DETAIL_TAB_KEYS = [
  { key: 'overview', labelKey: 'applicantReview.tabOverview' },
  { key: 'ai', labelKey: 'applicantReview.tabAi' },
  { key: 'company_test', labelKey: 'applicantReview.tabCompanyTest' },
  { key: 'hr', labelKey: 'applicantReview.tabHr' },
  { key: 'tech', labelKey: 'applicantReview.tabTech' },
];
function defaultTabForStage(stage) {
  return { ai_interview: 'ai', company_test: 'company_test', hr_interview: 'hr', tech_interview: 'tech' }[stage] || 'overview';
}
const ADVANCE_GATE_KEY = {
  company_test: 'applicantReview.gateCompanyTest',
  hr_interview: 'applicantReview.gateHrInterview',
  tech_interview: 'applicantReview.gateTechInterview',
};
const KIND_I18N_KEY = { hr_interview: 'interview.kindHrInterview', tech_interview: 'interview.kindTechInterview' };

// ---- tabs ----
function OverviewTab({ applicant }) {
  const { t } = useI18n();
  const rows = [
    [t('applicantReview.rowCurrentStage'), t(`stage.${applicant.stage}`)],
    [t('applicantReview.rowSkillTest'), applicant.skill_score != null ? `${applicant.skill_score}%` : '—'],
    [t('applicantReview.rowAiInterview'), applicant.ai_score != null ? `${applicant.ai_score}/100` : t('applicantReview.notScored')],
    [t('applicantReview.rowCompanyTest'), applicant.company_test_score != null ? `${applicant.company_test_score}%` : t('applicantReview.notTaken')],
  ];
  return (
    <div>
      <h3 style={{ fontSize: 17, marginBottom: 10 }}>{t('applicantReview.overviewTitle')}</h3>
      <table className="ledger">
        <tbody>{rows.map(([k, v]) => <tr key={k}><td style={{ fontWeight: 600, width: 220 }}>{k}</td><td>{v}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function AiInterviewTab({ applicant, aiAnswers, onChange }) {
  const { t } = useI18n();
  const [scores, setScores] = useState(() => Object.fromEntries(aiAnswers.map(a => [a.id, a.company_score ?? ''])));
  const [saved, setSaved] = useState('');
  const [err, setErr] = useState('');

  const save = async () => {
    setErr(''); setSaved('');
    try {
      const r = await api.post(`/api/company/applicants/${applicant.id}/ai-scores`, { scores });
      setSaved(r.ai_score != null ? t('applicantReview.savedWithScore', { n: r.ai_score }) : t('applicantReview.saved'));
      onChange();
    } catch (e) { setErr(e.message); }
  };

  if (aiAnswers.length === 0) return <><h3 style={{ fontSize: 17 }}>{t('applicantReview.tabAi')}</h3><p className="muted" style={{ marginTop: 8 }}>{t('applicantReview.aiNotCompleted')}</p></>;

  return (
    <div>
      <div className="job-row">
        <h3 style={{ fontSize: 17 }}>{t('applicantReview.aiScoreTitle')}</h3>
        {applicant.ai_score != null && <span className="badge verified">{t('applicantReview.sectionScoreBadge', { n: applicant.ai_score })}</span>}
      </div>
      <p className="muted" style={{ fontSize: 13, margin: '6px 0 4px' }}>{t('applicantReview.aiIntro')}</p>
      {err && <div className="alert error" role="alert">{err}</div>}
      {saved && <div className="alert ok" role="status">{saved}</div>}
      {[1, 2].filter(round => aiAnswers.some(qa => qa.attempt === round)).map(round => (
        <div key={round}>
          {aiAnswers.some(qa => qa.attempt === 2) && <p className="id-tag" style={{ marginTop: 16 }}>{t('applicantReview.roundLabel', { n: round })}</p>}
          {aiAnswers.filter(qa => qa.attempt === round).map(qa => (
            <div key={qa.id} style={{ marginTop: 12, borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{qa.question}</p>
              <p className="muted" style={{ marginTop: 4 }}>{qa.answer}</p>
              <label className="score-input">{t('applicantReview.scoreLabel')}
                <input type="number" min="0" max="10" value={scores[qa.id]} onChange={e => setScores(s => ({ ...s, [qa.id]: e.target.value }))} />
                <span className="muted">{t('applicantReview.outOf10')}</span>
              </label>
            </div>
          ))}
        </div>
      ))}
      <button className="btn" style={{ marginTop: 14 }} onClick={save}>{t('applicantReview.saveScores')}</button>
    </div>
  );
}

function CompanyTestTab({ companyTest }) {
  const { t } = useI18n();
  const { questions, answers, score } = companyTest;
  const answerFor = (qid) => answers.find(a => a.question_id === qid);
  const taken = score != null;
  return (
    <div>
      <div className="job-row">
        <h3 style={{ fontSize: 17 }}>{t('applicantReview.companyTestTitle')}</h3>
        {taken ? <span className="badge verified">{t('applicantReview.companyTestScore', { n: score })}</span> : <span className="badge pending">{t('applicantReview.companyTestNotTaken')}</span>}
      </div>
      <p className="muted" style={{ fontSize: 13, margin: '6px 0 10px' }}>{t('applicantReview.companyTestIntro')}</p>
      {!taken && <p className="muted">{t('applicantReview.companyTestNotSubmitted')}</p>}
      {taken && questions.map((q, i) => {
        const ans = answerFor(q.id);
        return (
          <div key={q.id} style={{ marginTop: 12, borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
            <p style={{ fontWeight: 600, fontSize: 14 }}>{i + 1}. {q.question}</p>
            <div style={{ marginTop: 6 }}>
              {q.options.map((opt, oi) => {
                const chosen = ans && ans.answer_idx === oi;
                const correct = q.answer_idx === oi;
                return (
                  <p key={oi} style={{ fontSize: 13.5, color: correct ? 'var(--verify)' : chosen ? 'var(--danger)' : 'var(--ink-soft)', fontWeight: chosen || correct ? 600 : 400 }}>
                    {correct ? '✓' : chosen ? '✕' : '•'} {opt}{chosen ? ` ${t('applicantReview.theirAnswer')}` : ''}
                  </p>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Score + written feedback the interviewer records after the interview.
function InterviewFeedback({ iv, onChange }) {
  const { t } = useI18n();
  const [score, setScore] = useState(iv.score ?? '');
  const [feedback, setFeedback] = useState(iv.feedback ?? '');
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    setErr(''); setSaved(false);
    try { await api.post(`/api/company/interviews/${iv.id}/feedback`, { score, feedback }); setSaved(true); onChange(); }
    catch (e) { setErr(e.message); }
  };

  return (
    <div style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
      <p className="filter-label">{t('applicantReview.interviewerAssessment')}</p>
      <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>{t('applicantReview.assessmentIntro')}</p>
      {err && <div className="alert error" role="alert">{err}</div>}
      {saved && <div className="alert ok" role="status">{t('applicantReview.assessmentSaved')}</div>}
      <label className="score-input">{t('applicantReview.scoreLabel')}
        <input type="number" min="0" max="10" value={score} onChange={e => setScore(e.target.value)} />
        <span className="muted">{t('applicantReview.outOf10')}</span>
      </label>
      <label className="field" style={{ marginTop: 10 }}>{t('applicantReview.commentsLabel')}
        <textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder={t('applicantReview.feedbackPlaceholder')} />
      </label>
      <button className="btn sm" onClick={save}>{t('applicantReview.saveAssessment')}</button>
    </div>
  );
}

function InterviewTab({ applicant, interviews, kind, onChange }) {
  const { t } = useI18n();
  const [proposed, setProposed] = useState([]);
  const [picker, setPicker] = useState(false);
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');

  const iv = interviews.find(x => x.kind === kind);
  const atThisStage = applicant.stage === kind;
  const kindLabel = t(KIND_I18N_KEY[kind]);

  const send = async () => {
    setErr('');
    try { await api.post('/api/company/interviews', { application_id: applicant.id, slots: proposed }); setProposed([]); setPicker(false); onChange(); }
    catch (e) { setErr(e.message); }
  };
  const addParticipant = async () => {
    if (!email.trim()) return;
    setErr('');
    try { await api.post(`/api/company/interviews/${iv.id}/participants`, { email: email.trim() }); setEmail(''); onChange(); }
    catch (e) { setErr(e.message); }
  };
  const removeParticipant = async (pid) => {
    try { await api.delete(`/api/company/interviews/${iv.id}/participants/${pid}`); onChange(); } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <h3 style={{ fontSize: 17 }}>{kindLabel}</h3>
      {err && <div className="alert error" style={{ marginTop: 10 }}>{err}</div>}
      {!iv && !atThisStage && (
        <p className="muted" style={{ marginTop: 8 }}>
          {reached(applicant.stage, kind) ? t('applicantReview.stagePassed') : t('applicantReview.stageNotYet', { kind: kindLabel.toLowerCase() })}
        </p>
      )}
      {iv && (
        <div className="card" style={{ marginTop: 12, boxShadow: 'none' }}>
          <div className="job-row">
            <span className={'badge ' + (iv.status === 'scheduled' ? 'verified' : 'pending')}>{iv.status === 'scheduled' ? t('applicantReview.scheduled') : t('applicantReview.awaitingCandidate')}</span>
          </div>
          {iv.status === 'scheduled' && iv.chosen_slot ? (
            <>
              <p style={{ marginTop: 8, fontWeight: 600 }}>{formatSlot(iv.chosen_slot.start_at, iv.chosen_slot.duration_min)}</p>
              <Link to={`/meeting/${iv.id}`} className="btn sm" style={{ marginTop: 10 }}>{t('applicantReview.joinMeeting')}</Link>
            </>
          ) : (
            <div className="slot-list">
              {iv.slots.map(s => <div className="slot-row" key={s.id}><span className="slot-when">{formatSlot(s.start_at, s.duration_min)}</span></div>)}
              <p className="muted" style={{ fontSize: 13 }}>{t('applicantReview.proposedWaiting')}</p>
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <p className="filter-label">{t('applicantReview.participantsLabel')} {kind === 'tech_interview' ? t('applicantReview.participantsTechHint') : t('applicantReview.participantsColleagueHint')}</p>
            <div className="participant-chips">
              {iv.participants.length === 0 && <span className="muted" style={{ fontSize: 13 }}>{t('applicantReview.justYou')}</span>}
              {iv.participants.map(p => <span className="participant-chip" key={p.id}>{p.email}<button onClick={() => removeParticipant(p.id)} aria-label={t('applicantReview.removeParticipant', { email: p.email })}>✕</button></span>)}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <input type="email" placeholder="colleague@company.com" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addParticipant(); } }} />
              <button className="btn sm secondary" onClick={addParticipant}>{t('applicantReview.add')}</button>
            </div>
          </div>
          <InterviewFeedback iv={iv} onChange={onChange} />
        </div>
      )}
      {!iv && atThisStage && (
        <div style={{ marginTop: 14 }}>
          {!picker && proposed.length === 0 && <button className="btn sm" onClick={() => setPicker(true)}>{t('applicantReview.proposeTimes', { kind: kindLabel.toLowerCase() })}</button>}
          {(picker || proposed.length > 0) && (
            <>
              {proposed.length > 0 && (
                <div className="slot-list">
                  {proposed.map((s, i) => (
                    <div className="slot-row" key={i}>
                      <span className="slot-when">{formatSlot(s.start_at, s.duration_min)}</span>
                      <button className="btn sm ghost" onClick={() => setProposed(p => p.filter((_, x) => x !== i))}>{t('applicantReview.remove')}</button>
                    </div>
                  ))}
                </div>
              )}
              {picker
                ? <DateTimePicker onAdd={(slot) => { setProposed(p => [...p, slot]); setPicker(false); }} />
                : <button className="btn sm secondary" onClick={() => setPicker(true)}>{t('applicantReview.addAnotherTime')}</button>}
              {proposed.length > 0 && !picker && (
                <button className="btn" style={{ marginTop: 12 }} onClick={send}>
                  {t(proposed.length === 1 ? 'applicantReview.sendTimesOne' : 'applicantReview.sendTimesOther', { n: proposed.length })}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---- reject confirmation modal ----
function RejectModal({ name, role, onCancel, onConfirm, busy }) {
  const { t } = useI18n();
  const ref = useRef(null);
  useFocusTrap(true, ref, onCancel);

  const [confirmPre, confirmName, confirmMid, confirmRole, confirmSuffix] = splitParts(t('applicantReview.rejectConfirm', { name, role }), 4);
  const [warnPre, warnBold, warnSuffix] = splitParts(t('applicantReview.rejectWarning'), 2);

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" ref={ref} onClick={e => e.stopPropagation()}
           role="dialog" aria-modal="true" aria-labelledby="reject-title">
        <h3 id="reject-title" style={{ fontSize: 20 }}>{t('applicantReview.rejectTitle')}</h3>
        <p style={{ marginTop: 10 }}>{confirmPre} <b>{confirmName}</b> {confirmMid} <b>{confirmRole}</b> {confirmSuffix}</p>
        <div className="alert error" style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>⚠️</span>
          <span>{warnPre} <b>{warnBold}</b> {warnSuffix}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
          <button className="btn secondary" onClick={onCancel} disabled={busy}>{t('applicantReview.cancel')}</button>
          <button className="btn danger" onClick={onConfirm} disabled={busy}>{busy ? t('applicantReview.rejecting') : t('applicantReview.yesReject')}</button>
        </div>
      </div>
    </div>
  );
}

export default function ApplicantReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [detail, setDetail] = useState(null);
  const [tab, setTab] = useState('overview');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [confirmReject, setConfirmReject] = useState(false);
  const [busy, setBusy] = useState(false);
  const [translatedTitle] = useTranslatedTexts([detail?.applicant?.title || '']);

  const load = (resetTab = false) => api.get(`/api/company/applicants/${id}`)
    .then(d => { setDetail(d); if (resetTab) setTab(defaultTabForStage(d.applicant.stage)); })
    .catch(e => setError(e.message));
  useEffect(() => { load(true); /* eslint-disable-next-line */ }, [id]);

  if (error) return <main className="container"><div className="alert error" role="alert">{error}</div><Link to="/company" className="btn secondary" style={{ marginTop: 12 }}>{t('applicantReview.backToDashboard')}</Link></main>;
  if (!detail) return <main className="container" />;

  const a = detail.applicant;
  const canAct = ['company_test', 'hr_interview', 'tech_interview'].includes(a.stage);

  const advance = async () => {
    setError(''); setOk(''); setBusy(true);
    try {
      const r = await api.post(`/api/company/applicants/${a.id}/advance`);
      setOk(r.stage === 'hired' ? t('applicantReview.hiredOk') : t('applicantReview.advancedTo', { stage: t(`stage.${r.stage}`) }));
      await load(true);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const doReject = async () => {
    setError(''); setOk(''); setBusy(true);
    try {
      await api.post(`/api/company/applicants/${a.id}/reject`);
      setConfirmReject(false);
      await load();
      setOk(t('applicantReview.rejectedOk'));
    } catch (e) { setError(e.message); setConfirmReject(false); } finally { setBusy(false); }
  };

  return (
    <main className="container">
      <Link to="/company" className="btn sm ghost" style={{ marginBottom: 12 }}>{t('applicantReview.backToApplicants')}</Link>

      <div className="card">
        <div className="job-row">
          <div>
            <h1 style={{ fontSize: 24 }}>{a.student_name}</h1>
            <p className="muted">{translatedTitle} · {a.student_email} · {a.major}</p>
          </div>
          <span className={'badge ' + (a.stage === 'hired' ? 'verified' : a.stage === 'rejected' ? 'danger' : 'pending')}>{t(`stage.${a.stage}`)}</span>
        </div>

        {error && <div className="alert error" style={{ marginTop: 14 }}>{error}</div>}
        {ok && <div className="alert ok" style={{ marginTop: 14 }}>{ok}</div>}

        <div className="tabs" style={{ marginTop: 16 }}>
          {DETAIL_TAB_KEYS.map(dt => <button key={dt.key} className={tab === dt.key ? 'active' : ''} onClick={() => setTab(dt.key)}>{t(dt.labelKey)}</button>)}
        </div>

        <div style={{ marginTop: 16 }}>
          {tab === 'overview' && <OverviewTab applicant={a} />}
          {tab === 'ai' && <AiInterviewTab applicant={a} aiAnswers={detail.aiAnswers} onChange={() => load()} />}
          {tab === 'company_test' && <CompanyTestTab companyTest={detail.companyTest} />}
          {tab === 'hr' && <InterviewTab applicant={a} interviews={detail.interviews || []} kind="hr_interview" onChange={() => load()} />}
          {tab === 'tech' && <InterviewTab applicant={a} interviews={detail.interviews || []} kind="tech_interview" onChange={() => load()} />}
        </div>
      </div>

      {canAct && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>{t('applicantReview.decisionTitle')}</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn" onClick={advance} disabled={busy || !detail.can_advance} title={detail.can_advance ? '' : t(ADVANCE_GATE_KEY[a.stage])}>
              {a.stage === 'tech_interview' ? t('applicantReview.hire') : t('applicantReview.advanceNext')}
            </button>
            <button className="btn danger" onClick={() => setConfirmReject(true)} disabled={busy}>{t('applicantReview.rejectCandidate')}</button>
          </div>
          {!detail.can_advance && <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>{t(ADVANCE_GATE_KEY[a.stage])}</p>}
        </div>
      )}

      {a.stage === 'hired' && <div className="alert ok" style={{ marginTop: 16 }}>{t('applicantReview.hiredBanner')}</div>}
      {a.stage === 'rejected' && <div className="alert error" style={{ marginTop: 16 }}>{t('applicantReview.rejectedBanner')}</div>}

      {confirmReject && (
        <RejectModal name={a.student_name} role={translatedTitle} busy={busy}
          onCancel={() => setConfirmReject(false)} onConfirm={doReject} />
      )}
    </main>
  );
}
