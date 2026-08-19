import { useI18n } from '../i18n.jsx';

export default function Resources() {
  const { t } = useI18n();
  return (
    <main className="container" style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 30, marginBottom: 12 }}>{t('resources.title')}</h1>
      <div className="card">
        <span className="badge pending">{t('resources.badge')}</span>
        <p className="muted" style={{ marginTop: 12 }}>
          {t('resources.body')}
        </p>
      </div>
    </main>
  );
}
