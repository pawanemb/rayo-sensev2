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
    const userRole = authData.user?.user_metadata?.role || authData.user?.app_metadata?.role
    
    if (userRole !== 'admin') {
      // Sign out the user if they don't have admin role
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Admin access required. Only administrators can access this system.' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      message: 'Sign in successful',
      user: authData.user,
    })
  } catch (error) {
    console.error('Sign in error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}