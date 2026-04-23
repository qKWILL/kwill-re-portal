import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Server-only admin client. Uses the service role key to perform privileged
// operations (creating auth users silently, reading auth.users for listing).
// NEVER import this from a client component.
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient must not be called in the browser");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
