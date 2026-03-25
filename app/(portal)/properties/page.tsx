import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import PropertiesClient from './properties-client'

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const { status, q } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let query = supabase
    .from('properties')
    .select('id, title, status, city, state, content, updated_at, created_by')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (q) {
    query = query.or(`title.ilike.%${q}%,address.ilike.%${q}%,city.ilike.%${q}%`)
  }

  const { data: properties } = await query

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-sm text-gray-500 mt-1">{properties?.length ?? 0} {status && status !== 'all' ? status : 'total'}</p>
        </div>
        <Link
          href="/properties/new"
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Property
        </Link>
      </div>

      <PropertiesClient
        properties={properties ?? []}
        currentStatus={status ?? 'all'}
        currentSearch={q ?? ''}
      />
    </div>
  )
}
