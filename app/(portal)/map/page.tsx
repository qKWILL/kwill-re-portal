import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MapClient from './map-client'

export default async function MapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: roleRow } = await supabase
    .from('user_roles').select('role').eq('user_id', user.id).single()
  const isAdmin = roleRow?.role === 'admin'

  const { data: properties } = await supabase
    .from('properties')
    .select('id, title, status, featured_image_url, content, address, city, state, lat, lng, property_agents(team_members(name))')
    .is('deleted_at', null)
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .order('updated_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Map View</h1>
        <p className="text-sm text-gray-500 mt-1">{properties?.length ?? 0} properties with coordinates</p>
      </div>
      <MapClient properties={properties ?? []} apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!} />
    </div>
  )
}
