import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import FormField from '../../components/FormField';
import Alert from '../../components/Alert';
import StatusBadge from '../../components/StatusBadge';
import { searchListings } from '../../services/searchApi';
import { getErrorMessage } from '../../services/api';

const FILTER_KEYS = ['keyword', 'role', 'company', 'location', 'type', 'deadlineBefore'];
const PAGE_SIZE = 10;

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Reads the current filters from the page address, e.g. /listings?keyword=java&location=Bengaluru */
function filtersFromUrl(searchParams) {
  return FILTER_KEYS.reduce((acc, key) => ({ ...acc, [key]: searchParams.get(key) || '' }), {});
}

/**
 * FR-04: Students search and filter listings by keyword, role, company, location and deadline.
 * Filters are kept in the address bar, so a search can be bookmarked or shared and the
 * browser Back button works as expected.
 */
export default function SearchListings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState(() => filtersFromUrl(searchParams));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const page = Number(searchParams.get('page')) || 1;

  // Run the search whenever the address (filters or page) changes
  useEffect(() => {
    const filters = filtersFromUrl(searchParams);
    setForm(filters);
    setLoading(true);
    setError('');
    searchListings({ ...filters, page, limit: PAGE_SIZE })
      .then(setResult)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [searchParams, page]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function applyFilters(filters, newPage = 1) {
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
    if (newPage > 1) params.page = String(newPage);
    setSearchParams(params);
  }

  function handleSubmit(e) {
    e.preventDefault();
    applyFilters(form);
  }

  function handleClear() {
    applyFilters({});
  }

  const hasFilters = FILTER_KEYS.some((key) => searchParams.get(key));

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Find internships &amp; jobs</h1>
          <p className="muted">Search by keyword, or narrow down by role, company, location and deadline.</p>
        </div>
      </div>

      <form className="card" onSubmit={handleSubmit} noValidate role="search">
        <FormField
          label="Keyword"
          name="keyword"
          type="search"
          value={form.keyword}
          onChange={handleChange}
          placeholder="e.g. React, data analyst, Infosys"
        />
        <div className="form-row-3">
          <FormField label="Role" name="role" value={form.role} onChange={handleChange} placeholder="e.g. Software Engineer" />
          <FormField label="Company" name="company" value={form.company} onChange={handleChange} placeholder="e.g. Acme" />
          <FormField label="Location" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Bengaluru" />
        </div>
        <div className="form-row">
          <FormField
            label="Type"
            name="type"
            as="select"
            options={[{ value: '', label: 'Any type' }, 'Internship', 'Full-time']}
            value={form.type}
            onChange={handleChange}
          />
          <FormField
            label="Deadline on or before"
            name="deadlineBefore"
            type="date"
            value={form.deadlineBefore}
            onChange={handleChange}
          />
        </div>
        <div className="btn-group">
          <button type="submit" className="btn btn-primary">
            Search
          </button>
          {hasFilters && (
            <button type="button" className="btn btn-secondary" onClick={handleClear}>
              Clear filters
            </button>
          )}
        </div>
      </form>

      <Alert type="error">{error}</Alert>

      {loading ? (
        <p className="muted">Searching…</p>
      ) : result && result.items.length === 0 ? (
        <div className="card empty-state">
          <p>No listings match your search.</p>
          {hasFilters && (
            <button type="button" className="btn btn-secondary" onClick={handleClear}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        result && (
          <>
            <p className="muted" aria-live="polite">
              {result.total} listing{result.total === 1 ? '' : 's'} found
            </p>

            {result.items.map((listing) => (
              <article key={listing.id} className="card listing-card">
                <div className="page-header">
                  <div>
                    <h2>
                      <Link to={`/listings/${listing.id}`}>{listing.title}</Link>
                    </h2>
                    <div className="meta">
                      <span>{listing.company}</span>
                      <span>{listing.role}</span>
                      <span>{listing.location}</span>
                      <span>Apply by {formatDate(listing.deadline)}</span>
                    </div>
                  </div>
                  <div className="btn-group">
                    <StatusBadge status={listing.type} />
                    <StatusBadge status={listing.isOpen ? 'Open' : 'Deadline passed'} />
                  </div>
                </div>
                <Link to={`/listings/${listing.id}`} className="btn btn-secondary btn-sm">
                  View details
                </Link>
              </article>
            ))}

            {result.totalPages > 1 && (
              <nav className="pagination" aria-label="Pagination">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={page <= 1}
                  onClick={() => applyFilters(filtersFromUrl(searchParams), page - 1)}
                >
                  ← Previous
                </button>
                <span>
                  Page {result.page} of {result.totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={page >= result.totalPages}
                  onClick={() => applyFilters(filtersFromUrl(searchParams), page + 1)}
                >
                  Next →
                </button>
              </nav>
            )}
          </>
        )
      )}
    </>
  );
}
