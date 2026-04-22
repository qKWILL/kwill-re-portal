'use client'

import PropertyEditor from '@/components/property-editor'

type TeamMember = {
  id: string
  name: string
  role: string
  img_url?: string | null
  slug?: string | null
}

export default function NewPropertyClient({
  teamMembers,
  userId,
}: {
  teamMembers: TeamMember[]
  userId: string
}) {
  return <PropertyEditor teamMembers={teamMembers} userId={userId} />
}
