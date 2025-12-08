"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaCopy } from "react-icons/fa";
import { MdDelete, MdRestore } from "react-icons/md";
import { generateAvatar } from "@/utils/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Modal } from "@/components/ui/modal";

interface Blog {
  _id: string;
  title: string;
  word_count: number | string | number[]; // Can be number, string, or array of numbers
  project_id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  status: string;
  is_active?: boolean;
  project_details?: {
    id: string;
    name: string;
    url: string;
    user_id: string;
  };
  user_details?: {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  showing: number;
}

// Helper function to get word count from various formats
const getWordCount = (wordCount: number | string | number[] | undefined): number => {
  if (!wordCount) return 0;

  if (Array.isArray(wordCount)) {
    // If array, get the latest (last) value
    return wordCount[wordCount.length - 1] || 0;
  } else if (typeof wordCount === 'string') {
    // If string, parse it
    return parseInt(wordCount) || 0;
  } else {
    // If number, use it directly
    return wordCount || 0;
  }
};

export default function BlogsList() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
    showing: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [processingBlog, setProcessingBlog] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<{
    id: string;
    title: string;
    action: 'delete' | 'restore';
    currentStatus: boolean;
  } | null>(null);

  const openConfirmModal = (blogId: string, blogTitle: string, action: 'delete' | 'restore', currentStatus: boolean) => {
    setSelectedBlog({ id: blogId, title: blogTitle, action, currentStatus });
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setSelectedBlog(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedBlog || processingBlog) return;

    const { id: blogId, action } = selectedBlog;
    setProcessingBlog(blogId);
    closeConfirmModal();

    try {
      const endpoint = action === 'delete'
        ? `/api/blogs/${blogId}/delete`
        : `/api/blogs/${blogId}/restore`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} blog`);
      }

      // Refresh the blogs list
      await fetchBlogs(pagination.page, searchTerm, pagination.limit);
    } catch (err) {
      console.error(`Failed to ${action} blog:`, err);
      alert(err instanceof Error ? err.message : `Failed to ${action} blog`);
    } finally {
      setProcessingBlog(null);
    }
  };

  const handleCopyId = async (blogId: string) => {
    try {
      await navigator.clipboard.writeText(blogId);
      setCopiedId(blogId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy ID:', err);
    }
  };

  const fetchBlogs = useCallback(
    async (page = 1, search = "", limit = 10) => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(
          `/api/blogs/list?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
          { credentials: 'include' }
        );
        if (!response.ok) throw new Error("Failed to load blogs");
        const data = await response.json();
        setBlogs(data.data || []);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load blogs");
        setBlogs([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearchTerm(searchInput);
      fetchBlogs(1, searchInput, pagination.limit);
    }, 500);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handlePageChange = (target: number) => {
    const totalPages = pagination.totalPages || 1;
    if (target < 1 || target > totalPages || target === pagination.page) return;
    fetchBlogs(target, searchTerm, pagination.limit);
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

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      completed: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
      'in progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      failed: 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400',
      creating: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
      pending: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };

