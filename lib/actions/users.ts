"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPortalSession, SUPER_ADMIN_EMAIL, type PortalRole } from "@/lib/auth";
import { TAGS } from "@/lib/cache-tags";

export type PortalUserRow = {
  id: string;
  email: string;
  role: PortalRole;
  created_at: string;
  last_sign_in_at: string | null;
  team_member: {
    id: string;
    name: string | null;
    img_url: string | null;
    role: string | null;
  } | null;
};

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

const inviteSchema = z.object({
  email: z.string().email("Valid email required"),
  role: z.enum(["admin", "editor"]),
  teamMemberId: z.string().uuid().nullable().optional(),
});

function isSuper(email: string | null | undefined) {
  return (email ?? "").toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

async function requireAdmin() {
  const session = await getPortalSession();
  if (!session.isAdmin) {
    return { ok: false as const, error: "Admins only." };
  }
  return { ok: true as const, session };
}

export async function listPortalUsers(): Promise<PortalUserRow[]> {
  const gate = await requireAdmin();
  if (!gate.ok) return [];

  const admin = createAdminClient();
  const supabase = await createClient();

  const [{ data: authList }, { data: roles }, { data: teamRows }] =
    await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabase.from("user_roles").select("user_id, role"),
      supabase
        .from("team_members")
        .select("id, name, img_url, role, user_id")
        .not("user_id", "is", null),
    ]);

  const roleMap = new Map(
    (roles ?? []).map((r) => [r.user_id as string, r.role as string]),
  );
  const teamByUser = new Map(
    (teamRows ?? []).map((t) => [t.user_id as string, t]),
  );

  const users = authList?.users ?? [];
  return users
    .map((u): PortalUserRow => {
      const role: PortalRole =
        (roleMap.get(u.id) as PortalRole | undefined) === "admin"
          ? "admin"
          : "editor";
      const tm = teamByUser.get(u.id);
      return {
        id: u.id,
        email: u.email ?? "",
        role,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        team_member: tm
          ? {
              id: tm.id,
              name: tm.name,
              img_url: tm.img_url,
              role: tm.role,
            }
          : null,
      };
    })
    .sort((a, b) => a.email.localeCompare(b.email));
}

export async function inviteUser(input: {
  email: string;
  role: PortalRole;
  teamMemberId?: string | null;
}): Promise<ActionResult<{ userId: string }>> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const admin = createAdminClient();
  const normalizedEmail = parsed.data.email.trim().toLowerCase();

  // Only super-admin can mint a new Admin outright. Regular admins can promote
  // existing editors but cannot invite directly as admin.
  if (parsed.data.role === "admin" && !gate.session.isSuperAdmin) {
    return {
      success: false,
      error: "Only the super-admin can create an admin directly.",
    };
  }

  // Find existing auth user by email (admin API has no direct lookup; filter
  // through a bounded listUsers page — sufficient for expected team size).
  const { data: existingList } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const existing = existingList?.users.find(
    (u) => (u.email ?? "").toLowerCase() === normalizedEmail,
  );

  let userId: string;
  if (existing) {
    userId = existing.id;
  } else {
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
      });
    if (createErr || !created.user) {
      return {
        success: false,
        error: createErr?.message ?? "Failed to create user",
      };
    }
    userId = created.user.id;
  }

  const supabase = await createClient();

  const { error: roleErr } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role: parsed.data.role }, { onConflict: "user_id" });
  if (roleErr) return { success: false, error: roleErr.message };

  if (parsed.data.teamMemberId) {
    const { error: linkErr } = await supabase
      .from("team_members")
      .update({ user_id: userId })
      .eq("id", parsed.data.teamMemberId);
    if (linkErr) return { success: false, error: linkErr.message };
    revalidateTag(TAGS.teamMember(parsed.data.teamMemberId), "max");
  }

  await supabase.from("audit_log").insert({
    table_name: "user_roles",
    record_id: userId,
    action: existing ? "update" : "create",
    before: null,
    after: { email: normalizedEmail, role: parsed.data.role },
    performed_by: gate.session.user.id,
  });

  revalidateTag(TAGS.users, "max");
  revalidateTag(TAGS.team, "max");
  return { success: true, data: { userId } };
}

export async function setUserRole(input: {
  userId: string;
  role: PortalRole;
}): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  if (input.userId === gate.session.user.id) {
    return { success: false, error: "You cannot change your own role." };
  }

  const admin = createAdminClient();
  const { data: target, error: targetErr } = await admin.auth.admin.getUserById(
    input.userId,
  );
  if (targetErr || !target.user) {
    return { success: false, error: "User not found." };
  }

  if (isSuper(target.user.email)) {
    return { success: false, error: "The super-admin's role cannot be changed." };
  }

  const supabase = await createClient();
  const { data: currentRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", input.userId)
    .maybeSingle();
  const currentRole: PortalRole =
    currentRow?.role === "admin" ? "admin" : "editor";

  if (currentRole === input.role) {
    return { success: true };
  }

  // Changing anyone who is currently an admin requires super-admin. That
  // covers demoting an admin and effectively locks admin role changes to the
  // super-admin.
  if (currentRole === "admin" && !gate.session.isSuperAdmin) {
    return {
      success: false,
      error: "Only the super-admin can change an admin's role.",
    };
  }

  // Promoting to admin is allowed for any admin.
  const { error: upsertErr } = await supabase
    .from("user_roles")
    .upsert(
      { user_id: input.userId, role: input.role },
      { onConflict: "user_id" },
    );
  if (upsertErr) return { success: false, error: upsertErr.message };

  await supabase.from("audit_log").insert({
    table_name: "user_roles",
    record_id: input.userId,
    action: "update",
    before: { role: currentRole },
    after: { role: input.role },
    performed_by: gate.session.user.id,
  });

  revalidateTag(TAGS.users, "max");
  return { success: true };
}

export async function linkTeamMember(input: {
  userId: string;
  teamMemberId: string;
}): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const supabase = await createClient();

  // Clear any previous link for this user so it stays 1:1.
  await supabase
    .from("team_members")
    .update({ user_id: null })
    .eq("user_id", input.userId);

  const { error } = await supabase
    .from("team_members")
    .update({ user_id: input.userId })
    .eq("id", input.teamMemberId);
  if (error) return { success: false, error: error.message };

  revalidateTag(TAGS.users, "max");
  revalidateTag(TAGS.team, "max");
  revalidateTag(TAGS.teamMember(input.teamMemberId), "max");
  return { success: true };
}

export async function unlinkTeamMember(input: {
  teamMemberId: string;
}): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const supabase = await createClient();

  const { data: before } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("id", input.teamMemberId)
    .single();

  // Protect admin rows: only super-admin can detach an admin.
  if (before?.user_id && !gate.session.isSuperAdmin) {
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", before.user_id)
      .maybeSingle();
    if (roleRow?.role === "admin") {
      return {
        success: false,
        error: "Only the super-admin can unlink an admin's team profile.",
      };
    }
  }

  const { error } = await supabase
    .from("team_members")
    .update({ user_id: null })
    .eq("id", input.teamMemberId);
  if (error) return { success: false, error: error.message };

  revalidateTag(TAGS.users, "max");
  revalidateTag(TAGS.team, "max");
  revalidateTag(TAGS.teamMember(input.teamMemberId), "max");
  return { success: true };
}

export async function getUnlinkedTeamMembers(): Promise<
  { id: string; name: string | null; role: string | null }[]
> {
  const gate = await requireAdmin();
  if (!gate.ok) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("team_members")
    .select("id, name, role")
    .is("user_id", null)
    .order("name");
  return data ?? [];
}
