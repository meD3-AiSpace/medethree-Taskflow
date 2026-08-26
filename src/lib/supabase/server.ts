import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const DEFAULT_SUPABASE_URL = "https://gihjahkmflcnnbebzebw.supabase.co";
const DEFAULT_SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpaGphaGttZmxjbm5iZWJ6ZWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczODQ4MjQsImV4cCI6MjEwMjk2MDgyNH0.f4kF8ecNIoXNTnTLrb_Gs1WXzHKn31WqUsQS_xDWnrU";

export function createClient() {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON || process.env.SUPABASE_ANON || DEFAULT_SUPABASE_ANON;

  return createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Ignored if called in Server Component
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Ignored if called in Server Component
        }
      },
    },
  });
}
