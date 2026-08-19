import { Link, useSearchParams } from 'react-router-dom';
import { useI18n } from '../i18n.jsx';

export default function ComingSoon() {
  const [params] = useSearchParams();
  const feature = params.get('feature');
  const { t } = useI18n();
  return (
    <main className="container" style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 30, marginBottom: 12 }}>{feature || t('comingSoon.title')}</h1>
      <div className="card">
        <span className="badge pending">{t('comingSoon.badge')}</span>
        <p className="muted" style={{ marginTop: 12 }}>
          {feature ? t('comingSoon.bodyWithFeature', { feature }) : t('comingSoon.bodyGeneric')} {t('comingSoon.bodySuffix')}
        </p>
        <Link to="/" className="btn secondary" style={{ marginTop: 16 }}>{t('comingSoon.backHome')}</Link>
      </div>
    </main>
  );
}
