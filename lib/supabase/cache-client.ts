import { createServerClient } from "@supabase/ssr";

// Server-only client for `unstable_cache` fetchers. These run outside the
// request scope, so no cookies/session are available. We use the service role
// key to bypass RLS — the portal is authenticated at the page level, and
// cached reads power trusted internal CMS views (drafts, submissions, etc.).
// Never import this from client code.
export function createCacheClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "createCacheClient requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createServerClient(url, serviceRoleKey, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  });
}
