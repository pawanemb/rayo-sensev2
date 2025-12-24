
import { GoogleGenAI, GenerateContentConfig } from '@google/genai';

export class GeminiService {
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  /**
   * Adapts standard params to Gemini SDK format
   */
  async createChatCompletionAdapter(params: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    max_tokens?: number;
    webSearch?: boolean;
    codeExecution?: boolean;
    urlContext?: boolean;
    thinking?: { type: "enabled", budget_tokens: number }; // Adapter for thinking
  }): Promise<ReadableStream> {
    
    // Map messages
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    let systemInstruction: string | undefined = undefined;

    for (const msg of params.messages) {
      if (msg.role === 'system') {
        systemInstruction = msg.content;
        continue;
      }
      
      const role = msg.role === 'assistant' ? 'model' : 'user';
      contents.push({
        role,
        parts: [{ text: msg.content }]
      });
    }

    // Config
    const config: GenerateContentConfig & { thinkingConfig?: any, responseModalities?: string[] } = {
      temperature: params.temperature,
      maxOutputTokens: params.max_tokens,
    };

    if (params.model.includes('image')) {
      config.responseModalities = ['IMAGE', 'TEXT'];
    }
    
    // Tools
    const tools: any[] = [];
    if (params.webSearch) {
      tools.push({ googleSearch: {} });
    }
    if (params.codeExecution) {
      tools.push({ codeExecution: {} });
    }
    if (params.urlContext) {
      tools.push({ urlContext: {} });
    }

    if (systemInstruction) {
        config.systemInstruction = {
            parts: [{ text: systemInstruction }]
        };
    }

    // Handle Thinking
    // User example: thinkingConfig: { thinkingLevel: "HIGH" } for gemini-3-pro-preview
    // Or if model is 2.0 Flash Thinking, it might be automatic or use thinkingConfig.
    // I'll check model name.
    const isThinkingModel = params.model.includes('thinking') || params.model.includes('gemini-3');

    if (isThinkingModel || params.thinking) {
        // If thinking is enabled in UI (params.thinking) OR model implies it
        // User snippet used:
        // config = { thinkingConfig: { thinkingLevel: 'HIGH' } }
        // Note: For gemini-2.0-flash-thinking-exp, we usually just use the model name.
        // But for gemini-3-pro-preview as per user snippet, we need thinkingConfig.
        
        // Only apply thinkingConfig if user explicitly enabled thinking or it's implied?
        // Let's apply it if params.thinking is present (from UI checkbox).
        if (params.thinking) {
             config.thinkingConfig = {
                 includeThoughts: true, // Allow seeing thoughts if supported
                 // thinkingLevel: 'HIGH' // Not in standard types yet? user snippet says so.
             };
             // User snippet passed thinkingConfig outside? No, inside config.
             // Wait, user snippet:
             // const config = { thinkingConfig: { thinkingLevel: 'HIGH' }, tools, ... }
             // await ai.models.generateContentStream({ model, config, contents })
             
             // So I should put it in config.
             // I'll cast to any to avoid type errors if SDK types are strict.
             (config as any).thinkingConfig = {
                 thinkingLevel: 'HIGH'
             };
        } else if (params.model.includes('gemini-2.5-pro') || params.model.includes('gemini-flash-latest')) {
             // For gemini-2.5-pro and gemini-flash-latest, use thinkingBudget: -1 as per example
             (config as any).thinkingConfig = {
                 thinkingBudget: -1
             };
        }
    }

    try {
        if (tools.length > 0) {
          config.tools = tools;
        }

        const response = await this.client.models.generateContentStream({
            model: params.model,
            config: config,
            contents: contents,
        });

        // Convert AsyncIterable to ReadableStream
        return new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of response) {
                        // Extract text and usage data
                        const text = chunk.text; 
                        const usageMetadata = chunk.usageMetadata;
                        
                        // Construct payload for frontend parser
                        const payload: Record<string, any> = {};
                        
                        if (text) {
                            payload.candidates = [{
                                content: {
                                    parts: [{ text }]
                                }
                            }];
                        }
                        
                        if (usageMetadata) {
                            payload.usageMetadata = usageMetadata;
                        }
                        
                        if (Object.keys(payload).length > 0) {
                            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`));
                        }
                    }
                    controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (e) {
                    controller.error(e);
                }
            }
        });

    } catch (error: unknown) {
        let message = error instanceof Error ? error.message : 'Gemini SDK Error';
        try {
            // Attempt to parse JSON error message from SDK
            const parsed = JSON.parse(message);
            if (parsed.error && parsed.error.message) {
                message = parsed.error.message;
            }
        } catch {
            // Not JSON, use original message
        }

        // If 404, try to list available models to help debug
        if (message.includes('404') || message.includes('not found')) {
            try {
                const list = await this.client.models.list();
                const modelNames = list.page.map(m => m.name || '').filter(Boolean).join(', ');
                message += `\nAvailable models (partial): ${modelNames}`;
            } catch {
                // Ignore list error
            }
        }
        
        throw new Error(message);
    }
  }
}
