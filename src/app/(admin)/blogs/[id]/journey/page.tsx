'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StepDetails from './StepDetails';

interface StepEntry {
  step: string;
  status: string;
  completed_at: { $date: string } | string;
}

interface PrimaryKeyword {
  keyword: string;
  search_volume?: number;
  difficulty?: number;
  intent?: string;
  country?: string;
  tag: string;
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
}

interface OutlineItem {
  section: string;
  subsections?: string[];
}

interface Outline {
  outline: OutlineItem[];
  tag?: string;
}

interface Source {
  url?: string;
  title?: string;
  relevance_score?: number;
  content?: string;
}

interface FeaturedImage {
  url?: string;
  filename?: string;
  status?: string;
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
  status: string;
  created_at: string;
  updated_at: string;
  country?: string;
  step_tracking?: StepTracking;
  primary_keyword?: PrimaryKeyword[];
  secondary_keywords?: SecondaryKeywords[];
  category?: string;
  subcategory?: string;
  outline?: Outline[];
  sources?: Source[];
  content?: string | Array<{ html: string }>;
  rayo_featured_image?: FeaturedImage;
}

export default function BlogJourneyPage() {
  const params = useParams();
  const router = useRouter();
  const [blog, setBlog] = useState<BlogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStep, setSelectedStep] = useState<string>('primary_keyword');

  useEffect(() => {
    if (params?.id) {
      fetchBlogData(params.id as string);
    }
  }, [params?.id]);

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
      return blog.title[blog.title.length - 1] || 'Untitled';
    }
    return blog.title;
  };

  // Helper to format step name
  const formatStepName = (step: string) => {
    return step.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Helper to convert country code to flag emoji
  const getCountryFlag = (countryCode: string) => {
    if (!countryCode) return '';
    const code = countryCode.toUpperCase();
    // Convert country code to flag emoji using regional indicator symbols
    return code
      .split('')
      .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
      .join('');
  };

  // Helper to get countries from blog data
  const getCountries = () => {
    // Get from root-level country field
    if (blog?.country) {
      return [blog.country];
    }
    return [];
  };

  // Helper to safely parse date from MongoDB format or direct string
  const parseDate = (dateValue: { $date: string } | string | undefined) => {
    if (!dateValue) return null;

    try {
      let date: Date | null = null;

      // If it's an object with $date property
      if (typeof dateValue === 'object' && '$date' in dateValue) {
        date = new Date(dateValue.$date);
      }
      // If it's a direct string
      else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      }

      // Validate the date
      if (date && !isNaN(date.getTime())) {
        return date;
      }
      return null;
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  };

  // Helper to get step status icon
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'done':
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'generated':
      case 'updated':
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading journey...</p>
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

  if (!blog.step_tracking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 dark:text-gray-400 mb-4">No journey data available for this blog</div>
          <button
            onClick={() => router.push(`/blogs/${params.id}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    'primary_keyword',
    'secondary_keywords',
    'category',
    'title',
    'outline',
    'sources',
    'content',
    'rayo_featured_image'
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Blog Generation Journey
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {getTitle()}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                Current Step: {formatStepName(blog.step_tracking?.current_step || 'Unknown')}
              </div>
              {getCountries().length > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                  <span>Country:</span>
                  {getCountries().map((country, idx) => (
                    <span key={country} className="flex items-center gap-1">
                      <span className="text-xl">{getCountryFlag(country)}</span>
                      {idx < getCountries().length - 1 && <span className="mx-1">,</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Back to Editor button */}
          <button
            onClick={() => router.push(`/blogs/${params.id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Back to Editor
          </button>
        </div>
      </div>

      {/* Two Column Layout: 30% Timeline | 70% Details */}
      <div className="max-w-[1800px] mx-auto flex gap-6">
        {/* Left Column - Timeline (30%) */}
        <div className="w-[30%] bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 sticky top-6 h-fit max-h-[calc(100vh-100px)] overflow-y-auto">
          <div className="space-y-8">
            {steps.map((stepName, index) => {
              const stepEntries = blog.step_tracking?.[stepName] as StepEntry[] | undefined;
              const latestEntry = stepEntries?.[stepEntries.length - 1];
              const isActive = blog.step_tracking?.current_step === stepName;
              const isDone = latestEntry?.status === 'done';
              const isInProgress = latestEntry && latestEntry.status !== 'done';
              const isSelected = selectedStep === stepName;

              return (
                <div key={stepName} className="relative">
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className={`absolute left-4 top-8 w-0.5 h-full ${isDone ? 'bg-green-200 dark:bg-green-900/50' : 'bg-gray-200 dark:bg-gray-800'}`} />
                  )}

                  {/* Step content */}
                  <button
                    onClick={() => setSelectedStep(stepName)}
                    className={`relative flex items-start gap-4 w-full text-left p-3 rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500 dark:ring-blue-400'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {/* Icon */}
                    <div className="relative z-10">
                      {getStepIcon(latestEntry?.status || 'pending')}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className={`text-lg font-semibold ${isDone ? 'text-gray-900 dark:text-white' : isInProgress ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'}`}>
                          {formatStepName(stepName)}
                        </h3>
                        {isActive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            Active
                          </span>
                        )}
                      </div>

                      {latestEntry && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Status: <span className="font-medium">{latestEntry.status}</span>
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {parseDate(latestEntry.completed_at)?.toLocaleString() || 'Pending'}
                          </p>

                          {/* Show history if multiple entries */}
                          {stepEntries && stepEntries.length > 1 && (
                            <details className="mt-2">
                              <summary className="text-xs text-gray-500 dark:text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                                View history ({stepEntries.length} updates)
                              </summary>
                              <div className="mt-2 space-y-1 pl-4 border-l-2 border-gray-200 dark:border-gray-800">
                                {stepEntries.map((entry, idx) => (
                                  <div key={idx} className="text-xs text-gray-500 dark:text-gray-500">
                                    <span className="font-medium">{entry.status}</span> - {parseDate(entry.completed_at)?.toLocaleString() || 'Pending'}
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      )}

                      {!latestEntry && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">Pending</p>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column - Step Details (70%) */}
        <div className="w-[70%]">
          <StepDetails selectedStep={selectedStep} blog={blog} />
        </div>
      </div>
    </div>
  );
}
