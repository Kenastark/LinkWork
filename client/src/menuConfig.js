// Account dropdown items.
//
// Entries are either a route ({ label, path }) or an action ({ labelKey,
// action }). App.jsx renders routes as NavLinks and actions as buttons.
//
// 'guest' is a pseudo-role so an entry can be offered signed out. There is no
// account menu when signed out, so App.jsx surfaces guest-visible actions in
// the nav bar instead — the theme is a display preference like the language,
// not something you should need an account to change.
export const ACCOUNT_MENU = [
  { label: 'Dashboard', path: '/dashboard', roles: ['student'] },
  { label: 'Profile', path: '/profile', roles: ['student', 'company', 'admin'] },
  { label: 'Alerts', path: '/alerts', roles: ['student'] },
  { label: 'Settings', path: '/settings', roles: ['student', 'company', 'admin'] },
  { labelKey: 'theme.label', action: 'theme', roles: ['student', 'company', 'admin', 'guest'] },
  { labelKey: 'brand.label', action: 'brand', roles: ['student', 'company', 'admin', 'guest'] },
];

// light -> dark -> system -> light. "system" follows the OS rather than pinning.
export const THEMES = ['light', 'dark', 'system'];
export const THEME_STORAGE_KEY = 'linkwork-theme';

// blue -> green -> blue. Two brands, no "system" equivalent: there is
// no OS signal for which institution's colours you want.
export const BRANDS = ['blue', 'green'];
export const BRAND_STORAGE_KEY = 'linkwork-brand';
