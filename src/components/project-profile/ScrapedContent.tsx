"use client";

import React, { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal, ModalBody, ModalHeader, ModalTitle } from "@/components/ui/modal";

interface ScrapedContentProps {
  scrapedContent: string | null;
}

export default function ScrapedContent({ scrapedContent }: ScrapedContentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!scrapedContent) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Scraped Content
        </h3>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  const truncate = (html: string, length: number) => {
    const text = new DOMParser().parseFromString(html, "text/html").body.textContent || "";
    return text.length > length ? text.substring(0, length) + "..." : text;
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Scraped Content
          </h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            View More
          </button>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 break-words">
          {truncate(scrapedContent, 200)}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="xl">
        <ModalHeader>
          <ModalTitle>Scraped HTML Content</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="max-h-[70vh] overflow-y-auto">
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: scrapedContent }}
            />
          </div>
        </ModalBody>
      </Modal>
    </>
  );
}
