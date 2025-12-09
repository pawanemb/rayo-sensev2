"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FaList, FaTh } from "react-icons/fa";
import { generateAvatar } from "@/utils/avatar";
import {
  getProjectImages,
  type ProjectImage,
  type PaginationInfo,
} from "@/services/projectImageService";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

interface ProjectImageGalleryProps {
  projectId: string;
}

export default function ProjectImageGallery({ projectId }: ProjectImageGalleryProps) {
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 6,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [hoveredImage, setHoveredImage] = useState<{ filename: string; description: string | null; x: number; y: number } | null>(null);

  const fetchImages = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await getProjectImages({
        projectId,
        page,
        limit: 6,
      });
      setImages(response.images);
      setPagination(response.pagination);
    } catch (err) {
      console.error("Failed to fetch project images:", err);
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchImages(newPage);
    }
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

  const lightboxSlides = images.map(img => ({
    src: img.public_url,
    alt: img.original_filename,
    width: img.width || undefined,
    height: img.height || undefined,
  }));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Project Images
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {pagination.total} {pagination.total === 1 ? "image" : "images"}
          </p>
        </div>

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
      </div>

      {viewMode === "list" ? (
        /* List View */
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-white/5 dark:text-gray-400">
              <TableRow>
                <TableCell className="px-4 py-3">Preview</TableCell>
                <TableCell className="px-4 py-3">Filename</TableCell>
                <TableCell className="px-4 py-3">User</TableCell>
                <TableCell className="px-4 py-3">Category</TableCell>
                <TableCell className="px-4 py-3">Size</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-4 py-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))
              ) : images.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No images found for this project.
                  </TableCell>
                </TableRow>
              ) : (
                images.map((image, index) => (
                  <TableRow
                    key={image.id}
                    onClick={() => openLightbox(index)}
                    className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <TableCell className="px-4 py-3">
                      <div
                        className="relative h-10 w-10 overflow-hidden rounded-lg border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
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
                          sizes="40px"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white max-w-[200px]" title={image.original_filename}>
                        {image.original_filename}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {image.user && (
                        <div className="flex items-center gap-2">
                          <div className="relative h-6 w-6 flex-shrink-0 overflow-hidden rounded-full border border-gray-100 dark:border-gray-700">
                            <Image
                              src={image.user.avatar || generateAvatar(image.user.name || image.user.email)}
                              alt={image.user.name || image.user.email}
                              fill
                              className="object-cover"
                              sizes="24px"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            {image.user.name && (
                              <p className="truncate text-sm font-medium text-gray-900 dark:text-white max-w-[150px]">
                                {image.user.name}
                              </p>
                            )}
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400 max-w-[150px]">
                              {image.user.email}
                            </p>
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {image.category ? (
                        <span className="inline-flex rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-medium text-brand-600 dark:text-brand-300">
                          {image.category}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatFileSize(image.file_size)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* Grid View */
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                  <div className="aspect-video w-full bg-gray-100 dark:bg-gray-700 animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : images.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No images found for this project.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  <div className="relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <Image
                      src={image.public_url}
                      alt={image.original_filename}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    {image.category && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex rounded-full bg-brand-500/90 backdrop-blur-sm px-2 py-0.5 text-xs font-medium text-white shadow-lg">
                          {image.category}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    <h4 className="truncate text-sm font-medium text-gray-900 dark:text-white" title={image.original_filename}>
                      {image.original_filename}
                    </h4>
                    {image.user && (
                      <div className="flex items-center gap-2">
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
                            <p className="truncate text-xs font-medium text-gray-900 dark:text-white">
                              {image.user.name}
                            </p>
                          )}
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {image.user.email}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatFileSize(image.file_size)}</span>
                      {image.width && image.height && (
                        <span>{image.width} × {image.height}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {!isLoading && images.length > 0 && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Previous
          </button>

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
                  className={`h-8 w-8 rounded-lg text-sm font-medium ${
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
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Next
          </button>
        </div>
      )}

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={lightboxSlides}
      />

      {/* Hover Tooltip */}
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
