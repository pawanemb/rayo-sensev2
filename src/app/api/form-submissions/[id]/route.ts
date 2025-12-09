import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Simple function to get IP location from ipwho.is
async function getIPLocation(ip: string) {
  try {
    if (!ip) return null;

    const response = await fetch(`http://ipwho.is/${ip}`);
    const data = await response.json();

    if (!data.success) return null;

    return {
      country: data.country,
      countryCode: data.country_code,
      region: data.region,
      city: data.city,
      timezone: data.timezone?.id || '',
      flag: data.flag?.emoji || '🌐',
      isLocal: false
    };
  } catch (error) {
    console.error('Error fetching IP location:', error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: submission, error } = await supabaseAdmin
      .from('free_analysis_submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !submission) {
      return NextResponse.json(
        { error: 'Form submission not found' },
        { status: 404 }
      );
    }

    // Get IP location if available
    const ipDetails = submission.ip_address
      ? await getIPLocation(submission.ip_address)
      : null;

    return NextResponse.json({
      submission: {
        ...submission,
        ipDetails
      }
    });
  } catch (error) {
    console.error('Error fetching form submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    // Only allow updating specific fields
    const allowedFields = ['status', 'notes', 'processed_at'];
    const filteredUpdates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in updates) {
        filteredUpdates[field] = updates[field];
      }
    }

    // Add updated_at timestamp
    filteredUpdates.updated_at = new Date().toISOString();

    const { data: submission, error } = await supabaseAdmin
      .from('free_analysis_submissions')
      .update(filteredUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating form submission:', error);
      return NextResponse.json(
        { error: 'Failed to update form submission' },
        { status: 500 }
      );
    }

    // Get IP location if available
    const ipDetails = submission.ip_address
      ? await getIPLocation(submission.ip_address)
      : null;

    return NextResponse.json({
      submission: {
        ...submission,
        ipDetails
      }
    });
  } catch (error) {
    console.error('Error updating form submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
