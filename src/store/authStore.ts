'use client';

import { create } from 'zustand';
import { authApi } from '@/lib/auth/api';
import { tokenManager } from '@/lib/auth/tokenManager';
import type { User } from '@/lib/auth/api';

interface AuthState {
  user: User | null;
  initialized: boolean;
  isAdmin: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshIntervalId?: NodeJS.Timeout;
}

// Helper to create User object
const createUser = (id: string, email: string, full_name?: string, avatar?: string, role?: string): User => ({
  id,
  email,
  email_confirmed: true,
  full_name: full_name || email.split('@')[0],
  avatar: avatar || undefined,
  role: role || undefined,
});

// Check if user is admin
const checkIsAdmin = (user: User | null): boolean => {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  return role === 'admin' || role === 'administrator';
};

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const useAuthStore = create<AuthState>((set, get) => {
  const setupAutoRefresh = () => {
    const currentIntervalId = get().refreshIntervalId;
    if (currentIntervalId) {
      clearInterval(currentIntervalId);
    }

    const intervalId = setInterval(async () => {
      const { user } = get();
      if (!user) return;

      const token = tokenManager.getAccessToken();
      if (!token) return;

      console.log('🔄 [AuthStore] Auto-refreshing token...');
      try {
        await get().refreshSession();
      } catch (error) {
        console.error('❌ [AuthStore] Auto-refresh failed:', error);
      }
    }, REFRESH_INTERVAL);

    set({ refreshIntervalId: intervalId });
    return () => {
      clearInterval(intervalId);
      set({ refreshIntervalId: undefined });
    };
  };

  return {
    user: null,
    initialized: false,
    isAdmin: false,

    initialize: async () => {
      try {
        // Check if user explicitly logged out
        if (tokenManager.wasLoggedOut()) {
          console.log('👋 [AuthStore] User was logged out, skipping init');
          set({ initialized: true, user: null, isAdmin: false });
          return;
        }

        const token = tokenManager.getAccessToken();

        if (!token) {
          console.log('ℹ️ [AuthStore] No access token found');
          set({ initialized: true, user: null, isAdmin: false });
          return;
        }

        console.log('🔍 [AuthStore] Found access token, validating...');

        const isExpired = tokenManager.isTokenExpired();
        if (isExpired) {
          console.log('⏰ [AuthStore] Token expired, refreshing...');
          try {
            const response = await authApi.refreshToken();
            if (response.access_token && response.refresh_token) {
              console.log('✅ [AuthStore] Token refresh successful');
              tokenManager.clearLogoutFlag();
              tokenManager.setTokens({
                access_token: response.access_token,
                refresh_token: response.refresh_token
              });
              localStorage.setItem('user', JSON.stringify(response.user));
              const isAdmin = checkIsAdmin(response.user || null);
              set({ user: response.user || null, isAdmin });
              setupAutoRefresh();
            } else {
              console.error('❌ [AuthStore] Invalid refresh response');
              tokenManager.clearTokens();
              localStorage.removeItem('user');
              set({ user: null, isAdmin: false });
            }
          } catch (error) {
            console.error('❌ [AuthStore] Token refresh failed on init:', error);
            // Don't mark as logged out - just clear invalid tokens
            tokenManager.clearTokens();
            localStorage.removeItem('user');
            set({ user: null, isAdmin: false });
          }
        } else {
          console.log('✅ [AuthStore] Token valid, extracting user info...');
          const id = tokenManager.getUserId();
          const email = tokenManager.getUserEmail();
          const fullName = tokenManager.getUserName();
          const avatar = tokenManager.getUserAvatar();
          const role = tokenManager.getUserRole();

          console.log('🔍 [AuthStore] Extracted from JWT:', {
            id: id ? '✓' : '✗',
            email,
            fullName,
            role,
            hasIdAndEmail: !!(id && email)
          });

          if (id && email) {
            const user = createUser(id, email, fullName || undefined, avatar || undefined, role || undefined);
            const isAdmin = checkIsAdmin(user);

            console.log('🔍 [AuthStore] User check:', {
              user_role: user.role,
              isAdmin,
              checkResult: isAdmin ? 'PASS ✅' : 'FAIL ❌'
            });

            // ADMIN CHECK - Only allow admin users
            if (!isAdmin) {
              // Silently clear tokens without error (user might be on signin page)
              console.log('ℹ️ [AuthStore] Non-admin token found, clearing session');
              tokenManager.setLoggedOut();
              tokenManager.clearTokens();
              localStorage.removeItem('user');
              set({ user: null, isAdmin: false, initialized: true });
              return; // Don't throw, just return
            }

            console.log('✅ [AuthStore] Admin user restored from token:', email);
            console.log('🎉 [AuthStore] Setting user state and starting auto-refresh');
            localStorage.setItem('user', JSON.stringify(user));
            set({ user, isAdmin: true });
            tokenManager.clearLogoutFlag();
            setupAutoRefresh();
          } else {
            console.log('ℹ️ [AuthStore] Could not extract user info from token (missing id or email)');
            tokenManager.clearTokens();
            localStorage.removeItem('user');
            set({ user: null, isAdmin: false });
          }
        }
      } catch (error) {
        console.log('ℹ️ [AuthStore] Session initialization completed with no valid session');
        // Don't mark as logged out on init errors - just clear invalid state
        tokenManager.clearTokens();
        localStorage.removeItem('user');
        set({ user: null, isAdmin: false });
      } finally {
        set({ initialized: true });
      }
    },

    login: async (email: string, password: string) => {
      try {
        const response = await authApi.login({ email, password });

        tokenManager.clearTokens();
        localStorage.removeItem('user');
        tokenManager.clearLogoutFlag();

        tokenManager.setTokens({
          access_token: response.access_token,
          refresh_token: response.refresh_token
        });

        if (!response.user) {
          const id = tokenManager.getUserId();
          const email = tokenManager.getUserEmail();
          const fullName = tokenManager.getUserName();
          const avatar = tokenManager.getUserAvatar();
          const role = tokenManager.getUserRole();

          if (id && email) {
            const user = createUser(id, email, fullName || undefined, avatar || undefined, role || undefined);
            const isAdmin = checkIsAdmin(user);

            // ADMIN CHECK - Only allow admin users
            if (!isAdmin) {
              console.error('❌ [AuthStore] Login denied - Admin role required');
              tokenManager.clearTokens();
              localStorage.removeItem('user');
              throw new Error('Admin access required. Only administrators can access this system.');
            }

            localStorage.setItem('user', JSON.stringify(user));
            set({ user, isAdmin: true });
          }
        } else {
          const isAdmin = checkIsAdmin(response.user);

          // ADMIN CHECK - Only allow admin users
          if (!isAdmin) {
            console.error('❌ [AuthStore] Login denied - Admin role required');
            tokenManager.clearTokens();
            localStorage.removeItem('user');
            throw new Error('Admin access required. Only administrators can access this system.');
          }

          localStorage.setItem('user', JSON.stringify(response.user));
          set({ user: response.user, isAdmin: true });
        }

        setupAutoRefresh();
        console.log('✅ [AuthStore] Login successful');
      } catch (error) {
        console.error('❌ [AuthStore] Login failed:', error);
        throw error;
      }
    },

    logout: async () => {
      try {
        console.log('Logging out user...');

        tokenManager.setLoggedOut();
        tokenManager.clearTokens();
        localStorage.removeItem('user');

        const currentIntervalId = get().refreshIntervalId;
        if (currentIntervalId) {
          clearInterval(currentIntervalId);
          set({ refreshIntervalId: undefined });
        }

        set({ user: null, isAdmin: false });
        console.log('✅ [AuthStore] Logout successful');
      } catch (error) {
        console.error('❌ [AuthStore] Logout error:', error);
        tokenManager.setLoggedOut();
        set({ user: null, isAdmin: false });
      }
    },

    refreshSession: async () => {
      try {
        if (tokenManager.wasLoggedOut()) {
          console.log('[AuthStore] User logged out, skipping refresh');
          return;
        }

        console.log('[AuthStore] Refreshing session...');
        const response = await authApi.refreshToken();

        if (response.access_token) {
          tokenManager.clearLogoutFlag();

          if (!response.user) {
            const id = tokenManager.getUserId();
            const email = tokenManager.getUserEmail();
            const fullName = tokenManager.getUserName();
            const avatar = tokenManager.getUserAvatar();
            const role = tokenManager.getUserRole();

            if (id && email) {
              const user = createUser(id, email, fullName || undefined, avatar || undefined, role || undefined);
              const isAdmin = checkIsAdmin(user);
              localStorage.setItem('user', JSON.stringify(user));
              set({ user, isAdmin });
            }
          } else {
            const isAdmin = checkIsAdmin(response.user);
            localStorage.setItem('user', JSON.stringify(response.user));
            set({ user: response.user, isAdmin });
          }

          setupAutoRefresh();
          console.log('✅ [AuthStore] Session refreshed');
        }
      } catch (error) {
        console.error('❌ [AuthStore] Refresh session failed:', error);

        const isAuthError = error &&
          typeof error === 'object' &&
          'response' in error &&
          (error as any).response?.status === 401;

        if (isAuthError) {
          tokenManager.setLoggedOut();
          tokenManager.clearTokens();
          localStorage.removeItem('user');
          set({ user: null, isAdmin: false });

          const currentIntervalId = get().refreshIntervalId;
          if (currentIntervalId) {
            clearInterval(currentIntervalId);
            set({ refreshIntervalId: undefined });
          }
        }
      }
    },
  };
});
