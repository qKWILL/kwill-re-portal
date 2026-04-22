import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PropertyEditor from '@/components/property-editor'

export default async function EditPropertyPage({
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

  const { data: property } = await supabase
    .from('properties')
    .select(
      '*, property_agents(role, team_member_id), property_media(id, url, storage_path, display_order, caption, media_type, filename), property_spaces(id, name, size_sf, term, rental_rate, space_use, build_out, available_date, features, display_order)',
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!property) notFound()
  if (!isAdmin && property.created_by !== user.id) redirect('/properties')

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('id, name, role, img_url')
    .contains('tags', ['real estate'])
    .order('name')

  return (
    <PropertyEditor
      teamMembers={teamMembers ?? []}
      userId={user.id}
      property={property}
    />
  )
}
