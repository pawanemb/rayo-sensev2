"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaCopy, FaCheckCircle, FaTimesCircle, FaPen, FaExternalLinkAlt, FaWordpress, FaUser } from "react-icons/fa";
import { SiShopify } from "react-icons/si";
import { FcGoogle } from "react-icons/fc";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectData {
  id: string;
  name: string;
  url: string;
  brand_name: string | null;
  services: string[];
  industries: string[];
  gender: string;
  languages: string[];
  age_groups: string[];
  locations: string[];
  business_type: string | null;
  is_active: boolean;
  visitors: number;
  created_at: string;
  updated_at: string | null;
  user_id: string;
  cms_config: unknown;
  gsc_connected?: boolean;
  background_image: string | null;
  brand_tone_settings: unknown;
  featured_image_style: string | null;
  feature_image_active: boolean;
  pinned: boolean;
  internal_linking_enabled: boolean;
  person_tone: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar: string;
  };
}

interface ProjectInformationProps {
  projectId: string;
  projectData?: ProjectData;
  projectInformation?: {
    id: string;
    name: string;
    url: string;
    brand_name: string | null;
    visitors: number;
    is_active: boolean;
    created_at: string;
    updated_at: string | null;
  };
  onProjectUpdated?: () => void;
}

export default function ProjectInformation({
  projectData,
}: ProjectInformationProps) {
  const [copiedId, setCopiedId] = useState(false);

  if (!projectData) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <Skeleton className="h-16 w-16 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    );
  }

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(projectData.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch (err) {
      console.error("Failed to copy ID:", err);
    }
  };

  const getCMSIcons = () => {
    const icons = [];
    const cmsConfig = projectData.cms_config as { shopify?: { connected: boolean }; wordpress?: { connected: boolean } } | null;
    if (cmsConfig?.shopify?.connected) {
      icons.push(
        <div key="shopify" className="flex items-center gap-1" title="Shopify Connected">
          <SiShopify className="h-4 w-4 text-[#96bf48]" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Shopify</span>
        </div>
      );
    }
    if (cmsConfig?.wordpress?.connected) {
      icons.push(
        <div key="wordpress" className="flex items-center gap-1" title="WordPress Connected">
          <FaWordpress className="h-4 w-4 text-[#21759b]" />
          <span className="text-xs text-gray-600 dark:text-gray-400">WordPress</span>
        </div>
      );
    }
    if (projectData.gsc_connected) {
      icons.push(
        <div key="gsc" className="flex items-center gap-1" title="Google Search Console">
          <FcGoogle className="h-4 w-4" />
          <span className="text-xs text-gray-600 dark:text-gray-400">GSC</span>
        </div>
      );
    }
    return icons.length > 0 ? icons : <span className="text-xs text-gray-400">No CMS connected</span>;
  };

  const userName = projectData.user?.name || projectData.user?.email || "Unknown";
  const userAvatar = projectData.user?.avatar;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Basic Information */}
        <div className="flex gap-4">
          {/* Project Favicon/Icon */}
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 border-gray-100 dark:border-gray-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(projectData.url)}&sz=64`}
              alt={projectData.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="gray"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>';
              }}
            />
          </div>

          {/* Basic Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                {projectData.name}
              </h2>
              {projectData.pinned && (
                <span className="inline-flex items-center rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-medium text-brand-600 dark:text-brand-400">
                  Pinned
                </span>
              )}
            </div>

            {projectData.brand_name && (
              <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                {projectData.brand_name}
              </p>
            )}

            <a
              href={projectData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 hover:underline"
            >
              {projectData.url.replace(/^https?:\/\//, "")}
              <FaExternalLinkAlt className="h-3 w-3" />
            </a>

            <div className="mt-2 flex items-center gap-2">
              <code className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate">
                {projectData.id.slice(0, 24)}...
              </code>
              <button
                onClick={handleCopyId}
                className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                title={copiedId ? "Copied!" : "Copy ID"}
              >
                {copiedId ? (
                  <svg
                    className="h-3.5 w-3.5 text-success-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <FaCopy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {/* Basic Details Grid - 3 columns */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
              {/* CMS */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  CMS
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {getCMSIcons()}
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Status
                </p>
                <div className="mt-1 flex items-center gap-1">
                  {projectData.is_active ? (
                    <>
                      <FaCheckCircle className="h-4 w-4 text-success-600" />
                      <span className="text-sm text-gray-900 dark:text-white">Active</span>
                    </>
                  ) : (
                    <>
                      <FaTimesCircle className="h-4 w-4 text-error-600" />
                      <span className="text-sm text-gray-900 dark:text-white">Inactive</span>
                    </>
                  )}
                </div>
              </div>

              {/* Created */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Created
                </p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatDateTime(projectData.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Additional Details */}
        <div className="space-y-4">
          {/* Owner Information */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Project Owner
            </p>
            <Link
              href={`/user/${projectData.user_id}`}
              className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="relative h-8 w-8 overflow-hidden rounded-full border border-gray-100 dark:border-gray-700">
                {userAvatar ? (
                  <Image
                    src={userAvatar}
                    alt={userName}
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-brand-100 dark:bg-brand-900">
                    <FaUser className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {userName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {projectData.user?.email}
                </p>
              </div>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
          </div>

          {/* Last Updated */}
          {projectData.updated_at && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Last updated: {formatDateTime(projectData.updated_at)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
