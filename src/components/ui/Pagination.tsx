import * as React from "react";

interface PaginationProps {
  total: number;
  current: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  maxButtons?: number;
  className?: string;
}

export function Pagination({
  total,
  current,
  pageSize,
  onPageChange,
  maxButtons = 5,
  className = ""
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages === 1) return null;

  // Calculate page numbers to show
  let start = Math.max(1, current - Math.floor(maxButtons / 2));
  const end = Math.min(totalPages, start + maxButtons - 1);
  if (end - start + 1 < maxButtons) {
    start = Math.max(1, end - maxButtons + 1);
  }
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav
      className={`flex items-center justify-center gap-1 mt-6 select-none ${className}`}
      aria-label="Pagination"
    >
      <button
        aria-label="Previous"
        onClick={() => onPageChange(current - 1)}
        disabled={current === 1}
        className={`mx-0.5 flex h-11 w-11 min-w-[44px] min-h-[44px] items-center justify-center rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation`}
      >
        <span className="sr-only">Previous</span>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
      </button>
      {start > 1 && (
        <button
          onClick={() => onPageChange(1)}
          className="px-3 py-2 min-h-[44px] min-w-[44px] border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md touch-manipulation flex items-center justify-center"
        >
          1
        </button>
      )}
      {start > 2 && <span className="px-2">...</span>}
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          aria-current={current === page ? "page" : undefined}
          className={`mx-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 dark:border-gray-700 transition text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500
            ${current === page
              ? "bg-blue-600 text-white border-blue-600 dark:border-blue-500"
              : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"}
          `}
        >
          {page}
        </button>
      ))}
      {end < totalPages - 1 && <span className="px-2">...</span>}
      {end < totalPages && (
        <button
          onClick={() => onPageChange(totalPages)}
          className="mx-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {totalPages}
        </button>
      )}
      <button
        aria-label="Next"
        onClick={() => onPageChange(current + 1)}
        disabled={current === totalPages}
        className={`mx-0.5 flex h-11 w-11 min-w-[44px] min-h-[44px] items-center justify-center rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation`}
      >
        <span className="sr-only">Next</span>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
      </button>
    </nav>
  );
}

export default Pagination;
