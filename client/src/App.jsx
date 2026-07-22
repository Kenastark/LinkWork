import { createContext, useContext, useEffect, useRef, useState } from 'react';
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
import Inbox from './pages/Inbox.jsx';
import { ACCOUNT_MENU } from './menuConfig.js';

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

function AccountMenu({ user, onSignOut }) {
  const [open, setOpen] = useState(false);
  const ref = useCloseOnOutsideOrRoute(open, setOpen);

  const items = ACCOUNT_MENU.filter(i => i.roles.includes(user.role));

  return (
    <div className="account-menu-wrap" ref={ref}>
      <button
        className="btn sm secondary my-space-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        My space ▾
      </button>
      {open && (
        <div className="account-menu" role="menu">
          <div className="account-menu-email">{user.email}</div>
          {items.map(i => (
            <NavLink key={i.path} to={i.path} className="account-menu-item" role="menuitem">
              {i.label}
            </NavLink>
          ))}
          <div className="account-menu-divider" />
          <button className="account-menu-item danger" role="menuitem" onClick={onSignOut}>Sign out</button>
        </div>
      )}
    </div>
  );
}

function RegisterMenu() {
  const [open, setOpen] = useState(false);
  const ref = useCloseOnOutsideOrRoute(open, setOpen);

  return (
    <div className="account-menu-wrap" ref={ref}>
      <button className="btn sm" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        Register
      </button>
      {open && (
        <div className="account-menu" role="menu">
          <Link to="/auth?mode=student" className="account-menu-item" role="menuitem">Join as a student</Link>
          <Link to="/auth?mode=company" className="account-menu-item" role="menuitem">Join as a company</Link>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = loading
  const nav = useNavigate();

  useEffect(() => { api.get('/api/auth/me').then(d => setUser(d.user)); }, []);

  const logout = async () => { await api.post('/api/auth/logout'); setUser(null); nav('/'); };

  if (user === undefined) return null;

  return (
    <AuthCtx.Provider value={{ user, setUser }}>
      <div className="shell">
        <nav className="nav">
          <div className="container nav-inner">
            <Link to={homeFor(user)} className="brand"><LinkMark /> LinkWork</Link>

            {user?.role === 'student' && <>
              <NavLink className="navlink navlink-lg" to="/student">Find an internship</NavLink>
              <NavLink className="navlink navlink-lg" to="/companies">Explore companies</NavLink>
              <NavLink className="navlink navlink-lg" to="/resources">Resources</NavLink>
            </>}
            {!user && <>
              <NavLink className="navlink navlink-lg" to="/auth">Find a job</NavLink>
              <NavLink className="navlink navlink-lg" to="/auth">Explore companies</NavLink>
              <NavLink className="navlink navlink-lg" to="/auth">Resources</NavLink>
            </>}
            {user?.role === 'company' && <NavLink className="navlink" to="/company">Dashboard</NavLink>}
            {user?.role === 'admin' && <NavLink className="navlink" to="/admin">Admin</NavLink>}

            <span className="spacer" />

            {user?.role === 'student' && <>
              <NavLink className="navlink" to="/my-applications">Applications</NavLink>
              <NavLink className="navlink" to="/inbox">Inbox</NavLink>
            </>}
            {user ? (
              <AccountMenu user={user} onSignOut={logout} />
            ) : (
              <>
                <NavLink className="navlink" to="/auth">Sign in</NavLink>
                <RegisterMenu />
              </>
            )}
          </div>
        </nav>

        <Routes>
          <Route path="/" element={!user || user.role === 'student' ? <Landing /> : <Navigate to={homeFor(user)} />} />
          <Route path="/auth" element={user ? <Navigate to={homeFor(user)} /> : <Auth />} />
          <Route path="/student" element={user?.role === 'student' ? <FindInternship /> : <Navigate to="/auth" />} />
          <Route path="/jobs/:id" element={user ? <JobDetail /> : <Navigate to="/auth" />} />
          <Route path="/company" element={user?.role === 'company' ? <CompanyDashboard /> : <Navigate to="/auth" />} />
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
          <Route path="/inbox" element={user?.role === 'student' ? <Inbox /> : <Navigate to="/auth" />} />
        </Routes>

        <footer className="site">
          <div className="container">
            <div className="footer-cols">
              <div className="footer-col">
                <h4>For students</h4>
                <Link to="/student">Find an internship</Link>
                <Link to="/companies">Explore companies</Link>
                <Link to="/resources">Resources</Link>
                {!user && <Link to="/auth">Sign in</Link>}
              </div>
              <div className="footer-col">
                <h4>For companies</h4>
                <Link to="/auth?mode=company">Hire from LinkWork</Link>
                {!user && <Link to="/auth">Sign in</Link>}
              </div>
              <div className="footer-col">
                <h4>About</h4>
                <Link to="/privacy">Privacy Policy</Link>
                <Link to="/terms">Terms of Service</Link>
              </div>
            </div>
            <div className="footer-bottom">
              <span className="footer-brand"><LinkMark size={28} /> LinkWork</span>
              <span>© {new Date().getFullYear()} LinkWork · Every posting is real. Every hire is on the ledger.</span>
            </div>
          </div>
        </footer>
      </div>
    </AuthCtx.Provider>
  );
}
