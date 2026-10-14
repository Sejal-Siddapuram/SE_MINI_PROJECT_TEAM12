const ICONS = { error: '⚠', success: '✓', info: 'ℹ' };

/**
 * Shared message box for page-level feedback.
 * type: 'error' | 'success' | 'info'
 *
 * NFR-02: errors use role="alert" so screen readers announce them immediately;
 * success/info messages use role="status". An icon is shown so the meaning
 * does not depend on colour alone.
 */
export default function Alert({ type = 'info', children }) {
  if (!children) return null;
  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <span className="alert-icon" aria-hidden="true">
        {ICONS[type]}
      </span>
      <div>{children}</div>
    </div>
  );
}
