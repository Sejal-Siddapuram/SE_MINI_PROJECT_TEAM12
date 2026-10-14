import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Public landing page (Guest view) */
export default function Home() {
  const { user } = useAuth();

  return (
    <>
      <section className="hero">
        <h1>Internships and placements, all in one place.</h1>
        <p>
          CampusReady brings listings, applications, recruiters and placement preparation together for
          students and the Training &amp; Placement Office.
        </p>
        <div className="hero-actions">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">
              Go to your dashboard
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary">
                Register as a student
              </Link>
              <Link to="/login" className="btn btn-secondary">
                Log in
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="feature-grid">
        <div className="card">
          <h2>Discover</h2>
          <p className="muted">Search internships and jobs by role, company, location and deadline.</p>
        </div>
        <div className="card">
          <h2>Apply &amp; track</h2>
          <p className="muted">Apply with your profile and follow every application from Applied to Selected.</p>
        </div>
        <div className="card">
          <h2>Prepare</h2>
          <p className="muted">Practise with mock aptitude tests and curated interview questions.</p>
        </div>
      </section>
    </>
  );
}
