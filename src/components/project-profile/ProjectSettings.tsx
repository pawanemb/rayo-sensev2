"use client";

import React from "react";
import { FaToggleOn, FaToggleOff } from "react-icons/fa";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectData {
  feature_image_active: boolean;
  featured_image_style: string | null;
  person_tone: string | null;
  pinned: boolean;
  brand_tone_settings: any;
}

interface ProjectSettingsProps {
  projectData?: ProjectData;
  onProjectUpdated?: () => void;
}

export default function ProjectSettings({ projectData }: ProjectSettingsProps) {
  if (!projectData) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  const toggleItems = [
    {
      label: "Featured Image",
      value: projectData.feature_image_active,
      description: "Generate featured images for blogs",
    },
    {
      label: "Pinned",
      value: projectData.pinned,
      description: "Pin this project to the top of the list",
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Settings
      </h3>

      <div className="space-y-4">
        {/* Toggle Settings */}
        {toggleItems.map((item, idx) => (
          <div
            key={idx}
            className="flex items-start justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700"
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {item.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {item.description}
              </p>
            </div>
            <div className="flex-shrink-0 ml-4">
              {item.value ? (
                <FaToggleOn className="h-6 w-6 text-success-600" />
              ) : (
                <FaToggleOff className="h-6 w-6 text-gray-400" />
              )}
            </div>
          </div>
        ))}

        {/* Image Style */}
        {projectData.featured_image_style && (
          <div className="rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Featured Image Style
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {projectData.featured_image_style}
            </p>
          </div>
        )}

        {/* Person Tone */}
        {projectData.person_tone && (
          <div className="rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Person Tone
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
              {projectData.person_tone}
            </p>
          </div>
        )}

        {/* Brand Tone Settings */}
        {projectData.brand_tone_settings && (
          <div className="rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Brand Tone
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {Object.entries(projectData.brand_tone_settings).map(([key, value]) => (
                <div key={key} className="flex items-baseline">
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize mr-2">{key}:</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
