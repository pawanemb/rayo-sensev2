import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Check if user is admin
    const userRole = (user.user_metadata?.role || user.app_metadata?.role || '').toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'administrator';

    if (!isAdmin) {
      return NextResponse.json({ user: null, error: 'Admin access required' }, { status: 403 });
    }

    // Return user data
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        role: userRole,
        avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        created_at: user.created_at,
      }
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ user: null, error: 'Session check failed' }, { status: 500 });
  }
}
