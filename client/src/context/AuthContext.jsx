import { createContext, useContext, useState } from 'react';
import { loginUser, logoutUser } from '../services/authApi';
import { saveSession, loadSessionUser, clearSession } from '../services/api';

const AuthContext = createContext(null);

/** Holds the logged-in user for the whole app (FR-02) */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadSessionUser);

  async function login(email, password) {
    const { token, user: loggedInUser } = await loginUser(email, password);
    saveSession(token, loggedInUser);
    setUser(loggedInUser);
    return loggedInUser;
  }

  // SR-04: revoke the token on the server, then forget it in the browser
  async function logout() {
    try {
      await logoutUser();
    } catch {
      // Even if the server can't be reached, the user is still logged out on this device
    } finally {
      clearSession();
      setUser(null);
    }
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
