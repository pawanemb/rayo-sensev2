
import { NextRequest, NextResponse } from 'next/server';
import { AnthropicService } from '@/lib/services/anthropic.service';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { model, messages, temperature, maxTokens, thinking } = await req.json();
    
    const authHeader = req.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '');

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 401 });
    }

    const service = new AnthropicService(apiKey);

    const response = await service.createChatCompletionAdapter({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
      thinking // Pass thinking parameter
    });

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('[AI Playground Anthropic Route] Error:', error);
    const errorMessage = error.message || 'Internal Server Error';
    const status = error.response?.status || 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}
