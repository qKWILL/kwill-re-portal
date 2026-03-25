'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Building2, FileText, Users, LogOut, Menu, X } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/properties', label: 'Properties', icon: Building2 },
  { href: '/posts', label: 'Posts', icon: FileText },
  { href: '/team', label: 'Team', icon: Users },
]

export default function SidebarNav({ user, role }: { user: User; role: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const NavLinks = () => (
    <>
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              active
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        )
      })}
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 flex items-center justify-between px-4 h-14">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">KWILL</p>
          <p className="text-sm font-medium text-gray-900 -mt-0.5">Portal</p>
        </div>
        <button onClick={() => setOpen(!open)} className="p-2 rounded-md text-gray-600 hover:bg-gray-100">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/40" onClick={() => setOpen(false)}>
          <div className="absolute top-14 left-0 bottom-0 w-64 bg-white flex flex-col" onClick={e => e.stopPropagation()}>
            <nav className="flex-1 p-4 space-y-1">
              <NavLinks />
            </nav>
            <div className="p-4 border-t border-gray-200">
              <div className="px-3 py-2 mb-2">
                <p className="text-xs font-medium text-gray-900 truncate">{user.email}</p>
                <p className="text-xs text-gray-400 capitalize">{role}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 w-full transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 min-h-screen bg-white border-r border-gray-200 flex-col">
        <div className="p-6 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">KWILL</p>
          <p className="text-sm font-medium text-gray-900 mt-1">Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLinks />
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs font-medium text-gray-900 truncate">{user.email}</p>
            <p className="text-xs text-gray-400 capitalize">{role}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
