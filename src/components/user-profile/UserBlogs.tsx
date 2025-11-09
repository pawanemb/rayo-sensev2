"use client";

import React from "react";

export default function UserBlogs() {
  const blogs = [
    { title: "Getting Started with Next.js", date: "Jan 10, 2025", views: 1234 },
    { title: "Understanding React Hooks", date: "Jan 8, 2025", views: 856 },
    { title: "Tailwind CSS Best Practices", date: "Jan 5, 2025", views: 2341 },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
        Blog Posts
      </h2>
      <div className="space-y-4">
        {blogs.map((blog, index) => (
          <div key={index} className="border-b border-gray-100 pb-4 last:border-0 dark:border-gray-800">
            <h3 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">{blog.title}</h3>
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span>{blog.date}</span>
              <span>•</span>
              <span>{blog.views.toLocaleString()} views</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
