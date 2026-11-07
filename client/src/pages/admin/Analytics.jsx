import { useEffect, useState } from 'react';
import { getAnalytics } from '../../services/adminApi';
import { getErrorMessage } from '../../services/api';
import Alert from '../../components/Alert';

export default function Analytics() {
  const [totals, setTotals] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  async function refresh() {
    setLoading(true);
    setError('');
    try { setTotals(await getAnalytics()); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);
  return <>
    <div className="page-header"><h1>Placement Analytics</h1>
      <button className="btn btn-primary" onClick={refresh} disabled={loading}>Refresh totals</button></div>
    <Alert type="error">{error}</Alert>
    {loading ? <p role="status">Loading analytics...</p> : totals && <>
      <div className="feature-grid">
        {Object.entries(totals).map(([key, value]) => <div className="card" key={key}>
          <h2>{key.charAt(0).toUpperCase() + key.slice(1)}</h2><p>{value}</p>
        </div>)}
      </div>
      <p className="muted">Listings include all statuses. Selections count applications marked Selected; one student may have multiple selections.</p>
    </>}
  </>;
}
