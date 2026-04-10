import { useEffect, useMemo, useState } from 'react';
import { AuthContext } from '@/context/auth-context';

const AUTH_STORAGE_KEY = 'stayease-auth-user';

const readStoredUser = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);

  useEffect(() => {
    if (user) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      return;
    }

    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }, [user]);

  const login = ({ email, name, role, token }) => {
    const nextUser = {
      email,
      role: role || 'user',
      ...(name ? { name } : {}),
    };

    if (token) {
      window.localStorage.setItem('token', token);
    }

    setUser(nextUser);
    return nextUser;
  };

  const logout = () => {
    window.localStorage.removeItem('token');
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
