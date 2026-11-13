import { createClient } from '@supabase/supabase-js';

const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};
export const supabaseUrl = env.VITE_SUPABASE_URL || 'https://gyfmtslcojkxcujfpxbk.supabase.co';
export const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5Zm10c2xjb2preGN1amZweGJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMDYyODksImV4cCI6MjEwMzY4MjI4OX0.g0r748PaFU8M6lGqOjZ1MrYpemFr43g4dzUE70R5Uys';

// Derive project ref from URL
export const getSupabaseProjectRef = (url: string = supabaseUrl) => {
  try {
    const match = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
    return match ? match[1] : 'gyfmtslcojkxcujfpxbk';
  } catch {
    return 'gyfmtslcojkxcujfpxbk';
  }
};

export const projectRef = getSupabaseProjectRef(supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
