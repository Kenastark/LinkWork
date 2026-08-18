import { Link } from 'react-router-dom';
import { useAuth } from '../App.jsx';
import { useI18n } from '../i18n.jsx';

// The 404 is a ledger record with a null ID. The product's whole claim is that
// every posting is on the register; a page that is not on it says so in the
// register's own voice rather than with an apology.
export default function NotFound() {
  const { user } = useAuth();
  const { t } = useI18n();

  return (
    <main className="container not-found">
      <div className="ledger-record" aria-hidden="true">
        <span className="lr-ids">JOB-???? ⟷ ---</span>
      </div>
      <h1>{t('notFound.title')}</h1>
      <p className="muted">{t('notFound.body')}</p>
      <div className="not-found-actions">
        <Link to="/" className="btn">{t('notFound.home')}</Link>
        <Link to={user?.role === 'student' ? '/jobs' : '/auth'} className="btn secondary">
          {t('notFound.jobs')}
        </Link>
      </div>
    </main>
  );
}
