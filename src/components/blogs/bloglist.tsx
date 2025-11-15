"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaSort, FaSearch, FaTrash } from 'react-icons/fa';
import { generateAvatar } from "@/utils/avatar";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
interface Blog {
  _id: string;
  title: string;
  word_count: number;
  project_id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  status: string;
  is_active?: boolean; // Soft delete flag (true = active, false = deleted)
  deleted_at?: string; // When the blog was deleted
  deleted_by?: string; // Who deleted the blog
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
  [key: string]: unknown; // Allow string indexing for dynamic field access
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

interface ApiResponse {
  success: boolean;
  data: Blog[];
  pagination: PaginationInfo;
  meta: {
    search: string | null;
    sort: string;
    order: string;
    blogs_with_user_details: number;
    timestamp: string;
  };
}

export default function TotalBlogsOverview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('search') || "");
  const [sortField, setSortField] = useState(searchParams?.get('sort') || "created_at");
  const [sortDirection, setSortDirection] = useState(searchParams?.get('order') || "desc");
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams?.get('page') || '1', 10));
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedBlogs, setSelectedBlogs] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkRestoring, setBulkRestoring] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const blogsPerPage = 10;
  
  // Fetch blogs from API with pagination, search, and sorting
  const fetchBlogs = useCallback(async (page = 1, search = '', sort = 'created_at', order = 'desc') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: blogsPerPage.toString(),
        ...(search && { search }),
        sort,
        order
      });
      
      const response = await fetch(`/api/blogs/list?${params}`);
      const result: ApiResponse = await response.json();
      
      if (result.success && result.data) {
        setBlogs(result.data);
        setPagination(result.pagination);
        
        // Update URL parameters without causing a page reload
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('page', page.toString());
        if (search) {
          newUrl.searchParams.set('search', search);
        } else {
          newUrl.searchParams.delete('search');
        }
        newUrl.searchParams.set('sort', sort);
        newUrl.searchParams.set('order', order);
        
        window.history.replaceState({}, '', newUrl.toString());
      } else {
        console.error('Error fetching blogs:', result);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  }, [blogsPerPage]);

  // Initial load
  useEffect(() => {
    fetchBlogs(currentPage, searchQuery, sortField, sortDirection);
  }, [currentPage, fetchBlogs, searchQuery, sortField, sortDirection]);

  // Handle search with debouncing
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      setCurrentPage(1); // Reset to first page on search
      fetchBlogs(1, searchQuery, sortField, sortDirection);
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [searchQuery, fetchBlogs, sortField, sortDirection, searchTimeout]);

  // Since we're using server-side pagination, filtering, and sorting,
  // we use the data directly from the API response
  const currentBlogs = blogs;

  // Handle sort
  const handleSort = (field: string) => {
    const newDirection = field === sortField && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(newDirection);
    setCurrentPage(1); // Reset to first page when sorting changes
    fetchBlogs(1, searchQuery, field, newDirection);
  };

  // Navigate to blog detail page
  const navigateToBlog = (blogId: string) => {
    router.push(`/blogs/${blogId}`);
  };

  // Handle blog selection
  const toggleBlogSelection = (blogId: string) => {
    const newSelected = new Set(selectedBlogs);
    if (newSelected.has(blogId)) {
      newSelected.delete(blogId);
    } else {
      newSelected.add(blogId);
    }
    setSelectedBlogs(newSelected);
  };

  // Select all blogs
  const selectAllBlogs = () => {
    const allBlogIds = currentBlogs.map(blog => blog._id);
    setSelectedBlogs(new Set(allBlogIds));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedBlogs(new Set());
  };

  // Show delete modal
  const showDeleteConfirmation = () => {
    if (selectedBlogs.size === 0) {
      return;
    }
    setShowDeleteModal(true);
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    setShowDeleteModal(false);

    try {
      setBulkDeleting(true);
      
      // Delete blogs one by one
      const deletePromises = Array.from(selectedBlogs).map(blogId => 
        fetch(`/api/blogs/${blogId}/delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        })
      );

      await Promise.all(deletePromises);

      // Refresh the blogs list
      fetchBlogs(currentPage, searchQuery, sortField, sortDirection);
      
      // Clear selection
      clearSelection();
    } catch (error) {
      console.error('Error during bulk delete:', error);
    } finally {
      setBulkDeleting(false);
    }
  };

  // Show restore modal
  const showRestoreConfirmation = () => {
    if (selectedBlogs.size === 0) {
      return;
    }
    setShowRestoreModal(true);
  };

  // Handle bulk restore
  const handleBulkRestore = async () => {
    setShowRestoreModal(false);

    try {
      setBulkRestoring(true);
      
      // Restore blogs one by one
      const restorePromises = Array.from(selectedBlogs).map(blogId => 
        fetch(`/api/blogs/${blogId}/restore`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        })
      );

      await Promise.all(restorePromises);

      // Refresh the blogs list
      fetchBlogs(currentPage, searchQuery, sortField, sortDirection);
      
      // Clear selection
      clearSelection();
    } catch (error) {
      console.error('Error during bulk restore:', error);
    } finally {
      setBulkRestoring(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get status badge color based on status value
  const getStatusColor = (status: string) => {
    const statusLower = (status || '').toLowerCase();
    
    switch (statusLower) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'in progress':
        return 'bg-[#EDEEF3] text-black-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'creating':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'pending':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  // Skeleton loading component
  const TableSkeleton = () => {
    return (
      <>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/3"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-6 w-full"></div>
          
          <div className="overflow-x-auto">
            <Table className="min-w-full table-fixed">
              <TableHeader className="bg-gray-50 dark:bg-gray-800">
                <TableRow>
                  <TableHead className="px-4 py-3 w-2/5"><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div></TableHead>
                  <TableHead className="px-4 py-3 w-1/6"><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div></TableHead>
                  <TableHead className="px-4 py-3 w-1/6"><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div></TableHead>
                  <TableHead className="px-4 py-3 w-1/6"><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div></TableHead>
                  <TableHead className="px-4 py-3 w-1/6"><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div></TableHead>
                  <TableHead className="px-4 py-3 w-1/8"><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-900/20">
                {[...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="px-4 py-4 w-2/5">
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </TableCell>
                    <TableCell className="px-4 py-4 w-1/6">
                      <div className="flex items-center">
                        <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full mr-2"></div>
                        <div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1 w-3/4"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 w-1/6">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full mr-3"></div>
                        <div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1 w-3/4"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 w-1/6">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </TableCell>
                    <TableCell className="px-4 py-4 w-1/6">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </TableCell>
                    <TableCell className="px-4 py-4 w-1/8">
                      <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </>
    );
  };

  return (
    <div>
      {/* Title with Total Count and Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-4 lg:space-y-0">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">
          Blog List <span className="text-gray-500 dark:text-gray-400 text-lg lg:text-xl">({pagination?.total || 0})</span>
        </h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          {/* Bulk Actions */}
          <div className="flex items-center space-x-2 order-2 sm:order-1">
            {selectedBlogs.size > 0 && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedBlogs.size} selected
              </span>
            )}
            <button
              onClick={showDeleteConfirmation}
              disabled={bulkDeleting || bulkRestoring || selectedBlogs.size === 0}
              className={`px-3 lg:px-4 py-3 min-h-[44px] rounded-md text-sm font-medium transition-colors touch-manipulation ${
                bulkDeleting || bulkRestoring
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                  : selectedBlogs.size === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                  : 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
              }`}
            >
              {bulkDeleting ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Deleting...
                </div>
              ) : (
                selectedBlogs.size > 0 ? `Delete ${selectedBlogs.size}` : 'Delete'
              )}
            </button>
            <button
              onClick={showRestoreConfirmation}
              disabled={bulkRestoring || bulkDeleting || selectedBlogs.size === 0}
              className={`px-3 lg:px-4 py-3 min-h-[44px] rounded-md text-sm font-medium transition-colors touch-manipulation ${
                bulkRestoring || bulkDeleting
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                  : selectedBlogs.size === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                  : 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
              }`}
            >
              {bulkRestoring ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Restoring...
                </div>
              ) : (
                selectedBlogs.size > 0 ? `Restore ${selectedBlogs.size}` : 'Restore'
              )}
            </button>
            {selectedBlogs.size > 0 && (
              <button
                onClick={clearSelection}
                className="px-3 py-3 min-h-[44px] rounded-md text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation"
              >
                Clear
              </button>
            )}
          </div>
          
          {/* Search */}
          <div className="relative w-full sm:w-64 order-1 sm:order-2">
            <input
              type="text"
              placeholder="Search blogs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 min-h-[44px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent touch-manipulation"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Card Layout - Visible only on mobile */}
      <div className="block lg:hidden space-y-4">
        {loading ? (
          // Mobile skeleton
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start space-x-3">
                  <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="flex space-x-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {currentBlogs.length > 0 ? (
              currentBlogs.map((blog) => (
                <div 
                  key={blog._id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => navigateToBlog(blog._id)}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedBlogs.has(blog._id)}
                      onChange={() => toggleBlogSelection(blog._id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 touch-manipulation"
                    />
                    <div className="flex-1 min-w-0">
                      {/* Title and Status */}
                      <div className="mb-3">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-2">
                          {blog.title}
                        </h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {(blog.word_count || 0).toLocaleString()} words
                          </span>
                          <div className="text-xs text-gray-400">•</div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(blog.status)}`}>
                            {blog.status || 'Unknown'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ml-auto ${
                            blog.is_active === false 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          }`}>
                            {blog.is_active === false ? 'Deleted' : 'Active'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Project and User Info */}
                      <div className="grid grid-cols-1 gap-3 mb-3">
                        {/* Project */}
                        <div className="flex items-center space-x-2">
                          <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full">
                            <Image 
                              src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(blog.project_details?.url || '')}&sz=16`}
                              alt="favicon"
                              width={16}
                              height={16}
                              className="h-4 w-4"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                              {blog.project_details?.name || 'Unknown Project'}
                            </div>
                            {blog.project_details?.url && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {blog.project_details.url.replace(/^https?:\/\//, '')}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* User */}
                        <div className="flex items-center space-x-2">
                          <Image 
                            src={blog.user_details?.avatar || (blog.user_details?.name ? generateAvatar(blog.user_details.name) : generateAvatar('Unknown User'))}
                            alt={blog.user_details?.name || 'Unknown User'} 
                            width={24}
                            height={24}
                            className="h-6 w-6 rounded-full flex-shrink-0 border border-gray-200 dark:border-gray-600"
                            onError={(e) => {
                              if (blog.user_details?.name) {
                                (e.target as HTMLImageElement).src = generateAvatar(blog.user_details.name);
                              } else {
                                (e.target as HTMLImageElement).src = generateAvatar('Unknown User');
                              }
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                              {blog.user_details?.name || 'Unknown User'}
                            </div>
                            {blog.user_details?.email && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {blog.user_details.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="text-gray-500 dark:text-gray-400 mb-1">Created</div>
                          <div className="text-gray-700 dark:text-gray-300">
                            {formatDate(blog.created_at)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 dark:text-gray-400 mb-1">Updated</div>
                          <div className="text-gray-700 dark:text-gray-300">
                            {formatDate(blog.updated_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No blogs found matching your search criteria.' : 'No blogs found.'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop Table Layout - Hidden on mobile */}
      <div className="hidden lg:block">
        {/* Blogs Table */}
      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed border-collapse shadow-sm rounded-lg overflow-hidden">
            <TableHeader className="bg-gray-100 dark:bg-gray-800">
              <TableRow>
                <TableHead
                  scope="col" 
                  className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer w-2/5 border-b border-gray-200 dark:border-gray-700"
                  onClick={() => handleSort("title")}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={currentBlogs.length > 0 && selectedBlogs.size === currentBlogs.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          selectAllBlogs();
                        } else {
                          clearSelection();
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                    />
                    <span>Title</span>
                    <FaSort className={`ml-1 h-3 w-3 ${sortField === "title" ? "text-blue-500" : "text-gray-400"}`} />
                  </div>
                </TableHead>
                <TableHead
                  scope="col" 
                  className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer w-1/6 border-b border-gray-200 dark:border-gray-700"
                  onClick={() => handleSort("project_details.name")}
                >
                  <div className="flex items-center">
                    <span>Project</span>
                    <FaSort className={`ml-1 h-3 w-3 ${sortField === "project_details.name" ? "text-blue-500" : "text-gray-400"}`} />
                  </div>
                </TableHead>
                <TableHead
                  scope="col" 
                  className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer w-1/6 border-b border-gray-200 dark:border-gray-700"
                  onClick={() => handleSort("user_details.name")}
                >
                  <div className="flex items-center">
                    <span>User</span>
                    <FaSort className={`ml-1 h-3 w-3 ${sortField === "user_details.name" ? "text-blue-500" : "text-gray-400"}`} />
                  </div>
                </TableHead>
                <TableHead
                  scope="col" 
                  className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer w-1/6 border-b border-gray-200 dark:border-gray-700"
                  onClick={() => handleSort("created_at")}
                >
                  <div className="flex items-center">
                    <span>Created</span>
                    <FaSort className={`ml-1 h-3 w-3 ${sortField === "created_at" ? "text-blue-500" : "text-gray-400"}`} />
                  </div>
                </TableHead>
                <TableHead
                  scope="col" 
                  className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer w-1/6 border-b border-gray-200 dark:border-gray-700"
                  onClick={() => handleSort("updated_at")}
                >
                  <div className="flex items-center">
                    <span>Updated</span>
                    <FaSort className={`ml-1 h-3 w-3 ${sortField === "updated_at" ? "text-blue-500" : "text-gray-400"}`} />
                  </div>
                </TableHead>
                <TableHead
                  scope="col" 
                  className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer w-1/8 border-b border-gray-200 dark:border-gray-700"
                  onClick={() => handleSort("is_active")}
                >
                  <div className="flex items-center">
                    <span>Active</span>
                    <FaSort className={`ml-1 h-3 w-3 ${sortField === "is_active" ? "text-blue-500" : "text-gray-400"}`} />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-900/20">
              {currentBlogs.length > 0 ? (
                currentBlogs.map((blog) => (
                  <TableRow 
                    key={blog._id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                  >
                    <TableCell 
                      className="px-4 py-4 w-2/5 cursor-pointer"
                      onClick={() => navigateToBlog(blog._id)}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedBlogs.has(blog._id)}
                          onChange={() => toggleBlogSelection(blog._id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate" title={blog.title}>
                            {blog.title}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {(blog.word_count || 0).toLocaleString()} words
                            </div>
                            <div className="text-xs text-gray-400">•</div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(blog.status)}`}>
                              {blog.status || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell 
                      className="px-4 py-4 w-1/6 cursor-pointer"
                      onClick={() => navigateToBlog(blog._id)}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full">
                          <Image 
                            src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(blog.project_details?.url || '')}&sz=32`}
                            alt="favicon"
                            width={20}
                            height={20}
                            className="h-5 w-5 flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="ml-3 min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate" title={blog.project_details?.name || 'Unknown Project'}>
                            {blog.project_details?.name || 'Unknown Project'}
                          </div>
                          {blog.project_details?.url && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate" title={blog.project_details.url}>
                              {blog.project_details.url.replace(/^https?:\/\//, '')}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell 
                      className="px-4 py-4 w-1/6 cursor-pointer"
                      onClick={() => navigateToBlog(blog._id)}
                    >
                      <div className="flex items-center">
                        <Image 
                          src={blog.user_details?.avatar || (blog.user_details?.name ? generateAvatar(blog.user_details.name) : generateAvatar('Unknown User'))}
                          alt={blog.user_details?.name || 'Unknown User'} 
                          width={36}
                          height={36}
                          className="h-9 w-9 rounded-full mr-3 flex-shrink-0 border-2 border-white dark:border-gray-800 shadow-sm"
                          onError={(e) => {
                            if (blog.user_details?.name) {
                              (e.target as HTMLImageElement).src = generateAvatar(blog.user_details.name);
                            } else {
                              (e.target as HTMLImageElement).src = generateAvatar('Unknown User');
                            }
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate" title={blog.user_details?.name || 'Unknown User'}>
                            {blog.user_details?.name || 'Unknown User'}
                          </div>
                          {blog.user_details?.email && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate" title={blog.user_details.email}>
                              {blog.user_details.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell 
                      className="px-4 py-4 w-1/6 cursor-pointer"
                      onClick={() => navigateToBlog(blog._id)}
                    >
                      <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap truncate" title={formatDate(blog.created_at)}>
                        {formatDate(blog.created_at)}
                      </div>
                    </TableCell>
                    <TableCell 
                      className="px-4 py-4 w-1/6 cursor-pointer"
                      onClick={() => navigateToBlog(blog._id)}
                    >
                      <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap truncate" title={formatDate(blog.updated_at)}>
                        {formatDate(blog.updated_at)}
                      </div>
                    </TableCell>
                    <TableCell 
                      className="px-4 py-4 w-1/8 cursor-pointer"
                      onClick={() => navigateToBlog(blog._id)}
                    >
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        blog.is_active === false 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {blog.is_active === false ? 'Deleted' : 'Active'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'No blogs found matching your search criteria.' : 'No blogs found.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col lg:flex-row justify-between items-center mt-6 space-y-4 lg:space-y-0">
          <div className="text-sm text-gray-700 dark:text-gray-300 text-center lg:text-left">
            Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> blogs
          </div>
          <div className="flex items-center space-x-1 lg:space-x-2 overflow-x-auto pb-2">
            <button
              onClick={() => {
                const newPage = Math.max(1, currentPage - 1);
                setCurrentPage(newPage);
                fetchBlogs(newPage, searchQuery, sortField, sortDirection);
              }}
              disabled={!pagination.hasPrev}
              className={`px-3 py-2 min-h-[44px] rounded-md whitespace-nowrap touch-manipulation ${
                !pagination.hasPrev
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Previous
            </button>
            
            {/* Numbered pagination */}
            <div className="flex items-center space-x-1 max-w-xs overflow-x-auto">
              {[...Array(pagination.totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                // Show current page, first, last, and pages around current
                const shouldShow = 
                  pageNumber === 1 || 
                  pageNumber === pagination.totalPages || 
                  Math.abs(pageNumber - pagination.page) <= 1;
                
                if (!shouldShow && (pageNumber === 2 || pageNumber === pagination.totalPages - 1)) {
                  return <span key={`ellipsis-${pageNumber}`} className="px-1 text-gray-500 dark:text-gray-400">...</span>;
                }
                
                if (!shouldShow) return null;
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => {
                      setCurrentPage(pageNumber);
                      fetchBlogs(pageNumber, searchQuery, sortField, sortDirection);
                    }}
                    className={`px-3 py-2 min-h-[44px] rounded-md whitespace-nowrap touch-manipulation ${
                      pagination.page === pageNumber
                        ? 'bg-blue-500 text-white dark:bg-blue-600'
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => {
                const newPage = Math.min(pagination.totalPages, currentPage + 1);
                setCurrentPage(newPage);
                fetchBlogs(newPage, searchQuery, sortField, sortDirection);
              }}
              disabled={!pagination.hasNext}
              className={`px-3 py-2 min-h-[44px] rounded-md whitespace-nowrap touch-manipulation ${
                !pagination.hasNext
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <FaTrash className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Delete {selectedBlogs.size} Blog{selectedBlogs.size > 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    This action cannot be easily undone
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Are you sure you want to delete the following blog{selectedBlogs.size > 1 ? 's' : ''}?
                </p>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3 max-h-32 overflow-y-auto">
                  {currentBlogs
                    .filter(blog => selectedBlogs.has(blog._id))
                    .map(blog => (
                      <div key={blog._id} className="text-sm text-gray-700 dark:text-gray-300 py-1">
                        • {blog.title}
                      </div>
                    ))
                  }
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  This action will mark the blogs as deleted (soft delete). They can be recovered later if needed.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={bulkDeleting}
                  className="px-4 py-3 min-h-[44px] text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors touch-manipulation order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className={`px-4 py-3 min-h-[44px] text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors touch-manipulation order-1 sm:order-2 ${
                    bulkDeleting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {bulkDeleting ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Deleting...
                    </div>
                  ) : (
                    `Delete ${selectedBlogs.size} Blog${selectedBlogs.size > 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Restore {selectedBlogs.size} Blog{selectedBlogs.size > 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Bring back deleted blogs
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Are you sure you want to restore the following blog{selectedBlogs.size > 1 ? 's' : ''}?
                </p>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3 max-h-32 overflow-y-auto">
                  {currentBlogs
                    .filter(blog => selectedBlogs.has(blog._id))
                    .map(blog => (
                      <div key={blog._id} className="text-sm text-gray-700 dark:text-gray-300 py-1">
                        • {blog.title}
                      </div>
                    ))
                  }
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  This action will mark the blogs as active and restore them.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowRestoreModal(false)}
                  disabled={bulkRestoring}
                  className="px-4 py-3 min-h-[44px] text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors touch-manipulation order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkRestore}
                  disabled={bulkRestoring}
                  className={`px-4 py-3 min-h-[44px] text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors touch-manipulation order-1 sm:order-2 ${
                    bulkRestoring
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {bulkRestoring ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Restoring...
                    </div>
                  ) : (
                    `Restore ${selectedBlogs.size} Blog${selectedBlogs.size > 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
