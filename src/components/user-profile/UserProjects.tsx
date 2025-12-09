"use client";

import React, { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { FaWordpress } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { RxCross2 } from "react-icons/rx";
import { SiShopify } from "react-icons/si";

interface ProjectRecord {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  cms_config?: {
    shopify?: { connected: boolean };
    wordpress?: { connected: boolean };
  } | null;
  gsc_connected?: boolean;
}

interface UserProjectsProps {
  userId: string;
  projects?: ProjectRecord[];
  totalProjects?: number;
}

export default function UserProjects({ userId, projects, totalProjects = 0 }: UserProjectsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProjects, setCurrentProjects] = useState<ProjectRecord[]>(projects || []);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const projectsPerPage = 5;
  const totalPages = Math.ceil(totalProjects / projectsPerPage);

  const handleCopyId = async (projectId: string) => {
    try {
      await navigator.clipboard.writeText(projectId);
      setCopiedId(projectId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy ID:', err);
    }
  };

  React.useEffect(() => {
    setCurrentProjects(projects || []);
    setCurrentPage(1);
  }, [projects]);

  if (!projects) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="space-y-3">
          {/* Table Header Skeleton */}
          <div className="grid grid-cols-6 gap-4 border-b border-gray-200 pb-3 dark:border-gray-800">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
          {/* Table Rows Skeleton */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4 border-b border-gray-100 py-3 dark:border-gray-800">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    
    // Format: "Jan 15, 2025, 2:30:45 PM"
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center rounded-full bg-success-100 px-2.5 py-0.5 text-xs font-medium text-success-700 dark:bg-success-900/30 dark:text-success-400">
        Active
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-400">
        Inactive
      </span>
    );
  };

  const getCMSIcons = (cmsConfig: ProjectRecord['cms_config'], gscConnected?: boolean) => {
    const shopifyConnected = cmsConfig?.shopify?.connected;
    const wordpressConnected = cmsConfig?.wordpress?.connected;
    const hasAnyConnection = shopifyConnected || wordpressConnected || gscConnected;

    // If nothing is connected, show cross
    if (!hasAnyConnection) {
      return (
        <div className="relative group" title="No Connections">
          <RxCross2 className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
      );
    }

    // Show icons for whatever is connected
    return (
      <div className="flex items-center gap-2">
        {/* Shopify Icon */}
        {shopifyConnected && (
          <div className="relative group" title="Shopify Connected">
            <SiShopify className="h-5 w-5 text-[#96bf48]" />
          </div>
        )}

        {/* WordPress Icon */}
        {wordpressConnected && (
          <div className="relative group" title="WordPress Connected">
            <FaWordpress className="h-5 w-5 text-[#21759b]" />
          </div>
        )}

        {/* GSC Icon */}
        {gscConnected && (
          <div className="relative group" title="Google Search Console Connected">
            <FcGoogle className="h-5 w-5" />
          </div>
        )}
      </div>
    );
  };

  const handlePageChange = async (page: number) => {
    if (page === currentPage || page < 1 || page > totalPages) return;
    
    setIsLoading(true);
    try {
      const start = (page - 1) * projectsPerPage;
      const end = start + projectsPerPage - 1;
      
      const response = await fetch(`/api/users/${userId}/projects?start=${start}&end=${end}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentProjects(data.projects || []);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Projects
        </h2>
        <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
          {totalProjects} {totalProjects === 1 ? 'Project' : 'Projects'}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {/* Table Header Skeleton */}
          <div className="grid grid-cols-6 gap-4 border-b border-gray-200 pb-3 dark:border-gray-800">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
          {/* Table Rows Skeleton */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4 border-b border-gray-100 py-3 dark:border-gray-800">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      ) : currentProjects.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No projects found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Project
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Project ID
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    CMS
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Created
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentProjects.map((project) => {
                  const domain = new URL(project.url).hostname;
                  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
                  
                  return (
                    <tr
                      key={project.id}
                      className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                    >
                      <td className="py-3">
                        <div className="flex items-start gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={faviconUrl} 
                            alt="" 
                            className="mt-0.5 h-5 w-5 flex-shrink-0 rounded"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="gray"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {project.name}
                            </p>
                            <a
                              href={project.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 hover:underline truncate block"
                            >
                              {project.url}
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-gray-600 dark:text-gray-300 font-mono">
                            {project.id.slice(0, 8)}...
                          </code>
                          <button
                            onClick={() => handleCopyId(project.id)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                            title={copiedId === project.id ? "Copied!" : "Copy full ID"}
                          >
                            {copiedId === project.id ? (
                              <svg className="h-3.5 w-3.5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3">
                        {getCMSIcons(project.cms_config, project.gsc_connected)}
                      </td>
                      <td className="py-3">
                        {getStatusBadge(project.is_active)}
                      </td>
                      <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                        {formatDateTime(project.created_at)}
                      </td>
                      <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                        {formatDateTime(project.updated_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {((currentPage - 1) * projectsPerPage) + 1} to {Math.min(currentPage * projectsPerPage, totalProjects)} of {totalProjects} projects
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Previous
                </button>
                <div className="flex flex-wrap gap-1">
                  {(() => {
                    const pages: (number | string)[] = [];
                    const maxVisible = 5;
                    
                    if (totalPages <= maxVisible + 2) {
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      pages.push(1);
                      
                      if (currentPage > 3) {
                        pages.push('...');
                      }
                      
                      const start = Math.max(2, currentPage - 1);
                      const end = Math.min(totalPages - 1, currentPage + 1);
                      
                      for (let i = start; i <= end; i++) {
                        if (!pages.includes(i)) {
                          pages.push(i);
                        }
                      }
                      
                      if (currentPage < totalPages - 2) {
                        pages.push('...');
                      }
                      
                      if (!pages.includes(totalPages)) {
                        pages.push(totalPages);
                      }
                    }
                    
                    return pages.map((page, index) => {
                      if (page === '...') {
                        return (
                          <span
                            key={`ellipsis-${index}`}
                            className="flex items-center px-2 text-sm text-gray-500 dark:text-gray-400"
                          >
                            ...
                          </span>
                        );
                      }
                      
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page as number)}
                          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                            currentPage === page
                              ? 'bg-brand-600 text-white'
                              : 'border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    });
                  })()}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
