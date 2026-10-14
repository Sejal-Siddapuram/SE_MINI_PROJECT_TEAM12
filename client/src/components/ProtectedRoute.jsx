import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccessDenied from './AccessDenied';

/**
 * Wraps pages that need a login (FR-02).
 *   <ProtectedRoute roles={['Recruiter']}><MyPage /></ProtectedRoute>
 * Not logged in  -> redirected to /login
 * Wrong role     -> "Access denied" page
 * (The server checks roles again on every request - SR-03.)
 */
export default function ProtectedRoute({ roles, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <AccessDenied />;
  return children;
}
