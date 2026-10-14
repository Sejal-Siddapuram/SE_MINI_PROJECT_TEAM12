import { Link } from 'react-router-dom';

/** Shown when a logged-in user opens a page their role cannot use (SAD 4.4: 403) */
export default function AccessDenied() {
  return (
    <section className="card narrow center">
      <h1>Access denied</h1>
      <p className="muted">Your account does not have permission to view this page.</p>
      <Link to="/dashboard" className="btn btn-primary">
        Back to dashboard
      </Link>
    </section>
  );
}
