import { useI18n } from '../i18n.jsx';

export const POLICY_VERSION = '2026-07-21';
// TODO: replace with a real contact address before this goes live for real users.
const CONTACT_EMAIL = 'privacy@linkwork.app';

export default function Privacy() {
  const { t } = useI18n();
  return (
    <main className="container" style={{ maxWidth: 720 }}>
      <span className="id-tag">{t('privacy.policyVersionLabel')} {POLICY_VERSION}</span>
      <h1 style={{ fontSize: 30, margin: '8px 0 20px' }}>{t('privacy.title')}</h1>

      <div className="card">
        <h3>{t('privacy.collectTitle')}</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          {t('privacy.collectBody')}
        </p>

        <h3 style={{ marginTop: 18 }}>{t('privacy.whyTitle')}</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          {t('privacy.whyBody')}
        </p>

        <h3 style={{ marginTop: 18 }}>{t('privacy.retentionTitle')}</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          {t('privacy.retentionBody')}
        </p>

        <h3 style={{ marginTop: 18 }}>{t('privacy.rightsTitle')}</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          {t('privacy.rightsBodyPre')} <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>

        <h3 style={{ marginTop: 18 }}>{t('privacy.contactTitle')}</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          {t('privacy.contactBodyPre')} <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>

        <p className="muted" style={{ marginTop: 18, fontSize: 12.5 }}>
          {t('privacy.disclaimer')}
        </p>
      </div>
    </main>
  );
}
