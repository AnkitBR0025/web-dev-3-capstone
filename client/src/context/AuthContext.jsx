import { createContext, useContext, useEffect, useState } from 'react';
import { api, saveTokens, clearTokens } from '../api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('auth:logout', onLogout);
    if (localStorage.getItem('accessToken')) {
      api('/auth/me')
        .then((d) => setUser(d.user))
        .catch(() => clearTokens())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  const login = async (email, password) => {
    const d = await api('/auth/login', { method: 'POST', body: { email, password } });
    saveTokens(d);
    setUser(d.user);
    return { user: d.user, message: d.message };
  };

  const register = async (name, email, password) => {
    const d = await api('/auth/register', { method: 'POST', body: { name, email, password } });
    saveTokens(d);
    setUser(d.user);
    return d.user;
  };

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    clearTokens();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}
