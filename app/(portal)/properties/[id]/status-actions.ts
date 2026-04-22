'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { TAGS } from '@/lib/cache-tags'

export async function updatePropertyStatus(propertyId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: roleRow } = await supabase
    .from('user_roles').select('role').eq('user_id', user.id).single()
  const isAdmin = roleRow?.role === 'admin'

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

    // Fire webhook if publishing or unpublishing
    if (status === 'active' || before?.status === 'active') {
      const { data: config } = await supabase
        .from('app_config')
        .select('key, value')
        .in('key', ['revalidation_url', 'webhook_secret'])
      const configMap = Object.fromEntries((config ?? []).map(r => [r.key, r.value]))
      if (configMap.revalidation_url && configMap.webhook_secret) {
        const body = JSON.stringify({
          event: 'status_change', table: 'properties', record_id: propertyId,
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
  }

  revalidateTag(TAGS.properties, 'max')
  revalidateTag(TAGS.property(propertyId), 'max')
  revalidatePath(`/properties/${propertyId}`)
}
