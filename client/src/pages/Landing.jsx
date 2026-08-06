import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import { useI18n } from '../i18n.jsx';
import LedgerRecord from '../components/LedgerRecord.jsx';

const BRAND_PALETTE = [
  { bg: '#eff5fc', fg: '#003b7a' }, // brand blue (--blue-50 / --blue-700)
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

// Original, industry-themed logo marks designed for our fictional companies.
// Monochrome (currentColor) so the whole strip reads as one clean logo set.
const LOGO_ICONS = {
  data: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="3" y="13" width="4" height="8" rx="1.2" /><rect x="10" y="7" width="4" height="14" rx="1.2" /><rect x="17" y="3" width="4" height="18" rx="1.2" /></svg>,
  bolt: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2 4 13.5h5.5L8 22l11-13h-6l2-7z" /></svg>,
  target: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" /><path d="M12 1.5v3.5M12 19v3.5M1.5 12H5M19 12h3.5" strokeLinecap="round" /></svg>,
  leaf: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 3C9 3 4 8.5 4 16.5c0 1.4.2 2.7.5 3.9C6 12 11 7 20 6c-5 2.4-8.5 6-9.4 12.4C17 17.5 20.5 11.6 20 3Z" /></svg>,
  scales: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v18M7.5 21h9M5 7.5l14-3M6 5 3 12a3 3 0 0 0 6 0L6 5ZM18 4.5 15 12a3 3 0 0 0 6 0l-3-7.5Z" /></svg>,
  cross: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.5 3h5v6h6v5h-6v6h-5v-6h-6V9h6z" /></svg>,
};

// name -> { icon, primary (brand word), sub (descriptor) }. Full names preserved across primary+sub.
const COMPANY_LOGOS = {
  'DataTech Hungary Kft.': { icon: 'data', primary: 'DataTech', sub: 'Hungary Kft.' },
  'Voltix Electronics Kft.': { icon: 'bolt', primary: 'Voltix', sub: 'Electronics' },
  'Precisa Engineering Kft.': { icon: 'target', primary: 'Precisa', sub: 'Engineering' },
  'GreenField AgroTech Zrt.': { icon: 'leaf', primary: 'GreenField', sub: 'AgroTech Zrt.' },
  'NyugatCom Legal Partners': { icon: 'scales', primary: 'NyugatCom', sub: 'Legal Partners' },
  'Debrecen Public Health Initiative': { icon: 'cross', primary: 'Debrecen', sub: 'Public Health' },
};

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

// The hero's ledger panel. Designed at n = 0 first: an empty register has to
// read as a promise, not a bug, because that is what a brand-new university
// partner sees. The mono line never hard-codes a count — it reads whatever
// /api/stats reports, so it is true at any n, including zero.
function HeroLedger({ records, hires, failed }) {
  const { t } = useI18n();
  const empty = !records || records.length === 0;
  return (
    <div className="hero-ledger glass ruled">
      <span className="eyebrow hero-ledger-title">{t('ledger.panelTitle')}</span>

      {failed ? (
        <p className="hero-ledger-note">{t('ledger.unavailable')}</p>
      ) : empty ? (
        <p className="hero-ledger-note">{t('ledger.empty')}</p>
      ) : (
        <div className="hero-ledger-rows">
          {records.map(r => (
            <LedgerRecord
              key={r.job_id}
              jobId={r.job_id}
              title={r.title}
              company={r.company}
              hiredAt={r.hired_at}
              facultyVerified={!!r.faculty_verified}
            />
          ))}
        </div>
      )}

      {/* Never assert a count /api/stats did not give us: showing "0 hires"
          beside four visible records would be a lie, not a fallback. */}
      <p className="hero-ledger-mono tabular">
        {hires == null ? t('ledger.monoNoCount') : t('ledger.mono', { n: hires })}
      </p>
    </div>
  );
}

function ProblemSection() {
  const { t } = useI18n();
  const cards = [
    ['problem.card1Title', 'problem.card1Body'],
    ['problem.card2Title', 'problem.card2Body'],
    ['problem.card3Title', 'problem.card3Body'],
  ];
  return (
    <section className="problem">
      <div className="container">
        <span className="eyebrow">{t('problem.eyebrow')}</span>
        <h2>{t('problem.title')}</h2>
        <div className="problem-grid">
          {cards.map(([title, body]) => (
            <div className="card problem-card" key={title}>
              <h3>{t(title)}</h3>
              <p className="muted">{t(body)}</p>
            </div>
          ))}
        </div>
        <p className="problem-punch">{t('problem.punch')}</p>
      </div>
    </section>
  );
}

function TrustChain() {
  const { t } = useI18n();
  const nodes = ['n1', 'n2', 'n3', 'n4'];
  return (
    <section className="trust">
      <div className="container">
        <span className="eyebrow">{t('trust.eyebrow')}</span>
        <h2>{t('trust.title')}</h2>
        <ol className="trust-grid">
          {nodes.map((n, i) => (
            <li className="trust-node" key={n}>
              <span className="trust-step" aria-hidden="true">{i + 1}</span>
              <h3>{t(`trust.${n}Title`)}</h3>
              <p className="muted">{t(`trust.${n}Body`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function LedgerSection({ records, failed }) {
  const { t } = useI18n();
  const empty = !records || records.length === 0;
  return (
    <section className="ledger-section">
      <div className="container">
        <span className="eyebrow">{t('ledgerSection.eyebrow')}</span>
        <h2>{t('ledgerSection.title')}</h2>
        <p className="muted ledger-section-body">{t('ledgerSection.body')}</p>
        <div className="card ruled ledger-sheet">
          {failed || empty
            ? <p className="muted">{failed ? t('ledger.unavailable') : t('ledgerSection.empty')}</p>
            : records.map(r => (
              <LedgerRecord
                key={r.job_id}
                jobId={r.job_id}
                title={r.title}
                company={r.company}
                hiredAt={r.hired_at}
                facultyVerified={!!r.faculty_verified}
              />
            ))}
        </div>
        <p className="ledger-punch">{t('ledgerSection.punch')}</p>
      </div>
    </section>
  );
}

// Accordion, one open at a time. A <button aria-expanded> drives a
// <div role="region">, so a screen reader is told the state and what it owns.
function Faq() {
  const { t } = useI18n();
  const [open, setOpen] = useState(null);
  const items = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'];
  return (
    <section className="faq">
      <div className="container">
        <span className="eyebrow">{t('faq.eyebrow')}</span>
        <h2>{t('faq.title')}</h2>
        <div className="faq-list">
          {items.map((q, i) => {
            const isOpen = open === i;
            return (
              <div className={'faq-item' + (isOpen ? ' open' : '')} key={q}>
                <h3>
                  <button
                    type="button"
                    className="faq-q"
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${i}`}
                    id={`faq-q-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                  >
                    <span>{t(`faq.${q}`)}</span>
                    <span className="faq-chevron" aria-hidden="true">⌄</span>
                  </button>
                </h3>
                <div
                  className="faq-a"
                  id={`faq-a-${i}`}
                  role="region"
                  aria-labelledby={`faq-q-${i}`}
                  hidden={!isOpen}
                >
                  <p className="muted">{t(`faq.a${i + 1}`)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ClosingCta({ user }) {
  const { t } = useI18n();
  return (
    <section className="closing-cta mesh">
      <div className="container">
        <h2>{t('cta.title')}</h2>
        <p>{t('cta.body')}</p>
        <div className="closing-cta-actions">
          <Link to={user ? '/student' : '/auth?mode=student'} className="btn closing-cta-btn">
            {user ? t('cta.browse') : t('cta.student')}
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [stats, setStats] = useState(null);
  // null = still loading, [] = genuinely empty, 'failed' = the route errored.
  // The three are different states and the panel says something different for
  // each; collapsing them would show "nothing hired yet" when the server is down.
  const [ledger, setLedger] = useState(null);

  useEffect(() => { api.get('/api/stats').then(setStats).catch(() => {}); }, []);
  useEffect(() => {
    api.get('/api/ledger/recent')
      .then(d => setLedger(Array.isArray(d?.records) ? d.records : []))
      .catch(() => setLedger('failed'));
  }, []);

  const ledgerFailed = ledger === 'failed';
  const records = Array.isArray(ledger) ? ledger : [];

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

          <HeroLedger records={records} hires={stats?.hires} failed={ledgerFailed} />
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

      <ProblemSection />

      <section className="match-pitch">
        <div className="container match-pitch-grid">
          <div>
            <span className="eyebrow">{t('matchPitch.eyebrow')}</span>
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

      <TrustChain />

      <LedgerSection records={records} failed={ledgerFailed} />

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
            <span className="eyebrow">{t('testimonials.eyebrow')}</span>
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
            <span className="eyebrow">{t('companyShowcase.eyebrow')}</span>
            <h2>{t('companyShowcase.title')}</h2>
            <div className="logo-strip">
              {stats.companies.map(c => {
                const logo = COMPANY_LOGOS[c.name];
                const colors = brandColors(c.name);
                return (
                  <Link to={user ? '/companies' : '/auth'} key={c.name} className="logo-lockup" title={c.name} style={{ '--brand-fg': colors.fg }}>
                    {logo ? (
                      <>
                        <span className="logo-mark">{LOGO_ICONS[logo.icon]}</span>
                        <span className="logo-word"><b>{logo.primary}</b><i>{logo.sub}</i></span>
                      </>
                    ) : (
                      <>
                        <span className="logo-mark logo-mark-initial">{c.name.charAt(0).toUpperCase()}</span>
                        <span className="logo-word"><b>{c.name}</b></span>
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <Faq />

      <ClosingCta user={user} />
    </>
  );
}