    const colorClass = statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
        {status || 'Unknown'}
      </span>
    );
  };

  const getActiveBadge = (isActive?: boolean) => {
    if (isActive === false) {
      return (
        <span className="inline-flex items-center rounded-full bg-error-100 px-2.5 py-0.5 text-xs font-medium text-error-700 dark:bg-error-900/30 dark:text-error-400">
          Deleted
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-success-100 px-2.5 py-0.5 text-xs font-medium text-success-700 dark:bg-success-900/30 dark:text-success-400">
        Active
      </span>
    );
  };

  const pageNumbers = (() => {
    const totalPages = pagination.totalPages || 1;
    const current = pagination.page;
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

  const totalBlogs = pagination.total ?? 0;
  const rangeStart = totalBlogs
    ? (pagination.page - 1) * pagination.limit + (blogs.length > 0 ? 1 : 0)
    : 0;
  const rangeEnd = totalBlogs && rangeStart !== 0
    ? Math.min(rangeStart + blogs.length - 1, totalBlogs)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Blog Management
            {typeof pagination.total === "number" && (
              <span className="ml-3 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-600 dark:text-brand-300">
                {pagination.total.toLocaleString()} {searchTerm ? 'results' : 'blogs'}
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
            placeholder="Search blogs..."
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
          <div className="min-w-[1000px]">
            <Table>
              <TableHeader className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-white/5 dark:text-gray-400">
                <TableRow>
                  <TableCell className="px-5 py-4">Blog Title</TableCell>
                  <TableCell className="px-5 py-4">Project</TableCell>
                  <TableCell className="px-5 py-4">Owner</TableCell>
                  <TableCell className="px-5 py-4">Blog ID</TableCell>
                  <TableCell className="px-5 py-4">Created</TableCell>
                  <TableCell className="px-5 py-4">Actions</TableCell>
                </TableRow>
              </TableHeader>
              {isLoading ? (
                <TableSkeleton rows={10} columns={6} />
              ) : (
                <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                  {blogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                        {searchTerm ? 'No blogs found matching your search.' : 'No blogs found.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    blogs.map((blog) => (
                      <TableRow
                        key={blog._id}
                        onClick={() => router.push(`/blogs/${blog._id}`)}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <TableCell className="px-5 py-4">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
                              {blog.title}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                {getWordCount(blog.word_count).toLocaleString()} words
                              </span>
                              {getStatusBadge(blog.status)}
                              {getActiveBadge(blog.is_active)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          {blog.project_details ? (
                            <div className="flex items-center gap-3">
                              <div className="relative h-8 w-8 overflow-hidden rounded border border-gray-100 dark:border-gray-700">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(blog.project_details.url || '')}&sz=32`}
                                  alt={blog.project_details.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {blog.project_details.name}
                                </p>
                                {blog.project_details.url && (
                                  <a
                                    href={blog.project_details.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {blog.project_details.url.replace(/^https?:\/\//, '')}
                                  </a>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Unknown Project</span>
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          {blog.user_details ? (
                            <div className="flex items-center gap-3">
                              <div className="relative h-8 w-8 overflow-hidden rounded-full border border-gray-100 dark:border-gray-700">
                                <Image
                                  src={blog.user_details.avatar || generateAvatar(blog.user_details.name)}
                                  alt={blog.user_details.name}
                                  fill
                                  sizes="32px"
                                  className="object-cover"
                                />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {blog.user_details.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {blog.user_details.email}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Unknown User</span>
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-gray-600 dark:text-gray-300 font-mono">
                              {blog._id.slice(0, 8)}...
                            </code>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyId(blog._id);
                              }}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                              title={copiedId === blog._id ? "Copied!" : "Copy full ID"}
                            >
                              {copiedId === blog._id ? (
                                <svg className="h-3.5 w-3.5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <FaCopy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {formatDateTime(blog.created_at)}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {blog.is_active === false ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openConfirmModal(blog._id, blog.title, 'restore', false);
                                }}
                                disabled={processingBlog === blog._id}
                                className="rounded-full border border-gray-200 p-2 text-gray-500 hover:border-success-200 hover:text-success-600 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-300"
                                title="Restore blog"
                              >
                                {processingBlog === blog._id ? (
                                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                ) : (
                                  <MdRestore className="h-4 w-4" />
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openConfirmModal(blog._id, blog.title, 'delete', true);
                                }}
                                disabled={processingBlog === blog._id}
                                className="rounded-full border border-gray-200 p-2 text-gray-500 hover:border-error-200 hover:text-error-600 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-300"
                                title="Delete blog"
                              >
                                {processingBlog === blog._id ? (
                                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                ) : (
                                  <MdDelete className="h-4 w-4" />
                                )}
                              </button>
                            )}
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
            {rangeStart && rangeEnd && totalBlogs
              ? `Showing ${rangeStart}–${rangeEnd} of ${totalBlogs.toLocaleString()} blogs`
              : `Showing ${blogs.length} blog${blogs.length !== 1 ? 's' : ''} on page ${pagination.page}`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="rounded-full border border-gray-200 px-3 py-1 text-sm disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700"
            >
              Prev
            </button>
            {pageNumbers.map((num) => (
              <button
                key={num}
                onClick={() => handlePageChange(num)}
                className={`rounded-full px-3 py-1 text-sm ${
                  num === pagination.page
                    ? "bg-brand-500 text-white"
                    : "border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200"
                }`}
                disabled={num === pagination.page}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
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
            {selectedBlog?.action === 'delete' ? 'Delete' : 'Restore'} Blog
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Are you sure you want to {selectedBlog?.action} the blog{' '}
            <span className="font-semibold text-gray-900 dark:text-white">&quot;{selectedBlog?.title}&quot;</span>?
            {selectedBlog?.action === 'delete' && (
              <span className="block mt-2 text-xs text-gray-500">
                This will soft delete the blog. You can restore it later.
              </span>
            )}
          </p>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={closeConfirmModal}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAction}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                selectedBlog?.action === 'delete'
                  ? 'bg-error-600 hover:bg-error-700'
                  : 'bg-success-600 hover:bg-success-700'
              }`}
            >
              {selectedBlog?.action === 'delete' ? 'Delete' : 'Restore'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
