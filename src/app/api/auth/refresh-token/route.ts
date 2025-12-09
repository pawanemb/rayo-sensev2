import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { refresh_token } = await request.json();

    if (!refresh_token) {
      return NextResponse.json(
        {
          error: 'Refresh token is required',
          detail: 'No refresh token provided. Please sign in again.'
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Refresh the session
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error) {
      console.error('❌ [Refresh] Token refresh error:', error.message);

      let errorMessage = error.message;

      if (error.message.includes('Invalid Refresh Token') || error.message.includes('expired')) {
        errorMessage = 'Your session has expired. Please sign in again.';
      } else if (error.message.includes('not found')) {
        errorMessage = 'Session not found. Please sign in again.';
      }

      return NextResponse.json(
        {
          error: errorMessage,
          detail: errorMessage,
          raw_error: error.message
        },
        { status: 401 }
      );
    }

    if (!data.session) {
      return NextResponse.json(
        {
          error: 'Session refresh failed',
          detail: 'Could not refresh your session. Please sign in again.',
        },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const userRole = (
      data.user?.user_metadata?.role ||
      data.user?.app_metadata?.role ||
      ''
    ).toLowerCase();

    if (userRole !== 'admin' && userRole !== 'administrator') {
      await supabase.auth.signOut();
      console.error('❌ [Refresh] Non-admin user session refresh blocked');
      return NextResponse.json(
        {
          error: 'Admin access required',
          detail: 'Your session cannot be refreshed. Admin role required.',
        },
        { status: 403 }
      );
    }

    console.log('✅ [Refresh] Token refreshed successfully');

    // Return new tokens and user data
    if (!data.user) {
      return NextResponse.json(
        { error: 'User data not found', detail: 'Unable to retrieve user information.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      user: {
        id: data.user.id,
        email: data.user.email || '',
        full_name: data.user.user_metadata?.full_name ||
                   data.user.user_metadata?.name ||
                   data.user.email?.split('@')[0] ||
                   'User',
        email_confirmed: true,
        avatar: data.user.user_metadata?.avatar_url ||
                data.user.user_metadata?.picture,
        role: userRole,
      },
    });

  } catch (error) {
    console.error('❌ [Refresh] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      {
        error: 'Server error',
        detail: errorMessage,
        raw_error: errorMessage
      },
      { status: 500 }
    );
  }
}
