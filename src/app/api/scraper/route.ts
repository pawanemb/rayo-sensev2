import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, output_format, method } = body;

    // Validate required fields
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Build request body for scraper API
    const scraperRequestBody: {
      url: string;
      output_format: string;
      method?: string;
    } = {
      url,
      output_format: output_format || 'markdown',
    };

    // Only add method if provided and not auto
    if (method && method !== 'auto') {
      scraperRequestBody.method = method;
    }

    // Get scraper API configuration from environment
    const scraperUrl = process.env.SCRAPER_URL || 'https://s.rayo.work';
    const scraperToken = process.env.SCRAPER_TOKEN || 'rayo-scraper-pawan';

    console.log('[SCRAPER] Calling scraper API:', scraperUrl);

    // Call the external scraper API
    const response = await fetch(`${scraperUrl}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${scraperToken}`,
      },
      body: JSON.stringify(scraperRequestBody),
    });

    const data = await response.json();

    // If scraper API returned an error
    if (!response.ok) {
      console.error('[SCRAPER] API error:', {
        status: response.status,
        data
      });
      return NextResponse.json(
        {
          success: false,
          error: data.detail || 'Scraping failed',
          details: data
        },
        { status: response.status }
      );
    }

    // Return successful response
    return NextResponse.json(data);

  } catch (error) {
    console.error('[SCRAPER] API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
