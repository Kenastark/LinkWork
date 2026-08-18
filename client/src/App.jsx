import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Routes, Route, Link, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { api } from './api.js';
import LinkMark from './components/LinkMark.jsx';
import Landing from './pages/Landing.jsx';
import Auth from './pages/Auth.jsx';
import FindInternship from './pages/FindInternship.jsx';
import JobDetail from './pages/JobDetail.jsx';
import CompanyDashboard from './pages/CompanyDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Privacy from './pages/Privacy.jsx';
import Terms from './pages/Terms.jsx';
import Profile from './pages/Profile.jsx';
import MyApplications from './pages/MyApplications.jsx';
import Alerts from './pages/Alerts.jsx';
import Settings from './pages/Settings.jsx';
import Companies from './pages/Companies.jsx';
import CompanyProfile from './pages/CompanyProfile.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Resources from './pages/Resources.jsx';
import ComingSoon from './pages/ComingSoon.jsx';
import Meeting from './pages/Meeting.jsx';
import Notifications from './pages/Notifications.jsx';
import ApplicantReview from './pages/ApplicantReview.jsx';
import NotFound from './pages/NotFound.jsx';
import { ACCOUNT_MENU, THEMES, THEME_STORAGE_KEY, BRANDS, BRAND_STORAGE_KEY } from './menuConfig.js';
import useFocusTrap from './useFocusTrap.js';
import { I18nProvider, useI18n, LANGUAGES } from './i18n.jsx';

// Social brand glyphs (single-path SVG, 24x24). Links point to a placeholder until real accounts exist.
const SOCIALS = [
  { name: 'Facebook', d: 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z' },
  { name: 'YouTube', d: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
  { name: 'X', d: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z' },
  { name: 'TikTok', d: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z' },
  { name: 'Instagram', d: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
  { name: 'LinkedIn', d: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
  { name: 'Google', d: 'M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z' },
  { name: 'Pinterest', d: 'M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C24 5.367 18.633.001 12.017.001z' },
];

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

function homeFor(user) {
  if (!user || user.role === 'student') return '/';
  return { company: '/company', admin: '/admin' }[user.role];
}

function useCloseOnOutsideOrRoute(open, setOpen) {
  const ref = useRef(null);
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return ref;
}

// True once the page has scrolled past the threshold. Used to swap the nav from
// transparent to glass over the hero.
function useScrolledPast(threshold) {
  const [past, setPast] = useState(() => typeof window !== 'undefined' && window.scrollY > threshold);
  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return past;
}

// Role-aware nav items, shared by the desktop bar and the mobile sheet so the
// two can never drift.
function navItemsFor(user, t) {
  if (user?.role === 'student') return {
    primary: [
      { to: '/jobs', label: t('nav.findInternship'), lg: true },
      { to: '/companies', label: t('nav.exploreCompanies'), lg: true },
      { to: '/resources', label: t('nav.resources'), lg: true },
    ],
    secondary: [{ to: '/my-applications', label: t('nav.applications') }],
  };
  if (user?.role === 'company') return { primary: [{ to: '/company', label: t('nav.dashboard') }], secondary: [] };
  if (user?.role === 'admin') return { primary: [{ to: '/admin', label: t('nav.admin') }], secondary: [] };
  return {
    primary: [
      { to: '/auth', label: t('nav.findAJob'), lg: true },
      { to: '/auth', label: t('nav.exploreCompanies'), lg: true },
      { to: '/auth', label: t('nav.resources'), lg: true },
    ],
    secondary: [],
  };
}


// Theme. Three states: light, dark, and system, which follows the OS.
// The resolved value is written to <html data-theme>, matching what the
// anti-flash script in index.html sets before React mounts — so the class the
// script picked is never contradicted after hydration.
function applyTheme(pref) {
  const dark = pref === 'dark'
    || (pref === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}

function useTheme() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(THEME_STORAGE_KEY) || 'system'; } catch { return 'system'; }
  });

  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch { /* private mode */ }
  }, [theme]);

  // Follow the OS while the preference is "system".
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  const cycle = useCallback(() => {
    setTheme(t => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length]);
  }, []);

  return { theme, cycle };
}

