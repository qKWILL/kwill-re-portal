import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { TeamMemberHeader } from '@/components/team/TeamMemberHeader'
import { getTeamMemberById } from '@/lib/cached-data'
import { getPortalSession } from '@/lib/auth'
import {
  parseExperienceText,
  type ExperienceEntry,
} from '@/lib/utils/team-experience'

type ExperienceRow = {
  id: string
  company: string | null
  role: string | null
  display_order: number
}

export default async function TeamMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [{ user, isAdmin }, member] = await Promise.all([
    getPortalSession(),
    getTeamMemberById(id),
  ])

  if (!member) notFound()

  const canEdit = isAdmin || member.user_id === user.id
  const firstName = (member.name ?? '').split(' ')[0] || 'This person'

  const bioParagraphs: string[] = (member.bio ?? '')
    .split('|')
    .map((p: string) => p.trim())
    .filter(Boolean)

  const experienceFromRows: ExperienceEntry[] = (
    (member.team_experience ?? []) as ExperienceRow[]
  )
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .map((e) => ({
      company: e.company ?? '',
      role: e.role ?? '',
    }))
  // Legacy fallback: if no rows backfilled yet, parse the text column
  const experience =
    experienceFromRows.length > 0
      ? experienceFromRows
      : parseExperienceText(member.experience)

  return (
    <main className="pb-16 bg-white">
      {/* Admin bar */}
      <div className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <Link
            href="/team"
            className="text-sm text-neutral-500 hover:text-neutral-900"
          >
            ← Team
          </Link>
          {canEdit ? (
            <Link
              href={`/team/${id}/edit`}
              className="inline-flex items-center gap-1.5 border border-neutral-300 text-neutral-700 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-neutral-50 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Link>
          ) : null}
        </div>
      </div>

      <TeamMemberHeader
        member={{
          id: member.id,
          name: member.name ?? '',
          role: member.role ?? '',
          img_url: member.img_url ?? null,
          linkedin: member.linkedin ?? null,
        }}
      />

      <div className="max-w-[1200px] mx-auto px-6 py-12 space-y-10">
        {bioParagraphs.length > 0 ? (
          <section className="border-t border-neutral-300 pt-10">
            <p className="tracking-wider text-neutral-800 font-medium mb-6">
              ABOUT {firstName.toUpperCase()}
            </p>
            <div className="space-y-6 max-w-3xl">
              {bioParagraphs.map((p, i) => (
                <p key={i} className="font-light text-neutral-700">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ) : null}

        {experience.length > 0 ? (
          <section className="border-t border-neutral-300 pt-10">
            <p className="tracking-wider text-neutral-800 font-medium mb-8">
              EXPERIENCE
            </p>
            <div className="space-y-6 max-w-3xl">
              {experience.map((e, i) => (
                <div key={i} className="space-y-1.5">
                  <p className="text-neutral-800 text-base font-medium">
                    {e.company}
                  </p>
                  {e.role ? (
                    <p className="font-light text-neutral-600">{e.role}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {member.tags && member.tags.length > 0 ? (
          <section className="border-t border-neutral-300 pt-10">
            <p className="tracking-wider text-neutral-800 font-medium mb-6">
              TEAM
            </p>
            <div className="flex flex-wrap gap-2">
              {member.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs capitalize"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}
