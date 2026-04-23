"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Users,
  Inbox,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { PortalRole } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/posts", label: "Posts", icon: FileText },
  { href: "/team", label: "Team", icon: Users },
  { href: "/submissions", label: "Submissions", icon: Inbox },
];

const adminNavItems = [
  { href: "/admin/access", label: "Access", icon: ShieldCheck },
];

export default function SidebarNav({
  user,
  role,
}: {
  user: User;
  role: PortalRole;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const renderItems = (
    items: { href: string; label: string; icon: typeof LayoutDashboard }[]
  ) =>
    items.map(({ href, label, icon: Icon }) => {
      const active = pathname === href || pathname.startsWith(href + "/");
      return (
        <Link
          key={href}
          href={href}
          prefetch
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
            active
              ? "bg-neutral-100 text-neutral-900"
              : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </Link>
      );
    });

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-neutral-200 flex items-center px-4 h-16">
        <div className="w-9 shrink-0" aria-hidden />
        <Link href="/dashboard" prefetch className="flex-1 flex items-center justify-center">
          <Image
            src="/KWILL Logo_Horizontal.png"
            alt="KWILL"
            width={180}
            height={48}
            priority
            className="h-10 w-auto"
          />
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-md text-neutral-600 hover:bg-neutral-100 shrink-0"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute top-16 left-0 bottom-0 w-64 bg-white flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex-1 p-4 space-y-1">
              {renderItems(navItems)}
              {role === "admin" ? (
                <>
                  <div className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-wider text-neutral-400">
                    Admin
                  </div>
                  {renderItems(adminNavItems)}
                </>
              ) : null}
            </nav>
            <div className="p-4 border-t border-neutral-200">
              <div className="px-3 py-2 mb-2">
                <p className="text-xs font-medium text-neutral-900 truncate">
                  {user.email}
                </p>
                <p className="text-xs text-neutral-400 capitalize">{role}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 w-full "
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 h-screen sticky top-0 bg-white border-r border-neutral-200 flex-col">
        <div className="p-6 border-b border-neutral-200 flex items-center justify-center">
          <Link href="/dashboard" prefetch className="flex items-center justify-center w-full">
            <Image
              src="/KWILL Logo_Horizontal.png"
              alt="KWILL"
              width={200}
              height={56}
              priority
              className="h-12 w-auto"
            />
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {renderItems(navItems)}
          {role === "admin" ? (
            <>
              <div className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-wider text-neutral-400">
                Admin
              </div>
              {renderItems(adminNavItems)}
            </>
          ) : null}
        </nav>
        <div className="p-4 border-t border-neutral-200">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs font-medium text-neutral-900 truncate">
              {user.email}
            </p>
            <p className="text-xs text-neutral-400 capitalize">{role}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 w-full "
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
