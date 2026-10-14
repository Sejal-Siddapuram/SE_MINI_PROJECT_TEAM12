import axios from 'axios';

const TOKEN_KEY = 'campusready.token';
const USER_KEY = 'campusready.user';

/** Shared Axios instance used by every module's API file */
const api = axios.create({ baseURL: '/api' });

// Attach the login token to every request (FR-02)
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token has expired, clear the session and send the user to the login page (SAD 4.4)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isLoginCall = error.config?.url?.startsWith('/auth/login');
    if (status === 401 && !isLoginCall && sessionStorage.getItem(TOKEN_KEY)) {
      clearSession();
      window.location.assign('/login?expired=1');
    }
    return Promise.reject(error);
  }
);

// ---- Session helpers ----
export function saveSession(token, user) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function loadSessionUser() {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

// ---- Error helpers (standard error format, SAD 4.4) ----
export function getErrorMessage(error) {
  return error.response?.data?.error?.message || 'Could not reach the server. Please try again.';
}

/** Turns error.details [{ field, message }] into { field: message } for forms */
export function getFieldErrors(error) {
  const details = error.response?.data?.error?.details || [];
  return details.reduce((acc, d) => ({ ...acc, [d.field]: acc[d.field] || d.message }), {});
}

export default api;
