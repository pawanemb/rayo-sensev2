"use client";

import React, { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";

interface UsageRecord {
  id: string;
  service_name: string;
  base_cost: number;
  actual_charge: number;
  multiplier: number;
  created_at: string;
  usage_data?: string;
  projects?: {
    name: string;
    url: string;
  };
}

interface UserUsageProps {
  userId: string;
}

export default function UserUsage({ userId }: UserUsageProps) {
  const [usage, setUsage] = useState<UsageRecord[]>([]);
  const [totalUsage, setTotalUsage] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUsageData, setSelectedUsageData] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totalBaseCost, setTotalBaseCost] = useState(0);
  const [totalActualCharge, setTotalActualCharge] = useState(0);
  const usagePerPage = 5;

  const fetchUsage = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/usage?page=${page}&limit=${usagePerPage}`);
      if (response.ok) {
        const data = await response.json();
        setUsage(data.usage || []);
        setTotalUsage(data.totalUsage || 0);
        setCurrentPage(data.currentPage || 1);
        setTotalPages(data.totalPages || 1);
        setTotalBaseCost(data.totalBaseCost || 0);
        setTotalActualCharge(data.totalActualCharge || 0);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    fetchUsage(page);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Usage History
          </h2>
          <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
            {totalUsage} {totalUsage === 1 ? 'Record' : 'Records'}
          </span>
        </div>
        {!isLoading && usage.length > 0 && (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Base Cost:</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatCurrency(totalBaseCost)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Actual Charge:</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatCurrency(totalActualCharge)}
              </span>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {/* Table Header Skeleton */}
          <div className="grid grid-cols-6 gap-4 border-b border-gray-200 pb-3 dark:border-gray-800">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
          {/* Table Rows Skeleton */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4 border-b border-gray-100 py-3 dark:border-gray-800">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : usage.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No usage records found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Service
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Project
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Base Cost
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Multiplier
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Actual Charge
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Date
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Usage Data
                  </th>
                </tr>
              </thead>
              <tbody>
                {usage.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                  >
                    <td className="py-3">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {record.service_name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </p>
                    </td>
                    <td className="py-3">
                      {record.projects ? (
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={`https://www.google.com/s2/favicons?domain=${new URL(record.projects.url).hostname}&sz=16`}
                              alt="" 
                              className="h-4 w-4 flex-shrink-0 rounded"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="gray"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>';
                              }}
                            />
                            <span className="text-xs text-gray-900 dark:text-white truncate">
                              {record.projects.name}
                            </span>
                          </div>
                          <a
                            href={record.projects.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 hover:underline truncate block mt-1"
                          >
                            {record.projects.url}
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatCurrency(record.base_cost)}
                    </td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {record.multiplier}x
                    </td>
                    <td className="py-3">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {formatCurrency(record.actual_charge)}
                      </p>
                    </td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(record.created_at)}
                    </td>
                    <td className="py-3">
                      {record.usage_data ? (
                        <button
                          onClick={() => {
                            setSelectedUsageData(record.usage_data || null);
                            setIsModalOpen(true);
                          }}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          View
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Usage Data Modal */}
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg">
            <ModalHeader>
              <ModalTitle>Usage Data</ModalTitle>
            </ModalHeader>
            <ModalBody>
              <pre className="whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                {selectedUsageData}
              </pre>
            </ModalBody>
            <ModalFooter>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Close
              </button>
            </ModalFooter>
          </Modal>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {((currentPage - 1) * usagePerPage) + 1} to {Math.min(currentPage * usagePerPage, totalUsage)} of {totalUsage} records
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
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      pages.push(1);
                      
                      if (currentPage > 3) {
                        pages.push('...');
                      }
                      
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
