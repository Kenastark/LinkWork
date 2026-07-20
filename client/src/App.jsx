import { createContext, useContext, useEffect, useState } from 'react';
import { Routes, Route, Link, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { api } from './api.js';
import LinkMark from './components/LinkMark.jsx';
import Landing from './pages/Landing.jsx';
import Auth from './pages/Auth.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import JobDetail from './pages/JobDetail.jsx';
import CompanyDashboard from './pages/CompanyDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

function homeFor(user) {
  if (!user) return '/';
  return { student: '/student', company: '/company', admin: '/admin' }[user.role];
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
              <>
                <span className="who">{user.email}</span>
                <button className="btn sm secondary" style={{ borderColor: '#5a6b8c', color: '#fff' }} onClick={logout}>Sign out</button>
              </>
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
