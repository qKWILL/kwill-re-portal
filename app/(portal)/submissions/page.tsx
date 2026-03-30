import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SubmissionsClient from './submissions-client'

export default async function SubmissionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  if (roleRow?.role !== 'admin') redirect('/dashboard')

  const { data: submissions } = await supabase
    .from('form_submissions')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Form Submissions</h1>
        <p className="text-sm text-gray-500 mt-1">{submissions?.length ?? 0} total</p>
      </div>
      <SubmissionsClient submissions={submissions ?? []} />
    </div>
  )
}
