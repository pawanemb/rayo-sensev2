"use client";

import React from "react";
import UserInformation from "@/components/user-profile/UserInformation";
import BillingInformation from "@/components/user-profile/BillingInformation";
import UserProjects from "@/components/user-profile/UserProjects";
import UserBlogs from "@/components/user-profile/UserBlogs";
import UserInvoices from "@/components/user-profile/UserInvoices";
import UserUsage from "@/components/user-profile/UserUsage";
import UserImageGallery from "@/components/user-profile/UserImageGallery";
import type { User } from "@/services/userService";

interface UserInformation {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  status: string;
  created_at: string;
  last_sign_in_at: string;
}

interface AccountInformation {
  balance: number;
  total_spent: number;
  payment_method?: string;
  billing_address?: string;
}

interface ProjectRecord {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserProfileProps {
  userId: string;
  userData?: User;
  userInformation?: UserInformation;
  accountInformation?: AccountInformation;
  projects?: ProjectRecord[];
  totalProjects?: number;
  onUserUpdated?: () => void;
}

export default function UserProfile({ userId, userData, userInformation, accountInformation, projects, totalProjects, onUserUpdated }: UserProfileProps) {
  return (
    <div className="space-y-6">
      {/* User Information Header - Full Width */}
      <UserInformation userId={userId} userData={userData} userInformation={userInformation} onUserUpdated={onUserUpdated} />

      {/* Billing Information */}
      <BillingInformation userId={userId} accountInformation={accountInformation} />

      {/* Projects */}
      <UserProjects userId={userId} projects={projects} totalProjects={totalProjects} />

      {/* Blogs */}
      <UserBlogs userId={userId} />

      {/* Invoices */}
      <UserInvoices userId={userId} />

      {/* User Images */}
      <UserImageGallery userId={userId} />

      {/* Usage History */}
      <UserUsage userId={userId} />
    </div>
  );
}