// Brand. Two states, no OS signal to follow, so no 'system'
// equivalent. Written to <html data-brand>, independent of
// data-theme — the four combinations of brand x theme are all
// defined in styles.css.
function applyBrand(pref) {
  const brand = BRANDS.includes(pref) ? pref : 'blue';
  document.documentElement.setAttribute('data-brand', brand);
  const icon = document.querySelector('link[rel="icon"][type="image/svg+xml"]');
  if (icon) icon.setAttribute('href',
    brand === 'green' ? '/favicon-green.svg' : '/favicon.svg');
}

function useBrand() {
  const [brand, setBrand] = useState(() => {
    try { return localStorage.getItem(BRAND_STORAGE_KEY) || 'blue'; }
    catch { return 'blue'; }
  });

  useEffect(() => {
    applyBrand(brand);
    try { localStorage.setItem(BRAND_STORAGE_KEY, brand); }
    catch { /* private mode */ }
  }, [brand]);

  const cycleBrand = useCallback(() => {
    setBrand(b => BRANDS[(BRANDS.indexOf(b) + 1) % BRANDS.length]);
  }, []);

  return { brand, cycleBrand };
}

// One entry from ACCOUNT_MENU rendered as a button. Actions are not routes.
function ThemeButton({ theme, cycle, className, inMenu = false }) {
  const { t } = useI18n();
  return (
    <button type="button" className={className} {...(inMenu ? { role: 'menuitem' } : {})} onClick={cycle}>
      {t('theme.label')}: {t(`theme.${theme}`)}
    </button>
  );
}

function BrandButton({ brand, cycleBrand, className, inMenu = false }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      className={className}
      {...(inMenu ? { role: 'menuitem' } : {})}
      onClick={cycleBrand}
      aria-label={t('brand.switchTo')}
      title={`${t('brand.label')}: ${t(`brand.${brand}`)}`}
    >
      <span className="brand-swatch" aria-hidden="true" />
      <span className="brand-btn-label">
        {t('brand.label')}: {t(`brand.${brand}`)}
      </span>
    </button>
  );
}

function Avatar({ user, size = 34 }) {
  const initial = (user.name || user.email || '?').trim().charAt(0).toUpperCase();
  return user.photo_path
    ? <img className="avatar" src={user.photo_path} alt="" style={{ width: size, height: size }} />
    : <span className="avatar avatar-initials" style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}>{initial}</span>;
}

// Renders one ACCOUNT_MENU entry. Actions ('theme', 'brand') become their
// matching button; everything else is a route, rendered as a NavLink.
function renderAccountMenuItem(i, { theme, cycle, brand, cycleBrand }) {
  if (i.action === 'theme') {
    return <ThemeButton key="theme" theme={theme} cycle={cycle} className="account-menu-item" inMenu />;
  }
  if (i.action === 'brand') {
    return <BrandButton key="brand" brand={brand} cycleBrand={cycleBrand} className="account-menu-item" inMenu />;
  }
  return (
    <NavLink key={i.path} to={i.path} className="account-menu-item" role="menuitem">
      {i.label}
    </NavLink>
  );
}

