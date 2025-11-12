"use client";
import React, { useEffect, useState } from "react";
import { FaUsers, FaCrown, FaBox } from "react-icons/fa";

interface MetricsData {
  total_users: number;
  free_users: number;
  pro_users: number;
  total_payments: number;
  total_amount: number;
}

export const EcommerceMetrics = () => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/analytics/metrics');
        const data = await response.json();

        if (data.success) {
          setMetrics(data.data);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* <!-- Users Card (Free & Pro) --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Users by Plan</h3>

        <div className="flex items-center justify-between gap-4">
          {/* Free Users */}
          <div className="flex items-center gap-2 flex-1">
            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg dark:bg-gray-800 flex-shrink-0">
              <FaUsers className="text-gray-800 size-4 dark:text-white/90" />
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 block">Free</span>
              {isLoading ? (
                <div className="mt-0.5 h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <h4 className="font-bold text-gray-800 dark:text-white/90">
                  {metrics?.free_users.toLocaleString() || '0'}
                </h4>
              )}
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="h-12 w-px bg-gray-200 dark:bg-gray-800"></div>

          {/* Pro Users */}
          <div className="flex items-center gap-2 flex-1">
            <div className="flex items-center justify-center w-8 h-8 bg-amber-50 rounded-lg dark:bg-amber-500/10 flex-shrink-0">
              <FaCrown className="text-amber-600 size-4 dark:text-amber-400" />
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 block">Pro</span>
              {isLoading ? (
                <div className="mt-0.5 h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <h4 className="font-bold text-gray-800 dark:text-white/90">
                  {metrics?.pro_users.toLocaleString() || '0'}
                </h4>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* <!-- Total Payments Card --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Total Payments</h3>

        <div className="flex items-center justify-between gap-4">
          {/* Payments Count */}
          <div className="flex items-center gap-2 flex-1">
            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg dark:bg-gray-800 flex-shrink-0">
              <FaBox className="text-gray-800 size-4 dark:text-white/90" />
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 block">Count</span>
              {isLoading ? (
                <div className="mt-0.5 h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <h4 className="font-bold text-gray-800 dark:text-white/90">
                  {metrics?.total_payments.toLocaleString() || '0'}
                </h4>
              )}
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="h-12 w-px bg-gray-200 dark:bg-gray-800"></div>

          {/* Total Amount */}
          <div className="flex items-center gap-2 flex-1">
            <div className="flex items-center justify-center w-8 h-8 bg-green-50 rounded-lg dark:bg-green-500/10 flex-shrink-0">
              <span className="text-green-600 dark:text-green-400 font-bold text-sm">$</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 block">Amount</span>
              {isLoading ? (
                <div className="mt-0.5 h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <h4 className="font-bold text-gray-800 dark:text-white/90">
                  ${((metrics?.total_amount || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h4>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
