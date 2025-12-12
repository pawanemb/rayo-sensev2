
export interface ChatCompletionParams {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  reasoning_effort?: 'low' | 'medium' | 'high';
  stream?: boolean;
  [key: string]: any;
}

export class OpenAIService {
  private apiKey: string;
  private baseUrl: string;
  private extraHeaders: Record<string, string>;

  constructor(apiKey: string, baseUrl: string = 'https://api.openai.com/v1', extraHeaders: Record<string, string> = {}) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.extraHeaders = extraHeaders;
  }

  private async post(endpoint: string, body: Record<string, unknown>): Promise<Response> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...this.extraHeaders,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error?.message || `API error: ${response.status}`);
      (error as any).response = { data: errorData, status: response.status };
      throw error;
    }

    // Return the response object for streaming handling, or json if not streaming
    return response;
  }

  /**
   * Create a chat completion with robust fallback logic
   */
  async createChatCompletionWithFallback(params: ChatCompletionParams): Promise<Response> {
    try {
      // 1. Try with all parameters
      return await this.createChatCompletion(params);
    } catch (error: any) {
      const errorMessage = error.message || '';
      const errorData = error.response?.data?.error;
      const errorParam = errorData?.param;

      console.log(`[OpenAIService] First attempt failed: ${errorMessage}`);

      // Check for specific error types
      const isReasoningError = 
        errorMessage.includes("reasoning_effort") || 
        errorMessage.includes("Unknown parameter") ||
        (errorParam === 'reasoning_effort');
      
      const isRoleError = 
        errorMessage.includes("does not support 'system'") || 
        (errorParam === 'messages[0].role');

      // 2. Retry without reasoning_effort if that was the issue
      if (isReasoningError && params.reasoning_effort) {
        console.log('[OpenAIService] Retrying without reasoning_effort...');
        const { reasoning_effort: _reasoning_effort, ...paramsWithoutReasoning } = params;
        
        try {
          return await this.createChatCompletion(paramsWithoutReasoning);
        } catch (secondError: any) {
          // If the second attempt fails, check if it's a system role issue
          const secondMsg = secondError.message || '';
          if (secondMsg.includes("does not support 'system'")) {
            console.log('[OpenAIService] Retrying without system role...');
            return await this.createChatCompletionWithoutSystem(paramsWithoutReasoning);
          }
          throw secondError;
        }
      }

      // 3. Retry without system role if that was the issue
      if (isRoleError) {
        console.log('[OpenAIService] Retrying without system role...');
        // If we also had reasoning_effort, we might need to remove that too? 
        // For now, let's try just removing system, but if it was both, the next error would catch it (but we only have 1 level of recursion here).
        // Safer to remove both if we suspect the model is very restrictive (like o1-mini which might not support either).
        
        // Let's try removing system role first, keeping reasoning_effort if present (unless we know for sure)
        // Actually, o1-preview supports system, o1-mini doesn't. 
        // o1-mini also doesn't support reasoning_effort (yet? or maybe it does).
        // To be safe, if we hit a role error, let's try the most compatible fallback: No System + No Reasoning.
        
        const { reasoning_effort: _reasoning_effort, ...paramsWithoutReasoning } = params;
        return await this.createChatCompletionWithoutSystem(paramsWithoutReasoning);
      }

      throw error;
    }
  }

  async createChatCompletion(params: ChatCompletionParams): Promise<Response> {
    // Determine if we should stream
    // For O-series models, we might need to force stream=false if the API doesn't support it yet
    // But ideally the caller handles that config.
    
    return this.post('/chat/completions', params);
  }

  async createResponse(params: Record<string, unknown>): Promise<Response> {
    return this.post('/responses', params);
  }

  async createChatCompletionWithoutSystem(params: ChatCompletionParams): Promise<Response> {
    const { messages, ...otherParams } = params;
    
    // Map system messages to user messages (or filter them out if preferred, but mapping preserves context)
    // O-series documentation often suggests mapping system to user.
    const mappedMessages = messages.map(msg => 
      msg.role === 'system' ? { ...msg, role: 'user' } : msg
    );

    return this.createChatCompletion({
      ...otherParams,
      messages: mappedMessages
    });
  }
}
