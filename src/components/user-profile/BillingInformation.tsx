"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface AccountInformation {
  balance?: number;
  total_spent?: number;
  credits?: number;
  currency?: string;
  plan_type?: string;
  plan_duration?: string;
  plan_status?: string;
  plan_start_date?: string;
  plan_end_date?: string;
  billing_name?: string;
  billing_email?: string;
  billing_phone?: string;
  billing_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_country?: string;
  billing_postal_code?: string;
  billing_tax_number?: string;
}

interface BillingInformationProps {
  userId: string;
  accountInformation?: AccountInformation;
}

export default function BillingInformation({ accountInformation }: BillingInformationProps) {
  if (!accountInformation) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Billing Information
        </h2>
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatAddress = () => {
    const parts = [
      accountInformation.billing_address,
      accountInformation.billing_city,
      accountInformation.billing_state,
      accountInformation.billing_country,
      accountInformation.billing_postal_code
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const getPlanStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      active: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
      grace_period: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
      expired: 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400',
      cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    };
    
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[status] || statusColors.active}`}>
        {status?.replace('_', ' ').toUpperCase() || 'N/A'}
      </span>
    );
  };

  const getPlanTypeBadge = (planType: string) => {
    const planColors: Record<string, string> = {
      free: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
      pro: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400',
    };
    
    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${planColors[planType?.toLowerCase()] || planColors.free}`}>
        {planType?.toUpperCase() || 'FREE'} Plan
      </span>
    );
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Billing Information
        </h2>
        {getPlanTypeBadge(accountInformation.plan_type || '')}
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Plan & Credits */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Plan & Credits</h3>
          
          <div className="space-y-3 text-sm">
            {/* Credits */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
              <span className="text-gray-500 dark:text-gray-400">Credits</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {accountInformation.credits?.toLocaleString() || '0'} {accountInformation.currency || 'USD'}
              </span>
            </div>

            {/* Plan Duration */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
              <span className="text-gray-500 dark:text-gray-400">Plan Duration</span>
              <span className="font-medium text-gray-900 dark:text-white capitalize">
                {accountInformation.plan_duration || 'N/A'}
              </span>
            </div>

            {/* Plan Status */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
              <span className="text-gray-500 dark:text-gray-400">Plan Status</span>
              {getPlanStatusBadge(accountInformation.plan_status || '')}
            </div>

            {/* Plan Start Date */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
              <span className="text-gray-500 dark:text-gray-400">Plan Start Date</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatDate(accountInformation.plan_start_date)}
              </span>
            </div>

            {/* Plan End Date */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Plan End Date</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatDate(accountInformation.plan_end_date)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Billing Details */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Billing Details</h3>
          
          <div className="space-y-3 text-sm">
            {/* Billing Name */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
              <span className="text-gray-500 dark:text-gray-400">Name</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {accountInformation.billing_name || 'N/A'}
              </span>
            </div>

            {/* Billing Email */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
              <span className="text-gray-500 dark:text-gray-400">Email</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {accountInformation.billing_email || 'N/A'}
              </span>
            </div>

            {/* Billing Phone */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
              <span className="text-gray-500 dark:text-gray-400">Phone</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {accountInformation.billing_phone || 'N/A'}
              </span>
            </div>

            {/* Billing Address */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
              <span className="text-gray-500 dark:text-gray-400">Address</span>
              <span className="font-medium text-gray-900 dark:text-white text-right max-w-[60%]">
                {formatAddress()}
              </span>
            </div>

            {/* Tax Number */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Tax Number</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {accountInformation.billing_tax_number || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
