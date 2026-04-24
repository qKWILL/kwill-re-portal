import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_EMAILS,
  isSuperAdminEmail,
} from "@/lib/super-admin";

export type PortalRole = "admin" | "editor";

export { SUPER_ADMIN_EMAIL, SUPER_ADMIN_EMAILS, isSuperAdminEmail };

export type PortalSession = {
  user: User;
  role: PortalRole;
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

// React.cache dedupes the result within a single request, so the layout
// and the page it wraps share one getUser + one user_roles lookup. Without
// this dedupe, every page component re-ran both queries.
export const getPortalSession = cache(async (): Promise<PortalSession> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const role: PortalRole = roleRow?.role === "admin" ? "admin" : "editor";
  const isSuperAdmin = role === "admin" && isSuperAdminEmail(user.email);
  return { user, role, isAdmin: role === "admin", isSuperAdmin };
});
