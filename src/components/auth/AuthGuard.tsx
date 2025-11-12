"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

type AuthGuardProps = {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth check to complete
    if (!loading) {
      // If not authenticated, redirect to signin
      if (!isAuthenticated || !user) {
        router.push('/signin');
        return;
      }

      // Check for admin role
      const userRole = (user.role || '').toLowerCase();
      if (userRole !== 'admin' && userRole !== 'administrator') {
        router.push('/signin?error=admin_required');
      }
    }
  }, [isAuthenticated, user, loading, router]);

  // Don't render anything while loading or if not authenticated
  if (loading || !isAuthenticated || !user) {
    return null;
  }

  const userRole = (user.role || '').toLowerCase();
  if (userRole !== 'admin' && userRole !== 'administrator') {
    return null;
  }

  return <>{children}</>;
}
