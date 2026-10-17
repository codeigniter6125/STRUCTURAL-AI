import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Public frontend Supabase configuration using Vite environment variables
// Sourced from VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL || '';

export const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Evaluate Supabase configuration state from active frontend values
export const isSupabaseConfigured: boolean = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_URL.startsWith('https://') &&
  !SUPABASE_ANON_KEY.includes('YOUR_') &&
  SUPABASE_ANON_KEY.length > 20
);

// Supabase client instance initialized with frontend publishable/anon credentials
// Uses dummy placeholder URL/key when unconfigured so module import succeeds while isSupabaseConfigured flags state
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

