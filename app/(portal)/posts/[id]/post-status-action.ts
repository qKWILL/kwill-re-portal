'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath, updateTag } from 'next/cache'
import { TAGS } from '@/lib/cache-tags'
import { getPortalSession } from '@/lib/auth'
import { fireMarketingRevalidation } from '@/lib/webhook'

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

  await fireMarketingRevalidation({
    event: status === 'published' ? 'publish' : 'unpublish',
    table: 'posts',
    record_id: postId,
    path: '/news',
  })

  updateTag(TAGS.posts)
  updateTag(TAGS.post(postId))
  if (before?.created_by) {
    updateTag(TAGS.userDashboard(before.created_by))
  }
  revalidatePath(`/posts/${postId}`)
}
