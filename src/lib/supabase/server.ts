import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

// Global cache for Supabase client instance (works in both dev and production)
const globalForSupabase = global as typeof globalThis & {
  _supabaseServerClient?: SupabaseClient;
};

export async function createClient() {
  const cookieStore = await cookies()

  // Reuse the same client instance in both dev and production
  if (globalForSupabase._supabaseServerClient) {
    return globalForSupabase._supabaseServerClient;
  }

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Cookie modification can only happen in Server Actions or Route Handlers
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Cookie modification can only happen in Server Actions or Route Handlers
          }
        },
      },
    }
  )

  // Cache the client globally (both dev and production)
  globalForSupabase._supabaseServerClient = client;

  return client;
}
