'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath, updateTag } from 'next/cache'
import { TAGS } from '@/lib/cache-tags'
import { getPortalSession } from '@/lib/auth'
import { fireMarketingRevalidation } from '@/lib/webhook'
import { recordOldSlug, slugToReplacePlaceholder } from '@/lib/property-slug'

export type UpdatePropertyStatusResult = { error: string | null }

// The statuses in lib/types/property.ts. Anything else from the client is refused.
const PROPERTY_STATUSES = new Set(['draft', 'active', 'pending', 'sold', 'leased'])

export async function updatePropertyStatus(
  propertyId: string,
  status: string,
): Promise<UpdatePropertyStatusResult> {
  if (!PROPERTY_STATUSES.has(status)) return { error: 'Unknown status.' }

  const supabase = await createClient()
  const { user, isAdmin } = await getPortalSession()

  const { data: before } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single()

  if (!before) return { error: 'Property not found.' }
  if (!isAdmin && before.created_by !== user.id) return { error: 'Not authorized.' }

  // A listing created by an early photo upload has no title until its first
  // save. Publishing it from here would put an untitled page on the site.
  const title = typeof before.title === 'string' ? before.title : ''
  if (status !== 'draft' && !title.trim()) {
    return { error: 'Add a title and save the listing before publishing.' }
  }

  const realSlug = await slugToReplacePlaceholder(supabase, before.slug, title)
  const oldSlug = realSlug ? ((before.slug as string | null) ?? null) : null
  const slug = realSlug ?? ((before.slug as string | null) ?? null)

  const { error } = await supabase
    .from('properties')
    .update(realSlug ? { status, slug: realSlug } : { status })
    .eq('id', propertyId)

  if (!error) {
    if (oldSlug) await recordOldSlug(propertyId, oldSlug)
    const { data: after } = await supabase.from('properties').select('*').eq('id', propertyId).single()
    await supabase.from('audit_log').insert({
      table_name: 'properties',
      record_id: propertyId,
      action: 'update',
      before,
      after,
      performed_by: user.id,
    })

    // Fire webhook if publishing or unpublishing. Sending the slug lets the
    // marketing site invalidate its slug-keyed detail-page cache; without it
    // only the listing tag refreshes.
    if (status === 'active' || before.status === 'active') {
      await fireMarketingRevalidation({
        event: 'status_change',
        table: 'properties',
        record_id: propertyId,
        slug,
        old_slug: oldSlug,
        path: '/properties',
      })
    }
  }

  updateTag(TAGS.properties)
  updateTag(TAGS.property(propertyId))
  if (before.created_by) {
    updateTag(TAGS.userDashboard(before.created_by))
  }
  revalidatePath(`/properties/${propertyId}`)

  if (error) {
    console.error(`Property status update failed for ${propertyId}:`, error)
    return { error: 'Could not update the status. Try again.' }
  }
  return { error: null }
}
