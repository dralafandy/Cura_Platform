import { createClient, SupabaseClient } from '@supabase/supabase-js';

// User's provided Supabase credentials
const supabaseUrl = 'https://vlhnceijreyoukkttbao.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsaG5jZWlqcmV5b3Vra3R0YmFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNjM1ODAsImV4cCI6MjA4NzYzOTU4MH0.vnoRgBGYPPE9yphuMvKdCZ2eRJGdvVlj6RVho7oOmMo';

// The supabase client is exported.
// An error will be logged if the URL or Key is missing.
export const supabase: SupabaseClient | null =
  (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

if (!supabase) {
    console.error(
        'Supabase client could not be initialized. Please check that the URL and anon key are valid in `frontend/supabaseClient.ts`.'
    );
}
