'use client';

/**
 * Cross-Tab Auth Sync Hook
 * Listens for logout events in other tabs and syncs auth state
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const LOGOUT_EVENT_KEY = 'auth_logout_event';
const LOGIN_EVENT_KEY = 'auth_login_event';

/**
 * Hook to sync authentication state across browser tabs
 */
export function useAuthSyncTabs() {
  const router = useRouter();

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Logout event from another tab
      if (event.key === LOGOUT_EVENT_KEY && event.newValue) {
        console.log('🔄 [AuthSync] Logout detected in another tab');

        useAuthStore.setState({ user: null, isAdmin: false });
        router.push('/signin');

        console.log('✅ [AuthSync] Logged out due to logout in another tab');
      }

      // Login event from another tab
      if (event.key === LOGIN_EVENT_KEY && event.newValue) {
        console.log('🔄 [AuthSync] Login detected in another tab');
        window.location.reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [router]);

  return null;
}

/**
 * Broadcast logout event to other tabs
 */
export function broadcastLogout() {
  try {
    localStorage.setItem(LOGOUT_EVENT_KEY, Date.now().toString());

    setTimeout(() => {
      localStorage.removeItem(LOGOUT_EVENT_KEY);
    }, 100);

    console.log('📢 [AuthSync] Logout broadcast sent to other tabs');
  } catch (error) {
    console.error('❌ [AuthSync] Failed to broadcast logout:', error);
  }
}

/**
 * Broadcast login event to other tabs
 */
export function broadcastLogin() {
  try {
    localStorage.setItem(LOGIN_EVENT_KEY, Date.now().toString());

    setTimeout(() => {
      localStorage.removeItem(LOGIN_EVENT_KEY);
    }, 100);

    console.log('📢 [AuthSync] Login broadcast sent to other tabs');
  } catch (error) {
    console.error('❌ [AuthSync] Failed to broadcast login:', error);
  }
}

export default useAuthSyncTabs;
