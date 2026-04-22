import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import TeamMemberEditor from '@/components/team-member-editor'
import type { ExperienceEntry } from '@/lib/utils/team-experience'

export default async function EditTeamMemberPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  const isAdmin = roleRow?.role === 'admin'

  const { data: member } = await supabase
    .from('team_members')
    .select('*, team_experience(id, company, role, display_order)')
    .eq('id', id)
    .single()

  if (!member) notFound()
  if (!isAdmin && member.user_id !== user.id) redirect('/team')

  const experienceRows: (ExperienceEntry & { display_order: number })[] = (
    member.team_experience ?? []
  )
    .slice()
    .sort(
      (
        a: { display_order: number },
        b: { display_order: number },
      ) => a.display_order - b.display_order,
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
