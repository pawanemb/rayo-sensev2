'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface PrimaryKeyword {
  keyword: string;
  search_volume?: number;
  difficulty?: number;
  intent?: string;
  country?: string;
  tag: string;
  generated_at?: { $date: string } | string;
  finalized_at?: { $date: string } | string;
}

interface BlogData {
  _id: string;
  title: string | string[];
  primary_keyword?: PrimaryKeyword[];
}

export default function PrimaryKeywordPage() {
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
      if (typeof dateValue === 'object' && '$date' in dateValue) {
        return new Date(dateValue.$date);
      }
      if (typeof dateValue === 'string') {
        return new Date(dateValue);
      }
      return null;
    } catch {
      return null;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-6">
      <div className="max-w-4xl mx-auto">
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
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Primary Keyword
            {blog?.primary_keyword && (
              <span className="ml-auto text-lg font-normal text-gray-500 dark:text-gray-400">
                {blog.primary_keyword.length} {blog.primary_keyword.length === 1 ? 'entry' : 'entries'}
              </span>
            )}
          </h1>

          {blog?.primary_keyword && blog.primary_keyword.length > 0 ? (
            <div className="space-y-6">
              {blog.primary_keyword.map((kw, idx) => (
                <div key={idx} className="border-l-4 border-purple-300 dark:border-purple-900 pl-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-r-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      kw.tag === 'final'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : kw.tag === 'updated'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {kw.tag}
                    </span>
                    {(kw.generated_at || kw.finalized_at) && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {parseDate(kw.finalized_at || kw.generated_at)?.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {kw.keyword}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {kw.search_volume && (
                      <div className="bg-white dark:bg-gray-900 px-4 py-3 rounded-lg">
                        <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Search Volume</span>
                        <span className="text-xl font-semibold text-gray-900 dark:text-white">
                          {kw.search_volume.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {kw.difficulty && (
                      <div className="bg-white dark:bg-gray-900 px-4 py-3 rounded-lg">
                        <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Difficulty</span>
                        <span className="text-xl font-semibold text-gray-900 dark:text-white">
                          {kw.difficulty}
                        </span>
                      </div>
                    )}
                    {kw.intent && (
                      <div className="bg-white dark:bg-gray-900 px-4 py-3 rounded-lg">
                        <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Intent</span>
                        <span className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
                          {kw.intent}
                        </span>
                      </div>
                    )}
                    {kw.country && (
                      <div className="bg-white dark:bg-gray-900 px-4 py-3 rounded-lg">
                        <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Country</span>
                        <span className="text-xl font-semibold text-gray-900 dark:text-white uppercase">
                          {kw.country}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No primary keyword data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
