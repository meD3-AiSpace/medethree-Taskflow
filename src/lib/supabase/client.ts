import { createBrowserClient } from "@supabase/ssr";

const DEFAULT_SUPABASE_URL = "https://gihjahkmflcnnbebzebw.supabase.co";
const DEFAULT_SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpaGphaGttZmxjbm5iZWJ6ZWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczODQ4MjQsImV4cCI6MjEwMjk2MDgyNH0.f4kF8ecNIoXNTnTLrb_Gs1WXzHKn31WqUsQS_xDWnrU";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON || DEFAULT_SUPABASE_ANON;

  return createBrowserClient(supabaseUrl, supabaseAnon);
}
