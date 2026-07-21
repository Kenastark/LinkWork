import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Routes, Route, Link, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { api } from './api.js';
import LinkMark from './components/LinkMark.jsx';
import Landing from './pages/Landing.jsx';
import Auth from './pages/Auth.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import JobDetail from './pages/JobDetail.jsx';
import CompanyDashboard from './pages/CompanyDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Privacy from './pages/Privacy.jsx';
import Terms from './pages/Terms.jsx';
import Profile from './pages/Profile.jsx';
import MyApplications from './pages/MyApplications.jsx';
import JobAlerts from './pages/JobAlerts.jsx';
import Settings from './pages/Settings.jsx';
import { ACCOUNT_MENU } from './menuConfig.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

function homeFor(user) {
  if (!user) return '/';
  return { student: '/student', company: '/company', admin: '/admin' }[user.role];
}

function AccountMenu({ user, onSignOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const items = ACCOUNT_MENU.filter(i => i.roles.includes(user.role));

  return (
    <div className="account-menu-wrap" ref={ref}>
      <button
        className="account-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <span className="hamburger"><span /><span /><span /></span>
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
            {user?.role === 'student' && <NavLink className="navlink" to="/student">Openings</NavLink>}
            {user?.role === 'company' && <NavLink className="navlink" to="/company">Dashboard</NavLink>}
            {user?.role === 'admin' && <NavLink className="navlink" to="/admin">Admin</NavLink>}
            <span className="spacer" />
            {user ? (
              <AccountMenu user={user} onSignOut={logout} />
            ) : (
              <>
                <NavLink className="navlink" to="/auth">Sign in</NavLink>
                <Link to="/auth?mode=student" className="btn sm">Join as a student</Link>
              </>
            )}
          </div>
        </nav>

        <Routes>
          <Route path="/" element={user ? <Navigate to={homeFor(user)} /> : <Landing />} />
          <Route path="/auth" element={user ? <Navigate to={homeFor(user)} /> : <Auth />} />
          <Route path="/student" element={user?.role === 'student' ? <StudentDashboard /> : <Navigate to="/auth" />} />
          <Route path="/jobs/:id" element={user ? <JobDetail /> : <Navigate to="/auth" />} />
          <Route path="/company" element={user?.role === 'company' ? <CompanyDashboard /> : <Navigate to="/auth" />} />
          <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/auth" />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/auth" />} />
          <Route path="/my-applications" element={user?.role === 'student' ? <MyApplications /> : <Navigate to="/auth" />} />
          <Route path="/job-alerts" element={user?.role === 'student' ? <JobAlerts /> : <Navigate to="/auth" />} />
          <Route path="/settings" element={user ? <Settings /> : <Navigate to="/auth" />} />
        </Routes>

        <footer className="site">
          <div className="container">
            <span>LinkWork · Faculty-verified hiring for the University of Debrecen</span>
            <span>Every posting is real. Every hire is on the ledger.</span>
          </div>
        </footer>
      </div>
    </AuthCtx.Provider>
  );
}
