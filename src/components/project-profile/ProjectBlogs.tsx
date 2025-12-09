"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FaFileAlt, FaArrowRight } from "react-icons/fa";

interface BlogRecord {
  _id: string;
  title: string;
  status: string;
  word_count: number;
  created_at: string;
}

interface ProjectBlogsProps {
  projectId: string;
  blogsCount?: number;
  recentBlogs?: BlogRecord[];
}

export default function ProjectBlogs({ projectId, blogsCount = 0, recentBlogs = [] }: ProjectBlogsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [blogs, setBlogs] = useState(recentBlogs);
  const [isLoading, setIsLoading] = useState(false);
  const limit = 5;
  const totalPages = Math.ceil(blogsCount / limit);

  // Update blogs when prop changes
  React.useEffect(() => {
    setBlogs(recentBlogs);
  }, [recentBlogs]);

  const fetchBlogs = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}?page=${page}&limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        setBlogs(data.recentBlogs || []);
        setCurrentPage(page);
      } else {
        console.error('Failed to fetch blogs:', response.status, response.statusText);
        setBlogs([]);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
      setBlogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || "";
    if (statusLower === "completed") return "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400";
    if (statusLower === "in progress") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    if (statusLower === "failed") return "bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400";
    return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Blogs
          </h3>
          <span className="inline-flex items-center rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-semibold text-brand-600 dark:text-brand-300">
            {blogsCount}
          </span>
        </div>
      </div>

      {blogs.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <FaFileAlt className="h-6 w-6 text-gray-400" />
          </div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            No blogs found for this project
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Blogs will appear here once created
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {blogs.map((blog) => (
              <Link
                key={blog._id}
                href={`/blogs/${blog._id}`}
              className="block rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                    {blog.title}
                  </p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(blog.status)}`}>
                      {blog.status}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {(blog.word_count || 0).toLocaleString()} words
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(blog.created_at)}
                    </span>
                  </div>
                </div>
                <FaArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              onClick={() => fetchBlogs(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              className="rounded-full border border-gray-200 px-3 py-1 text-sm disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700"
            >
              Prev
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => fetchBlogs(currentPage + 1)}
              disabled={currentPage === totalPages || isLoading}
              className="rounded-full border border-gray-200 px-3 py-1 text-sm disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700"
            >
              Next
            </button>
          </div>
        )}
        </>
      )}
    </div>
  );
}
