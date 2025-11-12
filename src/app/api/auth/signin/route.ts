import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    // Check if user has admin role - REQUIRED
    const userRole = (authData.user?.user_metadata?.role || authData.user?.app_metadata?.role || '').toLowerCase();

    if (userRole !== 'admin' && userRole !== 'administrator') {
      // Sign out the user if they don't have admin role
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Admin access required. Only administrators can access this system.' },
        { status: 403 }
      )
    }

    // Set explicit auth cookie with access token
    const response = NextResponse.json({
      message: 'Sign in successful',
      user: {
        id: authData.user.id,
        email: authData.user.email || '',
        name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'User',
        role: userRole,
        avatar: authData.user.user_metadata?.avatar_url || authData.user.user_metadata?.picture,
        created_at: authData.user.created_at,
      },
    });

    // Set explicit cookie for session management
    if (authData.session?.access_token) {
      response.cookies.set('supabase-auth-token', authData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Sign in error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}