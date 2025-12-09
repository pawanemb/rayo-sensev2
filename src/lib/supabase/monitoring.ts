/**
 * Supabase Monitoring Client
 * Separate Supabase instance for monitoring/logs data
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl2 = process.env.NEXT_PUBLIC_SUPABASE_URL2;
const supabaseAnonKey2 = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2;

if (!supabaseUrl2 || !supabaseAnonKey2) {
  throw new Error('Missing monitoring Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL2 or NEXT_PUBLIC_SUPABASE_ANON_KEY2)');
}

// Create Supabase client for monitoring database
export const supabaseMonitoring = createClient(supabaseUrl2, supabaseAnonKey2, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
