"use client";
import Image from "next/image";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { useState, useEffect } from "react";
import { getUserAvatar } from "@/lib/users/avatar";

// Define the TypeScript interface for payments
interface Payment {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  user_avatar: string | null;
  amount: number;
  currency: string;
  status: string;
  razorpay_payment_id: string;
  created_at: string;
  description: string | null;
}

export default function RecentOrders() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'captured' | 'created'>('captured');
  const perPage = 4;

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/payments/recent');
        const data = await response.json();

        if (data.success && data.payments) {
          setPayments(data.payments);
        } else {
          setHasError(true);
        }
      } catch (error) {
        console.error('Error fetching payments:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, []);

  // Filter payments by status
  const filteredPayments = payments.filter(payment => {
    if (statusFilter === 'all') return true;
    return payment.status.toLowerCase() === statusFilter;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredPayments.length / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    const formattedAmount = (amount / 100).toFixed(2); // Razorpay amounts are in paise
    const currencySymbol = currency.toUpperCase() === 'USD' ? '$' : currency.toUpperCase() === 'INR' ? '₹' : currency;
    return `${currencySymbol}${formattedAmount}`;
  };

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

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Payments
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              statusFilter === 'all'
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('captured')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              statusFilter === 'captured'
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Paid
          </button>
          <button
            onClick={() => setStatusFilter('created')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              statusFilter === 'created'
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Attempted
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="max-w-full overflow-x-auto min-h-[380px]">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell
                  isHeader
                  className="py-3 pr-8 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  User
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Description
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 pr-8 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Amount
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Date
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Skeleton Body */}
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
                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
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
          <p className="text-gray-500 dark:text-gray-400">Failed to load payments</p>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {payments.length === 0 ? 'No payments found' : `No ${statusFilter === 'captured' ? 'paid' : statusFilter === 'created' ? 'attempted' : ''} payments found`}
          </p>
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto min-h-[380px]">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell
                  isHeader
                  className="py-3 pr-8 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  User
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Description
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 pr-8 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Amount
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Date
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {currentPayments.map((payment) => {
                const formattedDateTime = formatDate(payment.created_at);
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="py-3 pr-8">
                      <Link href={`/user/${payment.user_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="relative h-10 w-10 overflow-hidden rounded-full border border-gray-100 dark:border-gray-700">
                          <Image
                            src={getUserAvatar(payment.user_id, payment.user_avatar)}
                            alt={payment.user_name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {payment.user_name}
                          </p>
                          <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                            {payment.user_email}
                          </span>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="py-3 text-gray-600 text-theme-sm dark:text-gray-300">
                      {payment.description || '-'}
                    </TableCell>
                    <TableCell className="py-3 pr-8 font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {formatAmount(payment.amount, payment.currency)}
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

          {/* Pagination */}
          {filteredPayments.length > perPage && (
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredPayments.length)} of {filteredPayments.length} payments
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800/50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800/50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
