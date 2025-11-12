"use client";
import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  created_at?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<{success: boolean; message?: string}>;
  logout: () => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Handle mounting state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check session with backend
  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();

        if (data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
          // Update auth cookie with user data
          Cookies.set('auth', JSON.stringify(data.user), { expires: 7 });
        } else {
          setUser(null);
          setIsAuthenticated(false);
          Cookies.remove('auth');
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        Cookies.remove('auth');

        // Only redirect if session expired
        if (response.status === 401) {
          const isSigninPage = typeof window !== 'undefined' &&
            window.location.pathname.includes('/signin');

          if (!isSigninPage) {
            router.push('/signin?session=expired');
          }
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
      setError(error instanceof Error ? error.message : 'Session check failed');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Run session check on mount
  useEffect(() => {
    if (mounted) {
      // Skip session check if we're already on the signin page
      const isSigninPage = typeof window !== 'undefined' && (
        window.location.pathname.includes('/signin') ||
        window.location.pathname.includes('/login')
      );

      // Check for a cookie-based authentication first
      const hasAuthCookie = Cookies.get('auth') || Cookies.get('supabase-auth-token');

      if (hasAuthCookie) {
        // If we have a cookie, assume authenticated temporarily
        setIsAuthenticated(true);

        // Try to parse the auth cookie for immediate user data
        try {
          const authData = Cookies.get('auth');
          if (authData) {
            const userData = JSON.parse(authData);
            setUser(userData);
          }
        } catch (e) {
          console.error('Error parsing auth cookie:', e);
        }
      }

      // Always check the session to verify authentication
      if (!isSigninPage) {
        setTimeout(() => {
          checkSession();
        }, 100);
      } else {
        setLoading(false);
      }
    }
  }, [mounted, checkSession]);

  // Set up periodic session check (every 5 minutes)
  useEffect(() => {
    if (!mounted) return;

    const isSigninPage = typeof window !== 'undefined' && (
      window.location.pathname.includes('/signin') ||
      window.location.pathname.includes('/login')
    );

    if (isSigninPage) return;

    const intervalId = setInterval(() => {
      if (isAuthenticated) {
        checkSession();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, [mounted, isAuthenticated, checkSession]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.user) {
        setIsAuthenticated(true);
        setUser(data.user);
        // Set backup cookie with user data
        Cookies.set('auth', JSON.stringify(data.user), { expires: 7 });
        return { success: true };
      }

      const errorMessage = data.error || 'Invalid credentials. Please try again.';
      setError(errorMessage);
      setLoading(false);
      return {
        success: false,
        message: errorMessage
      };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      setLoading(false);
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const logout = async () => {
    try {
      setLoading(true);

      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });

      // Always clear local state
      setIsAuthenticated(false);
      setUser(null);
      Cookies.remove('auth');
      Cookies.remove('supabase-auth-token');

      router.push('/signin');
      return true;
    } catch (error) {
      console.error('Logout error:', error);

      // Still clear local state on error
      setIsAuthenticated(false);
      setUser(null);
      Cookies.remove('auth');
      Cookies.remove('supabase-auth-token');

      router.push('/signin');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything until mounted on client
  if (!mounted) return null;

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
