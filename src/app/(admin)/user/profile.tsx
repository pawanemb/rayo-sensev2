"use client";

import React from "react";
import UserInformation from "@/components/user-profile/UserInformation";
import BillingInformation from "@/components/user-profile/BillingInformation";
import UserProjects from "@/components/user-profile/UserProjects";
import UserBlogs from "@/components/user-profile/UserBlogs";
import UserInvoices from "@/components/user-profile/UserInvoices";
import type { User } from "@/services/userService";

interface UserProfileProps {
  userId: string;
  userData?: User;
  userInformation?: any;
  accountInformation?: any;
  projects?: any[];
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

      {/* Blogs and Invoices */}
      <div className="grid gap-6 lg:grid-cols-2">
        <UserBlogs />
        <UserInvoices />
      </div>
    </div>
  );
}
