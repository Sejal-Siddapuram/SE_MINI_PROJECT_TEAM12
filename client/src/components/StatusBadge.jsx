/**
 * Shared status badge, e.g. <StatusBadge status="Published" />
 * Used for listing, approval and application statuses (SAD 4.5).
 */
export default function StatusBadge({ status }) {
  const slug = String(status).toLowerCase().replace(/\s+/g, '-');
  return <span className={`badge badge-${slug}`}>{status}</span>;
}