function AccountMenu({ user, onSignOut, theme, cycle, brand, cycleBrand }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useCloseOnOutsideOrRoute(open, setOpen);

  const items = ACCOUNT_MENU.filter(i => i.roles.includes(user.role));

  return (
    <div className="account-menu-wrap" ref={ref}>
      <button
        className="account-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        title={t('nav.mySpace')}
      >
        <Avatar user={user} size={34} />
        <span className="account-trigger-name">{user.name || t('nav.mySpace')}</span>
        <span className="account-chevron">▾</span>
      </button>
      {open && (
        <div className="account-menu" role="menu">
          <div className="account-menu-head">
            <Avatar user={user} size={46} />
            <div className="account-menu-id">
              <div className="account-menu-name">{user.name}</div>
              <div className="account-menu-email">{user.email}</div>
              <div className="account-menu-space">{t('nav.mySpace')}</div>
            </div>
          </div>
          <div className="account-menu-divider" />
          {items.map(i => renderAccountMenuItem(i, { theme, cycle, brand, cycleBrand }))}
          <div className="account-menu-divider" />
          <button className="account-menu-item danger" role="menuitem" onClick={onSignOut}>{t('nav.signOut')}</button>
        </div>
      )}
    </div>
  );
}

function NavBell() {
  const [unread, setUnread] = useState(0);
  const location = useLocation();
  useEffect(() => {
    api.get('/api/notifications').then(d => setUnread(d.unread)).catch(() => {});
  }, [location.pathname]);
  return (
    <NavLink to="/notifications" className="nav-bell" aria-label="Notifications" title="Notifications">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
      {unread > 0 && <span className="dot" aria-hidden="true">{unread > 9 ? '9+' : unread}</span>}
      {/* The badge is decorative; the count is announced here instead, so a
          change is spoken rather than silently repainted. */}
      <span className="sr-only" aria-live="polite">{unread > 0 ? `${unread} unread` : ''}</span>
    </NavLink>
  );
}

