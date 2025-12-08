/**
 * AI Console - Provider Types
 * Shared types for all AI providers
 */

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export type MessageRole = 'system' | 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  tokens?: number;
  latencyMs?: number;
  model?: string;
  provider?: string;
}

export interface ChatRequest {
  messages: Array<{
    role: MessageRole;
    content: string;
  }>;
  model: string;
  provider: string;
  parameters: ChatParameters;
}

export interface ChatParameters {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt?: string;
}

export const DEFAULT_PARAMETERS: ChatParameters = {
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  systemPrompt: '',
};

// ============================================================================
// MODEL TYPES
// ============================================================================

export interface AIModel {
  id: string;
  name: string;
  contextLength: number;
  maxOutputTokens?: number;
  inputPricePerMillion?: number;  // USD per 1M tokens
  outputPricePerMillion?: number; // USD per 1M tokens
  description?: string;
  capabilities?: string[];
  isDefault?: boolean;
}

export interface AIProvider {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  models: AIModel[];
  isEnabled: boolean;
  requiresApiKey: boolean;
  apiKeyEnvVar: string;
  baseUrl?: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface ChatResponse {
  id: string;
  content: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
  latencyMs?: number;
}

export interface StreamChunk {
  id: string;
  content: string;
  done: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class ProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export interface APIErrorResponse {
  error: string;
  code?: string;
  provider?: string;
  details?: unknown;
}

// ============================================================================
// PROVIDER INTERFACE
// ============================================================================

export interface ProviderClient {
  id: string;
  name: string;
  
  /**
   * Check if the provider is configured (API key exists)
   */
  isConfigured(): boolean;
  
  /**
   * Send a chat completion request (non-streaming)
   */
  chat(request: ChatRequest): Promise<ChatResponse>;
  
  /**
   * Send a chat completion request with streaming
   */
  streamChat(
    request: ChatRequest,
    onChunk: (chunk: StreamChunk) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ): Promise<void>;
  
  /**
   * Validate the API key
   */
  validateApiKey?(): Promise<boolean>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ProviderID = 'openai' | 'anthropic' | 'google' | 'mistral' | 'groq';

export interface ConsoleState {
  provider: ProviderID;
  model: string;
  messages: Message[];
  parameters: ChatParameters;
  isLoading: boolean;
  error: string | null;
}

export interface ConsoleActions {
  setProvider: (provider: ProviderID) => void;
  setModel: (model: string) => void;
  setParameters: (params: Partial<ChatParameters>) => void;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
}
