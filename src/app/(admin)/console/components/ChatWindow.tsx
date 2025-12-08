/**
 * AI Console - Chat Window Component
 * Main chat interface with messages display and input
 */

'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../providers/types';
import { FiSend, FiSquare, FiCopy, FiCheck, FiRefreshCw, FiTrash2 } from 'react-icons/fi';

// ============================================================================
// TYPES
// ============================================================================

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  onSendMessage: (content: string) => void;
  onStopGeneration: () => void;
  onClearMessages: () => void;
  onRegenerateLastResponse: () => void;
}

// ============================================================================
// MESSAGE BUBBLE COMPONENT
// ============================================================================

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-brand-500 text-white'
            : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
        }`}
      >
        {/* Message Content */}
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.content}
          {isStreaming && isAssistant && !message.content && (
            <span className="inline-flex items-center gap-1">
              <span className="animate-pulse">●</span>
              <span className="animate-pulse delay-100">●</span>
              <span className="animate-pulse delay-200">●</span>
            </span>
          )}
          {isStreaming && isAssistant && message.content && (
            <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-current" />
          )}
        </div>

        {/* Message Metadata */}
        {isAssistant && !isStreaming && message.content && (
          <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              {message.model && (
                <span className="rounded bg-gray-200 px-1.5 py-0.5 dark:bg-gray-700">
                  {message.model}
                </span>
              )}
              {message.tokens && <span>{message.tokens} tokens</span>}
              {message.latencyMs && <span>{(message.latencyMs / 1000).toFixed(2)}s</span>}
            </div>
            <button
              onClick={handleCopy}
              className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Copy message"
            >
              {copied ? <FiCheck className="h-4 w-4" /> : <FiCopy className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CHAT WINDOW COMPONENT
// ============================================================================

export function ChatWindow({
  messages,
  isLoading,
  isStreaming,
  error,
  onSendMessage,
  onStopGeneration,
  onClearMessages,
  onRegenerateLastResponse,
}: ChatWindowProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const hasMessages = messages.length > 0;
  const lastMessage = messages[messages.length - 1];
  const canRegenerate = hasMessages && lastMessage?.role === 'assistant' && !isLoading;

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {!hasMessages ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-brand-100 p-4 dark:bg-brand-900/30">
              <svg
                className="h-8 w-8 text-brand-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Start a conversation
            </h3>
            <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
              Select a model and start chatting. Your messages will appear here.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isStreaming={isStreaming && index === messages.length - 1}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mb-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      {hasMessages && (
        <div className="flex items-center justify-center gap-2 px-4 pb-2">
          {canRegenerate && (
            <button
              onClick={onRegenerateLastResponse}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <FiRefreshCw className="h-3.5 w-3.5" />
              Regenerate
            </button>
          )}
          <button
            onClick={onClearMessages}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <FiTrash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Shift+Enter for new line)"
              disabled={isLoading}
              rows={1}
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          {isLoading ? (
            <button
              type="button"
              onClick={onStopGeneration}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500 text-white hover:bg-red-600"
              title="Stop generation"
            >
              <FiSquare className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send message"
            >
              <FiSend className="h-5 w-5" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default ChatWindow;
