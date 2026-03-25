import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PropertyForm from '@/components/property-form'
import PropertyImageUpload from '@/components/property-image-upload'

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: property } = await supabase
    .from('properties')
    .select('*, property_agents(role, team_member_id), property_media(id, url, storage_path, display_order, caption)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!property) notFound()

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('id, name, role')
    .order('name')

  const media = (property.property_media ?? []).sort((a: any, b: any) => a.display_order - b.display_order)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Property</h1>
        <p className="text-sm text-gray-500 mt-1">{property.title}</p>
      </div>

      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Images</h2>
        <PropertyImageUpload propertyId={id} existingMedia={media} />
      </section>

      <PropertyForm
        teamMembers={teamMembers ?? []}
        userId={user.id}
        property={property}
      />
    </div>
  )
}
