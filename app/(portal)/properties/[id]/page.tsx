import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Map as MapIcon, ExternalLink, Download } from 'lucide-react'
import DeleteButton from './delete-button'
import StatusButtons from './status-buttons'
import { getPropertyById, getBrochureDownloadCount } from '@/lib/cached-data'
import { getPortalSession } from '@/lib/auth'
import { PropertyGallery } from '@/components/properties/PropertyGallery'
import { PropertySidebar } from '@/components/properties/PropertySidebar'
import { PropertyFeatures } from '@/components/properties/PropertyFeatures'
import { PropertyFacts } from '@/components/properties/PropertyFacts'
import { PropertyAttachments } from '@/components/properties/PropertyAttachments'
import { PropertySpaces } from '@/components/properties/PropertySpaces'
import type {
  Property,
  PropertyMedia,
  PropertyAgent,
  PropertySpace,
} from '@/lib/types/property-portal'
import { getPropertyBrochures } from '@/lib/types/property-portal'
import { getBuildingSizeParts } from '@/lib/format-size'

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [{ user, isAdmin }, row, submissionCount] = await Promise.all([
    getPortalSession(),
    getPropertyById(id),
    getBrochureDownloadCount(id),
  ])

  if (!row) notFound()

  const isOwner = row.created_by === user.id
  const canChangeStatus = isAdmin || isOwner

  const media: PropertyMedia[] = (row.property_media ?? []).sort(
    (a: PropertyMedia, b: PropertyMedia) => a.display_order - b.display_order,
  )
  const agents: PropertyAgent[] = (row.property_agents ?? [])
    .filter((a: { team_members?: unknown }) => a.team_members)
    .map(
      (a: {
        team_member_id: string
        role: string
        team_members: {
          id: string
          name: string
          role: string
          img_url?: string | null
        }
      }) => ({
        team_member_id: a.team_member_id,
        role: a.role,
        team_member: {
          id: a.team_members.id,
          name: a.team_members.name,
          role: a.team_members.role,
          img_url: a.team_members.img_url ?? null,
          slug: null,
        },
      }),
    )

  const property: Property = {
    id: row.id,
    title: row.title ?? 'Untitled',
    slug: row.slug ?? '',
    status: row.status,
    summary: row.summary ?? '',
    description: row.description ?? '',
    address: row.address ?? '',
    city: row.city ?? '',
    state: row.state ?? '',
    zip: row.zip ?? '',
    featured: !!row.featured,
    content: row.content ?? {
      property_type: '',
      transaction_type: '',
      size_sf: null,
      price: null,
      lease_rate_sf: null,
      year_built: null,
      zoning: null,
      parking: null,
      highlights: [],
    },
    lat: row.lat ?? null,
    lng: row.lng ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    agents,
    media,
    spaces: (row.property_spaces ?? [])
      .map(
        (s: PropertySpace & { features: string[] | null }): PropertySpace => ({
          id: s.id,
          name: s.name,
          size_sf: s.size_sf,
          term: s.term,
          rental_rate: s.rental_rate,
          space_use: s.space_use,
          build_out: s.build_out,
          available_date: s.available_date,
          features: s.features ?? [],
          display_order: s.display_order,
        }),
      )
      .sort(
        (a: PropertySpace, b: PropertySpace) =>
          a.display_order - b.display_order,
      ),
    tenants: [],
  }

  const { content } = property
  const transactionLabel = content.price
    ? 'For Sale'
    : content.lease_rate_sf
      ? 'For Lease'
      : null
  const priceLabel = content.price
    ? 'Sale Price'
    : content.lease_rate_sf
      ? 'Lease Price'
      : null
  const priceValue = content.price ?? content.lease_rate_sf ?? null
  const sizeParts = getBuildingSizeParts(content)

  return (
    <main className="pb-16 bg-white">
      {/* Admin bar */}
      <div className="sticky top-16 lg:top-0 z-30 border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              href="/properties"
              className="text-sm text-neutral-500 hover:text-neutral-900"
            >
              ← Properties
            </Link>
            <StatusButtons
              propertyId={id}
              currentStatus={property.status}
              canChangeStatus={canChangeStatus}
            />
            {property.featured && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                Featured
              </span>
            )}
            <Link
              href={`/submissions?property=${id}&tab=brochure_downloads`}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
            >
              {submissionCount} {submissionCount === 1 ? 'submission' : 'submissions'}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/properties/${id}/edit`}
              className="inline-flex items-center gap-1.5 border border-neutral-300 text-neutral-700 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-neutral-50 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Link>
            <DeleteButton
              propertyId={id}
              status={property.status}
              isOwner={isOwner}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="max-w-[1200px] mx-auto px-6 pt-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-neutral-900 text-[clamp(2.2rem,0.15rem+8vw,3.125rem)] leading-[1.1] tracking-[-0.01em] font-serif font-normal mb-2">
              {property.title}
            </h1>
            <p className="text-neutral-500 mt-1 text-[15px]">
              {[property.city, property.state].filter(Boolean).join(', ')}
              {property.zip ? ` ${property.zip}` : ''}
            </p>
          </div>
          <div className="flex flex-row flex-wrap gap-2 md:gap-4 md:items-end md:justify-end flex-shrink-0">
            {sizeParts && transactionLabel ? (
              <div className="text-left bg-neutral-50 px-4 py-3">
                <p className="text-xs text-neutral-500">{transactionLabel}</p>
                <p className="mt-1 text-xl font-medium text-neutral-900">
                  {sizeParts.kind === 'range'
                    ? `${sizeParts.min} - ${sizeParts.max} SF`
                    : `${sizeParts.value} SF`}
                </p>
              </div>
            ) : null}
            {priceLabel && priceValue ? (
              <div className="text-left bg-neutral-50 px-4 py-3">
                <p className="text-xs text-neutral-500">{priceLabel}</p>
                <p className="mt-1 text-xl font-medium text-neutral-900">
                  {priceValue}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Gallery - full width */}
      <div className="max-w-[1200px] mx-auto px-6 pt-10">
        <PropertyGallery media={property.media} />
      </div>

      {/* Details + Sidebar */}
      <div className="max-w-[1200px] mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row lg:gap-20 gap-8 items-start">
          <div className="flex-1 min-w-0">
            {/* Summary + description */}
            {property.summary || property.description ? (
              <div>
                {property.summary ? (
                  <div className="max-w-xl mb-4">
                    <h2 className="text-[1.675rem] leading-tight tracking-[-0.0175em] text-neutral-900 pb-4">
                      {property.summary}
                    </h2>
                    <div className="h-[4px] w-1/4 bg-[#BBAA8B]" />
                  </div>
                ) : null}
                {property.description ? (
                  <div className="text-neutral-700 font-light leading-relaxed whitespace-pre-wrap">
                    {property.description}
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Brochure / Map / LoopNet buttons */}
            {(() => {
              const brochures = getPropertyBrochures(property.media)
              const hasMap = property.lat && property.lng
              const hasRow = brochures.length > 0 || hasMap || content.loopnet_url
              if (!hasRow) return null
              return (
                <div className="flex flex-row flex-wrap gap-2 my-10">
                  {brochures.length > 0 ? (
                    <a
                      href={brochures[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-full text-white bg-neutral-900 hover:bg-neutral-800 transition-colors"
                    >
                      <Download className="w-4 h-4" /> Brochure
                    </a>
                  ) : null}
                  {hasMap ? (
                    <a
                      href="#property-map"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-full text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors"
                    >
                      <MapIcon className="w-4 h-4" /> View Map
                    </a>
                  ) : null}
                  {content.loopnet_url ? (
                    <a
                      href={content.loopnet_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-full text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" /> View on LoopNet
                    </a>
                  ) : null}
                </div>
              )
            })()}

            {/* Highlights */}
            {content.highlights && content.highlights.length > 0 ? (
              <div className="mb-8 pb-4">
                <h3 className="text-xl font-medium text-black mb-4">
                  Highlights
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  {content.highlights.map((h, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-sm text-neutral-500 font-light leading-relaxed"
                    >
                      <span aria-hidden="true" className="text-neutral-400">
                        &mdash;
                      </span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Mobile sidebar */}
            <div className="lg:hidden mb-8">
              <PropertySidebar property={property} />
            </div>

            <PropertyFeatures features={content.features} />
            <PropertySpaces spaces={property.spaces} />
            <PropertyFacts content={content} />
            <PropertyAttachments media={property.media} />
          </div>
          <div className="hidden lg:block lg:w-[320px] flex-shrink-0 lg:sticky lg:top-24">
            <PropertySidebar property={property} />
          </div>
        </div>
      </div>

      <p className="max-w-[1200px] mx-auto px-6 text-xs text-neutral-400">
        Last updated {new Date(property.updated_at).toLocaleString()}
      </p>
    </main>
  )
}
