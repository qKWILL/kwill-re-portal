import { redirect } from 'next/navigation'
import TeamMemberEditor from '@/components/team-member-editor'
import { getPortalSession } from '@/lib/auth'

export default async function NewTeamMemberPage() {
  const { isAdmin } = await getPortalSession()
  if (!isAdmin) redirect('/team')

  return <TeamMemberEditor member={null} />
}
