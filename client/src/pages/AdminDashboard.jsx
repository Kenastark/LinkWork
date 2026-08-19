import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useTranslatedTexts } from '../useTranslatedTexts.js';
import { useI18n } from '../i18n.jsx';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const { t } = useI18n();
  const translatedMatchTitles = useTranslatedTexts((data?.matches || []).map(m => m.title));

  const load = () => api.get('/api/admin/overview').then(setData).catch(e => setError(e.message));
  useEffect(() => { load(); }, []);

  const setCompany = async (id, status) => { await api.post(`/api/admin/companies/${id}/status`, { status }); load(); };
  const setDocs = async (id, status) => { await api.post(`/api/admin/students/${id}/doc-status`, { status }); load(); };

  if (error) return <main className="container"><div className="alert error" role="alert">{error}</div></main>;
  if (!data) return <main className="container" />;

  return (
    <main className="container">
      <h1 style={{ fontSize: 30, marginBottom: 20 }}>{t('adminDashboard.title')}</h1>

      <div className="grid cols-3" style={{ marginBottom: 24 }}>
        <div className="card"><span className="id-tag">{t('adminDashboard.openPostings')}</span><h3 style={{ fontSize: 34 }}>{data.stats.open_jobs}</h3></div>
        <div className="card"><span className="id-tag">{t('adminDashboard.companiesAwaitingReview')}</span><h3 style={{ fontSize: 34 }}>{data.stats.companies_pending}</h3></div>
        <div className="card"><span className="id-tag">{t('adminDashboard.hiresOnLedger')}</span><h3 style={{ fontSize: 34, color: 'var(--verify)' }}>{data.stats.hires}</h3></div>
      </div>

      <div className="card">
        <h3>{t('adminDashboard.companiesTitle')}</h3>
        <p className="muted" style={{ marginBottom: 12 }}>{t('adminDashboard.companiesIntro')}</p>
        <table className="ledger">
          <thead><tr><th>{t('adminDashboard.companyHeader')}</th><th>{t('adminDashboard.contactHeader')}</th><th>{t('adminDashboard.statusHeader')}</th><th>{t('adminDashboard.actionsHeader')}</th></tr></thead>
          <tbody>
            {data.companies.map(c => (
              <tr key={c.id}>
                <td><b>{c.name}</b><br /><span className="muted">{c.website || t('adminDashboard.noWebsite')} · {c.description || '—'}</span></td>
                <td>{c.owner_name}<br /><span className="muted">{c.owner_email}</span></td>
                <td><span className={'badge ' + (c.status === 'approved' ? 'verified' : c.status === 'rejected' ? 'danger' : 'pending')}>{c.status}</span></td>
                <td>
                  {c.status !== 'approved' && <button className="btn sm" onClick={() => setCompany(c.id, 'approved')}>{t('adminDashboard.approve')}</button>}{' '}
                  {c.status !== 'rejected' && <button className="btn sm danger" onClick={() => setCompany(c.id, 'rejected')}>{t('adminDashboard.reject')}</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>{t('adminDashboard.studentVerificationTitle')}</h3>
        <table className="ledger">
          <thead><tr><th>{t('adminDashboard.studentHeader')}</th><th>{t('adminDashboard.majorHeader')}</th><th>{t('adminDashboard.documentsHeader')}</th><th>{t('adminDashboard.actionsHeader')}</th></tr></thead>
          <tbody>
            {data.students.map(s => (
              <tr key={s.id}>
                <td><b>{s.name}</b><br /><span className="muted">{s.email} · <span className="id-tag">STU-{String(s.id).padStart(4, '0')}</span></span></td>
                <td>{s.major}</td>
                <td><span className={'badge ' + (s.doc_status === 'verified' ? 'verified' : s.doc_status === 'rejected' ? 'danger' : 'pending')}>{s.doc_status}</span>{s.doc_note ? <><br /><span className="muted">{s.doc_note}</span></> : null}</td>
                <td>
                  {s.doc_status === 'submitted' && <>
                    <button className="btn sm" onClick={() => setDocs(s.id, 'verified')}>{t('adminDashboard.verify')}</button>{' '}
                    <button className="btn sm danger" onClick={() => setDocs(s.id, 'rejected')}>{t('adminDashboard.reject')}</button>
                  </>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ borderColor: 'var(--verify)' }}>
        <h3>{t('adminDashboard.matchLedgerTitle')}</h3>
        <p className="muted" style={{ marginBottom: 12 }}>{t('adminDashboard.matchLedgerIntro')}</p>
        {data.matches.length === 0 ? <p className="muted">{t('adminDashboard.noHires')}</p> : (
          <table className="ledger">
            <thead><tr><th>{t('adminDashboard.matchHeader')}</th><th>{t('adminDashboard.roleHeader')}</th><th>{t('adminDashboard.companyHeader')}</th><th>{t('adminDashboard.hiredHeader')}</th></tr></thead>
            <tbody>
              {data.matches.map((m, i) => (
                <tr key={m.id}>
                  <td className="match-ids">JOB-{String(m.job_id).padStart(4, '0')} ⟷ STU-{String(m.student_id).padStart(4, '0')}</td>
                  <td>{translatedMatchTitles[i]}<br /><span className="muted">{m.student_name}</span></td>
                  <td>{m.company_name}</td>
                  <td className="muted">{m.hired_at?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
