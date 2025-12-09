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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const offset = (page - 1) * limit;

    // Build query
    let query = supabaseAdmin
      .from('free_analysis_submissions')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,website.ilike.%${search}%`);
    }

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: submissions, error, count } = await query;

    if (error) {
      console.error('Error fetching form submissions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch form submissions' },
        { status: 500 }
      );
    }

    // Get IP location for each submission
    const submissionsWithLocation = await Promise.all(
      (submissions || []).map(async (submission) => {
        const ipDetails = submission.ip_address
          ? await getIPLocation(submission.ip_address)
          : null;

        return {
          ...submission,
          ipDetails
        };
      })
    );

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      submissions: submissionsWithLocation,
      pagination: {
        currentPage: page,
        totalPages,
        totalSubmissions: count || 0,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error in form submissions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
