import SidebarNav from '@/components/sidebar-nav'
import { getPortalSession } from '@/lib/auth'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, role } = await getPortalSession()

  return (
    <div className="min-h-screen flex bg-neutral-50 items-start">
      <SidebarNav user={user} role={role} />
      <main className="flex-1 min-w-0 p-4 lg:p-8 pt-20 lg:pt-8">
        {children}
      </main>
    </div>
  )
}
