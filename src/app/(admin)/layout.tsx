import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import AuthGuard from "@/components/auth/AuthGuard";
import AdminLayoutClient from "@/components/layout/AdminLayoutClient";
import React from "react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </AuthGuard>
  );
}
