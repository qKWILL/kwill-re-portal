import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SidebarNav from '@/components/sidebar-nav'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const role = roleRow?.role ?? 'editor'

  return (
    <div className="min-h-screen flex bg-neutral-50 items-start">
      <SidebarNav user={user} role={role} />
      <main className="flex-1 min-w-0 p-4 lg:p-8 pt-20 lg:pt-8">
        {children}
      </main>
    </div>
  )
}
