import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import PropertyImageUpload from '@/components/property-image-upload'
import DeleteButton from './delete-button'
import StatusButtons from './status-buttons'

const STATUS_COLORS: Record<string, string> = {
  draft:   'bg-gray-100 text-gray-600',
  active:  'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  sold:    'bg-blue-100 text-blue-700',
  leased:  'bg-purple-100 text-purple-700',
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: roleRow } = await supabase
    .from('user_roles').select('role').eq('user_id', user.id).single()
  const role = roleRow?.role ?? 'editor'
  const isAdmin = role === 'admin'

  const { data: property } = await supabase
    .from('properties')
    .select('*, property_agents(role, team_members(id, name, role)), property_media(id, url, storage_path, display_order, caption)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!property) notFound()

  const c = property.content ?? {}
  const media = (property.property_media ?? []).sort((a: any, b: any) => a.display_order - b.display_order)
  const isOwner = property.created_by === user.id
  const canChangeStatus = isAdmin || isOwner

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/properties" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-2">
            <ArrowLeft className="w-3 h-3" /> Properties
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{property.title || 'Untitled'}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[property.status]}`}>
              {property.status}
            </span>
            {property.featured && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Featured</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <Link
            href={`/properties/${id}/edit`}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-4 h-4" /> Edit
          </Link>
          <DeleteButton propertyId={id} status={property.status} isOwner={isOwner} isAdmin={isAdmin} />
        </div>
      </div>

      {/* Status change buttons */}
      <StatusButtons propertyId={id} currentStatus={property.status} canChangeStatus={canChangeStatus} />

      {/* Images */}
      <section className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Images</h2>
        <PropertyImageUpload propertyId={id} existingMedia={media} />
      </section>

      {/* Details */}
      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {property.summary && (
          <div className="p-5">
            <p className="text-xs font-medium text-gray-500 mb-1">Summary</p>
            <p className="text-sm text-gray-800">{property.summary}</p>
          </div>
        )}
        {property.description && (
          <div className="p-5">
            <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{property.description}</p>
          </div>
        )}
        {(property.address || property.city) && (
          <div className="p-5">
            <p className="text-xs font-medium text-gray-500 mb-1">Location</p>
            <p className="text-sm text-gray-800">
              {[property.address, property.city, property.state, property.zip].filter(Boolean).join(', ')}
            </p>
          </div>
        )}
        <div className="p-5">
          <p className="text-xs font-medium text-gray-500 mb-3">Property Details</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {c.property_type && <Detail label="Type" value={c.property_type} />}
            {c.transaction_type && <Detail label="Transaction" value={c.transaction_type} />}
            {c.size_sf && <Detail label="Size" value={`${Number(c.size_sf).toLocaleString()} SF`} />}
            {c.price && <Detail label="Price" value={c.price} />}
            {c.lease_rate_sf && <Detail label="Lease Rate" value={`$${c.lease_rate_sf}/SF`} />}
            {c.year_built && <Detail label="Year Built" value={c.year_built} />}
            {c.zoning && <Detail label="Zoning" value={c.zoning} />}
            {c.parking && <Detail label="Parking" value={c.parking} />}
          </div>
        </div>
        {c.highlights?.length > 0 && (
          <div className="p-5">
            <p className="text-xs font-medium text-gray-500 mb-2">Highlights</p>
            <ul className="space-y-1">
              {c.highlights.map((h: string, i: number) => (
                <li key={i} className="text-sm text-gray-800 flex gap-2">
                  <span className="text-gray-400 shrink-0">—</span> {h}
                </li>
              ))}
            </ul>
          </div>
        )}
        {property.property_agents?.length > 0 && (
          <div className="p-5">
            <p className="text-xs font-medium text-gray-500 mb-2">Listing Agents</p>
            <div className="space-y-1">
              {property.property_agents.map((a: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-800">{a.team_members?.name}</span>
                  <span className="text-xs text-gray-400 capitalize">{a.role?.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400">Last updated {new Date(property.updated_at).toLocaleString()}</p>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900 capitalize">{value}</p>
    </div>
  )
}
