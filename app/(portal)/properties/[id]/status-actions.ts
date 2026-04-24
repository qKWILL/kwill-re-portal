'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { TAGS } from '@/lib/cache-tags'
import { getPortalSession } from '@/lib/auth'
import { fireMarketingRevalidation } from '@/lib/webhook'

export async function updatePropertyStatus(propertyId: string, status: string) {
  const supabase = await createClient()
  const { user, isAdmin } = await getPortalSession()

  const { data: before } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single()

  if (!before) return
  if (!isAdmin && before.created_by !== user.id) return

  const { error } = await supabase
    .from('properties')
    .update({ status })
    .eq('id', propertyId)

  if (!error) {
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
    if (status === 'active' || before?.status === 'active') {
      await fireMarketingRevalidation(supabase, {
        event: 'status_change',
        table: 'properties',
        record_id: propertyId,
        slug: (before?.slug as string | null) ?? null,
        path: '/properties',
      })
    }
  }

  revalidateTag(TAGS.properties, 'max')
  revalidateTag(TAGS.property(propertyId), 'max')
  if (before?.created_by) {
    revalidateTag(TAGS.userDashboard(before.created_by), 'max')
  }
  revalidatePath(`/properties/${propertyId}`)
}
