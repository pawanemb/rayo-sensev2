"use client";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { useState, useEffect } from "react";
import { getUserAvatar } from "@/lib/users/avatar";

// Define interfaces
interface Project {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  user_avatar: string | null;
  title: string;
  status: string;
  created_at: string;
}

interface Blog {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  user_avatar: string | null;
  title: string;
  status: string;
  created_at: string;
}

export default function RecentActivity() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [activeTab, setActiveTab] = useState<'projects' | 'blogs'>('projects');
  const itemsToShow = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch projects
        const projectsResponse = await fetch('/api/projects/recent');
        const projectsData = await projectsResponse.json();

        // Fetch blogs
        const blogsResponse = await fetch('/api/blogs/recent');
        const blogsData = await blogsResponse.json();

        if (projectsData.success && projectsData.projects) {
          setProjects(projectsData.projects.slice(0, itemsToShow));
        }

        if (blogsData.success && blogsData.blogs) {
          setBlogs(blogsData.blogs.slice(0, itemsToShow));
        }

        if (!projectsData.success && !blogsData.success) {
          setHasError(true);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return { date: dateStr, time: timeStr };
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'active': 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
      'inactive': 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400',
      'completed': 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
      'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
      'pending': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
      'published': 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
      'draft': 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status.toLowerCase()] || 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400'}`}>
        {status}
      </span>
    );
  };

  const currentData = activeTab === 'projects' ? projects : blogs;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Activity
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'projects'
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Projects
          </button>
          <button
            onClick={() => setActiveTab('blogs')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'blogs'
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Blogs
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="max-w-full overflow-x-auto min-h-[380px]">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell isHeader className="py-3 pr-8 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  User
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Title
                </TableCell>
                <TableCell isHeader className="py-3 pr-8 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Status
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Created
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {[...Array(4)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="py-3 pr-8">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                      <div className="flex flex-col gap-2">
                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell className="py-3 pr-8">
                    <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex flex-col gap-2">
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : hasError ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Failed to load data</p>
        </div>
      ) : currentData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No {activeTab} found
          </p>
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto min-h-[380px]">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell isHeader className="py-3 pr-8 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  User
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Title
                </TableCell>
                <TableCell isHeader className="py-3 pr-8 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Status
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Created
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {currentData.map((item) => {
                const formattedDateTime = formatDate(item.created_at);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="py-3 pr-8">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 overflow-hidden rounded-full border border-gray-100 dark:border-gray-700">
                          <Image
                            src={getUserAvatar(item.user_id, item.user_avatar)}
                            alt={item.user_name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {item.user_name}
                          </p>
                          <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                            {item.user_email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-gray-600 text-theme-sm dark:text-gray-300">
                      {item.title}
                    </TableCell>
                    <TableCell className="py-3 pr-8">
                      {getStatusBadge(item.status)}
                    </TableCell>
                    <TableCell className="py-3">
                      <div>
                        <p className="text-gray-800 text-theme-sm dark:text-white/90">
                          {formattedDateTime.date}
                        </p>
                        <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                          {formattedDateTime.time}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
