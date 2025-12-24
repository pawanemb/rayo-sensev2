
"use client";

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface ResponseTabsProps {
  content: string;
}

export default function ResponseTabs({ content }: ResponseTabsProps) {
  const [activeTab, setActiveTab] = useState<'raw' | 'rich' | 'html'>('rich');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('rich')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'rich'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Rich Text
        </button>
        <button
          onClick={() => setActiveTab('raw')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'raw'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Raw Text
        </button>
        <button
          onClick={() => setActiveTab('html')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'html'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Raw HTML
        </button>
      </div>

      <div className="min-h-[200px] text-gray-800 dark:text-gray-200">
              {activeTab === 'rich' && (
          <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm, remarkBreaks]}
              components={{
                p({children}) {
                  return <p className="mb-4 last:mb-0 leading-relaxed whitespace-pre-wrap">{children}</p>
                },
                h1({children}) {
                  return <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>
                },
                h2({children}) {
                  return <h2 className="text-xl font-bold mt-5 mb-3">{children}</h2>
                },
                h3({children}) {
                  return <h3 className="text-lg font-bold mt-4 mb-2">{children}</h3>
                },
                ul({children}) {
                  return <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>
                },
                ol({children}) {
                  return <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>
                },
                li({children}) {
                  return <li>{children}</li>
                },
                blockquote({children}) {
                  return <blockquote className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 italic my-4 text-gray-600 dark:text-gray-400">{children}</blockquote>
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                code({inline, className, children, ...props}: {inline?: boolean; className?: string; children?: React.ReactNode; [key: string]: any}) {
                  return !inline ? (
                    <div className="my-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                      <pre className="bg-gray-50 dark:bg-gray-900 p-4 overflow-x-auto text-sm font-mono m-0">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  ) : (
                    <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-brand-600 dark:text-brand-400" {...props}>
                      {children}
                    </code>
                  )
                },
                table({children}) {
                  return (
                    <div className="overflow-x-auto my-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                        {children}
                      </table>
                    </div>
                  )
                },
                thead({children}) {
                  return <thead className="bg-gray-50 dark:bg-gray-800/50">{children}</thead>
                },
                th({children}) {
                  return <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{children}</th>
                },
                td({children}) {
                  return <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-800">{children}</td>
                },
                a({children, href}) {
                  return <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">{children}</a>
                }
              }}
            >
              {content || '_No content_'}
            </ReactMarkdown>
          </div>
        )}
        
        {activeTab === 'raw' && (
          <pre className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-x-auto font-mono text-sm whitespace-pre-wrap">
            {content}
          </pre>
        )}

        {activeTab === 'html' && (
          <div className="space-y-2">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 text-xs rounded border border-yellow-200 dark:border-yellow-800">
              Note: This is simulated HTML structure from the Markdown parser.
            </div>
            <pre className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-x-auto font-mono text-sm whitespace-pre-wrap text-blue-600 dark:text-blue-400">
              {/* For HTML view, we can render the markdown to HTML string if needed, but for now simple block splitting is okay or we can use a library if critical. 
                  Given user wants 'remark-gfm' for 'response', the Rich Text tab is the priority. 
                  The Raw HTML tab was a simulation before. */}
              {content.split('\n\n').map(p => `<p>${p}</p>`).join('\n')}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
