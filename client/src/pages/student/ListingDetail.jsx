import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Alert from '../../components/Alert';
import StatusBadge from '../../components/StatusBadge';
import { getListing } from '../../services/searchApi';
import { getErrorMessage } from '../../services/api';

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** FR-04: Full details of one listing, opened from the search results */
export default function ListingDetail() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getListing(id)
      .then(setListing)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="muted">Loading listing…</p>;

  return (
    <>
      <p>
        <Link to="/listings">← Back to search</Link>
      </p>

      <Alert type="error">{error}</Alert>

      {listing && (
        <article className="card">
          <div className="page-header">
            <div>
              <h1>{listing.title}</h1>
              <p className="muted">{listing.company}</p>
            </div>
            <div className="btn-group">
              <StatusBadge status={listing.type} />
              <StatusBadge status={listing.isOpen ? 'Open' : 'Deadline passed'} />
            </div>
          </div>

          <dl className="detail-list">
            <dt>Role</dt>
            <dd>{listing.role}</dd>
            <dt>Location</dt>
            <dd>{listing.location}</dd>
            <dt>Apply by</dt>
            <dd>{formatDate(listing.deadline)}</dd>
            {listing.eligibility && (
              <>
                <dt>Eligibility</dt>
                <dd>{listing.eligibility}</dd>
              </>
            )}
          </dl>

          <h2>About this opening</h2>
          <p className="pre-line">{listing.description}</p>

          <Alert type="info">Online applications (FR-05) will be enabled in the next sprint.</Alert>
        </article>
      )}
    </>
  );
}
