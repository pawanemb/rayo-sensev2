
import { NextRequest, NextResponse } from 'next/server';
import { GeminiService } from '@/lib/services/gemini.service';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { model, messages, temperature, maxTokens, thinking } = await req.json();
    
    // Use gemini api key from header or env if we had it, but here we expect user to provide it.
    // Frontend should send it.
    // Wait, AiPlaygroundInterface sends Authorization: Bearer <key>.
    const authHeader = req.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '');

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 401 });
    }

    const service = new GeminiService(apiKey);

    const response = await service.createChatCompletionAdapter({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      thinking // Pass thinking parameter
    });

    // Gemini returns SSE but format is different from OpenAI/Anthropic
    // Usually: data: <json>
    // JSON shape: { candidates: [ { content: { parts: [ { text: "..." } ] } } ] }
    // We pass it through. Frontend needs to parse it.

    return new Response(response, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error('[AI Playground Gemini Route] Error:', error);
    const errorMessage = error.message || 'Internal Server Error';
    const status = error.response?.status || 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}
