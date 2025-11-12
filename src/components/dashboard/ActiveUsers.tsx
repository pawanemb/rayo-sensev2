"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import type { User } from '@supabase/supabase-js';

interface ActiveUser {
  user_id: string;
  user_email: string;
  name: string;
  last_activity: string;
  provider: string;
  avatar: string;
  is_active: boolean;
  raw: User; // Full raw user object from Supabase
}

interface ActiveUsersData {
  active_users: ActiveUser[];
  total_count: number;
  query_window_hours: number;
  active_window_minutes: number;
}

export default function ActiveUsers() {
  const [activeUsersData, setActiveUsersData] = useState<ActiveUsersData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [newUserIds, setNewUserIds] = useState<Set<string>>(new Set());

  const fetchActiveUsers = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setIsLoading(true);
      }
      setHasError(false);

      const response = await fetch('/api/analytics/active-users');
      const data = await response.json();

      if (!data.success || !data.data) {
        setHasError(true);
        return;
      }

      // Check for new users (compare with existing data)
      if (activeUsersData && activeUsersData.active_users) {
        const existingUserIds = new Set(activeUsersData.active_users.map(u => u.user_id));
        const incomingUsers = data.data.active_users as ActiveUser[];
        const incomingUserIds = new Set(incomingUsers.map(u => u.user_id));

        // Find new user IDs
        const newIds = new Set<string>();
        Array.from(incomingUserIds).forEach((id) => {
          if (!existingUserIds.has(id)) {
            newIds.add(id);
          }
        });

        if (newIds.size > 0) {
          setNewUserIds(newIds);
          // Clear the new IDs after animation completes (1 second)
          setTimeout(() => {
            setNewUserIds(new Set());
          }, 1000);
        }
      }

      setActiveUsersData(data.data);
    } catch {
      setHasError(true);
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      }
    }
  }, [activeUsersData]);

  useEffect(() => {
    // Initial load
    fetchActiveUsers(true);

    // Auto-refresh every 3 seconds for real-time data (silent updates)
    const intervalId = setInterval(() => {
      fetchActiveUsers(false);
    }, 3000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Format time ago
  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    // Ensure timestamp is treated as UTC by adding 'Z' if not present
    const utcTimestamp = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
    const activityTime = new Date(utcTimestamp);
    const diffInSeconds = Math.floor((now.getTime() - activityTime.getTime()) / 1000);

    if (diffInSeconds < 0) {
      return 'just now';
    } else if (diffInSeconds < 10) {
      return 'just now';
    } else if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
  };

  // Calculate count of currently active users (last 5 min)
  const activeCount = activeUsersData?.active_users.filter(user => user.is_active).length || 0;
  const [prevCount, setPrevCount] = React.useState(activeCount);
  const [countAnimation, setCountAnimation] = React.useState<'up' | 'down' | null>(null);

  // Animate count changes
  React.useEffect(() => {
    if (activeCount !== prevCount && prevCount !== 0) {
      setCountAnimation(activeCount > prevCount ? 'up' : 'down');
      setTimeout(() => setCountAnimation(null), 600);
    }
    setPrevCount(activeCount);
  }, [activeCount, prevCount]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Active Users
          </h3>
          <div className="h-6 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
        </div>

        <div className="space-y-3">
          {[1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30"
            >
              {/* Avatar Skeleton */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
              </div>

              {/* User Info Skeleton */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* Name skeleton */}
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                {/* Email skeleton */}
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
              </div>

              {/* Last Activity Skeleton */}
              <div className="flex-shrink-0 text-right space-y-2">
                {/* Label skeleton */}
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                {/* Time skeleton */}
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Active Users
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300 font-medium">Unable to Load Data</p>
            <p className="text-sm opacity-75 text-gray-500 dark:text-gray-400">There was an issue fetching active users</p>
          </div>
          <button
            onClick={() => fetchActiveUsers(false)}
            className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Active Users
        </h3>
        <span
          className={`text-sm bg-brand-50 text-brand-600 py-0.5 px-2 rounded-full dark:bg-brand-500/15 dark:text-white transition-all duration-300 ${
            countAnimation === 'up' ? 'animate-countUp' : countAnimation === 'down' ? 'animate-countDown' : ''
          }`}
        >
          {activeCount}
        </span>
      </div>

      {!activeUsersData || activeUsersData.active_users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <svg
            className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <p className="text-gray-600 dark:text-gray-300 font-medium">No Active Users</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            No users are currently active
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
          {activeUsersData.active_users.map((user) => {
            const isNewUser = newUserIds.has(user.user_id);
            return (
              <div
                key={user.user_id}
                className={`flex items-start gap-4 p-3.5 rounded-xl border transition-all ${
                  isNewUser
                    ? 'animate-slideIn bg-brand-50/50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-700'
                    : 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 hover:border-brand-200 dark:hover:border-brand-700'
                }`}
              >
              {/* User Avatar with Active Indicator */}
              <div className="flex-shrink-0 relative">
                <div className="relative w-10 h-10 overflow-hidden rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                {/* Active indicator - green dot if active in last 5 min */}
                {user.is_active && (
                  <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900 animate-pulse"></span>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate mb-1">
                  {user.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.user_email}
                </p>
              </div>

              {/* Last Activity Time */}
              <div className="flex-shrink-0 text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Last seen
                </div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {getTimeAgo(user.last_activity)}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
