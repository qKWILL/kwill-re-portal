'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'
import { TAGS } from '@/lib/cache-tags'

const draftSchema = z.object({
  title: z.string().min(1, 'Title is required'),
})

const publishSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  summary: z.string().min(1, 'Summary is required — this is the short pitch shown on listing cards'),
  address: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(1, 'ZIP code is required'),
  property_type: z.string().min(1, 'Property type must be selected'),
  transaction_type: z.string().min(1, 'Transaction type must be selected'),
})

export type PropertyFormData = {
  id?: string
  title: string
  summary: string
  description: string
  address: string
  city: string
  state: string
  zip: string
  featured: boolean
  property_type: string
  transaction_type: string
  size_sf_min: string
  size_sf_max: string
  price: string
  lease_rate_sf: string
  year_built: string
  zoning: string
  parking: string
  highlights: string[]
  agents: { team_member_id: string; role: string }[]
  // Building facts
  lot_size: string
  building_class: string
  stories: string
  construction_type: string
  sprinkler_system: string
  year_renovated: string
  typical_floor_size: string
  ceiling_height: string
  power_supply: string
  heating: string
  gas: string
  water: string
  sewer: string
  // Industrial
  clear_height: string
  drive_in_bays: string
  exterior_dock_doors: string
  interior_dock_doors: string
  column_spacing: string
  // Other
  features: { label: string; value: string }[]
  overview: string
  loopnet_url: string
  spaces: {
    id?: string
    name: string
    size_sf: string
    term: string
    rental_rate: string
    space_use: string
    build_out: string
    available_date: string
    features: string[]
  }[]
}

export type SavePropertyResult =
  | { success: true; id: string }
  | { success: false; errors: Record<string, string> }

async function persistSpaces(
  supabase: Awaited<ReturnType<typeof createClient>>,
  propertyId: string,
  spaces: PropertyFormData['spaces'],
) {
  await supabase.from('property_spaces').delete().eq('property_id', propertyId)
  const rows = spaces
    .filter((s) => s.name.trim() || s.size_sf.trim() || s.rental_rate.trim())
    .map((s, i) => ({
      property_id: propertyId,
      name: s.name,
      size_sf: s.size_sf ? parseInt(s.size_sf, 10) : null,
      term: s.term || null,
      rental_rate: s.rental_rate || null,
      space_use: s.space_use || null,
      build_out: s.build_out || null,
      available_date: s.available_date || null,
      features: s.features.filter((f) => f.trim()),
      display_order: i,
    }))
  if (rows.length > 0) {
    await supabase.from('property_spaces').insert(rows)
  }
}

function generateSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `property-${Date.now()}`
}

