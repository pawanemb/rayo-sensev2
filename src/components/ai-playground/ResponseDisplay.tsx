
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FaChevronDown } from 'react-icons/fa';
import ResponseTabs from './ResponseTabs';

interface ResponseDisplayProps {
  response: string;
  loading: boolean;
  error: string | null;
  responseTime?: number;
  wordCount?: number;
  usage?: { input_tokens: number, output_tokens: number };
  cost?: number;
}

export default function ResponseDisplay({
  response,
  loading,
  error,
  responseTime,
  usage,
  cost
}: ResponseDisplayProps) {
  const [copySuccess, setCopySuccess] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(response).then(() => {
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  // Status Indicator
  const renderStatus = () => {
    if (loading) {
       if (response) return <span className="text-xs text-blue-600 animate-pulse">Streaming...</span>;
       return <span className="text-xs text-brand-600 animate-pulse">Generating...</span>;
    }
    if (error) return <span className="text-xs text-error-600">Error</span>;
    if (response) return <span className="text-xs text-green-600">Complete</span>;
    return <span className="text-xs text-gray-400">Ready</span>;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="h-full">
      <Card className="h-full flex flex-col overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="flex flex-row items-center justify-between py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="flex items-center gap-3">
               <FaChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
               <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                 Response
               </CardTitle>
               {renderStatus()}
            </div>
            
            <div className="flex items-center gap-4 text-[10px] sm:text-xs" onClick={e => e.stopPropagation()}>
              {usage && (
                <div className="flex items-center gap-2 border-r border-gray-200 dark:border-gray-800 pr-3">
                  <span className="text-gray-400 flex items-center gap-1">
                    <span className="opacity-50">In:</span>
                    <span className="font-mono text-gray-600 dark:text-gray-400">{usage.input_tokens}</span>
                  </span>
                  <span className="text-gray-400 flex items-center gap-1">
                    <span className="opacity-50">Out:</span>
                    <span className="font-mono text-gray-600 dark:text-gray-400">{usage.output_tokens}</span>
                  </span>
                </div>
              )}
              {cost !== undefined && cost > 0 && (
                <span className="font-semibold text-brand-600 dark:text-brand-400 border-r border-gray-200 dark:border-gray-800 pr-3">
                  ${cost.toFixed(9).replace(/\.?0+$/, '') || '0'}
                </span>
              )}
              {responseTime !== undefined && (
                <span className="text-gray-400">
                  {responseTime.toFixed(2)}s
                </span>
              )}
              {(response || loading) && (
                 <button
                   onClick={copyToClipboard}
                   disabled={!response}
                   className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                 >
                   {copySuccess ? (
                     <span className="text-green-600 dark:text-green-400">{copySuccess}</span>
                   ) : (
                     <span>Copy</span>
                   )}
                 </button>
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="flex-1 overflow-hidden data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp">
           <CardContent className="pt-0 h-full overflow-y-auto custom-scrollbar">
             {loading && !response && (
               <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-2"></div>
                  <p className="text-sm">Thinking...</p>
               </div>
             )}
             
             {error ? (
               <div className="p-4 bg-error-50 dark:bg-error-900/20 rounded-lg text-sm text-error-700 dark:text-error-300">
                 <p className="font-semibold mb-1">Error Generating Response</p>
                 <p>{error}</p>
                 {error.includes("Missing API Key") && (
                    <button 
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="mt-2 text-xs underline hover:text-error-900"
                    >
                      Add API Key
                    </button>
                  )}
               </div>
             ) : (
               <ResponseTabs content={response} />
             )}
           </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
