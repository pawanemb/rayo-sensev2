/**
 * AI Console - Main Page
 * Chat playground for testing AI models
 */

'use client';

import React from 'react';
import { useChat } from './hooks/useChat';
import { ChatWindow } from './components/ChatWindow';
import { ModelSelector } from './components/ModelSelector';
import { ParameterPanel } from './components/ParameterPanel';
import { FiMessageSquare, FiPlus } from 'react-icons/fi';

export default function ConsolePage() {
  const {
    messages,
    isLoading,
    isStreaming,
    error,
    provider,
    model,
    parameters,
    sendMessage,
    stopGeneration,
    clearMessages,
    clearError,
    setProvider,
    setModel,
    setParameters,
    regenerateLastResponse,
  } = useChat();

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col lg:flex-row gap-4">
      {/* Sidebar - Model & Parameters */}
      <div className="w-full lg:w-80 flex-shrink-0 space-y-4 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
              <FiMessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">AI Console</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Test AI models</p>
            </div>
          </div>
          <button
            onClick={clearMessages}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            <FiPlus className="h-4 w-4" />
            New
          </button>
        </div>

        {/* Model Selector */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <ModelSelector
            provider={provider}
            model={model}
            onProviderChange={setProvider}
            onModelChange={setModel}
            disabled={isLoading}
          />
        </div>

        {/* Parameter Panel */}
        <ParameterPanel
          parameters={parameters}
          onParametersChange={setParameters}
          disabled={isLoading}
        />

        {/* Quick Tips */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Quick Tips</h3>
          <ul className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
            <li>• Press <kbd className="rounded bg-gray-200 px-1 dark:bg-gray-700">Enter</kbd> to send</li>
            <li>• Press <kbd className="rounded bg-gray-200 px-1 dark:bg-gray-700">Shift+Enter</kbd> for new line</li>
            <li>• Use system prompt to set AI behavior</li>
            <li>• Lower temperature = more focused responses</li>
          </ul>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          isStreaming={isStreaming}
          error={error}
          onSendMessage={sendMessage}
          onStopGeneration={stopGeneration}
          onClearMessages={clearMessages}
          onRegenerateLastResponse={regenerateLastResponse}
        />
      </div>
    </div>
  );
}
