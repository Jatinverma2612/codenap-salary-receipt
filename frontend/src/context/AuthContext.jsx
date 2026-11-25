import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/authApi.js';
import { clearCsrfToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      await authApi.fetchCsrfToken().catch(() => null);
      const data = await authApi.fetchCurrentUser();
      setUser(data.user || null);
      setNeedsSetup(false);
    } catch {
      setUser(null);
      try {
        const setupData = await authApi.fetchSetupStatus();
        setNeedsSetup(Boolean(setupData.needsSetup));
      } catch {
        setNeedsSetup(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const loginUser = useCallback(async (credentials) => {
    const data = await authApi.login(credentials);
    setUser(data.user);
    setNeedsSetup(false);
    return data.user;
  }, []);

  const setupInitialAdminAccount = useCallback(async (payload) => {
    const data = await authApi.setupInitialAdmin(payload);
    setUser(data.user);
    setNeedsSetup(false);
    return data.user;
  }, []);

  const logoutUser = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      clearCsrfToken();
    } finally {
      setUser(null);
      // Full redirect ensures clean memory/cache reset after sign-out.
      window.location.href = '/login';
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        needsSetup,
        loginUser,
        setupInitialAdminAccount,
        logoutUser,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }
  return ctx;
}
