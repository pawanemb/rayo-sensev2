
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ResponseTabs from './ResponseTabs';

interface ResponseDisplayProps {
  response: string;
  loading: boolean;
  error: string | null;
  responseTime?: number;
  wordCount?: number;
}

export default function ResponseDisplay({
  response,
  loading,
  error,
  responseTime,
  wordCount = 0
}: ResponseDisplayProps) {
  const [copySuccess, setCopySuccess] = useState('');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(response).then(() => {
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  if (loading && !response) {
    return (
      <Card className="h-full flex flex-col items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-200 dark:border-brand-800 border-t-brand-600 dark:border-t-brand-500 rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Generating response...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-950/20">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-error-100 dark:bg-error-900/50 flex items-center justify-center text-error-600 dark:text-error-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-error-900 dark:text-error-100 mb-1">Error Generating Response</h3>
              <p className="text-error-700 dark:text-error-300">{error}</p>
              {error.includes("Missing API Key") && (
                <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="mt-3 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Add API Key
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!response) {
    return (
      <Card className="h-full flex flex-col items-center justify-center min-h-[400px] text-gray-400 dark:text-gray-600">
        <div className="flex flex-col items-center gap-4">
          <svg className="w-16 h-16 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p className="font-medium">Response will appear here</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          Response
          {loading && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
          )}
        </CardTitle>
        <div className="flex items-center gap-3">
          {responseTime !== undefined && (
            <span className="text-xs text-gray-400">
              {responseTime.toFixed(2)}s
            </span>
          )}
          <span className="text-xs text-gray-400">
            {wordCount} words
          </span>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            {copySuccess ? (
              <>
                <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-600 dark:text-green-400">{copySuccess}</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto">
        <ResponseTabs content={response} />
      </CardContent>
    </Card>
  );
}
