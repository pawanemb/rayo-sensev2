'use client';

import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useAuthSyncTabs } from '@/lib/auth/useAuthSyncTabs';
import { usePathname } from 'next/navigation';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const initialize = useAuthStore((state) => state.initialize);
  const pathname = usePathname();

  // Check if we're on signin/login page
  const isAuthPage = pathname?.includes('/signin') || pathname?.includes('/login');

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Setup cross-tab sync
  useAuthSyncTabs();

  // For auth pages (signin/login), show immediately without waiting
  if (isAuthPage) {
    return <>{children}</>;
  }

  // For protected pages, show immediately (AuthGuard will handle redirects)
  return <>{children}</>;
}
