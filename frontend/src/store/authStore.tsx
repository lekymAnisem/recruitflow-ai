import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { User } from '@/types';
import * as authApi from '@/api/auth';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: authApi.RegisterData) => Promise<void>;
  registerCandidate: (data: authApi.CandidateRegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const userData = await authApi.getMe();
      setUser(userData);
    } catch {
      localStorage.removeItem('accessToken');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (email: string, password: string) => {
    const { user: userData, accessToken } = await authApi.login({
      email,
      password,
    });
    localStorage.setItem('accessToken', accessToken);
    setUser(userData);
  }, []);

  const register = useCallback(async (data: authApi.RegisterData) => {
    const { user: userData, accessToken } = await authApi.register(data);
    localStorage.setItem('accessToken', accessToken);
    setUser(userData);
  }, []);

  const registerCandidate = useCallback(async (data: authApi.CandidateRegisterData) => {
    const { user: userData, accessToken } = await authApi.registerCandidate(data);
    localStorage.setItem('accessToken', accessToken);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore server-side logout errors
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        registerCandidate,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
