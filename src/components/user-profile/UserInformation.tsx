"use client";

import React from "react";
import Image from "next/image";
import { FaLinkedin, FaCopy, FaCheckCircle, FaTimesCircle, FaPen } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { FcGoogle } from "react-icons/fc";
import type { User } from "@/services/userService";
import { Skeleton } from "@/components/ui/skeleton";
import { EditUserModal } from "@/components/users/EditUserModal";
import { updateUser } from "@/services/userService";

interface UserInformationData {
  occupation?: string;
  role?: string;
  purpose?: string;
  how_did_you_hear_about_us?: string;
}

interface UserInformationProps {
  userId: string;
  userData?: User;
  userInformation?: UserInformationData;
  onUserUpdated?: () => void;
}

const providerIcon = (provider: string) => {
  switch (provider) {
    case "email":
      return <MdEmail className="h-4 w-4 text-gray-600 dark:text-gray-400" title="Email" />;
    case "google":
      return <FcGoogle className="h-4 w-4" title="Google" />;
    case "linkedin":
    case "linkedin_oidc":
      return <FaLinkedin className="h-4 w-4 text-blue-600" title="LinkedIn" />;
    default:
      return null;
  }
};

export default function UserInformation({ userData, userInformation, onUserUpdated }: UserInformationProps) {
  const [copiedId, setCopiedId] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!userData) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    );
  }

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(userData.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch (err) {
      console.error('Failed to copy ID:', err);
    }
  };

  const providers =
    userData.raw.app_metadata?.providers ||
    (userData.raw.app_metadata?.provider ? [userData.raw.app_metadata.provider] : []);

  const handleUserUpdated = async (payload: { id: string; name: string; email: string; password?: string }) => {
    setIsSubmitting(true);
    try {
      await updateUser(payload.id, {
        email: payload.email,
        metadata: { full_name: payload.name },
        ...(payload.password ? { password: payload.password } : {}),
      });
      setShowEditModal(false);
      if (onUserUpdated) {
        onUserUpdated();
      }
    } catch (err) {
      console.error("Failed to update user:", err);
      alert(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Basic Information */}
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-gray-100 dark:border-gray-700">
            <Image 
              src={userData.avatar} 
              alt={userData.name} 
              fill 
              sizes="64px" 
              className="object-cover" 
            />
          </div>
          
          {/* Basic Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {userData.name}
              </h2>
              <button
                onClick={() => setShowEditModal(true)}
                className="rounded-full border border-gray-200 p-1.5 text-gray-500 hover:border-brand-200 hover:text-brand-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-brand-500 dark:hover:text-brand-400"
                title="Edit user"
              >
                <FaPen className="h-3.5 w-3.5" />
              </button>
            </div>
            
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {userData.email}
            </p>
            
            <div className="mt-2 flex items-center gap-2">
              <code className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
                {userData.id}
              </code>
              <button
                onClick={handleCopyId}
                className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                title={copiedId ? "Copied!" : "Copy ID"}
              >
                {copiedId ? (
                  <svg className="h-3.5 w-3.5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <FaCopy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {/* Basic Details Grid - 3 columns in one row */}
            <div className="mt-4 grid grid-cols-3 gap-1 text-sm">
              {/* Providers */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Providers</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {providers.length === 0 ? (
                    <span className="text-xs text-gray-400">N/A</span>
                  ) : (
                    providers.map((provider: string) => (
                      <span key={provider} title={provider}>
                        {providerIcon(provider)}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Email Verified */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Email Verified</p>
                <div className="mt-1 flex items-center gap-1">
                  {userData.raw.email_confirmed_at ? (
                    <>
                      <FaCheckCircle className="h-4 w-4 text-success-600" />
                      <span className="text-sm text-gray-900 dark:text-white">Yes</span>
                    </>
                  ) : (
                    <>
                      <FaTimesCircle className="h-4 w-4 text-error-600" />
                      <span className="text-sm text-gray-900 dark:text-white">No</span>
                    </>
                  )}
                </div>
              </div>

              {/* Created */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Created</p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatDateTime(userData.raw.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Additional Information */}
        <div className="text-sm">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Additional Information</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Occupation */}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Occupation</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {userInformation?.occupation || 'N/A'}
              </p>
            </div>

            {/* Role */}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Role</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {userInformation?.role || 'N/A'}
              </p>
            </div>

            {/* Purpose */}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Purpose</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {userInformation?.purpose || 'N/A'}
              </p>
            </div>

            {/* How Did You Hear About Us */}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">How Did You Hear About Us</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {userInformation?.how_did_you_hear_about_us || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      <EditUserModal
        user={userData}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUserUpdated}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
