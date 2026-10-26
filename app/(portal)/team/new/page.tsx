import { redirect } from 'next/navigation'
import TeamMemberEditor from '@/components/team-member-editor'
import { getPortalSession } from '@/lib/auth'
import { getTeamMembersList, getTeamTags } from '@/lib/cached-data'
import { collectTags, normalizeTags } from '@/lib/utils/team-tags'

export default async function NewTeamMemberPage() {
  const { isAdmin, isSuperAdmin } = await getPortalSession()
  if (!isAdmin) redirect('/team')
  const [teamRows, tagRows] = await Promise.all([
    getTeamMembersList(),
    getTeamTags().catch(() => []),
  ])

  return (
    <TeamMemberEditor
      member={null}
      viewerIsAdmin={isAdmin}
      viewerIsSuperAdmin={isSuperAdmin}
      tagOptions={normalizeTags([
        ...collectTags(teamRows),
        ...tagRows.map((t) => t.name),
      ]).sort()}
    />
  )
}
