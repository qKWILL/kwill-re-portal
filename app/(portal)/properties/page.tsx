import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import PropertiesClient from './properties-client'
import { getPropertiesList } from '@/lib/cached-data'
import type { PortalPropertyCard } from '@/components/properties/PropertyCard'

type PropertyMediaRow = {
  url: string
  display_order: number
  media_type: string | null
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; view?: string }>
}) {
  const { status, q, view } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const rows = await getPropertiesList()

  const query = (q ?? '').toLowerCase().trim()
  const filtered = rows.filter((row) => {
    if (status && status !== 'all' && row.status !== status) return false
    if (query) {
      const hay = `${row.title ?? ''} ${row.city ?? ''}`.toLowerCase()
      if (!hay.includes(query)) return false
    }
    return true
  })

  const properties: PortalPropertyCard[] = filtered.map((row) => {
    const imageMedia = (row.property_media ?? [])
      .filter(
        (m: PropertyMediaRow) =>
          m.media_type !== 'brochure' &&
          m.media_type !== 'floor_plan' &&
          m.media_type !== 'site_plan',
      )
      .sort(
        (a: PropertyMediaRow, b: PropertyMediaRow) =>
          a.display_order - b.display_order,
      )
    return {
      id: row.id,
      title: row.title ?? 'Untitled',
      city: row.city ?? '',
      state: row.state ?? '',
      zip: row.zip ?? '',
      heroImage: imageMedia[0]?.url ?? '',
      propertyType: row.content?.property_type ?? '',
      transactionType: row.content?.transaction_type ?? '',
      status: row.status,
      featured: !!row.featured,
    }
  })

  return (
    <div className="max-w-[1200px] mx-auto px-6 pt-8 pb-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-neutral-900 text-[clamp(2.2rem,0.15rem+8vw,3.125rem)] leading-[1.1] tracking-[-0.01em] font-serif font-normal">
            Properties
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {properties.length}{' '}
            {status && status !== 'all' ? status : 'total'}
          </p>
        </div>
        <Link
          href="/properties/new"
          className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Property
        </Link>
      </div>

      <PropertiesClient
        properties={properties}
        currentStatus={status ?? 'all'}
        currentSearch={q ?? ''}
        currentView={view === 'list' ? 'list' : 'grid'}
      />
    </div>
  )
}
