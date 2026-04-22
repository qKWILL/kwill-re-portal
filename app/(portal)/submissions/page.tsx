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
    <div className="max-w-[1200px] mx-auto px-6 pt-8 pb-16">
      <div className="mb-6">
        <h1 className="text-neutral-900 text-[clamp(2.2rem,0.15rem+8vw,3.125rem)] leading-[1.1] tracking-[-0.01em] font-serif font-normal">
          Submissions
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {submissions?.length ?? 0} total
        </p>
      </div>
      <SubmissionsClient submissions={submissions ?? []} />
    </div>
  )
}
