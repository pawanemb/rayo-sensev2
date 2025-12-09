'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaExternalLinkAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface IPDetails {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  timezone: string;
  flag: string;
  isLocal: boolean;
}

interface FormSubmission {
  id: string;
  email: string;
  website: string;
  ip_address?: string;
  status: 'email sent' | 'error' | 'processing' | 'done';
  created_at: string;
  ipDetails?: IPDetails | null;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalSubmissions: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const RecentFormSubmissions = () => {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalSubmissions: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  useEffect(() => {
    fetchSubmissions(1);
  }, []);

  const fetchSubmissions = async (page: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/form-submissions?page=${page}&limit=4`);
      const data = await response.json();
      setSubmissions(data.submissions || []);
      setPagination(data.pagination || {
        currentPage: page,
        totalPages: 1,
        totalSubmissions: 0,
        hasNextPage: false,
        hasPrevPage: false
      });
    } catch (error) {
      console.error('Error fetching form submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchSubmissions(newPage);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'email sent':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'processing':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'done':
        return 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400';
      case 'error':
        return 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const formatUrl = (url: string) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Form Submissions
        </h3>
        <Link
          href="/forms"
          className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          View all
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
            >
              <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-3 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </div>
              <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
            </div>
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <svg
            className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400">No form submissions yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <Link
              key={submission.id}
              href="/forms"
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-800"
            >
              <Image
                src={`https://www.google.com/s2/favicons?sz=32&domain=${submission.website}`}
                alt="Favicon"
                width={40}
                height={40}
                className="h-10 w-10 flex-shrink-0 rounded"
                unoptimized
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {submission.email}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <a
                    href={formatUrl(submission.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 flex items-center truncate max-w-[200px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {submission.website}
                    <FaExternalLinkAlt className="ml-1 h-2 w-2 flex-shrink-0" />
                  </a>
                  {submission.ipDetails && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{submission.ipDetails.flag}</span>
                      <span className="truncate max-w-[100px]">
                        {submission.ipDetails.city}, {submission.ipDetails.country}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(
                    submission.status
                  )}`}
                >
                  {submission.status}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDateTime(submission.created_at)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Compact Pagination */}
      {!loading && pagination.totalSubmissions > 4 && (
        <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Page {pagination.currentPage} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Previous page"
            >
              <FaChevronLeft className="h-3 w-3" />
            </button>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Next page"
            >
              <FaChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentFormSubmissions;
