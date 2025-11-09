"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaPen, FaCopy } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
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

  const getCMSIcons = (cmsConfig: Project['cms_config']) => {
    const shopifyConnected = cmsConfig?.shopify?.connected;
    const wordpressConnected = cmsConfig?.wordpress?.connected;

    return (
      <div className="flex items-center gap-2">
        {/* Shopify */}
        <div className="relative group" title={shopifyConnected ? 'Shopify Connected' : 'Shopify Not Connected'}>
          {shopifyConnected ? (
            <svg className="h-5 w-5 text-success-600 dark:text-success-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.373 4.618c-.073 0-.15.024-.227.048-.05-.122-.122-.27-.22-.417-.293-.44-.732-.66-1.27-.66-.025 0-.05 0-.074.024-1.05-1.44-2.93-1.1-3.54-.88-.196-.562-.562-.806-.83-.806h-.05c-.147-.172-.318-.245-.513-.245-.66 0-1.27.513-1.76 1.416-.342.635-.61 1.44-.66 2.1-.88.27-1.49.464-1.54.488-.464.147-.488.172-.537.61-.05.318-1.27 9.8-1.27 9.8l10.5 1.83 4.54-1.1s-2.1-14.1-2.15-14.2zm-3.1.88c-.22.073-.464.147-.732.22v-.172c0-.562-.073-1.05-.196-1.44.44.05.733.66.928 1.39zm-1.44-.44c.122.367.196.88.196 1.56v.098c-.562.172-1.17.367-1.78.562.172-.66.513-1.32.928-1.76.122-.122.27-.27.44-.367.05 0 .073-.024.122-.024.05 0 .073-.024.098-.024zm-.66-1.05c.098 0 .196.024.27.073-.196.122-.392.293-.586.513-.562.66-1.05 1.66-1.22 2.64-.513.147-1 .318-1.49.464.22-1.44 1.27-3.54 3.03-3.69z"/>
            </svg>
          ) : (
            <svg className="h-5 w-5 text-gray-300 dark:text-gray-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.373 4.618c-.073 0-.15.024-.227.048-.05-.122-.122-.27-.22-.417-.293-.44-.732-.66-1.27-.66-.025 0-.05 0-.074.024-1.05-1.44-2.93-1.1-3.54-.88-.196-.562-.562-.806-.83-.806h-.05c-.147-.172-.318-.245-.513-.245-.66 0-1.27.513-1.76 1.416-.342.635-.61 1.44-.66 2.1-.88.27-1.49.464-1.54.488-.464.147-.488.172-.537.61-.05.318-1.27 9.8-1.27 9.8l10.5 1.83 4.54-1.1s-2.1-14.1-2.15-14.2zm-3.1.88c-.22.073-.464.147-.732.22v-.172c0-.562-.073-1.05-.196-1.44.44.05.733.66.928 1.39zm-1.44-.44c.122.367.196.88.196 1.56v.098c-.562.172-1.17.367-1.78.562.172-.66.513-1.32.928-1.76.122-.122.27-.27.44-.367.05 0 .073-.024.122-.024.05 0 .073-.024.098-.024zm-.66-1.05c.098 0 .196.024.27.073-.196.122-.392.293-.586.513-.562.66-1.05 1.66-1.22 2.64-.513.147-1 .318-1.49.464.22-1.44 1.27-3.54 3.03-3.69z"/>
            </svg>
          )}
        </div>
        {/* WordPress */}
        <div className="relative group" title={wordpressConnected ? 'WordPress Connected' : 'WordPress Not Connected'}>
          {wordpressConnected ? (
            <svg className="h-5 w-5 text-success-600 dark:text-success-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.158 12.786L9.46 20.625c.806.237 1.657.366 2.54.366 1.047 0 2.051-.18 2.986-.51-.024-.037-.046-.078-.065-.123l-2.76-7.57zM3.008 12c0 3.56 2.07 6.634 5.068 8.092L3.788 8.342c-.5 1.117-.78 2.354-.78 3.658zm15.06-.454c0-1.112-.398-1.88-.74-2.48-.456-.74-.883-1.368-.883-2.11 0-.825.627-1.595 1.51-1.595.04 0 .078.006.116.008-1.598-1.464-3.73-2.36-6.07-2.36-3.14 0-5.904 1.613-7.512 4.053.21.007.41.01.58.01.94 0 2.395-.114 2.395-.114.484-.028.54.684.057.74 0 0-.487.058-1.03.086l3.275 9.74 1.968-5.902-1.4-3.838c-.485-.028-.944-.085-.944-.085-.486-.03-.43-.77.056-.742 0 0 1.484.114 2.368.114.94 0 2.397-.114 2.397-.114.486-.028.543.684.058.74 0 0-.488.058-1.03.086l3.25 9.665.897-2.996c.456-1.17.684-2.137.684-2.907zm1.82-3.86c.04.286.06.593.06.924 0 .912-.17 1.938-.683 3.22l-2.746 7.94c2.672-1.558 4.47-4.454 4.47-7.77 0-1.564-.4-3.033-1.1-4.314zM12 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
            </svg>
          ) : (
            <svg className="h-5 w-5 text-gray-300 dark:text-gray-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.158 12.786L9.46 20.625c.806.237 1.657.366 2.54.366 1.047 0 2.051-.18 2.986-.51-.024-.037-.046-.078-.065-.123l-2.76-7.57zM3.008 12c0 3.56 2.07 6.634 5.068 8.092L3.788 8.342c-.5 1.117-.78 2.354-.78 3.658zm15.06-.454c0-1.112-.398-1.88-.74-2.48-.456-.74-.883-1.368-.883-2.11 0-.825.627-1.595 1.51-1.595.04 0 .078.006.116.008-1.598-1.464-3.73-2.36-6.07-2.36-3.14 0-5.904 1.613-7.512 4.053.21.007.41.01.58.01.94 0 2.395-.114 2.395-.114.484-.028.54.684.057.74 0 0-.487.058-1.03.086l3.275 9.74 1.968-5.902-1.4-3.838c-.485-.028-.944-.085-.944-.085-.486-.03-.43-.77.056-.742 0 0 1.484.114 2.368.114.94 0 2.397-.114 2.397-.114.486-.028.543.684.058.74 0 0-.488.058-1.03.086l3.25 9.665.897-2.996c.456-1.17.684-2.137.684-2.907zm1.82-3.86c.04.286.06.593.06.924 0 .912-.17 1.938-.683 3.22l-2.746 7.94c2.672-1.558 4.47-4.454 4.47-7.77 0-1.564-.4-3.033-1.1-4.314zM12 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
            </svg>
          )}
        </div>
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
            placeholder="Search by name, URL, or ID..."
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
                          {getCMSIcons(project.cms_config)}
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
