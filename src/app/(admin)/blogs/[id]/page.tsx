'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';

// Dynamically import Editor with no SSR
const Editor = dynamic(() => import('@/components/Editor/Editor'), {
  ssr: false,
});

interface FeaturedImage {
  status?: string; // Optional: some blogs don't have status field
  completed_at?: { $date: string };
  url: string;
  id?: string;
  filename?: string;
  storage_path?: string;
  created_at?: { $date: string };
  style_used?: string;
  generation_method?: string;
  image_metadata?: {
    width: number;
    height: number;
    format: string;
    mode: string;
  };
  file_size?: number;
  request_id?: string;
}

interface PrimaryKeyword {
  keyword: string;
  search_volume?: number;
  difficulty?: number;
  intent?: string;
  country?: string;
  tag: string;
  generated_at?: { $date: string };
  finalized_at?: { $date: string };
}

interface SecondaryKeywordItem {
  keyword: string;
  search_volume?: number;
  difficulty?: number;
  intent?: string;
  selected?: string;
}

interface SecondaryKeywords {
  keywords: SecondaryKeywordItem[];
  tag: string;
  generated_at?: { $date: string };
  finalized_at?: { $date: string };
  primary_keyword?: string;
  intent?: string;
  country?: string;
}

interface StepEntry {
  step: string;
  status: string;
  completed_at: { $date: string } | string;
}

interface StepTracking {
  current_step?: string;
  primary_keyword?: StepEntry[];
  secondary_keywords?: StepEntry[];
  category?: StepEntry[];
  title?: StepEntry[];
  outline?: StepEntry[];
  sources?: StepEntry[];
  content?: StepEntry[];
  rayo_featured_image?: StepEntry[];
  [key: string]: StepEntry[] | string | undefined;
}

