import { redirect, notFound } from 'next/navigation'
import TeamMemberEditor, {
  type PortalAccessState,
} from '@/components/team-member-editor'
import { getPortalSession, type PortalRole } from '@/lib/auth'
import { getTeamMembersList, getTeamTags } from '@/lib/cached-data'
import { collectTags, normalizeTags } from '@/lib/utils/team-tags'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ExperienceEntry } from '@/lib/utils/team-experience'

export default async function EditTeamMemberPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  // Read fresh, not from the hour-long cache: this form saves its whole tag
  // list back, so a stale copy would undo changes made since it was cached.
  const [{ user, isAdmin, isSuperAdmin }, { data: member }, teamRows, tagRows] =
    await Promise.all([
      getPortalSession(),
      supabase
        .from('team_members')
        .select('*, team_experience(id, company, role, display_order)')
        .eq('id', id)
        .maybeSingle(),
      getTeamMembersList(),
      getTeamTags().catch(() => []),
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
      supabase
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
      tagOptions={normalizeTags([
        ...collectTags(teamRows),
        ...tagRows.map((t) => t.name),
      ]).sort()}
    />
  )
}
