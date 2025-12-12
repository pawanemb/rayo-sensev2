
export interface AnthropicMessage {
  role: string;
  content: string;
}

export interface AnthropicThinking {
  type: "enabled";
  budget_tokens: number;
}

export interface AnthropicCompletionParams {
  model: string;
  messages: AnthropicMessage[];
  max_tokens: number;
  temperature?: number;
  system?: string;
  stream?: boolean;
  thinking?: AnthropicThinking;
}

export class AnthropicService {
  private apiKey: string;
  private baseUrl: string = 'https://api.anthropic.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createMessage(params: AnthropicCompletionParams): Promise<Response> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = `Anthropic API error: ${response.status}`;
      
      if (errorData.error) {
        if (typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        } else if (errorData.error.message) {
          errorMessage = errorData.error.message;
        } else {
          errorMessage = JSON.stringify(errorData.error);
        }
      }
      
      const error = new Error(errorMessage);
      (error as any).response = { data: errorData, status: response.status };
      throw error;
    }

    return response;
  }

  /**
   * Adapts OpenAI-style params to Anthropic format
   */
  async createChatCompletionAdapter(params: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
    thinking?: AnthropicThinking;
  }): Promise<Response> {
    
    // Extract system message
    let system = '';
    const messages = params.messages.filter(msg => {
      if (msg.role === 'system') {
        system += (system ? '\n\n' : '') + msg.content;
        return false;
      }
      return true;
    });

    const anthropicParams: AnthropicCompletionParams = {
      model: params.model,
      messages: messages,
      max_tokens: params.max_tokens || 4096,
      stream: params.stream ?? true,
    };

    if (system) anthropicParams.system = system;
    
    // If thinking is enabled, pass it. Note: temperature constraints are handled by caller or API
    if (params.thinking) {
      anthropicParams.thinking = params.thinking;
    }
    
    if (params.temperature !== undefined) {
      anthropicParams.temperature = params.temperature;
    }

    return this.createMessage(anthropicParams);
  }
}
