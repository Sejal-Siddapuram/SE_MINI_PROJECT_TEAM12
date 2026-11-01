import { useEffect, useState } from 'react';
import Alert from '../../components/Alert';
import FormField from '../../components/FormField';
import StatusBadge from '../../components/StatusBadge';
import { getAuditLogs, getListingsForModeration, moderateListing } from '../../services/adminApi';
import { getErrorMessage } from '../../services/api';

const TABS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Removed', label: 'Removed' },
  { value: '', label: 'All' },
];

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** FR-10: TPO approves, edits or removes listings, before or after publication (BR-02) */
export default function ModerateListings() {
  const [tab, setTab] = useState('Pending');
  const [listings, setListings] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [editing, setEditing] = useState(null); // { id, title, description, eligibility }

  async function load(currentTab = tab) {
    setLoading(true);
    try {
      const [items, recentLogs] = await Promise.all([getListingsForModeration(currentTab), getAuditLogs()]);
      setListings(items);
      setLogs(recentLogs);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function runAction(listing, action, extra) {
    setError('');
    setMessage('');
    setBusyId(listing._id);
    try {
      await moderateListing(listing._id, action, extra);
      const verb = { approve: 'approved', remove: 'removed', edit: 'updated' }[action];
      setMessage(`"${listing.title}" was ${verb}.`);
      setEditing(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  function handleRemove(listing) {
    const reason = window.prompt(`Remove "${listing.title}"? Optionally enter a reason:`, '');
    if (reason === null) return; // cancelled
    runAction(listing, 'remove', { reason });
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Moderate listings</h1>
          <p className="muted">
            Students only see listings that are <strong>Approved</strong> here and <strong>Published</strong> by the
            recruiter.
          </p>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.label}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            className={tab === t.value ? 'active' : ''}
            onClick={() => setTab(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Alert type="success">{message}</Alert>
      <Alert type="error">{error}</Alert>

      {loading ? (
        <p className="muted">Loading listings…</p>
      ) : listings.length === 0 ? (
        <div className="card empty-state">
          <p>No {tab ? tab.toLowerCase() : ''} listings.</p>
        </div>
      ) : (
        listings.map((listing) => (
          <article key={listing._id} className="card listing-card">
            {editing?.id === listing._id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const { id, ...updates } = editing;
                  runAction(listing, 'edit', { updates });
                }}
              >
                <FormField
                  label="Title"
                  name="title"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
                <FormField
                  label="Eligibility"
                  name="eligibility"
                  value={editing.eligibility}
                  onChange={(e) => setEditing({ ...editing, eligibility: e.target.value })}
                />
                <FormField
                  label="Description"
                  name="description"
                  as="textarea"
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
                <div className="btn-group">
                  <button type="submit" className="btn btn-primary btn-sm" disabled={busyId === listing._id}>
                    Save edits
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="page-header">
                  <div>
                    <h2>{listing.title}</h2>
                    <div className="meta">
                      <span>{listing.company}</span>
                      <span>
                        {listing.role} · {listing.type}
                      </span>
                      <span>{listing.location}</span>
                      <span>Deadline {formatDate(listing.deadline)}</span>
                    </div>
                  </div>
                  <div className="btn-group">
                    <StatusBadge status={listing.status} />
                    <StatusBadge status={listing.approvalStatus} />
                  </div>
                </div>
                <p className="pre-line">{listing.description}</p>
                {listing.eligibility && (
                  <p>
                    <strong>Eligibility:</strong> {listing.eligibility}
                  </p>
                )}
                <p className="muted">
                  Posted by {listing.recruiterId?.name} ({listing.recruiterId?.email}) on {formatDate(listing.createdAt)}
                </p>
                <div className="btn-group">
                  {listing.approvalStatus !== 'Approved' && (
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      disabled={busyId === listing._id}
                      onClick={() => runAction(listing, 'approve')}
                    >
                      Approve
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      setEditing({
                        id: listing._id,
                        title: listing.title,
                        description: listing.description,
                        eligibility: listing.eligibility || '',
                      })
                    }
                  >
                    Edit
                  </button>
                  {listing.approvalStatus !== 'Removed' && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      disabled={busyId === listing._id}
                      onClick={() => handleRemove(listing)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </>
            )}
          </article>
        ))
      )}

      <section className="card table-wrap">
        <h2>Recent admin activity</h2>
        <p className="muted">Every admin action is recorded in the audit log (SR-06).</p>
        {logs.length === 0 ? (
          <p className="muted">No admin actions yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td>{new Date(log.createdAt).toLocaleString('en-IN')}</td>
                  <td>{log.userId?.name}</td>
                  <td>{log.action}</td>
                  <td>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
