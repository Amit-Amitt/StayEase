import { useEffect, useMemo, useState } from 'react';
import { apiClient, clearAccessToken, setAccessToken } from '@/api/client';
import { AuthContext } from '@/context/auth-context';

const AUTH_STORAGE_KEY = 'stayease-auth-user';
let pendingRestore;

const readStoredUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEY) || 'null');
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

const restoreSession = () => {
  pendingRestore ||= apiClient.post('auth/refresh').then(({ data }) => {
    setAccessToken(data.token);
    return data.user;
  }).finally(() => {
    pendingRestore = undefined;
  });
  return pendingRestore;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    localStorage.removeItem('token');
    const clearUser = () => {
      clearAccessToken();
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
    };

    window.addEventListener('stayease:unauthorized', clearUser);
    restoreSession()
      .then((nextUser) => {
        if (active) setUser(nextUser);
      })
      .catch(() => {
        clearAccessToken();
        localStorage.removeItem(AUTH_STORAGE_KEY);
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setIsReady(true);
      });

    return () => {
      active = false;
      window.removeEventListener('stayease:unauthorized', clearUser);
    };
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(AUTH_STORAGE_KEY);
  }, [user]);

  const login = ({ email, name, role, token, _id, emailVerified }) => {
    if (token) setAccessToken(token);
    const nextUser = {
      ...(email ? { email } : {}),
      ...(name ? { name } : {}),
      ...(role ? { role: role.toUpperCase() } : {}),
      ...(_id ? { _id } : {}),
      ...(emailVerified !== undefined ? { emailVerified } : {}),
    };
    setUser((current) => ({ ...current, ...nextUser }));
  };

  const logout = async () => {
    setUser(null);
    clearAccessToken();
    localStorage.removeItem(AUTH_STORAGE_KEY);
    try {
      await apiClient.post('auth/logout');
    } catch {
      // Local credentials are cleared even if the API cannot be reached.
    }
  };

  const value = useMemo(() => ({ user, isReady, login, logout }), [user, isReady]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
