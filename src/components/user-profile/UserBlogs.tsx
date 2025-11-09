"use client";

import React, { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface UserBlogsProps {
  userId: string;
}

export default function UserBlogs({ userId }: UserBlogsProps) {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [totalBlogs, setTotalBlogs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const blogsPerPage = 5;

  const fetchBlogs = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/blogs?page=${page}&limit=${blogsPerPage}`);
      if (response.ok) {
        const data = await response.json();
        
        // Fetch project names for all blogs
        const blogsWithProjects = await Promise.all(
          (data.blogs || []).map(async (blog: any) => {
            if (blog.project_id) {
              try {
                const projectRes = await fetch(`/api/projects/${blog.project_id}`);
                if (projectRes.ok) {
                  const projectData = await projectRes.json();
                  return { 
                    ...blog, 
                    projectName: projectData.name,
                    projectUrl: projectData.url 
                  };
                }
              } catch (err) {
                console.error('Failed to fetch project:', err);
              }
            }
            return { ...blog, projectName: null, projectUrl: null };
          })
        );
        
        setBlogs(blogsWithProjects);
        setTotalBlogs(data.totalBlogs || 0);
        setCurrentPage(data.currentPage || 1);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch blogs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [userId]);

  const handleCopyId = async (blogId: string) => {
    try {
      await navigator.clipboard.writeText(blogId);
      setCopiedId(blogId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy ID:', err);
    }
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    
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

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
      published: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
      scheduled: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
    };
    
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[status] || statusColors.draft}`}>
        {status?.toUpperCase() || 'DRAFT'}
      </span>
    );
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    fetchBlogs(page);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Blog Posts
        </h2>
        <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
          {totalBlogs} {totalBlogs === 1 ? 'Post' : 'Posts'}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {/* Table Header Skeleton */}
          <div className="grid grid-cols-5 gap-4 border-b border-gray-200 pb-3 dark:border-gray-800">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
          {/* Table Rows Skeleton */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 border-b border-gray-100 py-3 dark:border-gray-800">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No blog posts found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Title
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Blog ID
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {blogs.map((blog) => (
                  <tr
                    key={blog._id}
                    className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                  >
                    <td className="py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {blog.title}
                        </p>
                        {blog.projectName && blog.projectUrl && (
                          <div className="flex items-center gap-2 mt-1 min-w-0">
                            <img 
                              src={`https://www.google.com/s2/favicons?domain=${new URL(blog.projectUrl).hostname}&sz=16`}
                              alt="" 
                              className="h-4 w-4 flex-shrink-0 rounded"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="gray"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>';
                              }}
                            />
                            <span className="text-xs text-gray-900 dark:text-white truncate">
                              {blog.projectName}
                            </span>
                            <span className="text-xs text-gray-400">-</span>
                            <a
                              href={blog.projectUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 hover:underline truncate"
                            >
                              {blog.projectUrl}
                            </a>
                            <span className="text-xs text-gray-400">-</span>
                            <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                              Wordcount: {blog.word_count ? blog.word_count.toLocaleString() : 'N/A'}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-gray-600 dark:text-gray-300 font-mono">
                          {blog._id.slice(0, 8)}...
                        </code>
                        <button
                          onClick={() => handleCopyId(blog._id)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                          title={copiedId === blog._id ? "Copied!" : "Copy full ID"}
                        >
                          {copiedId === blog._id ? (
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
                      {getStatusBadge(blog.status)}
                    </td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatDateTime(blog.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {((currentPage - 1) * blogsPerPage) + 1} to {Math.min(currentPage * blogsPerPage, totalBlogs)} of {totalBlogs} posts
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
                    const pages = [];
                    const maxVisible = 5;
                    
                    if (totalPages <= maxVisible + 2) {
                      // Show all pages if total is small
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      // Always show first page
                      pages.push(1);
                      
                      if (currentPage > 3) {
                        pages.push('...');
                      }
                      
                      // Show pages around current page
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
                      
                      // Always show last page
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
