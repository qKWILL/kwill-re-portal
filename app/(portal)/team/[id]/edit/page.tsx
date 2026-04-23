import { redirect, notFound } from 'next/navigation'
import TeamMemberEditor from '@/components/team-member-editor'
import { getPortalSession } from '@/lib/auth'
import { getTeamMemberById } from '@/lib/cached-data'
import type { ExperienceEntry } from '@/lib/utils/team-experience'

export default async function EditTeamMemberPage({
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
  if (!isAdmin && member.user_id !== user.id) redirect('/team')

  const experienceRows: (ExperienceEntry & { display_order: number })[] = (
    member.team_experience ?? []
  )
    .slice()
    .sort(
      (a: { display_order: number }, b: { display_order: number }) =>
        a.display_order - b.display_order,
    )
    .map(
      (e: {
        id: string
        company: string | null
        role: string | null
        display_order: number
      }) => ({
        id: e.id,
        company: e.company ?? '',
        role: e.role ?? '',
        display_order: e.display_order,
      }),
    )

  return (
    <TeamMemberEditor
      member={{
        ...member,
        team_experience: experienceRows,
      }}
    />
  )
}
