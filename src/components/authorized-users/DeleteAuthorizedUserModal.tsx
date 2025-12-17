"use client";

import React from "react";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/modal";
import type { AuthorizedUser } from "./AddAuthorizedUserModal";

interface DeleteAuthorizedUserModalProps {
  user: AuthorizedUser | null;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DeleteAuthorizedUserModal({
  user,
  isOpen,
  onConfirm,
  onCancel,
  isLoading
}: DeleteAuthorizedUserModalProps) {
  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="md">
      <ModalHeader>
        <ModalTitle>Remove authorized user</ModalTitle>
        <ModalDescription>
          Are you sure you want to remove <span className="font-semibold">{user.email}</span> from
          the authorized users list? This will prevent them from registering if they haven&apos;t already.
        </ModalDescription>
      </ModalHeader>

      <ModalFooter>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-full bg-error-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-error-700 disabled:opacity-60"
          disabled={isLoading}
        >
          {isLoading ? "Removing..." : "Remove"}
        </button>
      </ModalFooter>
    </Modal>
  );
}
