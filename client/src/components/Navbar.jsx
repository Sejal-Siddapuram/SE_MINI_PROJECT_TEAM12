import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { navLinks } from '../config/navLinks';

/**
 * Main navigation.
 * NFR-02: collapses into a menu button on small screens, highlights the current page
 * (aria-current), and offers a "Skip to main content" link for keyboard users.
 */
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = user ? navLinks.filter((link) => link.roles.includes(user.role)) : [];

  // Close the mobile menu whenever the page changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="navbar">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <div className="navbar-inner container">
        <Link to="/" className="brand">
          Campus<span>Ready</span>
        </Link>

        <button
          type="button"
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="main-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
          <span className="menu-toggle-label">Menu</span>
        </button>

        <div id="main-menu" className={`nav-menu${menuOpen ? ' open' : ''}`}>
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
                <Link to="/login" className="btn btn-secondary btn-sm">
                  Log in
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
