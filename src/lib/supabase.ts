import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Using untyped client since we don't have Supabase CLI generated types.
// The app types are defined in ./types.ts and used for casting query results.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
