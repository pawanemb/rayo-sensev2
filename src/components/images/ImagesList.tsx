"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { FaSearch, FaTimes } from "react-icons/fa";
import {
  getProjectImages,
  type ProjectImage,
  type PaginationInfo,
} from "@/services/projectImageService";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import Alert from "@/components/ui/alert/Alert";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

export default function ImagesList() {
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 12,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [hoveredImage, setHoveredImage] = useState<{ filename: string; description: string | null; x: number; y: number } | null>(null);

  // Filters
  const [userFilter, setUserFilter] = useState("");

  const fetchImages = useCallback(
    async (page = 1, search = "", projectId = "", userId = "", category = "", limit = 12) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getProjectImages({
          page,
          limit,
          search,
          ...(projectId && { projectId }),
          ...(userId && { userId }),
          ...(category && { category }),
        });

        setImages(response.images);
        setPagination(response.pagination);
      } catch (err) {
        console.error("Failed to fetch images:", err);
        setError("Failed to load images. Please try again.");
        setImages([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchImages(1, searchTerm, "", userFilter, "");
  }, [searchTerm, userFilter, fetchImages]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchImages(newPage, searchTerm, "", userFilter, "");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setUserFilter("");
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };


  const lightboxSlides = images.map(img => ({
    src: img.public_url,
    alt: img.original_filename,
    width: img.width || undefined,
    height: img.height || undefined,
  }));

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Image Gallery
              <span className="ml-3 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-500">
                {pagination.total.toLocaleString()}{" "}
                {searchTerm ? "results" : "images"}
              </span>
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage and view all project images
            </p>
          </div>
        </div>

        {/* Search Row */}
        <div className="relative">
          <input
            type="text"
            className="h-11 w-full rounded-full border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            placeholder="Search by filename, description, or category..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <FaSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          {searchInput && (
            <button
              onClick={handleClearFilters}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <FaTimes className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          variant="error"
          title="Error"
          message={error}
        />
      )}

      {/* Images Grid/Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[960px]">
            <Table>
              <TableHeader className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-white/5 dark:text-gray-400">
                <TableRow>
                  <TableCell className="px-5 py-4">Preview</TableCell>
                  <TableCell className="px-5 py-4">Filename</TableCell>
                  <TableCell className="px-5 py-4">Project</TableCell>
                  <TableCell className="px-5 py-4">User</TableCell>
                  <TableCell className="px-5 py-4">Size / Dimensions</TableCell>
                  <TableCell className="px-5 py-4">Category</TableCell>
                  <TableCell className="px-5 py-4">Uploaded</TableCell>
                </TableRow>
              </TableHeader>
              {isLoading ? (
                <TableSkeleton rows={10} columns={7} />
              ) : (
                <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                  {images.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                        {searchTerm
                          ? "No images found. Try a different search term."
                          : "No images have been uploaded yet."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    images.map((image, index) => (
                      <TableRow
                        key={image.id}
                        onClick={() => openLightbox(index)}
                        className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        {/* Preview Thumbnail */}
                        <TableCell className="px-5 py-4">
                          <div
                            className="relative h-12 w-12 overflow-hidden rounded-lg border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHoveredImage({
                                filename: image.original_filename,
                                description: image.description,
                                x: rect.left + rect.width / 2,
                                y: rect.top - 10,
                              });
                            }}
                            onMouseMove={(e) => {
                              if (hoveredImage) {
                                setHoveredImage({
                                  ...hoveredImage,
                                  x: e.clientX,
                                  y: e.clientY - 20,
                                });
                              }
                            }}
                            onMouseLeave={() => setHoveredImage(null)}
                          >
                            <Image
                              src={image.public_url}
                              alt={image.original_filename}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                        </TableCell>

                        {/* Filename */}
                        <TableCell className="px-5 py-4">
                          <div className="max-w-[200px]">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-white" title={image.original_filename}>
                              {image.original_filename}
                            </p>
                          </div>
                        </TableCell>

                        {/* Project */}
                        <TableCell className="px-5 py-4">
                          {image.project ? (
                            <div className="flex items-center gap-3">
                              <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded border border-gray-100 dark:border-gray-700">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={`https://www.google.com/s2/favicons?domain=${new URL(image.project.url).hostname}&sz=64`}
                                  alt={image.project.name}
                                  className="h-full w-full object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                  {image.project.name}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                                  {image.project.url}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </TableCell>

                        {/* User */}
                        <TableCell className="px-5 py-4">
                          {image.user ? (
                            <div className="flex items-center gap-3">
                              {image.user.avatar && (
                                <div className="relative h-8 w-8 overflow-hidden rounded-full">
                                  <Image
                                    src={image.user.avatar}
                                    alt={image.user.name || image.user.email}
                                    fill
                                    className="object-cover"
                                    sizes="32px"
                                  />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                {image.user.name && (
                                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                    {image.user.name}
                                  </p>
                                )}
                                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                  {image.user.email}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </TableCell>

                        {/* Size / Dimensions */}
                        <TableCell className="px-5 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatFileSize(image.file_size)}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                              {image.width && image.height
                                ? `${image.width} × ${image.height}`
                                : "—"}
                            </p>
                          </div>
                        </TableCell>

                        {/* Category */}
                        <TableCell className="px-5 py-4">
                          {image.category ? (
                            <span className="inline-flex rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-medium text-brand-600 dark:text-brand-300">
                              {image.category}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </TableCell>

                        {/* Uploaded Date */}
                        <TableCell className="px-5 py-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDateTime(image.created_at)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              )}
            </Table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && images.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900 sm:flex-row">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Showing{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {(pagination.currentPage - 1) * pagination.limit + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {Math.min(pagination.currentPage * pagination.limit, pagination.total)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {pagination.total}
            </span>{" "}
            images
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`h-10 w-10 rounded-lg text-sm font-medium ${
                      pageNum === pagination.currentPage
                        ? "bg-brand-500 text-white"
                        : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Lightbox for Image Preview */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={lightboxSlides}
      />

      {/* Custom Tooltip that follows cursor */}
      {hoveredImage && hoveredImage.description && (
        <div
          className="pointer-events-none fixed z-[99999] max-w-sm rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800"
          style={{
            left: `${hoveredImage.x}px`,
            top: `${hoveredImage.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="text-sm text-gray-900 dark:text-white">
            {hoveredImage.description}
          </p>
        </div>
      )}
    </div>
  );
}
