import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Handle auth session updates first
  const response = await updateSession(request)

  const { pathname } = request.nextUrl

  // Check if user is accessing admin routes
  if (pathname.startsWith('/admin') || pathname === '/') {
    // For admin routes, we'll handle auth checking in the AuthGuard component
    // This allows for better error handling and user experience
    return response
  }

  // Allow auth pages (signin, signup) and error pages
  if (
    pathname.startsWith('/signin') || 
    pathname.startsWith('/signup') || 
    pathname.startsWith('/error-404') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api')
  ) {
    return response
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images in public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}