async function geocodeAddress(address: string, city: string, state: string, zip: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = encodeURIComponent(`${address}, ${city}, ${state} ${zip}`)
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GOOGLE_MAPS_KEY}`
    )
    const data = await res.json()
    if (data.status === 'OK' && data.results[0]) {
      return {
        lat: data.results[0].geometry.location.lat,
        lng: data.results[0].geometry.location.lng,
      }
    }
    return null
  } catch {
    return null
  }
}

export async function saveProperty(
  data: PropertyFormData,
  status: 'draft' | 'active' | 'pending' | 'sold' | 'leased'
): Promise<SavePropertyResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Run ALL validation together so all errors show at once
  const schema = status === 'draft' ? draftSchema : publishSchema
  const parsed = schema.safeParse({
    title: data.title,
    summary: data.summary,
    address: data.address,
    city: data.city,
    state: data.state,
    zip: data.zip,
    property_type: data.property_type,
    transaction_type: data.transaction_type,
  })

  const errors: Record<string, string> = {}

  if (!parsed.success) {
    parsed.error.issues.forEach(issue => {
      errors[issue.path[0] as string] = issue.message
    })
  }

  // For any non-draft save — also check images and agents at the same time
  if (status !== 'draft') {
    const validAgents = data.agents.filter(a => a.team_member_id)
    if (validAgents.length === 0) {
      errors.agents = 'At least one listing agent is required to publish'
    }
    if (!data.id) {
      errors.images = 'At least one image is required to publish'
    } else {
      const { count: imageCount } = await supabase
        .from('property_media')
        .select('*', { count: 'exact', head: true })
        .eq('property_id', data.id)
      if (!imageCount || imageCount === 0) {
        errors.images = 'At least one image is required to publish'
      }
    }
  }

  if (Object.keys(errors).length > 0) return { success: false, errors }

  // Geocode address if we have enough info
  let lat: number | null = null
  let lng: number | null = null
  if (data.address && data.city && data.state) {
    const coords = await geocodeAddress(data.address, data.city, data.state, data.zip)
    if (coords) { lat = coords.lat; lng = coords.lng }
  }

  const slug = generateSlug(data.title)
  const sizeMin = data.size_sf_min ? Number(data.size_sf_min) : null
  const sizeMax = data.size_sf_max ? Number(data.size_sf_max) : null
  const content = {
    property_type: data.property_type,
    transaction_type: data.transaction_type,
    size_sf: sizeMax ?? sizeMin ?? null,
    size_sf_min: sizeMin,
    size_sf_max: sizeMax,
    price: data.price || null,
    lease_rate_sf: data.lease_rate_sf || null,
    year_built: data.year_built ? Number(data.year_built) : null,
    zoning: data.zoning || null,
    parking: data.parking || null,
    highlights: data.highlights.filter(h => h.trim()),
    // Building facts
    lot_size: data.lot_size || null,
    building_class: data.building_class || null,
    stories: data.stories ? parseInt(data.stories, 10) : null,
    construction_type: data.construction_type || null,
    sprinkler_system: data.sprinkler_system || null,
    year_renovated: data.year_renovated ? parseInt(data.year_renovated, 10) : null,
    typical_floor_size: data.typical_floor_size || null,
    ceiling_height: data.ceiling_height || null,
    power_supply: data.power_supply || null,
    heating: data.heating || null,
    gas: data.gas || null,
    water: data.water || null,
    sewer: data.sewer || null,
    // Industrial
    clear_height: data.clear_height || null,
    drive_in_bays: data.drive_in_bays ? parseInt(data.drive_in_bays, 10) : null,
    exterior_dock_doors: data.exterior_dock_doors ? parseInt(data.exterior_dock_doors, 10) : null,
    interior_dock_doors: data.interior_dock_doors ? parseInt(data.interior_dock_doors, 10) : null,
    column_spacing: data.column_spacing || null,
    // Other
    features: (data.features ?? []).filter(f => f.label.trim() || f.value.trim()),
    overview: data.overview || null,
    loopnet_url: data.loopnet_url || null,
  }

  const payload: Record<string, any> = {
    title: data.title,
    summary: data.summary || null,
    description: data.description || null,
    address: data.address || null,
    city: data.city || null,
    state: data.state || null,
    zip: data.zip || null,
    featured: data.featured,
    content,
    status,
    slug,
  }

  // Only update lat/lng if we got coords — don't overwrite existing with null
  if (lat !== null && lng !== null) {
    payload.lat = lat
    payload.lng = lng
  }

  let propertyId = data.id

  if (data.id) {
    const { data: roleRow } = await supabase
      .from('user_roles').select('role').eq('user_id', user.id).single()
    const isAdmin = roleRow?.role === 'admin'

    const { data: before } = await supabase.from('properties').select('*').eq('id', data.id).single()

    if (!before) return { success: false, errors: { _: 'Property not found' } }
    if (!isAdmin && before.created_by !== user.id)
      return { success: false, errors: { _: 'Not authorized' } }

    const { error } = await supabase.from('properties').update(payload).eq('id', data.id)
    if (error) return { success: false, errors: { _: error.message } }
    const { data: after } = await supabase.from('properties').select('*').eq('id', data.id).single()
    await supabase.from('audit_log').insert({
      table_name: 'properties', record_id: data.id, action: 'update',
      before, after, performed_by: user.id,
    })
    await supabase.from('property_agents').delete().eq('property_id', data.id)
    const validAgents = data.agents.filter(a => a.team_member_id)
    if (validAgents.length > 0) {
      await supabase.from('property_agents').insert(
        validAgents.map(a => ({ property_id: data.id, team_member_id: a.team_member_id, role: a.role }))
      )
    }
    await persistSpaces(supabase, data.id, data.spaces ?? [])
  } else {
    const { data: newProp, error } = await supabase
      .from('properties')
      .insert({ ...payload, created_by: user.id })
      .select('id')
      .single()
    if (error || !newProp) return { success: false, errors: { _: error?.message ?? 'Failed to create property' } }
    propertyId = newProp.id
    await supabase.from('audit_log').insert({
      table_name: 'properties', record_id: newProp.id, action: 'create',
      before: null, after: newProp, performed_by: user.id,
    })
    const validAgents = data.agents.filter(a => a.team_member_id)
    if (validAgents.length > 0) {
      await supabase.from('property_agents').insert(
        validAgents.map(a => ({ property_id: newProp.id, team_member_id: a.team_member_id, role: a.role }))
      )
    }
    await persistSpaces(supabase, newProp.id, data.spaces ?? [])
  }

  // Fire webhook on publish
  if (status === 'active') {
    const { data: config } = await supabase
      .from('app_config')
      .select('key, value')
      .in('key', ['revalidation_url', 'webhook_secret'])
    const configMap = Object.fromEntries((config ?? []).map(r => [r.key, r.value]))
    if (configMap.revalidation_url && configMap.webhook_secret) {
      const body = JSON.stringify({
        event: 'publish', table: 'properties', record_id: propertyId,
        path: '/properties', timestamp: new Date().toISOString(),
      })
      const encoder = new TextEncoder()
      const cryptoKey = await crypto.subtle.importKey('raw', encoder.encode(configMap.webhook_secret),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(body))
      const sigHex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('')
      await fetch(configMap.revalidation_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Webhook-Signature': sigHex },
        body,
      }).catch(() => {})
    }
  }

  revalidateTag(TAGS.properties, 'max')
  if (propertyId) revalidateTag(TAGS.property(propertyId), 'max')
  revalidatePath('/properties', 'layout')

  return { success: true, id: propertyId! }
}
