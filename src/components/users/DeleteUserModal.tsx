"use client";

import React from "react";
import type { User } from "@/services/userService";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/modal";

interface DeleteUserModalProps {
  user: User | null;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DeleteUserModal({ user, isOpen, onConfirm, onCancel, isLoading }: DeleteUserModalProps) {
  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="md">
      <ModalHeader>
        <ModalTitle>Delete user</ModalTitle>
        <ModalDescription>
          Are you sure you want to remove <span className="font-semibold">{user.name}</span>? This action cannot be undone and the
          account will be permanently removed from Supabase Auth.
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
          {isLoading ? "Deleting..." : "Delete"}
        </button>
      </ModalFooter>
    </Modal>
  );
}
