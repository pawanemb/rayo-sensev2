"use client";

import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from "react";

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check authentication and redirect if needed
  useEffect(() => {
    // Don't do anything until component is mounted
    if (!mounted) return;

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
  }, [isAuthenticated, user, loading, router, mounted]);

  if (!mounted) return null;

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
      </div>
    </div>
  );
}