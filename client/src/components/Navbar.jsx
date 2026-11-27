import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user && ['theatreAdmin', 'superAdmin'].includes(user.role);

  return (
    <header className="nav">
      <Link to="/" className="brand" aria-label="CineGo home">
        <img className="brand-logo" src="/cinego-logo.png" alt="CineGo — Book, Watch, Enjoy" />
      </Link>
      <nav>
        <NavLink to="/" end>Movies</NavLink>
        <NavLink to="/theatres">Theatres</NavLink>
        {user && <NavLink to="/bookings">My bookings</NavLink>}
        {isAdmin && <NavLink to="/admin">Manage</NavLink>}
        {isAdmin && <NavLink to="/reports">Collections</NavLink>}
      </nav>
      <div className="nav-right">
        {user ? (
          <>
            <span className="muted">{user.name} ({user.role})</span>
            <button className="btn ghost" onClick={async () => { await logout(); navigate('/'); }}>Log out</button>
          </>
        ) : (
          <>
            <Link className="btn ghost" to="/login">Log in</Link>
            <Link className="btn" to="/register">Sign up</Link>
          </>
        )}
      </div>
    </header>
  );
}