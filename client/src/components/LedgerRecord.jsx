import { useI18n } from '../i18n.jsx';

const pad = (n) => String(n).padStart(4, '0');

// One row of the hire ledger:
//
//   JOB-0042  ⟷  STU-0007   Junior Data Engineer · DataTech   14 May 2026  ★
//
// A record, not a control. It does not hover, does not link and carries no
// interactive role — the whole point is that it is a fact on the register.
//
// Props mirror the /api/ledger/recent shape in BRANDING.md section 8 so that
// route can be dropped in without reshaping anything. studentId is optional:
// section 8 flags that publishing it alongside a job title and company can
// identify a real person at pilot scale, and the safer variant omits it.
export default function LedgerRecord({
  jobId, studentId, title, company, hiredAt, facultyVerified = false, style,
}) {
  const { t } = useI18n();
  const date = hiredAt
    ? new Date(hiredAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="ledger-record" style={style}>
      <span className="lr-ids">
        JOB-{pad(jobId)}
        {studentId != null && <> ⟷ STU-{pad(studentId)}</>}
      </span>
      <span className="lr-role">{title}</span>
      {company && <span className="lr-company">{company}</span>}
      {date && <span className="lr-date">{date}</span>}
      {facultyVerified && (
        <span className="lr-seal">
          <span aria-hidden="true">★</span>
          <span className="sr-only">{t('ledger.facultyVerified')}</span>
        </span>
      )}
    </div>
  );
}
