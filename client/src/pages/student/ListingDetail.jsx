import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Alert from '../../components/Alert';
import StatusBadge from '../../components/StatusBadge';
import { getListing } from '../../services/searchApi';
import { applyToListing } from '../../services/applicationApi';
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
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyNotice, setApplyNotice] = useState(null); // { type, text, details }

  useEffect(() => {
    getListing(id)
      .then(setListing)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  /** FR-05: apply with the student's profile and resume */
  async function handleApply() {
    setApplying(true);
    setApplyNotice(null);
    try {
      await applyToListing(id);
      setApplied(true);
      setApplyNotice({ type: 'success', text: 'Your application has been submitted.' });
    } catch (err) {
      const apiError = err.response?.data?.error;
      if (apiError?.code === 'DUPLICATE_APPLICATION') {
        setApplied(true);
        setApplyNotice({ type: 'info', text: apiError.message });
      } else {
        setApplyNotice({ type: 'error', text: getErrorMessage(err), details: apiError?.details || [] });
      }
    } finally {
      setApplying(false);
    }
  }

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

          <section aria-labelledby="apply-heading">
            <h2 id="apply-heading">Apply</h2>
            {!listing.isOpen ? (
              <Alert type="info">The deadline for this listing has passed, so applications are closed.</Alert>
            ) : (
              <>
                {applyNotice && (
                  <Alert type={applyNotice.type}>
                    {applyNotice.text}
                    {applyNotice.type !== 'error' && (
                      <>
                        {' '}
                        <Link to="/applications">View my applications</Link>
                      </>
                    )}
                    {applyNotice.details?.length > 0 && (
                      <ul>
                        {applyNotice.details.map((d) => (
                          <li key={d.field}>{d.message}</li>
                        ))}
                      </ul>
                    )}
                  </Alert>
                )}
                <button type="button" className="btn btn-primary" onClick={handleApply} disabled={applying || applied}>
                  {applying ? 'Applying…' : applied ? 'Applied' : 'Apply now'}
                </button>
              </>
            )}
          </section>
        </article>
      )}
    </>
  );
}
