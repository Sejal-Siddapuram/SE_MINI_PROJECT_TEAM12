// NFR-02 / SAD 4.5: every status has its own symbol as well as its own colour,
// so the meaning is still clear for colour-blind users and in black-and-white printouts.
const ICONS = {
  draft: '✎',
  published: '●',
  closed: '■',
  pending: '◷',
  approved: '✓',
  removed: '✕',
  open: '●',
  'deadline-passed': '■',
  applied: '◷',
  shortlisted: '★',
  rejected: '✕',
  selected: '✓',
};

/**
 * Shared status badge, e.g. <StatusBadge status="Published" />
 * Used for listing, approval and application statuses (SAD 4.5).
 */
export default function StatusBadge({ status }) {
  const slug = String(status).toLowerCase().replace(/\s+/g, '-');
  const icon = ICONS[slug];
  return (
    <span className={`badge badge-${slug}`}>
      {icon && (
        <span className="badge-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {status}
    </span>
  );
}
