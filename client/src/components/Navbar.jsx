import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { navLinks } from '../config/navLinks';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user ? navLinks.filter((link) => link.roles.includes(user.role)) : [];

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="brand">
          Campus<span>Ready</span>
        </Link>

        <nav className="nav-links" aria-label="Main">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-user">
          {user ? (
            <>
              <span className="nav-user-name">
                {user.name} <small>({user.role})</small>
              </span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