interface BlogData {
  _id: string;
  title: string | string[];
  content: string | Array<{ html: string }>;
  word_count: number | string | number[];
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  project_id: string;
  is_active?: boolean;
  rayo_featured_image?: FeaturedImage;
  primary_keyword?: PrimaryKeyword[];
  secondary_keywords?: SecondaryKeywords[];
  category?: string;
  subcategory?: string;
  step_tracking?: StepTracking;
}

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [blog, setBlog] = useState<BlogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);

  useEffect(() => {
    if (params?.id) {
      fetchBlogData(params.id as string);
    }
  }, [params?.id]);

  // Redirect to journey page if blog status is incomplete (only once)
  useEffect(() => {
    if (blog && blog.status === 'incomplete' && !window.location.pathname.includes('/journey')) {
      router.push(`/blogs/${params.id}/journey`);
    }
  }, [blog, params.id, router]);

  // Close image preview on ESC key and lock body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showImagePreview) {
        setShowImagePreview(false);
      }
    };

    if (showImagePreview) {
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      // Restore body scroll
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showImagePreview]);

  const fetchBlogData = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/blogs/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch blog data');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setBlog(result.data);
      } else {
        throw new Error(result.error || 'Failed to load blog');
      }
    } catch (err) {
      console.error('Error fetching blog:', err);
      setError(err instanceof Error ? err.message : 'Failed to load blog');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get title (handle array or string)
  const getTitle = () => {
    if (!blog?.title) return 'Untitled';
    if (Array.isArray(blog.title)) {
      if (blog.title.length === 0) return 'Untitled';
      const lastTitle = blog.title[blog.title.length - 1];
      return lastTitle && lastTitle.trim() !== '' ? lastTitle : 'Untitled';
    }
    return blog.title && blog.title.trim() !== '' ? blog.title : 'Untitled';
  };

  // Helper to get word count
  const getWordCount = () => {
    if (!blog?.word_count) return 0;
    if (Array.isArray(blog.word_count)) {
      return blog.word_count[blog.word_count.length - 1] || 0;
    }
    if (typeof blog.word_count === 'string') {
      return parseInt(blog.word_count) || 0;
    }
    return blog.word_count;
  };

  // Helper to get primary keyword (from final tag)
  const getPrimaryKeyword = () => {
    if (!blog?.primary_keyword || !Array.isArray(blog.primary_keyword)) return null;
    const finalKeyword = blog.primary_keyword.find(k => k.tag === 'final');
    return finalKeyword?.keyword || null;
  };

  // Helper to get selected secondary keywords (from final tag)
  const getSecondaryKeywords = () => {
    if (!blog?.secondary_keywords || !Array.isArray(blog.secondary_keywords)) return [];
    const finalEntry = blog.secondary_keywords.find(entry => entry.tag === 'final');
    if (!finalEntry) return [];
    return finalEntry.keywords
      .filter(k => k.selected === 'true')
      .map(k => k.keyword);
  };

  // Helper to get HTML content with featured image embedded
  const getHtmlContent = () => {
    let htmlContent = '<p>No content available</p>';

    // Get blog content
    if (blog?.content) {
      if (Array.isArray(blog.content)) {
        htmlContent = blog.content
          .map(item => item.html || '')
          .join('\n');
      } else {
        htmlContent = blog.content;
      }
    }

    // Prepend featured image if available
    if (getFeaturedImageUrl()) {
      const imageHtml = `
        <img src="${getFeaturedImageUrl()}" alt="${getTitle()}" data-width="large" />
        <p></p>
      `;
      htmlContent = imageHtml + htmlContent;
    }

    return htmlContent;
  };

  // Helper to get featured image URL
  const getFeaturedImageUrl = () => {
    if (!blog?.rayo_featured_image) return null;

    // If there's a status field, check if it's completed
    if (blog.rayo_featured_image.status) {
      if (blog.rayo_featured_image.status === 'completed' && blog.rayo_featured_image.url) {
        return blog.rayo_featured_image.url;
      }
      return null;
    }

    // If no status field, just check if url exists
    if (blog.rayo_featured_image.url) {
      return blog.rayo_featured_image.url;
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading blog...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-gray-600 dark:text-gray-400">Blog not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Blog Info Header - Fixed at top */}
      <div className="bg-white dark:bg-gray-900 shadow-sm px-6 py-4 rounded-lg mx-4 mt-4">
        <div className="max-w-screen-xl mx-auto">
          {/* Title and Metadata Row */}
          <div className="flex items-start justify-between gap-6 mb-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex-1">
              {getTitle()}
            </h1>

            <div className="flex flex-col items-end gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {getWordCount().toLocaleString()} words
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  blog.status === 'completed'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : blog.status === 'in progress'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    : blog.status === 'failed'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {blog.status}
                </span>
                {blog.is_active === false && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    Deleted
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span>Created: {new Date(blog.created_at).toLocaleString()}</span>
                <span>Updated: {new Date(blog.updated_at).toLocaleString()}</span>
              </div>
              {/* View Journey Button */}
              {blog.step_tracking && (
                <button
                  onClick={() => router.push(`/blogs/${params.id}/journey`)}
                  className="flex items-center gap-2 px-3 py-1.5 mt-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-xs font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  View Journey
                </button>
              )}
            </div>
          </div>

          {/* Keywords and Category Tags */}
          {(getPrimaryKeyword() || getSecondaryKeywords().length > 0 || blog.category || blog.subcategory) && (
            <div className="space-y-2">
              {/* Primary Keyword */}
              {getPrimaryKeyword() && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 min-w-20">Primary:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                    {getPrimaryKeyword()}
                  </span>
                </div>
              )}

              {/* Secondary Keywords */}
              {getSecondaryKeywords().length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 min-w-20 pt-0.5">Secondary:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {getSecondaryKeywords().map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Category & Subcategory */}
              {(blog.category || blog.subcategory) && (
                <div className="flex items-center gap-2 flex-wrap">
                  {blog.category && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      Category: {blog.category}
                    </span>
                  )}
                  {blog.subcategory && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400">
                      Subcategory: {blog.subcategory}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Blog Content Editor - Scrollable (image embedded in content) */}
      <div className="flex-1 overflow-hidden mx-4 mb-4 mt-4">
        <div className="h-full bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-y-auto">
          <Editor initialContent={getHtmlContent()} readOnly={false} />
        </div>
      </div>

      {/* Full-Screen Image Preview Modal */}
      {showImagePreview && getFeaturedImageUrl() && (
        <div
          className="fixed inset-0 z-[9999] bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setShowImagePreview(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div className="relative max-w-7xl max-h-full">
            {/* Close button */}
            <button
              onClick={() => setShowImagePreview(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Full-size image */}
            <Image
              src={getFeaturedImageUrl()!}
              alt={getTitle()}
              className="max-w-full max-h-[90vh] object-contain rounded-lg w-auto h-auto"
              onClick={(e) => e.stopPropagation()}
              width={1200}
              height={800}
              unoptimized
            />

            {/* Image metadata */}
            {blog.rayo_featured_image && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white px-4 py-3 rounded-b-lg">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    {blog.rayo_featured_image.style_used && (
                      <span className="font-medium">Style: {blog.rayo_featured_image.style_used}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-300">
                    {blog.rayo_featured_image.image_metadata && (
                      <span>
                        {blog.rayo_featured_image.image_metadata.width} × {blog.rayo_featured_image.image_metadata.height}
                      </span>
                    )}
                    {blog.rayo_featured_image.generation_method && (
                      <span>Method: {blog.rayo_featured_image.generation_method}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
