
import { NextRequest, NextResponse } from 'next/server';
import { OpenAIService } from '@/lib/services/openai.service';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { model, messages, temperature, maxTokens } = await req.json();
    
    // Extract API key
    const authHeader = req.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '');

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 401 });
    }

    const headers: Record<string, string> = {
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Rayo Sense AI Playground'
    };

    // Initialize Service pointing to OpenRouter with headers
    const service = new OpenAIService(apiKey, 'https://openrouter.ai/api/v1', headers);

    const params: any = {
      model,
      messages,
      stream: true,
    };

    if (temperature !== undefined) params.temperature = temperature;
    if (maxTokens !== undefined) params.max_tokens = maxTokens;
    
    const response = await service.createChatCompletion(params);

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('[AI Playground OpenRouter Route] Error:', error);
    const errorMessage = error.message || 'Internal Server Error';
    const status = error.response?.status || 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}
