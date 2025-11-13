"use client";

import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { useRouter } from 'next/navigation';
import React, { useEffect } from "react";

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  // Check authentication and redirect if needed
  useEffect(() => {
    // Wait for auth to finish loading before making redirect decisions
    if (!loading) {
      // Only redirect if we've completed the initial auth check and user is not authenticated
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

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex min-h-screen w-full flex-col transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <main className="flex-1">
          <div className="mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}