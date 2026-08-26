import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://gihjahkmflcnnbebzebw.supabase.co";
const DEFAULT_SERVICE_ROLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpaGphaGttZmxjbm5iZWJ6ZWJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzM4NDgyNCwiZXhwIjoyMTAyOTYwODI0fQ.K-JcGlGhPjJsxLrpEvvtEE_vFOichlW_GbUc76RXw3c";

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_ROLE;

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
