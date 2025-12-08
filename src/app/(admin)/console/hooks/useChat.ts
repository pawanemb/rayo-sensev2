/**
 * AI Console - useChat Hook
 * State management for chat functionality
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Message,
  ChatParameters,
  DEFAULT_PARAMETERS,
  ProviderID,
} from '../providers/types';

// ============================================================================
// TYPES
// ============================================================================

interface UseChatOptions {
  initialProvider?: ProviderID;
  initialModel?: string;
  initialParameters?: Partial<ChatParameters>;
}

interface UseChatReturn {
  // State
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  provider: ProviderID;
  model: string;
  parameters: ChatParameters;
  
  // Actions
  sendMessage: (content: string) => Promise<void>;
  stopGeneration: () => void;
  clearMessages: () => void;
  clearError: () => void;
  setProvider: (provider: ProviderID) => void;
  setModel: (model: string) => void;
  setParameters: (params: Partial<ChatParameters>) => void;
  regenerateLastResponse: () => Promise<void>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const {
    initialProvider = 'openai',
    initialModel = 'gpt-4o',
    initialParameters = {},
  } = options;

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProviderState] = useState<ProviderID>(initialProvider);
  const [model, setModelState] = useState(initialModel);
  const [parameters, setParametersState] = useState<ChatParameters>({
    ...DEFAULT_PARAMETERS,
    ...initialParameters,
  });

  // Refs for abort control
  const abortControllerRef = useRef<AbortController | null>(null);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const setProvider = useCallback((newProvider: ProviderID) => {
    setProviderState(newProvider);
    // Reset model when provider changes
    const defaultModels: Record<ProviderID, string> = {
      openai: 'gpt-4o',
      anthropic: 'claude-sonnet-4-20250514',
      google: 'gemini-pro',
      mistral: 'mistral-large',
      groq: 'llama-3.1-70b',
    };
    setModelState(defaultModels[newProvider] || '');
  }, []);

  const setModel = useCallback((newModel: string) => {
    setModelState(newModel);
  }, []);

  const setParameters = useCallback((params: Partial<ChatParameters>) => {
    setParametersState((prev) => ({ ...prev, ...params }));
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Clear any previous error
    setError(null);

    // Create user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    // Add user message to state
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      model,
      provider,
    };

    // Add placeholder for streaming
    setMessages((prev) => [...prev, assistantMessage]);
    setIsStreaming(true);

    // Create abort controller
    abortControllerRef.current = new AbortController();

    try {
      // Build messages array for API
      const apiMessages = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch('/api/console/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          model,
          provider,
          parameters,
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      let usage: Message['tokens'] = undefined;
      let latencyMs: number | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          try {
            const event = JSON.parse(trimmed.slice(6));

            if (event.type === 'chunk' && event.data) {
              fullContent += event.data.content || '';
              
              // Update assistant message with new content
              setMessages((prev) => {
                const updated = [...prev];
                const lastIndex = updated.length - 1;
                if (updated[lastIndex]?.role === 'assistant') {
                  updated[lastIndex] = {
                    ...updated[lastIndex],
                    content: fullContent,
                  };
                }
                return updated;
              });

              // Capture usage if provided
              if (event.data.usage) {
                usage = event.data.usage.totalTokens;
              }
            } else if (event.type === 'done') {
              latencyMs = event.latencyMs;
            } else if (event.type === 'error') {
              throw new Error(event.error);
            }
          } catch (parseError) {
            // Skip invalid JSON
            if (parseError instanceof Error && parseError.message !== 'Unexpected end of JSON input') {
              console.error('Parse error:', parseError);
            }
          }
        }
      }

      // Update final message with metadata
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (updated[lastIndex]?.role === 'assistant') {
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: fullContent,
            tokens: usage,
            latencyMs,
          };
        }
        return updated;
      });

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled - keep partial response
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);

      // Remove the empty assistant message on error
      setMessages((prev) => {
        const updated = [...prev];
        if (updated[updated.length - 1]?.role === 'assistant' && !updated[updated.length - 1]?.content) {
          updated.pop();
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [messages, model, provider, parameters, isLoading]);

  const regenerateLastResponse = useCallback(async () => {
    // Find the last user message
    const lastUserMessageIndex = messages.findLastIndex((m) => m.role === 'user');
    if (lastUserMessageIndex === -1) return;

    const lastUserMessage = messages[lastUserMessageIndex];
    
    // Remove messages after the last user message
    setMessages((prev) => prev.slice(0, lastUserMessageIndex));
    
    // Resend the message
    await sendMessage(lastUserMessage.content);
  }, [messages, sendMessage]);

  return {
    // State
    messages,
    isLoading,
    isStreaming,
    error,
    provider,
    model,
    parameters,
    
    // Actions
    sendMessage,
    stopGeneration,
    clearMessages,
    clearError,
    setProvider,
    setModel,
    setParameters,
    regenerateLastResponse,
  };
}

export default useChat;
