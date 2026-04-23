import Link from 'next/link'
import { Plus } from 'lucide-react'
import TeamClient, { type PortalTeamRow } from './team-client'
import { getTeamMembersList } from '@/lib/cached-data'
import { getPortalSession } from '@/lib/auth'

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const [{ user, isAdmin }, rows] = await Promise.all([
    getPortalSession(),
    getTeamMembersList(),
  ])

  const members: PortalTeamRow[] = rows.map((row) => ({
    id: row.id,
    name: row.name ?? '',
    role: row.role ?? '',
    img_url: row.img_url ?? null,
    tags: row.tags ?? [],
    user_id: row.user_id ?? null,
  }))

  return (
    <main className="max-w-[1200px] mx-auto px-6 pt-8 pb-16">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-neutral-900 text-[clamp(2.2rem,0.15rem+8vw,3.125rem)] leading-[1.1] tracking-[-0.01em] font-serif font-normal">
            Team
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {isAdmin
              ? `${members.length} members`
              : 'Your profile is highlighted first — you can only edit yourself.'}
          </p>
        </div>
        {isAdmin ? (
          <Link
            href="/team/new"
            className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Member
          </Link>
        ) : null}
      </div>

      <TeamClient
        members={members}
        currentUserId={user.id}
        isAdmin={isAdmin}
        currentView={view === 'list' ? 'list' : 'grid'}
      />
    </main>
  )
}
