import { redirect, notFound } from 'next/navigation'
import PropertyEditor from '@/components/property-editor'
import { getPortalSession } from '@/lib/auth'
import { getPropertyById, getTeamMembersList } from '@/lib/cached-data'

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [{ user, isAdmin }, property, teamMembers] = await Promise.all([
    getPortalSession(),
    getPropertyById(id),
    getTeamMembersList(),
  ])

  if (!property) notFound()
  if (!isAdmin && property.created_by !== user.id) redirect('/properties')

  const realEstateTeam = teamMembers.filter((m) =>
    (m.tags ?? []).includes('real estate'),
  )

  return (
    <PropertyEditor
      teamMembers={realEstateTeam}
      userId={user.id}
      property={property}
      marketingOrigin={process.env.NEXT_PUBLIC_MARKETING_ORIGIN}
    />
  )
}
