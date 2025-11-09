"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaPen, FaLinkedin, FaCopy } from "react-icons/fa";
import { MdDelete, MdEmail } from "react-icons/md";
import { FcGoogle } from "react-icons/fc";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteUser, getUsers, updateUser, type PaginationInfo, type User } from "@/services/userService";
import { EditUserModal } from "./EditUserModal";
import { DeleteUserModal } from "./DeleteUserModal";
import { InviteUserModal } from "./InviteUserModal";
import { TableSkeleton } from "@/components/ui/table-skeleton";

const providerIcon = (provider: string) => {
  switch (provider) {
    case "email":
      return <MdEmail className="h-4 w-4 text-gray-600" title="Email" />;
    case "google":
      return <FcGoogle className="h-4 w-4" title="Google" />;
    case "linkedin":
    case "linkedin_oidc":
      return <FaLinkedin className="h-4 w-4 text-blue-600" title="LinkedIn" />;
    default:
      return null;
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  
  // Format: "Jan 15, 2025, 2:30:45 PM"
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

export default function UserList() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalUsers: null,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = async (userId: string) => {
    try {
      await navigator.clipboard.writeText(userId);
      setCopiedId(userId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy ID:', err);
    }
  };

  const fetchUsers = useCallback(
    async (page = 1, search = "", limit = 10) => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getUsers({ page, limit, search });
        setUsers(response.users);
        setPagination(response.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load users");
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    },
    [] // Empty dependency array - function is stable
  );

  useEffect(() => {
    fetchUsers(1, "", pagination.limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearchTerm(searchInput);
      fetchUsers(1, searchInput, pagination.limit);
    }, 500);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]); // Only depend on searchInput

  const handleUserCreated = () => {
    setShowInviteModal(false);
    fetchUsers(1, searchTerm, pagination.limit);
  };

  const handleUserUpdated = async (payload: { id: string; name: string; email: string; password?: string }) => {
    setActionLoading(true);
    try {
      await updateUser(payload.id, {
        email: payload.email,
        metadata: { full_name: payload.name },
        ...(payload.password ? { password: payload.password } : {}),
      });
      setUserToEdit(null);
      fetchUsers(pagination.currentPage, searchTerm, pagination.limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setActionLoading(true);
    try {
      await deleteUser(userToDelete.id);
      setUserToDelete(null);
      const nextPage =
        users.length === 1 && pagination.currentPage > 1 ? pagination.currentPage - 1 : pagination.currentPage;
      fetchUsers(nextPage, searchTerm, pagination.limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
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
    
    // Calculate start and end of range
    const start = Math.max(1, current - range);
    const end = Math.min(totalPages, current + range);
    
    // Add page numbers in range
    for (let i = start; i <= end; i++) {
      numbers.push(i);
    }
    
    // Always include first page
    if (!numbers.includes(1)) {
      numbers.unshift(1);
    }
    
    // Always include last page
    if (!numbers.includes(totalPages) && totalPages > 1) {
      numbers.push(totalPages);
    }
    
    return [...new Set(numbers)].sort((a, b) => a - b);
  })();

  const totalUsers = pagination.totalUsers ?? null;
  const rangeStart = totalUsers
    ? (pagination.currentPage - 1) * pagination.limit + (users.length > 0 ? 1 : 0)
    : null;
  const rangeEnd = totalUsers && rangeStart !== null ? Math.min(rangeStart + users.length - 1, totalUsers) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            User management
            {typeof pagination.totalUsers === "number" && (
              <span className="ml-3 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-600 dark:text-brand-300">
                {pagination.totalUsers.toLocaleString()} {searchTerm ? 'results' : 'users'}
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
              placeholder="Search users, email, or ID..."
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
            onClick={() => setShowInviteModal(true)}
            className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-brand-600"
          >
            Create account
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
          <div className="min-w-[960px]">
            <Table>
              <TableHeader className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-white/5 dark:text-gray-400">
                <TableRow>
                  <TableCell className="px-5 py-4">User</TableCell>
                  <TableCell className="px-5 py-4">User ID</TableCell>
                  <TableCell className="px-5 py-4">Providers</TableCell>
                  <TableCell className="px-5 py-4">Email verified</TableCell>
                  <TableCell className="px-5 py-4">Last sign in</TableCell>
                  <TableCell className="px-5 py-4">Created</TableCell>
                  <TableCell className="px-5 py-4">Actions</TableCell>
                </TableRow>
              </TableHeader>
              {isLoading ? (
                <TableSkeleton rows={10} columns={7} />
              ) : (
                <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                  {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const providers =
                      user.raw.app_metadata?.providers ||
                      (user.raw.app_metadata?.provider ? [user.raw.app_metadata.provider] : []);
                    return (
                      <TableRow 
                        key={user.id}
                        onClick={() => router.push(`/user/${user.id}`)}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-gray-100 dark:border-gray-700">
                              <Image src={user.avatar} alt={user.name} fill sizes="40px" className="object-cover" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-gray-600 dark:text-gray-300 font-mono">
                              {user.id.slice(0, 8)}...
                            </code>
                            <button
                              onClick={() => handleCopyId(user.id)}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                              title={copiedId === user.id ? "Copied!" : "Copy full ID"}
                            >
                              {copiedId === user.id ? (
                                <svg className="h-3.5 w-3.5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <FaCopy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            {providers.length === 0 && <span className="text-xs text-gray-400">—</span>}
                            {providers.map((provider: string) => (
                              <span key={`${user.id}-${provider}`} title={provider}>
                                {providerIcon(provider)}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {user.raw.email_confirmed_at ? "Yes" : "No"}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {formatDateTime(user.raw.last_sign_in_at)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {formatDateTime(user.raw.created_at)}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setUserToEdit(user);
                              }}
                              className="rounded-full border border-gray-200 p-2 text-gray-500 hover:border-brand-200 hover:text-brand-600 dark:border-gray-700 dark:text-gray-300"
                              title="Edit user"
                            >
                              <FaPen className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setUserToDelete(user);
                              }}
                              className="rounded-full border border-gray-200 p-2 text-gray-500 hover:border-error-200 hover:text-error-600 dark:border-gray-700 dark:text-gray-300"
                              title="Delete user"
                            >
                              <MdDelete className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                  )}
                </TableBody>
              )}
            </Table>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 text-sm text-gray-500 dark:border-white/5 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {rangeStart && rangeEnd && totalUsers
              ? `Showing ${rangeStart}–${rangeEnd} of ${totalUsers.toLocaleString()} users`
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

      <EditUserModal
        user={userToEdit}
        isOpen={Boolean(userToEdit)}
        onClose={() => setUserToEdit(null)}
        onSubmit={handleUserUpdated}
        isSubmitting={actionLoading}
      />

      <DeleteUserModal
        user={userToDelete}
        isOpen={Boolean(userToDelete)}
        onCancel={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        isLoading={actionLoading}
      />

      <InviteUserModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onCreated={handleUserCreated}
      />
    </div>
  );
}
