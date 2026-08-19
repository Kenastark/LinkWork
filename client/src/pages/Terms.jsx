import { POLICY_VERSION } from './Privacy.jsx';
import { useI18n, splitT } from '../i18n.jsx';

export default function Terms() {
  const { t } = useI18n();
  const [terminationPre, terminationRest] = splitT(t('terms.termination'));
  const [terminationLink, terminationSuffix] = splitT(terminationRest);
  return (
    <main className="container" style={{ maxWidth: 720 }}>
      <span className="id-tag">{t('terms.policyVersionLabel')} {POLICY_VERSION}</span>
      <h1 style={{ fontSize: 30, margin: '8px 0 20px' }}>{t('terms.title')}</h1>

      <div className="card">
        <h3>{t('terms.eligibilityTitle')}</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          {t('terms.eligibilityBody')}
        </p>

        <h3 style={{ marginTop: 18 }}>{t('terms.commitmentsTitle')}</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          {t('terms.commitmentsBody')}
        </p>

        <h3 style={{ marginTop: 18 }}>{t('terms.fairUseTitle')}</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          {t('terms.fairUseBody')}
        </p>

        <h3 style={{ marginTop: 18 }}>{t('terms.terminationTitle')}</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          {terminationPre} <a href="/privacy">{terminationLink}</a> {terminationSuffix}
        </p>
      </div>
    </main>
  );
}
