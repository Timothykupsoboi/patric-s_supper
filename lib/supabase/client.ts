import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nombvcgcklptugiiwrvu.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbWJ2Y2dja2xwdHVnaWl3cnZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMzc5NTgsImV4cCI6MjA5ODkxMzk1OH0.Z-dYIsDmDsh1djdbgOfMr2jiYYu515smBBKxgbFFRPw';

let clientInstance: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (clientInstance) return clientInstance;

  clientInstance = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return clientInstance;
}

export const supabase = createClient();
