import { createClient, SupabaseClient } from '@supabase/supabase-js';

// User's provided Supabase credentials
const supabaseUrl = 'https://xiaolhekiioawkymvjwb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpYW9saGVraWlvYXdreW12andiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MjQxNzYsImV4cCI6MjA3NzIwMDE3Nn0.iyAUKnGa5Y_sKZgsvw1XujjeG61j_Rf4hXibyzsL_VU';

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
