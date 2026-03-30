'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

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
  size_sf: string
  price: string
  lease_rate_sf: string
  year_built: string
  zoning: string
  parking: string
  highlights: string[]
  agents: { team_member_id: string; role: string }[]
}

export type SavePropertyResult =
  | { success: true; id: string }
  | { success: false; errors: Record<string, string> }

function generateSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `property-${Date.now()}`
}

async function geocodeAddress(address: string, city: string, state: string, zip: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = encodeURIComponent(`${address}, ${city}, ${state} ${zip}`)
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`
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
  status: 'draft' | 'active'
): Promise<SavePropertyResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Run ALL validation together so all errors show at once
  const schema = status === 'active' ? publishSchema : draftSchema
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

  // For publish — also check images and agents at the same time
  if (status === 'active') {
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
  const content = {
    property_type: data.property_type,
    transaction_type: data.transaction_type,
    size_sf: data.size_sf ? Number(data.size_sf) : null,
    price: data.price || null,
    lease_rate_sf: data.lease_rate_sf || null,
    year_built: data.year_built ? Number(data.year_built) : null,
    zoning: data.zoning || null,
    parking: data.parking || null,
    highlights: data.highlights.filter(h => h.trim()),
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
    const { data: before } = await supabase.from('properties').select('*').eq('id', data.id).single()
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

  return { success: true, id: propertyId! }
}
