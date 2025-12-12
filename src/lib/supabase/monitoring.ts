/**
 * Supabase Monitoring Client
 * Separate Supabase instance for monitoring/logs data
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl2 = process.env.NEXT_PUBLIC_SUPABASE_URL2;
const supabaseAnonKey2 = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2;

if (!supabaseUrl2 || !supabaseAnonKey2) {
  console.warn('Missing monitoring Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL2 or NEXT_PUBLIC_SUPABASE_ANON_KEY2)');
}

// Create Supabase client for monitoring database
// Use fallback values to prevent build errors if variables are missing
export const supabaseMonitoring = createClient(
  supabaseUrl2 || 'https://placeholder.supabase.co', 
  supabaseAnonKey2 || 'placeholder', 
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
