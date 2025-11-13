"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaPen, FaEye } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getBlogs,
  deleteBlog,
  type BlogPost,
  type BlogPaginationInfo,
} from "@/services/blogService";
import { TableSkeleton } from "@/components/ui/table-skeleton";

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  // Format: "Jan 15, 2025, 2:30:45 PM"
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

const getStatusBadge = (status: string) => {
  const statusClasses: Record<string, string> = {
    completed: "bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-300",
    creating: "bg-info-100 text-info-700 dark:bg-info-500/20 dark:text-info-300",
    failed: "bg-error-100 text-error-700 dark:bg-error-500/20 dark:text-error-300",
    draft: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        statusClasses[status] || statusClasses.draft
      }`}
    >
      {status}
    </span>
  );
};

export default function BlogList() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [pagination, setPagination] = useState<BlogPaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
    showing: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [blogToDelete, setBlogToDelete] = useState<BlogPost | null>(null);

  const fetchBlogs = useCallback(
    async (page = 1, search = "", limit = 10, sort = "created_at", order: "asc" | "desc" = "desc") => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getBlogs({ page, limit, search, sort, order });
        setBlogs(response.data);
        setPagination(response.pagination);
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
      fetchBlogs(1, searchInput, pagination.limit, sortField, sortOrder);
    }, 500);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handleDeleteBlog = async () => {
    if (!blogToDelete) return;
    setActionLoading(true);
    try {
      await deleteBlog(blogToDelete._id);
      setBlogToDelete(null);
      const nextPage =
        blogs.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page;
      fetchBlogs(nextPage, searchTerm, pagination.limit, sortField, sortOrder);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete blog");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePageChange = (target: number) => {
    const totalPages = pagination.totalPages || 1;
    if (target < 1 || target > totalPages || target === pagination.page) return;
    fetchBlogs(target, searchTerm, pagination.limit, sortField, sortOrder);
  };

  const handleSort = (field: string) => {
    const newOrder = sortField === field && sortOrder === "desc" ? "asc" : "desc";
    setSortField(field);
    setSortOrder(newOrder);
    fetchBlogs(pagination.page, searchTerm, pagination.limit, field, newOrder);
  };

  // Generate page numbers for pagination
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

  const total = pagination.total;
  const rangeStart = total
    ? (pagination.page - 1) * pagination.limit + (blogs.length > 0 ? 1 : 0)
    : null;
  const rangeEnd = total && rangeStart !== null ? Math.min(rangeStart + blogs.length - 1, total) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Blog Management
            {typeof pagination.total === "number" && (
              <span className="ml-3 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-600 dark:text-brand-300">
                {pagination.total.toLocaleString()} {searchTerm ? "results" : "blogs"}
              </span>
            )}
          </h1>
          {searchTerm && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Search results for &quot;{searchTerm}&quot;
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <input
              className="w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 pr-11 text-sm shadow-inner focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:w-64"
              placeholder="Search blogs, title, or status..."
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
      </div>

      {error && (
        <div className="rounded-2xl border border-error-100 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-200">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1200px]">
            <Table>
              <TableHeader className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-white/5 dark:text-gray-400">
                <TableRow>
                  <TableCell className="px-5 py-4">
                    <button
                      onClick={() => handleSort("title")}
                      className="flex items-center gap-1 hover:text-brand-600"
                    >
                      Title
                      {sortField === "title" && (
                        <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="px-5 py-4">Project</TableCell>
                  <TableCell className="px-5 py-4">Author</TableCell>
                  <TableCell className="px-5 py-4">
                    <button
                      onClick={() => handleSort("word_count")}
                      className="flex items-center gap-1 hover:text-brand-600"
                    >
                      Words
                      {sortField === "word_count" && (
                        <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <button
                      onClick={() => handleSort("status")}
                      className="flex items-center gap-1 hover:text-brand-600"
                    >
                      Status
                      {sortField === "status" && (
                        <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <button
                      onClick={() => handleSort("created_at")}
                      className="flex items-center gap-1 hover:text-brand-600"
                    >
                      Created
                      {sortField === "created_at" && (
                        <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <button
                      onClick={() => handleSort("updated_at")}
                      className="flex items-center gap-1 hover:text-brand-600"
                    >
                      Updated
                      {sortField === "updated_at" && (
                        <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="px-5 py-4">Actions</TableCell>
                </TableRow>
              </TableHeader>
              {isLoading ? (
                <TableSkeleton rows={10} columns={8} />
              ) : (
                <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                  {blogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                        No blogs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    blogs.map((blog) => (
                      <TableRow
                        key={blog._id}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        onClick={() => router.push(`/blogs/${blog._id}`)}
                      >
                        <TableCell className="px-5 py-4">
                          <div className="max-w-xs">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {blog.title || "Untitled"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <div className="max-w-xs">
                            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                              {blog.project_details?.name || "Unknown"}
                            </p>
                            {blog.project_details?.url && (
                              <p className="text-xs text-gray-400 truncate">
                                {blog.project_details.url}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {blog.user_details?.avatar && (
                              <div className="relative h-8 w-8 overflow-hidden rounded-full border border-gray-100 dark:border-gray-700">
                                <Image
                                  src={blog.user_details.avatar}
                                  alt={blog.user_details.name}
                                  fill
                                  sizes="32px"
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div>
                              <p className="text-sm text-gray-900 dark:text-white">
                                {blog.user_details?.name || "Unknown"}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {blog.user_details?.email || ""}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {blog.word_count?.toLocaleString() || "—"}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          {getStatusBadge(blog.status)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {formatDateTime(blog.created_at)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {formatDateTime(blog.updated_at)}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/blogs/${blog._id}`);
                              }}
                              className="rounded-full border border-gray-200 p-2 text-gray-500 hover:border-brand-200 hover:text-brand-600 dark:border-gray-700 dark:text-gray-300"
                              title="View blog"
                            >
                              <FaEye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setBlogToDelete(blog);
                              }}
                              className="rounded-full border border-gray-200 p-2 text-gray-500 hover:border-error-200 hover:text-error-600 dark:border-gray-700 dark:text-gray-300"
                              title="Delete blog"
                            >
                              <MdDelete className="h-4 w-4" />
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
            {rangeStart && rangeEnd && total
              ? `Showing ${rangeStart}–${rangeEnd} of ${total.toLocaleString()} blogs`
              : `Showing ${blogs.length} blog${blogs.length !== 1 ? "s" : ""} on page ${pagination.page}`}
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

      {/* Delete Confirmation Modal */}
      {blogToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Delete Blog</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete &quot;{blogToDelete.title}&quot;? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setBlogToDelete(null)}
                disabled={actionLoading}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBlog}
                disabled={actionLoading}
                className="rounded-full bg-error-600 px-4 py-2 text-sm font-medium text-white hover:bg-error-700 disabled:opacity-50"
              >
                {actionLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
