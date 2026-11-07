import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Alert from '../../components/Alert';
import StatusBadge from '../../components/StatusBadge';
import {
  getMyListing,
  getListingApplicants,
  getListingApplicantSummary,
  updateApplicationStatus,
} from '../../services/recruiterApi';
import { getErrorMessage } from '../../services/api';

/**
 * FR-08 & FR-09: Recruiter applicant review page.
 * Displays applicant table, summary counters, and status action buttons.
 */
export default function Applicants() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadData() {
    try {
      const [listingData, applicantsData, summaryData] = await Promise.all([
        getMyListing(id),
        getListingApplicants(id),
        getListingApplicantSummary(id),
      ]);
      setListing(listingData);
      setApplicants(applicantsData);
      setSummary(summaryData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  async function handleStatusChange(applicationId, newStatus, studentName) {
    setError('');
    setMessage('');
    setBusyId(applicationId);
    try {
      await updateApplicationStatus(applicationId, newStatus);
      setMessage(`Application for ${studentName || 'student'} marked as ${newStatus}.`);
      await loadData();
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
          <Link to="/recruiter/listings" className="muted" style={{ display: 'inline-block', marginBottom: '0.5rem' }}>
            ← Back to listings
          </Link>
          <h1>{listing ? `Applicants for ${listing.title}` : 'Listing applicants'}</h1>
          {listing && (
            <p className="muted">
              {listing.role} · {listing.type} · {listing.location}
            </p>
          )}
        </div>
      </div>

      <Alert type="success">{message}</Alert>
      <Alert type="error">{error}</Alert>

      {summary && (
        <div className="feature-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="card">
            <h2>Total</h2>
            <p>{summary.total || 0}</p>
          </div>
          <div className="card">
            <h2>Applied</h2>
            <p>{summary.Applied || 0}</p>
          </div>
          <div className="card">
            <h2>Shortlisted</h2>
            <p>{summary.Shortlisted || 0}</p>
          </div>
          <div className="card">
            <h2>Selected</h2>
            <p>{summary.Selected || 0}</p>
          </div>
          <div className="card">
            <h2>Rejected</h2>
            <p>{summary.Rejected || 0}</p>
          </div>
        </div>
      )}

      {loading ? (
        <p className="muted">Loading applicants…</p>
      ) : applicants.length === 0 ? (
        <div className="card empty-state">
          <p>No students have applied to this listing yet.</p>
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>USN</th>
                <th>Branch & Sem</th>
                <th>CGPA</th>
                <th>Skills</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((app) => (
                <tr key={app.applicationId}>
                  <td>
                    <strong>{app.student.name}</strong>
                    <div className="muted">{app.student.email}</div>
                  </td>
                  <td>{app.student.usn || '—'}</td>
                  <td>
                    {app.student.branch || '—'}
                    {app.student.semester ? ` (Sem ${app.student.semester})` : ''}
                  </td>
                  <td>{app.student.cgpa !== null && app.student.cgpa !== undefined ? app.student.cgpa : '—'}</td>
                  <td>
                    {app.student.skills && app.student.skills.length > 0
                      ? app.student.skills.join(', ')
                      : 'None'}
                  </td>
                  <td>
                    <StatusBadge status={app.status} />
                  </td>
                  <td>
                    {app.status === 'Applied' && (
                      <div className="btn-group">
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          disabled={busyId === app.applicationId}
                          onClick={() => handleStatusChange(app.applicationId, 'Shortlisted', app.student.name)}
                        >
                          Shortlist
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          disabled={busyId === app.applicationId}
                          onClick={() => handleStatusChange(app.applicationId, 'Rejected', app.student.name)}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {app.status === 'Shortlisted' && (
                      <div className="btn-group">
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          disabled={busyId === app.applicationId}
                          onClick={() => handleStatusChange(app.applicationId, 'Selected', app.student.name)}
                        >
                          Select
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          disabled={busyId === app.applicationId}
                          onClick={() => handleStatusChange(app.applicationId, 'Rejected', app.student.name)}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {(app.status === 'Selected' || app.status === 'Rejected') && (
                      <span className="muted">Decision finalized</span>
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
