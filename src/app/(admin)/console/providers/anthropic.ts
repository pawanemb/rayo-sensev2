/**
 * AI Console - Anthropic Provider
 * Integration with Anthropic's Messages API (Claude models)
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
// ANTHROPIC MODELS CONFIGURATION
// ============================================================================

export const ANTHROPIC_MODELS: AIModel[] = [
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    contextLength: 200000,
    maxOutputTokens: 64000,
    inputPricePerMillion: 3,
    outputPricePerMillion: 15,
    description: 'Latest Claude Sonnet - balanced performance and speed',
    capabilities: ['text', 'vision', 'function-calling'],
    isDefault: true,
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    contextLength: 200000,
    maxOutputTokens: 8192,
    inputPricePerMillion: 3,
    outputPricePerMillion: 15,
    description: 'Previous Sonnet version - excellent for coding',
    capabilities: ['text', 'vision', 'function-calling'],
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    contextLength: 200000,
    maxOutputTokens: 8192,
    inputPricePerMillion: 0.8,
    outputPricePerMillion: 4,
    description: 'Fast and affordable for simple tasks',
    capabilities: ['text', 'vision', 'function-calling'],
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    contextLength: 200000,
    maxOutputTokens: 4096,
    inputPricePerMillion: 15,
    outputPricePerMillion: 75,
    description: 'Most capable Claude 3 model for complex tasks',
    capabilities: ['text', 'vision', 'function-calling'],
  },
  {
    id: 'claude-3-sonnet-20240229',
    name: 'Claude 3 Sonnet',
    contextLength: 200000,
    maxOutputTokens: 4096,
    inputPricePerMillion: 3,
    outputPricePerMillion: 15,
    description: 'Balanced Claude 3 model',
    capabilities: ['text', 'vision', 'function-calling'],
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    contextLength: 200000,
    maxOutputTokens: 4096,
    inputPricePerMillion: 0.25,
    outputPricePerMillion: 1.25,
    description: 'Fastest Claude 3 model',
    capabilities: ['text', 'vision', 'function-calling'],
  },
];

export const ANTHROPIC_PROVIDER: AIProvider = {
  id: 'anthropic',
  name: 'Anthropic',
  icon: '/images/providers/anthropic.svg',
  description: 'Claude models from Anthropic - safe and helpful AI',
  models: ANTHROPIC_MODELS,
  isEnabled: true,
  requiresApiKey: true,
  apiKeyEnvVar: 'ANTHROPIC_API_KEY',
  baseUrl: 'https://api.anthropic.com/v1',
};

// ============================================================================
// ANTHROPIC API TYPES
// ============================================================================

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicRequest {
  model: string;
  messages: AnthropicMessage[];
  system?: string;
  max_tokens: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
}

interface AnthropicContentBlock {
  type: 'text';
  text: string;
}

interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: AnthropicContentBlock[];
  model: string;
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface AnthropicStreamEvent {
  type: string;
  index?: number;
  message?: AnthropicResponse;
  content_block?: {
    type: string;
    text: string;
  };
  delta?: {
    type: string;
    text?: string;
    stop_reason?: string;
  };
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

// ============================================================================
// ANTHROPIC CLIENT IMPLEMENTATION
// ============================================================================

export class AnthropicClient implements ProviderClient {
  id = 'anthropic';
  name = 'Anthropic';
  private apiKey: string | undefined;
  private baseUrl: string;
  private apiVersion: string;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    this.baseUrl = 'https://api.anthropic.com/v1';
    this.apiVersion = '2023-06-01';
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  private getHeaders(): HeadersInit {
    if (!this.apiKey) {
      throw new ProviderError('Anthropic API key not configured', 'anthropic');
    }
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': this.apiVersion,
    };
  }

  private buildRequest(request: ChatRequest, stream: boolean = false): AnthropicRequest {
    // Anthropic requires alternating user/assistant messages
    // System prompt is separate
    const messages: AnthropicMessage[] = [];

    for (const msg of request.messages) {
      if (msg.role === 'system') {
        // Skip system messages - handled separately
        continue;
      }
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }

    // Ensure messages start with user message
    if (messages.length > 0 && messages[0].role !== 'user') {
      messages.unshift({
        role: 'user',
        content: 'Hello',
      });
    }

    const anthropicRequest: AnthropicRequest = {
      model: request.model,
      messages,
      max_tokens: request.parameters.maxTokens,
      temperature: request.parameters.temperature,
      top_p: request.parameters.topP,
      stream,
    };

    // Add system prompt if provided
    if (request.parameters.systemPrompt) {
      anthropicRequest.system = request.parameters.systemPrompt;
    }

    return anthropicRequest;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(this.buildRequest(request, false)),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ProviderError(
          errorData.error?.message || `Anthropic API error: ${response.status}`,
          'anthropic',
          response.status,
          errorData
        );
      }

      const data: AnthropicResponse = await response.json();
      const latencyMs = Date.now() - startTime;

      // Extract text content from response
      const content = data.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('');

      return {
        id: data.id,
        content,
        model: data.model,
        provider: 'anthropic',
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        },
        finishReason: data.stop_reason || undefined,
        latencyMs,
      };
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError(
        error instanceof Error ? error.message : 'Unknown error',
        'anthropic',
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
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(this.buildRequest(request, true)),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ProviderError(
          errorData.error?.message || `Anthropic API error: ${response.status}`,
          'anthropic',
          response.status,
          errorData
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new ProviderError('No response body', 'anthropic');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let responseId = '';
      let inputTokens = 0;
      let outputTokens = 0;

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
            const event: AnthropicStreamEvent = JSON.parse(trimmed.slice(6));

            switch (event.type) {
              case 'message_start':
                responseId = event.message?.id || '';
                if (event.message?.usage?.input_tokens) {
                  inputTokens = event.message.usage.input_tokens;
                }
                break;

              case 'content_block_delta':
                if (event.delta?.text) {
                  onChunk({
                    id: responseId,
                    content: event.delta.text,
                    done: false,
                  });
                }
                break;

              case 'message_delta':
                if (event.usage?.output_tokens) {
                  outputTokens = event.usage.output_tokens;
                }
                if (event.delta?.stop_reason) {
                  onChunk({
                    id: responseId,
                    content: '',
                    done: true,
                    finishReason: event.delta.stop_reason,
                    usage: {
                      promptTokens: inputTokens,
                      completionTokens: outputTokens,
                      totalTokens: inputTokens + outputTokens,
                    },
                  });
                }
                break;

              case 'message_stop':
                // Stream complete
                break;
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
          'anthropic',
          undefined,
          error
        ));
      }
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      // Anthropic doesn't have a simple validation endpoint
      // We'll try a minimal request
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 1,
        }),
      });
      return response.ok || response.status === 400; // 400 means auth worked but request was bad
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const anthropicClient = new AnthropicClient();
