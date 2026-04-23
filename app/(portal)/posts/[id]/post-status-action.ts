'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { TAGS } from '@/lib/cache-tags'
import { getPortalSession } from '@/lib/auth'

export async function updatePostStatus(postId: string, status: string) {
  const supabase = await createClient()
  const { user, isAdmin } = await getPortalSession()

  const { data: before } = await supabase.from('posts').select('*').eq('id', postId).single()

  if (!before) return
  if (!isAdmin && before.created_by !== user.id) return

  await supabase.from('posts').update({
    status,
    date: status === 'published' && !before?.date ? new Date().toISOString() : before?.date,
  }).eq('id', postId)

  const { data: after } = await supabase.from('posts').select('*').eq('id', postId).single()

  await supabase.from('audit_log').insert({
    table_name: 'posts', record_id: postId, action: 'update',
    before, after, performed_by: user.id,
  })

  const { data: config } = await supabase
    .from('app_config').select('key, value').in('key', ['revalidation_url', 'webhook_secret'])
  const configMap = Object.fromEntries((config ?? []).map(r => [r.key, r.value]))
  if (configMap.revalidation_url && configMap.webhook_secret) {
    const body = JSON.stringify({
      event: status === 'published' ? 'publish' : 'unpublish',
      table: 'posts', record_id: postId,
      path: '/news', timestamp: new Date().toISOString(),
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

  revalidateTag(TAGS.posts, 'max')
  revalidateTag(TAGS.post(postId), 'max')
  if (before?.created_by) {
    revalidateTag(TAGS.userDashboard(before.created_by), 'max')
  }
  revalidatePath(`/posts/${postId}`)
}
