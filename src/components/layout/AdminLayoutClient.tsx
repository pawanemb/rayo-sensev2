"use client";

import { useSidebar } from "@/context/SidebarContext";
import { useAuthStore } from "@/store/authStore";
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
  const { user, isAdmin, initialized } = useAuthStore();
  const router = useRouter();

  // Check authentication and redirect if needed
  useEffect(() => {
    // Wait for auth to finish loading before making redirect decisions
    if (initialized) {
      // Only redirect if we've completed the initial auth check and user is not authenticated
      if (!user) {
        router.push('/signin');
        return;
      }

      // Check for admin role
      if (!isAdmin) {
        router.push('/signin?error=admin_required');
      }
    }
  }, [user, isAdmin, initialized, router]);

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
        className={`flex min-h-screen w-full flex-col border-l border-gray-200 transition-all duration-300 ease-in-out dark:border-gray-800 ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <main className="flex-1">
          <div className="mx-auto w-full px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}