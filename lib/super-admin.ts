// Server-free module so client components can import the helper without
// pulling lib/auth.ts (which depends on next/headers via the Supabase
// server client) into the browser bundle.

export const SUPER_ADMIN_EMAILS = [
  "qmorton@kwilladvisors.com",
  "qasirhmorton@gmail.com",
] as const;

export const SUPER_ADMIN_EMAIL = SUPER_ADMIN_EMAILS[0];

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  const normalized = (email ?? "").toLowerCase();
  return SUPER_ADMIN_EMAILS.some((e) => e.toLowerCase() === normalized);
}
