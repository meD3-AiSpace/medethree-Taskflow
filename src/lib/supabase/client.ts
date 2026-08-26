import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON;

  if (!supabaseUrl || !supabaseAnon) {
    throw new Error(
      "Missing Supabase Client Environment Variables: Please define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON in .env.local"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnon);
}
