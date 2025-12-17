"use client";

import React, { useCallback, useEffect, useState } from "react";
import { MdDelete } from "react-icons/md";
import { FaCopy } from "react-icons/fa";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { AddAuthorizedUserModal } from "./AddAuthorizedUserModal";

interface AuthorizedUser {
  id: string;
  email: string;
  company_name: string;
  user_id: string | null;
  user_name: string | null;
  user_avatar: string | null;
  created_at: string;
  updated_at: string | null;
}
import { DeleteAuthorizedUserModal } from "./DeleteAuthorizedUserModal";

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

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

export default function AuthorizedUsersList() {
  const [users, setUsers] = useState<AuthorizedUser[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AuthorizedUser | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedId(email);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  };

  const fetchUsers = useCallback(
    async (page = 1, search = "", limit = 10) => {
      try {
        setIsLoading(true);
        setError(null);

        const query = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (search) query.set("search", search);

        const response = await fetch(`/api/authorized-users?${query.toString()}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error("Failed to load authorized users");
        }

        const data = await response.json();
        setUsers(data.authorizedUsers || []);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load authorized users");
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearchTerm(searchInput);
      fetchUsers(1, searchInput, pagination.limit);
    }, 500);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handleUserCreated = () => {
    setShowAddModal(false);
    fetchUsers(1, searchTerm, pagination.limit);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setActionLoading(true);
    try {
      const response = await fetch(`/api/authorized-users/${userToDelete.id}`, {
        method: "DELETE",
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete authorized user");
      }

      setUserToDelete(null);
      const nextPage =
        users.length === 1 && pagination.currentPage > 1
          ? pagination.currentPage - 1
          : pagination.currentPage;
      fetchUsers(nextPage, searchTerm, pagination.limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete authorized user");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePageChange = (target: number) => {
    const totalPages = pagination.totalPages || 1;
    if (target < 1 || target > totalPages || target === pagination.currentPage) return;
    fetchUsers(target, searchTerm, pagination.limit);
  };

  // Generate page numbers for pagination
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

  const total = pagination.total ?? 0;
  const rangeStart = total
    ? (pagination.currentPage - 1) * pagination.limit + (users.length > 0 ? 1 : 0)
    : null;
  const rangeEnd = total && rangeStart !== null
    ? Math.min(rangeStart + users.length - 1, total)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Schbang users
            {typeof pagination.total === "number" && (
              <span className="ml-3 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-600 dark:text-brand-300">
                {pagination.total.toLocaleString()} {searchTerm ? 'results' : 'users'}
              </span>
            )}
          </h1>
          {searchTerm && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Search results for &quot;{searchTerm}&quot;
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <input
              className="w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 pr-11 text-sm shadow-inner focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:w-64"
              placeholder="Search email or company..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-brand-600"
          >
            Add user
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-error-100 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-200">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[700px]">
            <Table>
              <TableHeader className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-white/5 dark:text-gray-400">
                <TableRow>
                  <TableCell className="px-5 py-4">Email</TableCell>
                  <TableCell className="px-5 py-4">Company</TableCell>
                  <TableCell className="px-5 py-4">User</TableCell>
                  <TableCell className="px-5 py-4">Created</TableCell>
                  <TableCell className="px-5 py-4">Actions</TableCell>
                </TableRow>
              </TableHeader>
              {isLoading ? (
                <TableSkeleton rows={10} columns={5} />
              ) : (
                <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                        No Schbang users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow
                        key={user.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.email}
                            </span>
                            <button
                              onClick={() => handleCopyEmail(user.email)}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                              title={copiedId === user.email ? "Copied!" : "Copy email"}
                            >
                              {copiedId === user.email ? (
                                <svg className="h-3.5 w-3.5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <FaCopy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {user.company_name}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          {user.user_id && user.user_name ? (
                            <div className="flex items-center gap-2">
                              {user.user_avatar ? (
                                <img
                                  src={user.user_avatar}
                                  alt={user.user_name}
                                  className="h-7 w-7 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-7 w-7 rounded-full bg-brand-100 flex items-center justify-center text-xs font-medium text-brand-600">
                                  {user.user_name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="text-sm text-gray-900 dark:text-white">{user.user_name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {formatDateTime(user.created_at)}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <button
                            onClick={() => setUserToDelete(user)}
                            className="rounded-full border border-gray-200 p-2 text-gray-500 hover:border-error-200 hover:text-error-600 dark:border-gray-700 dark:text-gray-300"
                            title="Remove user"
                          >
                            <MdDelete className="h-4 w-4" />
                          </button>
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
            {rangeStart && rangeEnd && total
              ? `Showing ${rangeStart}–${rangeEnd} of ${total.toLocaleString()} users`
              : `Showing ${users.length} user${users.length !== 1 ? 's' : ''} on page ${pagination.currentPage}`}
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

      <AddAuthorizedUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={handleUserCreated}
      />

      <DeleteAuthorizedUserModal
        user={userToDelete}
        isOpen={Boolean(userToDelete)}
        onCancel={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        isLoading={actionLoading}
      />
    </div>
  );
}
