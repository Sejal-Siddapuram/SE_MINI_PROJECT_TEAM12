import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../../components/Alert';
import StatusBadge from '../../components/StatusBadge';
import { getMyApplications, withdrawApplication } from '../../services/applicationApi';
import { getNotifications } from '../../services/notificationApi';
import { getErrorMessage } from '../../services/api';

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** FR-06: the student's applications with their status, withdraw, and status notifications */
export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function load() {
    try {
      const [apps, notes] = await Promise.all([getMyApplications(), getNotifications()]);
      setApplications(apps);
      setNotifications(notes);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleWithdraw(application) {
    const title = application.listing ? application.listing.title : 'this listing';
    if (!window.confirm(`Withdraw your application for "${title}"?`)) return;

    setError('');
    setMessage('');
    setBusyId(application.id);
    try {
      await withdrawApplication(application.id);
      setMessage(`Your application for "${title}" was withdrawn.`);
    } catch (err) {
      // e.g. 409: the recruiter has already responded
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
      await load(); // show the latest status either way
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My applications</h1>
          <p className="muted">
            Follow every application from <strong>Applied</strong> to <strong>Selected</strong>. You can withdraw an
            application until the recruiter responds.
          </p>
        </div>
        <Link to="/listings" className="btn btn-primary">
          Find listings
        </Link>
      </div>

      <Alert type="success">{message}</Alert>
      <Alert type="error">{error}</Alert>

      {loading ? (
        <p className="muted">Loading your applications…</p>
      ) : applications.length === 0 ? (
        <div className="card empty-state">
          <p>You have not applied to any listing yet.</p>
          <Link to="/listings" className="btn btn-primary">
            Find a listing
          </Link>
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Listing</th>
                <th>Applied on</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id}>
                  <td>
                    {application.listing ? (
                      <>
                        <Link to={`/listings/${application.listing.id}`}>
                          <strong>{application.listing.title}</strong>
                        </Link>
                        <div className="muted">
                          {application.listing.company} · {application.listing.location}
                        </div>
                      </>
                    ) : (
                      <span className="muted">This listing is no longer available</span>
                    )}
                  </td>
                  <td>{formatDate(application.appliedAt)}</td>
                  <td>
                    <StatusBadge status={application.status} />
                  </td>
                  <td>
                    {application.status === 'Applied' ? (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={busyId === application.id}
                        onClick={() => handleWithdraw(application)}
                      >
                        {busyId === application.id ? 'Withdrawing…' : 'Withdraw'}
                      </button>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 id="notifications-heading">Notifications</h2>
      {loading ? null : notifications.length === 0 ? (
        <p className="muted">No notifications yet. You will see a message here whenever a recruiter updates an application.</p>
      ) : (
        <ul className="card" aria-labelledby="notifications-heading">
          {notifications.map((n) => (
            <li key={n.id}>
              {n.message} <span className="muted">({formatDate(n.createdAt)})</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
