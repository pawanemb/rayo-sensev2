'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  getFormSubmissions,
  updateFormSubmission,
  FormSubmission,
  PaginationInfo
} from '@/services/formSubmissionService';
import { FaExternalLinkAlt } from 'react-icons/fa';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import FormSubmissionModal from './FormSubmissionModal';


// Fallback data in case API fails
const fallbackSubmissions: FormSubmission[] = [
  {
    id: '1',
    email: 'user@example.com',
    website: 'https://example.com',
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    status: 'email sent',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: null
  },
  {
    id: '2',
    email: 'contact@company.com',
    website: 'https://company.com',
    ip_address: '203.0.113.195',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    status: 'done',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    processed_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    notes: 'Analysis completed successfully'
  }
];

const FormsTable = () => {
  const [submissions, setSubmissions] = useState<FormSubmission[]>(fallbackSubmissions);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalSubmissions: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  // Modal state
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const fetchSubmissions = useCallback(async (page: number, search: string, limit: number = 10) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getFormSubmissions({
        page,
        limit,
        search
      });
      
      setSubmissions(response.submissions);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching form submissions:', error);
      setError('Failed to fetch form submissions');
      setSubmissions(fallbackSubmissions);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalSubmissions: fallbackSubmissions.length,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions(1, '', 10);
  }, [fetchSubmissions]);

  // Handle search with debouncing
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== searchTerm) {
        setSearchTerm(searchInput);
        fetchSubmissions(1, searchInput, 10);
      }
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [searchInput, fetchSubmissions, searchTerm]);

  // Pagination handler
  const handlePageChange = (pageNumber: number) => {
    fetchSubmissions(pageNumber, searchTerm, 10);
  };

  // Handle submission update
  const handleSubmissionUpdate = async (id: string, updates: Partial<FormSubmission>) => {
    try {
      setActionLoading(true);
      await updateFormSubmission(id, updates);
      setShowModal(false);
      setSelectedSubmission(null);
      await fetchSubmissions(pagination.currentPage, searchTerm, 10);
    } catch (error) {
      console.error('Error updating form submission:', error);
    } finally {
      setActionLoading(false);
    }
  };


  // Open submission modal
  const openSubmissionModal = (submission: FormSubmission) => {
    setSelectedSubmission(submission);
    setShowModal(true);
  };

  const formatUrl = (url: string) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
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

  const totalSubmissions = pagination.totalSubmissions ?? 0;
  const rangeStart = totalSubmissions
    ? (pagination.currentPage - 1) * pagination.limit + (submissions.length > 0 ? 1 : 0)
    : 0;
  const rangeEnd = totalSubmissions && rangeStart !== 0
    ? Math.min(rangeStart + submissions.length - 1, totalSubmissions)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Form Submissions
            {typeof pagination.totalSubmissions === "number" && (
              <span className="ml-3 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-600 dark:text-brand-300">
                {pagination.totalSubmissions.toLocaleString()} {searchTerm ? 'results' : 'submissions'}
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
              type="text"
              placeholder="Search email, website..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 pr-11 text-sm shadow-inner focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:w-64"
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

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[960px]">
            <Table>
              <TableHeader className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-white/5 dark:text-gray-400">
                <TableRow>
                  <TableCell className="px-5 py-4">Email & Website</TableCell>
                  <TableCell className="px-5 py-4">Status</TableCell>
                  <TableCell className="px-5 py-4">IP Address</TableCell>
                  <TableCell className="px-5 py-4">Location</TableCell>
                  <TableCell className="px-5 py-4">Created</TableCell>
                </TableRow>
              </TableHeader>
              {loading ? (
                <TableSkeleton rows={10} columns={5} />
              ) : (
                <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                  {submissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                        {searchTerm ? 'No form submissions found matching your search.' : 'No form submissions found.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    submissions.map((submission) => (
                      <TableRow
                        key={submission.id}
                        onClick={() => openSubmissionModal(submission)}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Image
                              src={`https://www.google.com/s2/favicons?sz=32&domain=${submission.website}`}
                              alt="Favicon"
                              width={32}
                              height={32}
                              className="h-8 w-8 flex-shrink-0"
                              unoptimized
                            />
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{submission.email}</p>
                              <a
                                href={formatUrl(submission.website)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 hover:underline flex items-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {submission.website}
                                <FaExternalLinkAlt className="w-2.5 h-2.5 ml-1" />
                              </a>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(submission.status)}`}>
                            {submission.status}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <code className="text-xs text-gray-600 dark:text-gray-300 font-mono">
                            {submission.ip_address || '—'}
                          </code>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          {submission.ipDetails ? (
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {submission.ipDetails.flag || '🌐'}
                              </span>
                              <div className="space-y-0.5">
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {submission.ipDetails.city}, {submission.ipDetails.country}
                                </p>
                                {submission.ipDetails.timezone && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {submission.ipDetails.timezone}
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {formatDateTime(submission.created_at)}
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
            {rangeStart && rangeEnd && totalSubmissions
              ? `Showing ${rangeStart}–${rangeEnd} of ${totalSubmissions.toLocaleString()} submissions`
              : `Showing ${submissions.length} submission${submissions.length !== 1 ? 's' : ''} on page ${pagination.currentPage}`}
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


      {/* Form Submission Modal */}
      {showModal && selectedSubmission && (
        <FormSubmissionModal
          submission={selectedSubmission}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedSubmission(null);
          }}
          onUpdate={handleSubmissionUpdate}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};

export default FormsTable;