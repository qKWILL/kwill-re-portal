'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function deleteProperty(propertyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  const isAdmin = roleRow?.role === 'admin'

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
  }

  revalidatePath('/properties')
  redirect('/properties')
}
