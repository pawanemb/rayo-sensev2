"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaCopy } from "react-icons/fa";
import { FaWordpress } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { MdDelete } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { SiShopify } from "react-icons/si";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Modal } from "@/components/ui/modal";

interface Project {
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
  cms_config?: {
    shopify?: { connected: boolean };
    wordpress?: { connected: boolean };
  } | null;
  gsc_connected?: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar: string;
  };
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalProjects: number | null;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalProjects: null,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<{ id: string; name: string; currentStatus: boolean } | null>(null);

  const openConfirmModal = (projectId: string, projectName: string, currentStatus: boolean) => {
    setSelectedProject({ id: projectId, name: projectName, currentStatus });
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setSelectedProject(null);
  };

  const handleConfirmToggle = async () => {
    if (!selectedProject || togglingStatus) return;

    const { id: projectId, currentStatus } = selectedProject;
    const newStatus = !currentStatus;
    const action = newStatus ? 'activate' : 'deactivate';

    setTogglingStatus(projectId);
    closeConfirmModal();
    try {
      const response = await fetch(`/api/projects/${projectId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} project`);
      }

      // Refresh the projects list
      await fetchProjects(pagination.currentPage, searchTerm, pagination.limit);
    } catch (err) {
      console.error(`Failed to ${action} project:`, err);
      alert(err instanceof Error ? err.message : `Failed to ${action} project`);
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleCopyId = async (projectId: string) => {
    try {
      await navigator.clipboard.writeText(projectId);
      setCopiedId(projectId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy ID:', err);
    }
  };

  const fetchProjects = useCallback(
    async (page = 1, search = "", limit = 10) => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/projects?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
        if (!response.ok) throw new Error("Failed to load projects");
        const data = await response.json();
        setProjects(data.projects || []);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load projects");
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchProjects(1, "", pagination.limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearchTerm(searchInput);
      fetchProjects(1, searchInput, pagination.limit);
    }, 500);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handlePageChange = (target: number) => {
    const totalPages = pagination.totalPages || 1;
    if (target < 1 || target > totalPages || target === pagination.currentPage) return;
    fetchProjects(target, searchTerm, pagination.limit);
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
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

  const getCMSIcons = (cmsConfig: Project['cms_config'], gscConnected?: boolean) => {
    const shopifyConnected = cmsConfig?.shopify?.connected;
    const wordpressConnected = cmsConfig?.wordpress?.connected;
    const hasAnyCMS = shopifyConnected || wordpressConnected;

    return (
      <div className="flex items-center gap-2">
        {/* CMS Icon - Shopify, WordPress, or Cross */}
        {shopifyConnected ? (
          <div className="relative group" title="Shopify Connected">
            <SiShopify className="h-5 w-5 text-[#96bf48]" />
          </div>
        ) : wordpressConnected ? (
          <div className="relative group" title="WordPress Connected">
            <FaWordpress className="h-5 w-5 text-[#21759b]" />
          </div>
        ) : (
          <div className="relative group" title="No CMS Connected">
            <RxCross2 className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
        )}

        {/* GSC Icon - Only show if any CMS is connected */}
        {hasAnyCMS && (
          <div className="relative group" title={gscConnected ? "Google Search Console Connected" : "Google Search Console Not Connected"}>
            <FcGoogle className={`h-5 w-5 ${!gscConnected && 'opacity-30 grayscale'}`} />
          </div>
        )}
      </div>
    );
  };

  const pageNumbers = (() => {
    const totalPages = pagination.totalPages || 1;
    const current = pagination.currentPage;
    const range = 2;
    const numbers: number[] = [];
    
    const start = Math.max(1, current - range);
    const end = Math.min(totalPages, current + range);
    
    for (let i = start; i <= end; i++) {
      numbers.push(i);
    }
    
    if (!numbers.includes(1)) {
      numbers.unshift(1);
    }
    
    if (!numbers.includes(totalPages) && totalPages > 1) {
      numbers.push(totalPages);
    }
    
    return [...new Set(numbers)].sort((a, b) => a - b);
  })();

  const totalProjects = pagination.totalProjects ?? null;
  const rangeStart = totalProjects
    ? (pagination.currentPage - 1) * pagination.limit + (projects.length > 0 ? 1 : 0)
    : null;
  const rangeEnd = totalProjects && rangeStart !== null ? Math.min(rangeStart + projects.length - 1, totalProjects) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Project Management
            {typeof pagination.totalProjects === "number" && (
              <span className="ml-3 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-600 dark:text-brand-300">
                {pagination.totalProjects.toLocaleString()} {searchTerm ? 'results' : 'projects'}
              </span>
            )}
          </h1>
          {searchTerm && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Search results for &quot;{searchTerm}&quot;
            </p>
          )}
        </div>
        <div className="relative">
          <input
            className="w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 pr-11 text-sm shadow-inner focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:w-64"
            placeholder="Search by name or URL..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-error-100 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-200">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[960px]">
            <Table>
              <TableHeader className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-white/5 dark:text-gray-400">
                <TableRow>
                  <TableCell className="px-5 py-4">Project</TableCell>
                  <TableCell className="px-5 py-4">Owner</TableCell>
                  <TableCell className="px-5 py-4">CMS</TableCell>
                  <TableCell className="px-5 py-4">Project ID</TableCell>
                  <TableCell className="px-5 py-4">Status</TableCell>
                  <TableCell className="px-5 py-4">Created</TableCell>
                  <TableCell className="px-5 py-4">Actions</TableCell>
                </TableRow>
              </TableHeader>
              {isLoading ? (
                <TableSkeleton rows={10} columns={7} />
              ) : (
                <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                  {projects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                        No projects found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    projects.map((project) => (
                      <TableRow 
                        key={project.id}
                        onClick={() => router.push(`/projects/${project.id}`)}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 overflow-hidden rounded border border-gray-100 dark:border-gray-700">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img 
                                src={`https://www.google.com/s2/favicons?domain=${new URL(project.url).hostname}&sz=64`}
                                alt={project.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="gray"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>';
                                }}
                              />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{project.name}</p>
                              <a 
                                href={project.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {project.url}
                              </a>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          {project.user ? (
                            <div className="flex items-center gap-3">
                              <div className="relative h-8 w-8 overflow-hidden rounded-full border border-gray-100 dark:border-gray-700">
                                <Image src={project.user.avatar} alt={project.user.name} fill sizes="32px" className="object-cover" />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{project.user.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{project.user.email}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          {getCMSIcons(project.cms_config, project.gsc_connected)}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-gray-600 dark:text-gray-300 font-mono">
                              {project.id.slice(0, 8)}...
                            </code>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyId(project.id);
                              }}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                              title={copiedId === project.id ? "Copied!" : "Copy full ID"}
                            >
                              {copiedId === project.id ? (
                                <svg className="h-3.5 w-3.5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <FaCopy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          {getStatusBadge(project.is_active)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {formatDateTime(project.created_at)}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openConfirmModal(project.id, project.name, project.is_active);
                              }}
                              disabled={togglingStatus === project.id}
                              className={`rounded-full border p-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                project.is_active
                                  ? 'border-gray-200 text-gray-500 hover:border-error-200 hover:text-error-600 dark:border-gray-700 dark:text-gray-300'
                                  : 'border-gray-200 text-gray-500 hover:border-success-200 hover:text-success-600 dark:border-gray-700 dark:text-gray-300'
                              }`}
                              title={project.is_active ? 'Deactivate project' : 'Activate project'}
                            >
                              {togglingStatus === project.id ? (
                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              ) : (
                                <MdDelete className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              )}
            </Table>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 text-sm text-gray-500 dark:border-white/5 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {rangeStart && rangeEnd && totalProjects
              ? `Showing ${rangeStart}–${rangeEnd} of ${totalProjects.toLocaleString()} projects`
              : `Showing ${projects.length} project${projects.length !== 1 ? 's' : ''} on page ${pagination.currentPage}`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="rounded-full border border-gray-200 px-3 py-1 text-sm disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700"
            >
              Prev
            </button>
            {pageNumbers.map((num) => (
              <button
                key={num}
                onClick={() => handlePageChange(num)}
                className={`rounded-full px-3 py-1 text-sm ${
                  num === pagination.currentPage
                    ? "bg-brand-500 text-white"
                    : "border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200"
                }`}
                disabled={num === pagination.currentPage}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="rounded-full border border-gray-200 px-3 py-1 text-sm disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={showConfirmModal} onClose={closeConfirmModal}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {selectedProject?.currentStatus ? 'Deactivate' : 'Activate'} Project
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Are you sure you want to {selectedProject?.currentStatus ? 'deactivate' : 'activate'} the project{' '}
            <span className="font-semibold text-gray-900 dark:text-white">&quot;{selectedProject?.name}&quot;</span>?
          </p>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={closeConfirmModal}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmToggle}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                selectedProject?.currentStatus
                  ? 'bg-error-600 hover:bg-error-700'
                  : 'bg-success-600 hover:bg-success-700'
              }`}
            >
              {selectedProject?.currentStatus ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
