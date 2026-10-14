import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Alert from '../../components/Alert';
import StatusBadge from '../../components/StatusBadge';
import { getMyListings, setPublishState } from '../../services/recruiterApi';
import { getErrorMessage } from '../../services/api';

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** FR-07: Recruiter's "My Listings" page - see, edit, publish and close own listings */
export default function MyListings() {
  const location = useLocation();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(location.state?.message || '');
  const [busyId, setBusyId] = useState(null);

  async function load() {
    try {
      setListings(await getMyListings());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handlePublishState(listing, action) {
    setError('');
    setMessage('');
    setBusyId(listing._id);
    try {
      await setPublishState(listing._id, action);
      setMessage(action === 'publish' ? `"${listing.title}" is now published.` : `"${listing.title}" is now closed.`);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My listings</h1>
          <p className="muted">
            Create internship and job openings. Students see a listing once it is <strong>Published</strong> and{' '}
            <strong>Approved</strong> by the TPO.
          </p>
        </div>
        <Link to="/recruiter/listings/new" className="btn btn-primary">
          + New listing
        </Link>
      </div>

      <Alert type="success">{message}</Alert>
      <Alert type="error">{error}</Alert>

      {loading ? (
        <p className="muted">Loading your listings…</p>
      ) : listings.length === 0 ? (
        <div className="card empty-state">
          <p>You have not created any listings yet.</p>
          <Link to="/recruiter/listings/new" className="btn btn-primary">
            Create your first listing
          </Link>
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>TPO approval</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing._id}>
                  <td>
                    <strong>{listing.title}</strong>
                    <div className="muted">
                      {listing.role} · {listing.type} · {listing.location}
                    </div>
                  </td>
                  <td>{formatDate(listing.deadline)}</td>
                  <td>
                    <StatusBadge status={listing.status} />
                  </td>
                  <td>
                    <StatusBadge status={listing.approvalStatus} />
                  </td>
                  <td>
                    {listing.approvalStatus !== 'Removed' && (
                      <div className="btn-group">
                        <Link to={`/recruiter/listings/${listing._id}/edit`} className="btn btn-secondary btn-sm">
                          Edit
                        </Link>
                        {listing.status !== 'Published' ? (
                          <button
                            type="button"
                            className="btn btn-success btn-sm"
                            disabled={busyId === listing._id}
                            onClick={() => handlePublishState(listing, 'publish')}
                          >
                            Publish
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            disabled={busyId === listing._id}
                            onClick={() => handlePublishState(listing, 'close')}
                          >
                            Close
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
