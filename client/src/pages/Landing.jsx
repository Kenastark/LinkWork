import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import { useI18n } from '../i18n.jsx';

const BRAND_PALETTE = [
  { bg: '#e3f3ec', fg: '#147d5b' }, // verify
  { bg: '#fbf3dd', fg: '#7c5a00' }, // gold
  { bg: '#e6ecf7', fg: '#2b4a8c' }, // blue
  { bg: '#f3e8f5', fg: '#7a3d8c' }, // plum
  { bg: '#fbe9e2', fg: '#a24a2b' }, // terracotta
  { bg: '#e4f0f0', fg: '#1c6b6b' }, // teal
];
function brandColors(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return BRAND_PALETTE[hash % BRAND_PALETTE.length];
}

function Icon({ d }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function MatchIllustration() {
  // Decorative job-card mockup (not interactive) — styled after the reference,
  // in the LinkWork green/gold theme, with real LinkWork content.
  return (
    <div className="match-mock" role="img" aria-label="Example job posting card">
      <div className="match-mock-panel">
        <div className="match-mock-card">
          <span className="match-mock-badge">New roles <b>6</b></span>
          <div className="match-mock-head">
            <span className="match-mock-logo">D</span>
            <div>
              <h4>Software Engineering Intern</h4>
              <p>DataTech Hungary</p>
            </div>
          </div>
          <div className="match-mock-chips">
            <span className="mm-chip green">💶 280K HUF/mo</span>
            <span className="mm-chip green">📈 Internship</span>
            <span className="mm-chip green">📍 Debrecen</span>
            <span className="mm-chip">🏠 Hybrid</span>
            <span className="mm-chip">🏷 Informatics</span>
            <span className="mm-chip gold">★ Faculty-verified</span>
          </div>
          <div className="match-mock-actions">
            <span className="mm-btn primary">View &amp; apply</span>
            <span className="mm-btn ghost">→ Skip</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Category icons — hand-drawn inline SVG (no external asset / flaticon dependency).
const FEATURE_ICONS = {
  track: (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="2.4" /><circle cx="12" cy="12" r="2.4" /><circle cx="19" cy="12" r="2.4" opacity="0.5" />
    </svg>
  ),
  offers: (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="4" y="12" width="4" height="7" rx="1.2" /><rect x="10" y="8" width="4" height="11" rx="1.2" /><rect x="16" y="4" width="4" height="15" rx="1.2" />
    </svg>
  ),
  transparent: (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2c.6 4.1 2.3 5.8 6.4 6.4C14.3 9 12.6 10.7 12 14.8 11.4 10.7 9.7 9 5.6 8.4 9.7 7.8 11.4 6.1 12 2Z" />
      <path d="M19 3.5c.2 1.3.7 1.8 2 2-1.3.2-1.8.7-2 2-.2-1.3-.7-1.8-2-2 1.3-.2 1.8-.7 2-2Z" />
    </svg>
  ),
};
const CARD_ICONS = {
  doc: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h6" />
    </svg>
  ),
  bell: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  ),
};

function FeatureRow({ tone, icon, title, body, ctaTo, ctaLabel, art, reverse }) {
  return (
    <section className={`feature-row feature-${tone}${reverse ? ' reverse' : ''}`}>
      <div className="container feature-grid">
        <div className="feature-copy">
          <span className="feature-badge">{icon}</span>
          <h2>{title}</h2>
          <p>{body}</p>
          <Link to={ctaTo} className="btn secondary">{ctaLabel}</Link>
        </div>
        <div className="feature-art-wrap">{art}</div>
      </div>
    </section>
  );
}

// Product-preview mockups — real LinkWork content, echoing the reference's panel + card + floating tags.
function TrackArt({ t }) {
  return (
    <div className="feature-panel panel-purple">
      <div className="mock-card">
        <span className="mock-mono">JOB-0042</span>
        <h4>{t('mock.trackRole')}</h4>
        <p>{t('mock.trackCompany')}</p>
        <ul className="mock-track">
          <li className="done"><span className="dot" />{t('mock.trackStep1')}</li>
          <li className="done"><span className="dot" />{t('mock.trackStep2')}</li>
          <li className="current"><span className="dot" />{t('mock.trackStep3')}</li>
          <li><span className="dot" />{t('mock.trackStep4')}</li>
          <li><span className="dot" />{t('mock.trackStep5')}</li>
        </ul>
      </div>
      <span className="feature-tag tag-a">🔔 {t('mock.trackTag')}</span>
    </div>
  );
}
function OffersArt({ t }) {
  return (
    <div className="feature-panel panel-blue">
      <div className="mock-card">
        <span className="mock-mono">JOB-0037</span>
        <h4>{t('mock.offersRole')}</h4>
        <p>{t('mock.offersCompany')}</p>
        <div className="mock-tags">
          <span className="mock-chip strong">280K HUF / mo</span>
          <span className="mock-chip">{t('mock.chipHybrid')}</span>
          <span className="mock-chip">{t('mock.chipInternship')}</span>
          <span className="mock-chip">{t('mock.chip6Months')}</span>
        </div>
      </div>
      <span className="feature-tag tag-b">💰 {t('mock.tagSalary')}</span>
      <span className="feature-tag tag-c">🏠 {t('mock.tagRemote')}</span>
    </div>
  );
}
function TransparentArt({ t }) {
  return (
    <div className="feature-panel panel-green">
      <div className="mock-card">
        <span className="mock-mono">GreenField AgroTech Zrt.</span>
        <h4 style={{ marginTop: 6 }}>{t('mock.whatToExpect')}</h4>
        <ul className="mock-facts">
          <li><b>{t('mock.factVerified')}</b> {t('mock.factVerifiedRest')}</li>
          <li><b>{t('mock.factResponse')}</b> {t('mock.factResponseRest')}</li>
          <li><b>{t('mock.factSteps')}</b>{t('mock.factStepsRest')}</li>
        </ul>
        <div className="mock-tags">
          <span className="mock-chip">{t('mock.chipMentorship')}</span>
          <span className="mock-chip">{t('mock.chipPaid')}</span>
        </div>
      </div>
      <span className="feature-tag tag-a">✓ {t('mock.tagCommitted')}</span>
    </div>
  );
}

function HowItWorks() {
  const { t } = useI18n();
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);

  const steps = [
    { icon: '1', title: t('how.step1Title'), body: t('how.step1Body') },
    { icon: '2', title: t('how.step2Title'), body: t('how.step2Body') },
    { icon: '3', title: t('how.step3Title'), body: t('how.step3Body') },
  ];

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') { setRevealed(true); return; }
    const el = ref.current;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setRevealed(true); observer.disconnect(); }
    }, { threshold: 0.2 });
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="how">
      <div className="container">
        <span className="eyebrow">{t('how.eyebrow')}</span>
        <h2>{t('how.title')}</h2>
        <p className="sub">{t('how.subtitle')}</p>
        <div className={`how-flow${revealed ? ' revealed' : ''}`} ref={ref}>
          {steps.map(s => (
            <div className="how-step" key={s.icon}>
              <div className="how-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [stats, setStats] = useState(null);

  useEffect(() => { api.get('/api/stats').then(setStats).catch(() => {}); }, []);

  return (
    <>
      <section className="hero">
        <div className="container">
          <div>
            <div className="eyebrow">{t('hero.eyebrow')}</div>
            <h1>{t('hero.title')} <em>{t('hero.titleEm')}</em></h1>
            <p className="lede">{t('hero.lede')}</p>
            <div className="cta-row">
              {user ? (
                <>
                  <Link to="/student" className="btn">{t('nav.findInternship')}</Link>
                  <Link to="/companies" className="btn secondary" style={{ borderColor: '#fff', color: '#fff' }}>{t('nav.exploreCompanies')}</Link>
                </>
              ) : (
                <>
                  <Link to="/auth?mode=student" className="btn">{t('hero.ctaJoinStudent')}</Link>
                  <Link to="/auth?mode=company" className="btn secondary" style={{ borderColor: '#fff', color: '#fff' }}>{t('hero.ctaHireStudents')}</Link>
                </>
              )}
            </div>
          </div>

          <div className="hero-chain" aria-label="How verification flows">
            <div className="hnode">
              <div className="hicon"><Icon d="M12 3 2 8l10 5 10-5-10-5Zm-6 7.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5" /></div>
              <div><b>{t('hero.chainFacultyTitle')}</b><span>{t('hero.chainFacultyBody')}</span></div>
            </div>
            <div className="hlink" />
            <div className="hnode">
              <div className="hicon"><Icon d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" /></div>
              <div><b>{t('hero.chainCompanyTitle')}</b><span>{t('hero.chainCompanyBody')}</span></div>
            </div>
            <div className="hlink" />
            <div className="hnode">
              <div className="hicon"><Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /></div>
              <div><b>{t('hero.chainYouTitle')}</b><span>{t('hero.chainYouBody')}</span></div>
            </div>
          </div>
        </div>
      </section>

      {stats && (
        <div className="container">
          <div className="overlap-band">
            <div className="stat"><b>{stats.open_jobs}</b><span>{t('stats.openPostings')}</span></div>
            <div className="stat"><b>{stats.hires}</b><span>{t('stats.hires')}</span></div>
            <div className="stat"><b>{stats.approved_companies}</b><span>{t('stats.companies')}</span></div>
          </div>
        </div>
      )}

      <section className="match-pitch">
        <div className="container match-pitch-grid">
          <div>
            <span className="eyebrow" style={{ color: 'var(--verify)' }}>{t('matchPitch.eyebrow')}</span>
            <h2>{t('matchPitch.title')}</h2>
            <h3 style={{ marginTop: 18, fontSize: 22 }}>{t('matchPitch.subtitle')}</h3>
            <p className="muted" style={{ marginTop: 10, fontSize: 16.5, maxWidth: '46ch' }}>{t('matchPitch.body')}</p>
            <Link to={user ? '/student' : '/auth?mode=student'} className="btn" style={{ marginTop: 22 }}>
              {user ? t('matchPitch.ctaBrowse') : t('matchPitch.ctaGetStarted')}
            </Link>
          </div>
          <div className="match-pitch-art"><MatchIllustration /></div>
        </div>
      </section>

      <FeatureRow
        tone="purple"
        reverse
        icon={FEATURE_ICONS.track}
        title={t('feature.trackTitle')}
        body={t('feature.trackBody')}
        ctaTo={user ? '/my-applications' : '/auth?mode=student'}
        ctaLabel={t('feature.trackCta')}
        art={<TrackArt t={t} />}
      />

      <FeatureRow
        tone="blue"
        icon={FEATURE_ICONS.offers}
        title={t('feature.offersTitle')}
        body={t('feature.offersBody')}
        ctaTo={user ? '/student' : '/auth?mode=student'}
        ctaLabel={t('nav.findInternship')}
        art={<OffersArt t={t} />}
      />

      <FeatureRow
        tone="green"
        reverse
        icon={FEATURE_ICONS.transparent}
        title={t('feature.transparentTitle')}
        body={t('feature.transparentBody')}
        ctaTo={user ? '/companies' : '/auth'}
        ctaLabel={t('feature.transparentCta')}
        art={<TransparentArt t={t} />}
      />

      <section className="land-job">
        <div className="container">
          <h2 className="land-title"><span className="land-title-light">{t('landJob.titleLight')}</span><span className="land-title-bold">{t('landJob.titleBold')}</span></h2>
          <div className="land-grid">
            <div className="land-card stat land-lav">
              <b>{stats ? stats.open_jobs : '—'}</b>
              <p>{t('landJob.card1Pre')}<b>{t('landJob.card1Bold')}</b></p>
            </div>
            <div className="land-card action land-peri">
              <div className="land-card-top">
                <h4>{t('landJob.card2Title')}</h4>
                <span className="land-ic">{CARD_ICONS.doc}</span>
              </div>
              <Link to={user ? '/profile' : '/auth?mode=student'} className="btn dark">{t('landJob.card2Cta')}</Link>
            </div>
            <div className="land-card stat land-cream">
              <b>{stats ? stats.approved_companies : '—'}</b>
              <p>{t('landJob.card3Pre')}<b>{t('landJob.card3Bold')}</b></p>
            </div>
            <div className="land-card action land-gold">
              <div className="land-card-top">
                <h4>{t('landJob.card4Title')}</h4>
                <span className="land-ic">{CARD_ICONS.bell}</span>
              </div>
              <Link to={user ? '/alerts' : '/auth?mode=student'} className="btn dark">{t('landJob.card4Cta')}</Link>
            </div>
          </div>
        </div>
      </section>

      <HowItWorks />

      {/* Illustrative placeholder testimonials — replace with real student quotes before public launch. */}
      <section className="testimonials">
        <div className="container testimonials-grid">
          <div className="testimonials-photo">
            <img src="/images/students-testimonial.jpg" alt="A multicultural group of students studying together" />
          </div>
          <div>
            <span className="eyebrow" style={{ color: 'var(--verify)' }}>{t('testimonials.eyebrow')}</span>
            <h2 style={{ fontSize: 32, marginBottom: 24 }}>{t('testimonials.title')}</h2>
            <div className="notes-grid">
              <div className="note note-tint-a">
                <p>{t('testimonials.quote1')}</p>
                <span>{t('testimonials.author1')}</span>
              </div>
              <div className="note note-stat">
                <b>{stats ? stats.open_jobs : '—'}</b>
                <span>{t('stats.openPostings')}</span>
              </div>
              <div className="note note-stat note-tint-b">
                <b>{stats ? stats.approved_companies : '—'}</b>
                <span>{t('stats.companies')}</span>
              </div>
              <div className="note note-tint-c">
                <p>{t('testimonials.quote2')}</p>
                <span>{t('testimonials.author2')}</span>
              </div>
              <div className="note note-stat note-tint-a" style={{ gridColumn: 'span 2' }}>
                <b>100%</b>
                <span>{t('testimonials.stat100Label')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {stats?.companies?.length > 0 && (
        <section className="company-showcase">
          <div className="container">
            <span className="eyebrow" style={{ color: 'var(--verify)' }}>{t('companyShowcase.eyebrow')}</span>
            <h2>{t('companyShowcase.title')}</h2>
            <div className="showcase-grid">
              {stats.companies.map(c => {
                const colors = brandColors(c.name);
                return (
                  <Link to={user ? '/companies' : '/auth'} key={c.name} className="showcase-card" style={{ '--brand-bg': colors.bg, '--brand-fg': colors.fg }}>
                    <span className="showcase-mono">{c.name.charAt(0).toUpperCase()}</span>
                    <span className="showcase-wordmark">{c.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* TODO: hero image section — content pending user description */}
    </>
  );
}
