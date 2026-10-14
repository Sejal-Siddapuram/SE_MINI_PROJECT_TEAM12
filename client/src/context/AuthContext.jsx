import { createContext, useContext, useState } from 'react';
import { loginUser } from '../services/authApi';
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

  function logout() {
    clearSession();
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
