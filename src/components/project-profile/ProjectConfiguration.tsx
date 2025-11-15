"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectData {
  services: string[];
  industries: string[];
  languages: string[];
  age_groups: string[];
  locations: string[];
  gender: string;
}

interface ProjectConfigurationProps {
  projectData?: ProjectData;
  onProjectUpdated?: () => void;
}

export default function ProjectConfiguration({ projectData }: ProjectConfigurationProps) {
  if (!projectData) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  const renderBadges = (items: string[], emptyText = "Not specified") => {
    if (!items || items.length === 0) {
      return <span className="text-sm text-gray-400">{emptyText}</span>;
    }
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <span
            key={idx}
            className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            {item}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Target Audience
      </h3>

      <div className="space-y-6">
        {/* Services */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Services
          </label>
          {renderBadges(projectData.services)}
        </div>


        {/* Languages */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Languages
          </label>
          {renderBadges(projectData.languages)}
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Gender
          </label>
          <span className="text-sm text-gray-900 dark:text-white capitalize">
            {projectData.gender || "Any"}
          </span>
        </div>

        {/* Age Groups */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Age Groups
          </label>
          {renderBadges(projectData.age_groups)}
        </div>

        {/* Locations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Locations
          </label>
          {renderBadges(projectData.locations)}
        </div>
      </div>
    </div>
  );
}
