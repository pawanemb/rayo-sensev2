
import { NextRequest, NextResponse } from 'next/server';
import { OpenAIService } from '@/lib/services/openai.service';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { 
      model, messages, temperature, maxTokens, reasoningEffort,
      responseFormat, reasoningSummary, store, include, thinking, tools, verbosity
    } = await req.json();
    
    const authHeader = req.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '');

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 401 });
    }

    const service = new OpenAIService(apiKey);

    // Identify models that require restricted temperature (O-Series, GPT-5)
    // Even though we use v1/responses, these models might still reject non-default temp.
    const isRestrictedTemp = model.startsWith('o1') || model.startsWith('o3') || model.startsWith('o4') || model.startsWith('gpt-5');

    // Handle JSON constraints
    let finalMessages = [...messages];
    let formatConfig: any = null;

    if (responseFormat === 'json_object') {
       formatConfig = { type: 'json_object' };
       // Ensure 'json' is mentioned in prompt
       const hasJson = messages.some((m: any) => m.content.toLowerCase().includes('json'));
       if (!hasJson) {
         finalMessages.push({ role: 'system', content: 'Please output valid JSON.' });
       }
    } else if (responseFormat === 'json_schema') {
       formatConfig = {
         type: 'json_schema',
         json_schema: {
           name: 'response',
           schema: {
             type: 'object',
             properties: {
               result: { type: 'string' }
             }
           }
         }
       };
    }
    // If text, we don't send format config to avoid 'missing schema' error

    // Construct advanced payload for /v1/responses (Unified for all models)
    const advancedPayload: any = {
      model,
      input: finalMessages, 
      reasoning: {
        // Only include effort if it's set/relevant, or default to medium if model supports it?
        // User example for GPT-3.5 had empty reasoning: {}
        // O-series needs it.
      },
      store: store || false,
      include: include || [],
      stream: true
    };

    // Construct text object
    const textObj: any = {};
    if (formatConfig) {
      textObj.format = formatConfig;
    }
    if (verbosity) {
      textObj.verbosity = verbosity;
    }
    
    // Only add text object if it has properties
    if (Object.keys(textObj).length > 0) {
      advancedPayload.text = textObj;
    }
    // If text object is empty (default text format, no verbosity), we omit it or send empty?
    // User snippet had text: { format: { type: "text" } }.
    // But that caused error.
    // If we send empty text: {}, maybe it works?
    // Let's try sending text: {} if empty, or just omit. 
    // Usually omitting means default.

    // Add Reasoning params if applicable
    if (reasoningEffort || reasoningSummary) {
       advancedPayload.reasoning = {
         ...advancedPayload.reasoning,
         effort: reasoningEffort || 'medium',
         summary: reasoningSummary || 'auto'
       };
    }

    // Add Tools
    if (tools) {
      advancedPayload.tools = tools;
    }

    // Add Thinking
    if (thinking) {
      // Put thinking at top level or inside reasoning depending on API spec.
      // User snippet for O1 put it where? User didn't show thinking for O1 snippet.
      // GPT-5.2 Thinking snippet? User provided O1 snippet earlier.
      // For now, I'll put it at top level as before.
      advancedPayload.thinking = thinking;
      // Also ensure reasoning.thinking is set if that's the location?
      // I'll stick to what I had which worked for GPT-5.2 presumably.
    }

    // Add Standard Params (Temperature, Max Tokens)
    // v1/responses uses 'max_output_tokens' based on user snippet
    if (maxTokens !== undefined) {
      advancedPayload.max_output_tokens = maxTokens;
    }

    if (temperature !== undefined) {
      if (isRestrictedTemp && temperature !== 1) {
        // Skip for restricted
      } else {
        advancedPayload.temperature = temperature;
      }
    }
    
    // Add top_p if needed (default 1) - Removed forced default as some models reject it
    // advancedPayload.top_p = 1;

    // Thinking parameter removal
    // Both top-level 'thinking' and 'reasoning.thinking' were rejected by API.
    // It's likely that 'thinking' budget is handled via 'max_completion_tokens' or the model name itself implies behavior.
    // We will not send the 'thinking' parameter to avoid errors.
    if (advancedPayload.thinking) {
       delete advancedPayload.thinking;
    }
    if (advancedPayload.reasoning && advancedPayload.reasoning.thinking) {
       delete advancedPayload.reasoning.thinking;
    }

    const response = await service.createResponse(advancedPayload);
    
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('[AI Playground Route] Error:', error);
    
    const errorMessage = error.message || 'Internal Server Error';
    const status = error.response?.status || 500;
    const errorData = error.response?.data || {};

    return NextResponse.json(
      { error: errorMessage, details: errorData },
      { status }
    );
  }
}
