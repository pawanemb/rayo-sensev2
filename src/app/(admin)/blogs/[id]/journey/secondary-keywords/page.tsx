'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

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
  generated_at?: { $date: string } | string;
  finalized_at?: { $date: string } | string;
  primary_keyword?: string;
}

interface BlogData {
  secondary_keywords?: SecondaryKeywords[];
}

export default function SecondaryKeywordsPage() {
  const params = useParams();
  const router = useRouter();
  const [blog, setBlog] = useState<BlogData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      fetchBlogData(params.id as string);
    }
  }, [params?.id]);

  const fetchBlogData = async (id: string) => {
    try {
      const response = await fetch(`/api/blogs/${id}`, { credentials: 'include' });
      const result = await response.json();
      if (result.success && result.data) {
        setBlog(result.data);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseDate = (dateValue: { $date: string } | string | undefined) => {
    if (!dateValue) return null;
    try {
      if (typeof dateValue === 'object' && '$date' in dateValue) return new Date(dateValue.$date);
      if (typeof dateValue === 'string') return new Date(dateValue);
      return null;
    } catch {
      return null;
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-6">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.push(`/blogs/${params.id}/journey`)}
          className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Journey
        </button>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Secondary Keywords
            {blog?.secondary_keywords && (
              <span className="ml-auto text-lg font-normal text-gray-500 dark:text-gray-400">
                {blog.secondary_keywords.length} entries
              </span>
            )}
          </h1>

          {blog?.secondary_keywords && blog.secondary_keywords.length > 0 ? (
            <div className="space-y-6">
              {blog.secondary_keywords.map((entry, idx) => (
                <div key={idx} className="border-l-4 border-indigo-300 dark:border-indigo-900 pl-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-r-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      entry.tag === 'final' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      entry.tag === 'updated' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {entry.tag}
                    </span>
                    {(entry.generated_at || entry.finalized_at) && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {parseDate(entry.finalized_at || entry.generated_at)?.toLocaleString()}
                      </span>
                    )}
                    {entry.primary_keyword && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">Primary: {entry.primary_keyword}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {entry.keywords.map((kw, kwIdx) => (
                      <div key={kwIdx} className={`p-4 rounded-lg border-2 ${
                        kw.selected === 'true' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700' :
                        'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-60'
                      }`}>
                        <div className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          {kw.keyword}
                          {kw.selected === 'true' && (
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          {kw.search_volume && <div>Volume: {kw.search_volume.toLocaleString()}</div>}
                          {kw.difficulty && <div>Difficulty: {kw.difficulty}</div>}
                          {kw.intent && <div className="capitalize">Intent: {kw.intent}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No secondary keywords data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
