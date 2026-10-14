import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { navLinks } from '../config/navLinks';

/**
 * Role-specific dashboard (SAD 4.5).
 * Shows a card for every feature the logged-in role can use, taken from navLinks,
 * so new module pages appear here automatically.
 */
export default function Dashboard() {
  const { user } = useAuth();
  const features = navLinks.filter((link) => link.to !== '/dashboard' && link.roles.includes(user.role));

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Welcome, {user.name}</h1>
          <p className="muted">
            Logged in as <strong>{user.role}</strong>
            {user.company ? ` · ${user.company}` : ''} · {user.email}
          </p>
        </div>
      </div>

      {features.length === 0 ? (
        <div className="card empty-state">
          <p>More features for your role are coming in the next sprints.</p>
        </div>
      ) : (
        <div className="feature-grid">
          {features.map((feature) => (
            <Link key={feature.to} to={feature.to} className="card card-link">
              <h2>{feature.label}</h2>
              <p className="muted">{feature.description}</p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
