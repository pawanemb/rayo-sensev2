/**
 * AI Console - OpenAI Provider
 * Integration with OpenAI's Chat Completions API
 */

import {
  AIProvider,
  AIModel,
  ChatRequest,
  ChatResponse,
  StreamChunk,
  ProviderClient,
  ProviderError,
} from './types';

// ============================================================================
// OPENAI MODELS CONFIGURATION
// ============================================================================

export const OPENAI_MODELS: AIModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    contextLength: 128000,
    maxOutputTokens: 16384,
    inputPricePerMillion: 2.5,
    outputPricePerMillion: 10,
    description: 'Most capable model, great for complex tasks',
    capabilities: ['text', 'vision', 'function-calling'],
    isDefault: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    contextLength: 128000,
    maxOutputTokens: 16384,
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.6,
    description: 'Fast and affordable for most tasks',
    capabilities: ['text', 'vision', 'function-calling'],
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    contextLength: 128000,
    maxOutputTokens: 4096,
    inputPricePerMillion: 10,
    outputPricePerMillion: 30,
    description: 'Previous generation flagship model',
    capabilities: ['text', 'vision', 'function-calling'],
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    contextLength: 8192,
    maxOutputTokens: 8192,
    inputPricePerMillion: 30,
    outputPricePerMillion: 60,
    description: 'Original GPT-4 model',
    capabilities: ['text', 'function-calling'],
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    contextLength: 16385,
    maxOutputTokens: 4096,
    inputPricePerMillion: 0.5,
    outputPricePerMillion: 1.5,
    description: 'Fast and cost-effective for simple tasks',
    capabilities: ['text', 'function-calling'],
  },
  {
    id: 'o1',
    name: 'o1',
    contextLength: 200000,
    maxOutputTokens: 100000,
    inputPricePerMillion: 15,
    outputPricePerMillion: 60,
    description: 'Advanced reasoning model',
    capabilities: ['text', 'reasoning'],
  },
  {
    id: 'o1-mini',
    name: 'o1 Mini',
    contextLength: 128000,
    maxOutputTokens: 65536,
    inputPricePerMillion: 3,
    outputPricePerMillion: 12,
    description: 'Smaller reasoning model, faster responses',
    capabilities: ['text', 'reasoning'],
  },
  {
    id: 'o3-mini',
    name: 'o3 Mini',
    contextLength: 200000,
    maxOutputTokens: 100000,
    inputPricePerMillion: 1.1,
    outputPricePerMillion: 4.4,
    description: 'Latest mini reasoning model',
    capabilities: ['text', 'reasoning'],
  },
];

export const OPENAI_PROVIDER: AIProvider = {
  id: 'openai',
  name: 'OpenAI',
  icon: '/images/providers/openai.svg',
  description: 'GPT-4o, GPT-4, and GPT-3.5 models from OpenAI',
  models: OPENAI_MODELS,
  isEnabled: true,
  requiresApiKey: true,
  apiKeyEnvVar: 'OPENAI_API_KEY',
  baseUrl: 'https://api.openai.com/v1',
};

// ============================================================================
// OPENAI API TYPES
// ============================================================================

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
}

interface OpenAIChoice {
  index: number;
  message?: {
    role: string;
    content: string;
  };
  delta?: {
    role?: string;
    content?: string;
  };
  finish_reason: string | null;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ============================================================================
// OPENAI CLIENT IMPLEMENTATION
// ============================================================================

export class OpenAIClient implements ProviderClient {
  id = 'openai';
  name = 'OpenAI';
  private apiKey: string | undefined;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseUrl = 'https://api.openai.com/v1';
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  private getHeaders(): HeadersInit {
    if (!this.apiKey) {
      throw new ProviderError('OpenAI API key not configured', 'openai');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  private buildRequest(request: ChatRequest, stream: boolean = false): OpenAIRequest {
    const messages: OpenAIMessage[] = [];

    // Add system prompt if provided
    if (request.parameters.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.parameters.systemPrompt,
      });
    }

    // Add conversation messages
    for (const msg of request.messages) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    return {
      model: request.model,
      messages,
      temperature: request.parameters.temperature,
      max_tokens: request.parameters.maxTokens,
      top_p: request.parameters.topP,
      frequency_penalty: request.parameters.frequencyPenalty,
      presence_penalty: request.parameters.presencePenalty,
      stream,
    };
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(this.buildRequest(request, false)),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ProviderError(
          errorData.error?.message || `OpenAI API error: ${response.status}`,
          'openai',
          response.status,
          errorData
        );
      }

      const data: OpenAIResponse = await response.json();
      const latencyMs = Date.now() - startTime;

      return {
        id: data.id,
        content: data.choices[0]?.message?.content || '',
        model: data.model,
        provider: 'openai',
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        } : undefined,
        finishReason: data.choices[0]?.finish_reason || undefined,
        latencyMs,
      };
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError(
        error instanceof Error ? error.message : 'Unknown error',
        'openai',
        undefined,
        error
      );
    }
  }

  async streamChat(
    request: ChatRequest,
    onChunk: (chunk: StreamChunk) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(this.buildRequest(request, true)),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ProviderError(
          errorData.error?.message || `OpenAI API error: ${response.status}`,
          'openai',
          response.status,
          errorData
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new ProviderError('No response body', 'openai');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let responseId = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            responseId = json.id || responseId;
            const content = json.choices?.[0]?.delta?.content || '';
            const finishReason = json.choices?.[0]?.finish_reason;

            if (content || finishReason) {
              onChunk({
                id: responseId,
                content,
                done: !!finishReason,
                finishReason: finishReason || undefined,
                usage: json.usage ? {
                  promptTokens: json.usage.prompt_tokens,
                  completionTokens: json.usage.completion_tokens,
                  totalTokens: json.usage.total_tokens,
                } : undefined,
              });
            }
          } catch {
            // Skip invalid JSON lines
          }
        }
      }

      onComplete();
    } catch (error) {
      if (error instanceof ProviderError) {
        onError(error);
      } else {
        onError(new ProviderError(
          error instanceof Error ? error.message : 'Unknown error',
          'openai',
          undefined,
          error
        ));
      }
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const openaiClient = new OpenAIClient();
