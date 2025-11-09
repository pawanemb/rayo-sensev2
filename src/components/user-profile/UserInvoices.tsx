"use client";

import React, { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface InvoiceRecord {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email?: string;
  status: string;
  total: number;
  currency: string;
  amount_paid: number;
  issue_date: string;
  due_date: string;
}

interface UserInvoicesProps {
  userId: string;
}

export default function UserInvoices({ userId }: UserInvoicesProps) {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const invoicesPerPage = 5;

  const fetchInvoices = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/invoices?page=${page}&limit=${invoicesPerPage}`);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
        setTotalInvoices(data.totalInvoices || 0);
        setCurrentPage(data.currentPage || 1);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
      sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      paid: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
      overdue: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
      cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
      partially_paid: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
    };
    
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[status] || statusColors.draft}`}>
        {status?.toUpperCase().replace('_', ' ') || 'DRAFT'}
      </span>
    );
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    fetchInvoices(page);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Invoices
        </h2>
        <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
          {totalInvoices} {totalInvoices === 1 ? 'Invoice' : 'Invoices'}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {/* Table Header Skeleton */}
          <div className="grid grid-cols-5 gap-4 border-b border-gray-200 pb-3 dark:border-gray-800">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
          {/* Table Rows Skeleton */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 border-b border-gray-100 py-3 dark:border-gray-800">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No invoices found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Invoice #
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Client
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Amount
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Issue Date
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                  >
                    <td className="py-3">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {invoice.invoice_number}
                      </p>
                    </td>
                    <td className="py-3">
                      <div className="min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white truncate">
                          {invoice.client_name}
                        </p>
                        {invoice.client_email && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {invoice.client_email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="py-3">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {formatCurrency(invoice.total, invoice.currency)}
                      </p>
                      {invoice.amount_paid > 0 && invoice.status === 'partially_paid' && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Paid: {formatCurrency(invoice.amount_paid, invoice.currency)}
                        </p>
                      )}
                    </td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(invoice.issue_date)}
                    </td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(invoice.due_date)}
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
                Showing {((currentPage - 1) * invoicesPerPage) + 1} to {Math.min(currentPage * invoicesPerPage, totalInvoices)} of {totalInvoices} invoices
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
