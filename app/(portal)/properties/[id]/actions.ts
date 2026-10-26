'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { TAGS } from '@/lib/cache-tags'
import { getPortalSession } from '@/lib/auth'
import { fireMarketingRevalidation } from '@/lib/webhook'

export async function deleteProperty(propertyId: string) {
  const supabase = await createClient()
  const { user, isAdmin } = await getPortalSession()

  const { data: before } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single()

  // Use RPC to bypass RLS for soft delete
  const { error } = await supabase.rpc('soft_delete_property', {
    p_property_id: propertyId,
    p_user_id: user.id,
    p_is_admin: isAdmin,
  })

  if (!error) {
    await supabase.from('audit_log').insert({
      table_name: 'properties',
      record_id: propertyId,
      action: 'delete',
      before,
      after: null,
      performed_by: user.id,
    })

    // Only notify the marketing site for properties that were live. Drafts
    // don't appear there, so deleting one doesn't need a revalidation.
    if (before?.status === 'active') {
      await fireMarketingRevalidation(supabase, {
        event: 'update',
        table: 'properties',
        record_id: propertyId,
        slug: (before?.slug as string | null) ?? null,
        path: '/properties',
      })
    }
  }

  updateTag(TAGS.properties)
  updateTag(TAGS.property(propertyId))
  updateTag(TAGS.userDashboard(user.id))
  if (before?.created_by && before.created_by !== user.id) {
    updateTag(TAGS.userDashboard(before.created_by))
  }
  revalidatePath('/properties')
  redirect('/properties')
}
