"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { FaSearch, FaTimes, FaList, FaTh } from "react-icons/fa";
import { generateAvatar } from "@/utils/avatar";
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
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

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
      {/* Header with Search */}
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-brand-600 shadow-sm dark:bg-gray-900 dark:text-brand-400"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <FaList className="h-4 w-4" />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-brand-600 shadow-sm dark:bg-gray-900 dark:text-brand-400"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <FaTh className="h-4 w-4" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>

            {/* Search Input - Inline */}
            <div className="relative w-full lg:w-80">
              <input
                type="text"
                className="h-10 w-full rounded-full border border-gray-200 bg-gray-50 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                placeholder="Search by project, user, or filename..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <FaSearch className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              {searchInput && (
                <button
                  onClick={handleClearFilters}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                >
                  <FaTimes className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
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
      {viewMode === "list" ? (
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
                  <TableSkeleton rows={10} variant="images" />
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
                              <div className="relative h-8 w-8 overflow-hidden rounded-full border border-gray-100 dark:border-gray-700">
                                <Image
                                  src={image.user.avatar || generateAvatar(image.user.name || image.user.email)}
                                  alt={image.user.name || image.user.email}
                                  fill
                                  className="object-cover"
                                  sizes="32px"
                                />
                              </div>
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
      ) : (
        /* Grid View */
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                  <div className="aspect-video w-full bg-gray-100 dark:bg-gray-700 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : images.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchTerm
                  ? "No images found. Try a different search term."
                  : "No images have been uploaded yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  onClick={() => openLightbox(index)}
                  className="group cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:shadow-lg hover:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-400"
                  onMouseEnter={(e) => {
                    if (image.description) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredImage({
                        filename: image.original_filename,
                        description: image.description,
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10,
                      });
                    }
                  }}
                  onMouseMove={(e) => {
                    if (hoveredImage && image.description) {
                      setHoveredImage({
                        ...hoveredImage,
                        x: e.clientX,
                        y: e.clientY - 20,
                      });
                    }
                  }}
                  onMouseLeave={() => setHoveredImage(null)}
                >
                  {/* Image Preview with Category Overlay */}
                  <div className="relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <Image
                      src={image.public_url}
                      alt={image.original_filename}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />

                    {/* Category Badge Overlay */}
                    {image.category && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex rounded-full bg-brand-500/90 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-white shadow-lg">
                          {image.category}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-3">
                    {/* Filename */}
                    <h3 className="truncate text-sm font-medium text-gray-900 dark:text-white" title={image.original_filename}>
                      {image.original_filename}
                    </h3>

                    {/* Project and User Info Side by Side */}
                    <div className="flex items-center justify-between gap-3 text-xs">
                      {/* Project */}
                      {image.project ? (
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <div className="relative h-5 w-5 flex-shrink-0 overflow-hidden rounded border border-gray-100 dark:border-gray-700">
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
                            <p className="truncate text-gray-900 dark:text-white font-medium">
                              {image.project.name}
                            </p>
                            <p className="truncate text-gray-500 dark:text-gray-400">
                              {new URL(image.project.url).hostname}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1" />
                      )}

                      {/* User */}
                      {image.user && (
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <div className="relative h-5 w-5 flex-shrink-0 overflow-hidden rounded-full border border-gray-100 dark:border-gray-700">
                            <Image
                              src={image.user.avatar || generateAvatar(image.user.name || image.user.email)}
                              alt={image.user.name || image.user.email}
                              fill
                              className="object-cover"
                              sizes="20px"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            {image.user.name && (
                              <p className="truncate text-gray-900 dark:text-white font-medium">
                                {image.user.name}
                              </p>
                            )}
                            <p className="truncate text-gray-500 dark:text-gray-400">
                              {image.user.email}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(image.file_size)}
                      </span>
                      {image.width && image.height && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {image.width} × {image.height}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
