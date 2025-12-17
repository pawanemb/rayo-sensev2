"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";

export interface AuthorizedUser {
  id: string;
  email: string;
  company_name: string;
  user_id: string | null;
  created_at: string;
  updated_at: string | null;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface AddAuthorizedUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (user: AuthorizedUser) => void;
}

export function AddAuthorizedUserModal({ isOpen, onClose, onCreated }: AddAuthorizedUserModalProps) {
  const [formState, setFormState] = useState({
    email: "",
    company_name: "Schbang",
    user_id: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // User search state
  const [users, setUsers] = useState<UserOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch users when modal opens or search changes
  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const query = new URLSearchParams({
          page: "1",
          perPage: "50",
        });
        if (searchQuery) {
          query.set("search", searchQuery);
        }

        const response = await fetch(`/api/users?${query.toString()}`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setUsers(data.users.map((u: { id: string; name: string; email: string; avatar: string }) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            avatar: u.avatar,
          })));
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    const debounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounce);
  }, [isOpen, searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectUser = (user: UserOption) => {
    setSelectedUser(user);
    setFormState((prev) => ({
      ...prev,
      email: user.email,
      user_id: user.id,
    }));
    setSearchQuery(user.name || user.email);
    setShowDropdown(false);
  };

  const handleClearSelection = () => {
    setSelectedUser(null);
    setFormState((prev) => ({
      ...prev,
      email: "",
      user_id: "",
    }));
    setSearchQuery("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!formState.email || !formState.company_name) {
        throw new Error("Please select a user and enter company name");
      }

      const response = await fetch("/api/authorized-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formState.email,
          company_name: formState.company_name,
          user_id: formState.user_id || null,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add authorized user");
      }

      onCreated(data.authorizedUser);
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add authorized user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormState({ email: "", company_name: "Schbang", user_id: "" });
    setSearchQuery("");
    setSelectedUser(null);
    setError(null);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalHeader>
        <ModalTitle>Add authorized user</ModalTitle>
        <ModalDescription>
          Select a user from the list and enter their company name.
        </ModalDescription>
      </ModalHeader>

      <form onSubmit={handleSubmit}>
        <ModalBody>
          {error && (
            <div className="rounded-xl bg-error-50 px-3 py-2 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-300">
              {error}
            </div>
          )}

          {/* User Selection */}
          <div ref={dropdownRef} className="relative">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select user
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                  if (selectedUser) {
                    handleClearSelection();
                  }
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="Search users by name or email..."
              />
              {selectedUser && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {isLoadingUsers ? (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Loading users...
                  </div>
                ) : users.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    No users found
                  </div>
                ) : (
                  users.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Email (Read-only when user selected) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email address
            </label>
            <input
              type="email"
              value={formState.email}
              readOnly
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
              placeholder="Select a user above"
            />
          </div>

          {/* User ID (Read-only) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              User ID
            </label>
            <input
              type="text"
              value={formState.user_id}
              readOnly
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-mono text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
              placeholder="Auto-filled from selection"
            />
          </div>

          {/* Company Name (Manual input) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Company name
            </label>
            <input
              type="text"
              value={formState.company_name}
              onChange={(e) => setFormState((prev) => ({ ...prev, company_name: e.target.value }))}
              required
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Enter company name"
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
            disabled={isSubmitting || !selectedUser}
          >
            {isSubmitting ? "Adding..." : "Add user"}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
