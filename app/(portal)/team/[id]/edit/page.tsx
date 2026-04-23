import { redirect, notFound } from 'next/navigation'
import TeamMemberEditor, {
  type PortalAccessState,
} from '@/components/team-member-editor'
import { getPortalSession, type PortalRole } from '@/lib/auth'
import { getTeamMemberById } from '@/lib/cached-data'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ExperienceEntry } from '@/lib/utils/team-experience'

export default async function EditTeamMemberPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [{ user, isAdmin, isSuperAdmin }, member] = await Promise.all([
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

  let portalAccess: PortalAccessState = { linked: false }
  if (isAdmin && member.user_id) {
    const [authRes, roleRes] = await Promise.all([
      createAdminClient().auth.admin.getUserById(member.user_id),
      (await createClient())
        .from('user_roles')
        .select('role')
        .eq('user_id', member.user_id)
        .maybeSingle(),
    ])
    const email = authRes.data.user?.email ?? ''
    const role: PortalRole = roleRes.data?.role === 'admin' ? 'admin' : 'editor'
    portalAccess = { linked: true, email, role }
  }

  return (
    <TeamMemberEditor
      member={{
        ...member,
        team_experience: experienceRows,
      }}
      viewerIsAdmin={isAdmin}
      viewerIsSuperAdmin={isSuperAdmin}
      portalAccess={portalAccess}
    />
  )
}
