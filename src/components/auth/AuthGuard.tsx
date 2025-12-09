'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

type AuthGuardProps = {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isAdmin, initialized } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;

    // If not authenticated, redirect to signin
    if (!user) {
      router.push('/signin');
      return;
    }

    // Check for admin role
    if (!isAdmin) {
      router.push('/signin?error=admin_required');
    }
  }, [user, isAdmin, initialized, router]);

  // Don't render anything while loading or if not authenticated
  if (!initialized || !user || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
