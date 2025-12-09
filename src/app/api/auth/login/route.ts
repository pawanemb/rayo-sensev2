import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          error: 'Email and password are required',
          detail: 'Please provide both email and password to sign in.'
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Sign in with Supabase
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ [Login] Supabase auth error:', error.message);

      // Provide user-friendly error messages
      let errorMessage = error.message;

      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email address before signing in.';
      } else if (error.message.includes('User not found')) {
        errorMessage = 'No account found with this email address.';
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

    if (!authData.session) {
      return NextResponse.json(
        {
          error: 'Authentication failed',
          detail: 'Could not create session. Please try again.',
        },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const userRole = (
      authData.user?.user_metadata?.role ||
      authData.user?.app_metadata?.role ||
      ''
    ).toLowerCase();

    if (userRole !== 'admin' && userRole !== 'administrator') {
      await supabase.auth.signOut();
      console.error('❌ [Login] Non-admin user attempted login:', email);
      return NextResponse.json(
        {
          error: 'Admin access required',
          detail: 'Only administrators can access this system.',
        },
        { status: 403 }
      );
    }

    console.log('✅ [Login] Admin user logged in:', email);

    // Return tokens and user data
    return NextResponse.json({
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
      expires_in: authData.session.expires_in,
      user: {
        id: authData.user.id,
        email: authData.user.email || '',
        full_name: authData.user.user_metadata?.full_name ||
                   authData.user.user_metadata?.name ||
                   authData.user.email?.split('@')[0] ||
                   'User',
        email_confirmed: true,
        avatar: authData.user.user_metadata?.avatar_url ||
                authData.user.user_metadata?.picture,
        role: userRole,
      },
    });

  } catch (error) {
    console.error('❌ [Login] Unexpected error:', error);
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