function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useCloseOnOutsideOrRoute(open, setOpen);
  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  return (
    <div className="account-menu-wrap" ref={ref}>
      <button
        className="btn sm ghost lang-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        title="Change language"
      >
        {current.flag} {current.code.toUpperCase()} ▾
      </button>
      {open && (
        <div className="account-menu lang-menu" role="menu">
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              className={`account-menu-item${l.code === lang ? ' active' : ''}`}
              role="menuitem"
              onClick={() => { setLang(l.code); setOpen(false); }}
            >
              {l.flag} {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RegisterMenu() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useCloseOnOutsideOrRoute(open, setOpen);

  return (
    <div className="account-menu-wrap" ref={ref}>
      <button className="btn sm" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        {t('nav.register')}
      </button>
      {open && (
        <div className="account-menu" role="menu">
          <Link to="/auth?mode=student" className="account-menu-item" role="menuitem">{t('nav.joinAsStudent')}</Link>
          <Link to="/auth?mode=company" className="account-menu-item" role="menuitem">{t('nav.joinAsCompany')}</Link>
        </div>
      )}
    </div>
  );
}

function AppShell({ user, setUser, logout }) {
  const { t } = useI18n();
  const location = useLocation();
  const { primary, secondary } = navItemsFor(user, t);
  const { theme, cycle } = useTheme();
  const { brand, cycleBrand } = useBrand();

  // Transparent only where there is a hero behind the bar. Companies and admins
  // are redirected away from "/", so the landing is not what they see there.
  const overHero = location.pathname === '/' && (!user || user.role === 'student');
  const scrolled = useScrolledPast(24);

  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef(null);
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  useFocusTrap(sheetOpen, sheetRef, closeSheet);
  useEffect(() => { setSheetOpen(false); }, [location.pathname]);

  // The active-route underline. Measured rather than computed, because item
  // widths depend on the locale and on whether the display face has loaded.
  const navInnerRef = useRef(null);
  const [rule, setRule] = useState(null);
  useEffect(() => {
    const measure = () => {
      const root = navInnerRef.current;
      const active = root?.querySelector('a.navlink.active');
      if (!root || !active) { setRule(null); return; }
      const a = active.getBoundingClientRect();
      const r = root.getBoundingClientRect();
      setRule({ x: a.left - r.left, w: a.width });
    };
    measure();
    window.addEventListener('resize', measure);
    document.fonts?.ready?.then(measure).catch(() => {});
    return () => window.removeEventListener('resize', measure);
  }, [location.pathname, user, t]);

  const navClass = 'nav'
    + (overHero ? ' over-hero' : '')
    + (scrolled ? ' scrolled' : '');

  return (
    <AuthCtx.Provider value={{ user, setUser }}>
      <div className="shell">
        <a className="skip-link" href="#content">{t('nav.skipToContent')}</a>

        <nav className={navClass}>
          <div className="container nav-inner" ref={navInnerRef}>
            <Link to={homeFor(user)} className="brand"><LinkMark /> <span className="brand-word">LinkWork</span></Link>

            <div className="nav-group nav-primary">
              {primary.map((i, n) => (
                <NavLink key={`${i.to}-${n}`} className={'navlink' + (i.lg ? ' navlink-lg' : '')} to={i.to}>{i.label}</NavLink>
              ))}
            </div>

            <span className="spacer" />

            <div className="nav-group nav-secondary">
              {secondary.map(i => <NavLink key={i.to} className="navlink" to={i.to}>{i.label}</NavLink>)}
            </div>

            {user && <NavBell />}
            <LanguageSwitcher />
            {!user && <ThemeButton theme={theme} cycle={cycle} className="btn sm ghost lang-trigger nav-theme" />}
            {!user && <BrandButton brand={brand} cycleBrand={cycleBrand} className="btn sm ghost lang-trigger nav-brand" />}
            {user ? (
              <AccountMenu user={user} onSignOut={logout} theme={theme} cycle={cycle} brand={brand} cycleBrand={cycleBrand} />
            ) : (
              <div className="nav-group nav-auth">
                <NavLink className="navlink" to="/auth">{t('nav.signIn')}</NavLink>
                <RegisterMenu />
              </div>
            )}

            <button
              className="nav-toggle"
              aria-label={sheetOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              aria-expanded={sheetOpen}
              aria-controls="nav-sheet"
              onClick={() => setSheetOpen(o => !o)}
            >
              <span aria-hidden="true">{sheetOpen ? '✕' : '☰'}</span>
            </button>

            <span
              className="nav-underline"
              aria-hidden="true"
              style={rule
                ? { opacity: 1, transform: `translateX(${rule.x}px) scaleX(${rule.w})` }
                : { opacity: 0 }}
            />
          </div>

          {sheetOpen && <div className="nav-sheet-backdrop" onClick={closeSheet} />}
          <div
            id="nav-sheet"
            className={'nav-sheet' + (sheetOpen ? ' open' : '')}
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.menu')}
            hidden={!sheetOpen}
          >
            {[...primary, ...secondary].map((i, n) => (
              <NavLink key={`${i.to}-${n}`} className="navlink" to={i.to}>{i.label}</NavLink>
            ))}
            {!user && <>
              <NavLink className="navlink" to="/auth">{t('nav.signIn')}</NavLink>
              <NavLink className="navlink" to="/auth?mode=student">{t('nav.joinAsStudent')}</NavLink>
              <NavLink className="navlink" to="/auth?mode=company">{t('nav.joinAsCompany')}</NavLink>
            </>}
            <button className="btn secondary" onClick={closeSheet}>{t('nav.closeMenu')}</button>
          </div>
        </nav>

        <div id="content" className={overHero ? 'under-nav' : ''} tabIndex={-1}>
        <Routes>
          <Route path="/" element={!user || user.role === 'student' ? <Landing /> : <Navigate to={homeFor(user)} />} />
          <Route path="/auth" element={user ? <Navigate to={homeFor(user)} /> : <Auth />} />
          <Route path="/jobs" element={user?.role === 'student' ? <FindInternship /> : <Navigate to="/auth" />} />
          <Route path="/jobs/:id" element={user ? <JobDetail /> : <Navigate to="/auth" />} />
          <Route path="/company" element={user?.role === 'company' ? <CompanyDashboard /> : <Navigate to="/auth" />} />
          <Route path="/company/applicants/:id" element={user?.role === 'company' ? <ApplicantReview /> : <Navigate to="/auth" />} />
          <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/auth" />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/auth" />} />
          <Route path="/my-applications" element={user?.role === 'student' ? <MyApplications /> : <Navigate to="/auth" />} />
          <Route path="/alerts" element={user?.role === 'student' ? <Alerts /> : <Navigate to="/auth" />} />
          <Route path="/settings" element={user ? <Settings /> : <Navigate to="/auth" />} />
          <Route path="/companies" element={user ? <Companies /> : <Navigate to="/auth" />} />
          <Route path="/companies/:id" element={user ? <CompanyProfile /> : <Navigate to="/auth" />} />
          <Route path="/dashboard" element={user?.role === 'student' ? <Dashboard /> : <Navigate to="/auth" />} />
          <Route path="/resources" element={user ? <Resources /> : <Navigate to="/auth" />} />
          <Route path="/inbox" element={<Navigate to="/notifications" replace />} />
          <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/auth" />} />
          <Route path="/meeting/:id" element={user ? <Meeting /> : <Navigate to="/auth" />} />
          <Route path="/coming-soon" element={<ComingSoon />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </div>

        <footer className="site">
          <div className="container">
            <div className="footer-cols">
              <div className="footer-col">
                <h2 className="footer-head">{t('footer.forStudents')}</h2>
                <Link to="/jobs">{t('nav.findInternship')}</Link>
                <Link to="/companies">{t('nav.exploreCompanies')}</Link>
                <Link to="/resources">{t('nav.resources')}</Link>
                {!user && <Link to="/auth">{t('nav.signIn')}</Link>}
              </div>
              <div className="footer-col">
                <h2 className="footer-head">{t('footer.hireTalent')}</h2>
                <Link to="/coming-soon?feature=Welcome Hiring Suite">{t('footer.welcomeHiringSuite')}</Link>
                <Link to="/coming-soon?feature=Employer branding">{t('footer.employerBranding')}</Link>
                <Link to="/coming-soon?feature=Pricing">{t('footer.pricing')}</Link>
                <Link to="/coming-soon?feature=Clients' testimonials">{t('footer.testimonials')}</Link>
                <Link to="/coming-soon?feature=Resources">{t('nav.resources')}</Link>
                <Link to="/coming-soon?feature=Need help?">{t('footer.needHelp')}</Link>
                <Link to="/auth?mode=login">{t('footer.haveAccount')}</Link>
              </div>
              <div className="footer-col">
                <h2 className="footer-head">{t('footer.about')}</h2>
                <Link to="/privacy">{t('footer.privacyPolicy')}</Link>
                <Link to="/terms">{t('footer.termsOfService')}</Link>
              </div>
            </div>

            <div className="footer-social">
              <span>{t('footer.followUs')}</span>
              <div className="footer-social-icons">
                {SOCIALS.map(s => (
                  <Link key={s.name} to="/coming-soon?feature=Social media" aria-label={s.name} title={s.name}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={s.d} /></svg>
                  </Link>
                ))}
              </div>
            </div>

            <div className="footer-bottom">
              <span className="footer-brand"><LinkMark size={28} /> LinkWork</span>
              <span>© {new Date().getFullYear()} LinkWork · {t('footer.tagline')}</span>
            </div>
          </div>
        </footer>
      </div>
    </AuthCtx.Provider>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = loading
  const nav = useNavigate();

  useEffect(() => { api.get('/api/auth/me').then(d => setUser(d.user)); }, []);

  const logout = async () => { await api.post('/api/auth/logout'); setUser(null); nav('/'); };

  if (user === undefined) return null;

  return (
    <I18nProvider>
      <AppShell user={user} setUser={setUser} logout={logout} />
    </I18nProvider>
  );
}
