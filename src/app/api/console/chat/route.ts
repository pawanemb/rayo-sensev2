/**
 * AI Console - Chat API Route
 * Handles chat completions with streaming support
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleApiError } from '@/lib/auth/requireAdmin';
import { 
  getProviderClient, 
  getProvider,
  ChatRequest,
  ProviderID,
  ProviderError,
  DEFAULT_PARAMETERS,
} from '@/app/(admin)/console/providers';

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

interface ChatRequestBody {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model: string;
  provider: ProviderID;
  parameters?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    systemPrompt?: string;
  };
  stream?: boolean;
}

function validateRequest(body: unknown): ChatRequestBody {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }

  const data = body as Record<string, unknown>;

  if (!Array.isArray(data.messages) || data.messages.length === 0) {
    throw new Error('Messages array is required and must not be empty');
  }

  if (typeof data.model !== 'string' || !data.model) {
    throw new Error('Model is required');
  }

  if (typeof data.provider !== 'string' || !data.provider) {
    throw new Error('Provider is required');
  }

  // Validate provider exists
  const provider = getProvider(data.provider as ProviderID);
  if (!provider) {
    throw new Error(`Unknown provider: ${data.provider}`);
  }

  // Validate model exists for provider
  const modelExists = provider.models.some((m) => m.id === data.model);
  if (!modelExists) {
    throw new Error(`Model ${data.model} not found for provider ${data.provider}`);
  }

  return {
    messages: data.messages as ChatRequestBody['messages'],
    model: data.model as string,
    provider: data.provider as ProviderID,
    parameters: data.parameters as ChatRequestBody['parameters'],
    stream: data.stream as boolean | undefined,
  };
}

// ============================================================================
// NON-STREAMING HANDLER
// ============================================================================

async function handleNonStreamingChat(request: ChatRequest) {
  const client = getProviderClient(request.provider as ProviderID);
  
  if (!client.isConfigured()) {
    throw new ProviderError(
      `${request.provider} API key not configured`,
      request.provider,
      401
    );
  }

  const startTime = Date.now();
  const response = await client.chat(request);
  const latencyMs = Date.now() - startTime;

  return NextResponse.json({
    success: true,
    data: {
      id: response.id,
      content: response.content,
      model: response.model,
      provider: response.provider,
      usage: response.usage,
      finishReason: response.finishReason,
      latencyMs: response.latencyMs || latencyMs,
    },
  });
}

// ============================================================================
// STREAMING HANDLER
// ============================================================================

async function handleStreamingChat(request: ChatRequest) {
  const client = getProviderClient(request.provider as ProviderID);
  
  if (!client.isConfigured()) {
    throw new ProviderError(
      `${request.provider} API key not configured`,
      request.provider,
      401
    );
  }

  const encoder = new TextEncoder();
  const startTime = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await client.streamChat(
          request,
          // onChunk
          (chunk) => {
            const data = JSON.stringify({
              type: 'chunk',
              data: chunk,
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          },
          // onError
          (error) => {
            const errorData = JSON.stringify({
              type: 'error',
              error: error.message,
              provider: request.provider,
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.close();
          },
          // onComplete
          () => {
            const latencyMs = Date.now() - startTime;
            const doneData = JSON.stringify({
              type: 'done',
              latencyMs,
            });
            controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
            controller.close();
          }
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorData = JSON.stringify({
          type: 'error',
          error: errorMessage,
          provider: request.provider,
        });
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin();

    // Parse and validate request
    const body = await req.json();
    const validatedBody = validateRequest(body);

    // Build chat request
    const chatRequest: ChatRequest = {
      messages: validatedBody.messages,
      model: validatedBody.model,
      provider: validatedBody.provider,
      parameters: {
        ...DEFAULT_PARAMETERS,
        ...validatedBody.parameters,
      },
    };

    // Handle streaming or non-streaming
    if (validatedBody.stream) {
      return handleStreamingChat(chatRequest);
    } else {
      return handleNonStreamingChat(chatRequest);
    }
  } catch (error) {
    console.error('[Console Chat API] Error:', error);

    if (error instanceof ProviderError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          provider: error.provider,
          code: error.statusCode,
        },
        { status: error.statusCode || 500 }
      );
    }

    return handleApiError(error);
  }
}

// ============================================================================
// GET PROVIDERS ENDPOINT
// ============================================================================

export async function GET() {
  try {
    // Verify admin authentication
    await requireAdmin();

    // Import providers dynamically to get fresh config
    const { getAvailableProviders, isProviderConfigured } = await import(
      '@/app/(admin)/console/providers'
    );

    const providers = getAvailableProviders().map((provider) => ({
      id: provider.id,
      name: provider.name,
      description: provider.description,
      models: provider.models,
      isConfigured: isProviderConfigured(provider.id as ProviderID),
    }));

    return NextResponse.json({
      success: true,
      data: providers,
    });
  } catch (error) {
    console.error('[Console Chat API] Error fetching providers:', error);
    return handleApiError(error);
  }
}
