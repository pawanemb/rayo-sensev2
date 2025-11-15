"use client";

import React from "react";
import { FaFileAlt, FaEye, FaCalendarAlt, FaPencilAlt } from "react-icons/fa";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectData {
  visitors: number;
  created_at: string;
  updated_at: string | null;
}

interface ProjectAnalyticsProps {
  projectData?: ProjectData;
  blogsCount?: number;
}

export default function ProjectAnalytics({ projectData, blogsCount = 0 }: ProjectAnalyticsProps) {
  if (!projectData) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  const getDaysActive = () => {
    const created = new Date(projectData.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysSinceUpdate = () => {
    if (!projectData.updated_at) return null;
    const updated = new Date(projectData.updated_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - updated.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const stats = [
    {
      icon: FaEye,
      label: "Visitors",
      value: (projectData.visitors || 0).toLocaleString(),
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      icon: FaFileAlt,
      label: "Total Blogs",
      value: blogsCount.toLocaleString(),
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      icon: FaCalendarAlt,
      label: "Days Active",
      value: getDaysActive().toLocaleString(),
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
  ];

  const daysSinceUpdate = getDaysSinceUpdate();

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Analytics
      </h3>

      <div className="space-y-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="flex items-center gap-4 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {stat.label}
              </p>
              <p className="mt-0.5 text-lg font-semibold text-gray-900 dark:text-white">
                {stat.value}
              </p>
            </div>
          </div>
        ))}

        {/* Last Activity */}
        {daysSinceUpdate !== null && (
          <div className="flex items-center gap-4 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <FaPencilAlt className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Last Updated
              </p>
              <p className="mt-0.5 text-lg font-semibold text-gray-900 dark:text-white">
                {daysSinceUpdate === 0 ? "Today" : `${daysSinceUpdate}d ago`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
