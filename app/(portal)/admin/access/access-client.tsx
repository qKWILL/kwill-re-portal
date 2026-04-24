"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Link2, Unlink, Mail, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  inviteUser,
  setUserRole,
  linkTeamMember,
  unlinkTeamMember,
  type PortalUserRow,
} from "@/lib/actions/users";
import { isSuperAdminEmail } from "@/lib/auth";

type UnlinkedMember = {
  id: string;
  name: string | null;
  role: string | null;
};

function formatLastSignIn(iso: string | null) {
  if (!iso) return "Never";
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const day = 86_400_000;
  if (diffMs < day) return "Today";
  if (diffMs < 2 * day) return "Yesterday";
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}d ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export default function AccessClient({
  currentUserId,
  isSuperAdmin,
  users,
  unlinkedTeamMembers,
}: {
  currentUserId: string;
  isSuperAdmin: boolean;
  users: PortalUserRow[];
  unlinkedTeamMembers: UnlinkedMember[];
}) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [linkFor, setLinkFor] = useState<PortalUserRow | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const ordered = useMemo(() => {
    const selfIdx = users.findIndex((u) => u.id === currentUserId);
    if (selfIdx < 0) return users;
    const copy = [...users];
    const [self] = copy.splice(selfIdx, 1);
    return [self, ...copy];
  }, [users, currentUserId]);

  function refresh() {
    router.refresh();
  }

  function clearRowError(id: string) {
    setRowError((prev) => {
      if (!(id in prev)) return prev;
      const rest = { ...prev };
      delete rest[id];
      return rest;
    });
  }

  function setRowErr(id: string, msg: string) {
    setRowError((prev) => ({ ...prev, [id]: msg }));
  }

  function handleRoleChange(u: PortalUserRow, next: "admin" | "editor") {
    clearRowError(u.id);
    startTransition(async () => {
      const res = await setUserRole({ userId: u.id, role: next });
      if (!res.success) setRowErr(u.id, res.error);
      refresh();
    });
  }

  function handleUnlink(u: PortalUserRow) {
    if (!u.team_member) return;
    clearRowError(u.id);
    startTransition(async () => {
      const res = await unlinkTeamMember({ teamMemberId: u.team_member!.id });
      if (!res.success) setRowErr(u.id, res.error);
      refresh();
    });
  }

  function handleLinkSubmit(teamMemberId: string) {
    if (!linkFor) return;
    const target = linkFor;
    clearRowError(target.id);
    startTransition(async () => {
      const res = await linkTeamMember({
        userId: target.id,
        teamMemberId,
      });
      if (!res.success) setRowErr(target.id, res.error);
      setLinkFor(null);
      refresh();
    });
  }

  return (
    <main className="max-w-[1200px] mx-auto px-6 pt-8 pb-16">
      {/* Header */}
      <div className="flex items-end justify-between gap-6 flex-wrap mb-10">
        <div>
          <h1 className="text-neutral-900 text-[clamp(2.2rem,0.15rem+8vw,3.125rem)] leading-[1.1] tracking-[-0.01em] font-serif font-normal">
            Access
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage who can sign in. No passwords, no invite emails.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add person
        </button>
      </div>

      {/* List */}
      {ordered.length === 0 ? (
        <div className="bg-neutral-50 rounded-lg p-16 text-center">
          <h2 className="font-serif text-2xl text-neutral-900 mb-2">
            Just you so far
          </h2>
          <p className="text-sm text-neutral-500 mb-6">
            Add someone and they&apos;ll sign in with a magic link from the login page.
          </p>
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add person
          </button>
        </div>
      ) : (
        <div className="border-t border-neutral-100">
          {ordered.map((u) => {
            const isSelf = u.id === currentUserId;
            const targetIsSuper = isSuperAdminEmail(u.email);
            const canChangeRole =
              !isSelf &&
              !targetIsSuper &&
              (u.role === "editor" || isSuperAdmin);
            const canUnlink =
              !!u.team_member &&
              !targetIsSuper &&
              (u.role !== "admin" || isSuperAdmin);
            const err = rowError[u.id];

            return (
              <div
                key={u.id}
                className="flex items-center gap-4 py-4 border-b border-neutral-100"
              >
                {/* Person */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative w-10 h-10 shrink-0 rounded-full bg-neutral-100 overflow-hidden">
                    {u.team_member?.img_url ? (
                      <Image
                        src={u.team_member.img_url}
                        alt={u.team_member.name ?? u.email}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs font-medium">
                        {u.email.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {u.team_member?.name || u.email}
                      </p>
                      {isSelf ? (
                        <span className="text-[10px] uppercase tracking-wider text-neutral-400">
                          You
                        </span>
                      ) : null}
                      {targetIsSuper && !isSelf ? (
                        <Shield className="w-3 h-3 text-neutral-400" />
                      ) : null}
                    </div>
                    <p className="text-xs text-neutral-500 truncate">
                      {u.team_member?.name ? u.email : "No team profile"}
                    </p>
                  </div>
                </div>

                {/* Team profile */}
                <div className="hidden md:block w-40 shrink-0 text-xs text-neutral-500">
                  {u.team_member ? (
                    <Link
                      href={`/team/${u.team_member.id}/edit`}
                      className="hover:text-neutral-900 truncate block"
                    >
                      {u.team_member.role || "Linked"}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setLinkFor(u)}
                      disabled={unlinkedTeamMembers.length === 0}
                      className="inline-flex items-center gap-1 text-neutral-500 hover:text-neutral-900 disabled:opacity-40"
                    >
                      <Link2 className="w-3 h-3" />
                      Link profile
                    </button>
                  )}
                </div>

                {/* Last sign-in */}
                <div className="hidden lg:block w-24 shrink-0 text-xs text-neutral-400 tabular-nums">
                  {formatLastSignIn(u.last_sign_in_at)}
                </div>

                {/* Role — toggle for super-admin, static label for everyone else */}
                {isSuperAdmin ? (
                  <RoleToggle
                    value={u.role}
                    disabled={!canChangeRole || pending}
                    onChange={(r) => handleRoleChange(u, r)}
                    hint={
                      isSelf
                        ? "Can't change your own role"
                        : targetIsSuper
                          ? "Super-admin role is locked"
                          : undefined
                    }
                  />
                ) : (
                  <span className="inline-flex items-center rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium capitalize text-neutral-700">
                    {u.role}
                  </span>
                )}

                {/* Actions */}
                <div className="w-8 shrink-0 flex justify-end">
                  {canUnlink ? (
                    <button
                      type="button"
                      onClick={() => handleUnlink(u)}
                      disabled={pending}
                      title="Unlink team profile"
                      className="p-1.5 rounded text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-40"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>

                {err ? (
                  <div className="w-full basis-full text-xs text-red-600 pl-14">
                    {err}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        canCreateAdmin={isSuperAdmin}
        unlinkedTeamMembers={unlinkedTeamMembers}
        onDone={refresh}
      />

      <LinkDialog
        target={linkFor}
        unlinkedTeamMembers={unlinkedTeamMembers}
        onOpenChange={(open) => !open && setLinkFor(null)}
        onSubmit={handleLinkSubmit}
      />
    </main>
  );
}

function RoleToggle({
  value,
  disabled,
  onChange,
  hint,
}: {
  value: "admin" | "editor";
  disabled: boolean;
  onChange: (next: "admin" | "editor") => void;
  hint?: string;
}) {
  return (
    <div
      className="inline-flex items-center rounded-full border border-neutral-200 p-0.5 text-xs font-medium"
      title={hint}
    >
      {(["editor", "admin"] as const).map((r) => {
        const active = value === r;
        return (
          <button
            key={r}
            type="button"
            onClick={() => !active && onChange(r)}
            disabled={disabled || active}
            className={`px-3 py-1 rounded-full capitalize transition-colors ${
              active
                ? "bg-neutral-900 text-white"
                : "text-neutral-500 hover:text-neutral-900 disabled:cursor-not-allowed disabled:hover:text-neutral-500"
            }`}
          >
            {r}
          </button>
        );
      })}
    </div>
  );
}

function InviteDialog({
  open,
  onOpenChange,
  canCreateAdmin,
  unlinkedTeamMembers,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canCreateAdmin: boolean;
  unlinkedTeamMembers: UnlinkedMember[];
  onDone: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "editor">("editor");
  const [teamMemberId, setTeamMemberId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function reset() {
    setEmail("");
    setRole("editor");
    setTeamMemberId("");
    setError(null);
    setBusy(false);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await inviteUser({
      email,
      role,
      teamMemberId: teamMemberId || null,
    });
    setBusy(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    reset();
    onOpenChange(false);
    onDone();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Add person</DialogTitle>
          <DialogDescription>
            We&apos;ll create their account. They sign in with a magic link from the
            login page — no password.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-neutral-700 block mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full border border-neutral-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-700 block mb-1.5">
              Role
            </label>
            <div className="inline-flex items-center rounded-full border border-neutral-200 p-0.5 text-xs font-medium">
              {(["editor", "admin"] as const).map((r) => {
                const active = role === r;
                const disabled = r === "admin" && !canCreateAdmin;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => !disabled && setRole(r)}
                    disabled={disabled}
                    title={
                      disabled
                        ? "Only qmorton@kwilladvisors.com can create an admin directly"
                        : undefined
                    }
                    className={`px-3 py-1 rounded-full capitalize transition-colors ${
                      active
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-500 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed"
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
            {!canCreateAdmin ? (
              <p className="text-[11px] text-neutral-400 mt-1.5">
                Editors can be promoted to admin later by the super-admin.
              </p>
            ) : null}
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-700 block mb-1.5">
              Link to team profile (optional)
            </label>
            <select
              value={teamMemberId}
              onChange={(e) => setTeamMemberId(e.target.value)}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
            >
              <option value="">None</option>
              {unlinkedTeamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name || "Unnamed"}
                  {m.role ? ` — ${m.role}` : ""}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-sm text-neutral-500 hover:text-neutral-900 px-3 py-1.5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy || !email}
            className="inline-flex items-center gap-1.5 bg-black text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {busy ? "Adding…" : "Add person"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LinkDialog({
  target,
  unlinkedTeamMembers,
  onOpenChange,
  onSubmit,
}: {
  target: PortalUserRow | null;
  unlinkedTeamMembers: UnlinkedMember[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (teamMemberId: string) => void;
}) {
  const [selected, setSelected] = useState("");

  return (
    <Dialog
      open={!!target}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setSelected("");
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            Link team profile
          </DialogTitle>
          <DialogDescription>
            Attach a public team profile to {target?.email}.
          </DialogDescription>
        </DialogHeader>

        <div>
          <label className="text-xs font-medium text-neutral-700 block mb-1.5">
            Team profile
          </label>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
          >
            <option value="">Choose one…</option>
            {unlinkedTeamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name || "Unnamed"}
                {m.role ? ` — ${m.role}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-sm text-neutral-500 hover:text-neutral-900 px-3 py-1.5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => selected && onSubmit(selected)}
            disabled={!selected}
            className="inline-flex items-center gap-1.5 bg-black text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            Link profile
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
