import { NextResponse } from 'next/server';
import { requireAdmin, handleApiError } from '@/lib/auth/requireAdmin';

export async function GET() {
  try {
    // Use centralized requireAdmin - handles all auth checks
    const user = await requireAdmin();

    // Return normalized user data
    const userRole = (user.user_metadata?.role || user.app_metadata?.role || '').toLowerCase();

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
    return handleApiError(error);
  }
}
