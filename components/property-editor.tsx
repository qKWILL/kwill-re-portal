'use client'

import { useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'
import { Map as MapIcon, ExternalLink } from 'lucide-react'
import { saveProperty, type PropertyFormData } from '@/lib/actions/properties'
import { EditableText } from '@/components/properties/editable/EditableText'
import { EditableRichText } from '@/components/properties/editable/EditableRichText'
import { EditableSelect } from '@/components/properties/editable/EditableSelect'
import { EditableHighlights } from '@/components/properties/editable/EditableHighlights'
import { EditableFeatures } from '@/components/properties/editable/EditableFeatures'
import { EditableGallery } from '@/components/properties/editable/EditableGallery'
import { EditableAgents } from '@/components/properties/editable/EditableAgents'
import {
  EditableSpaces,
  type EditableSpaceInput,
} from '@/components/properties/editable/EditableSpaces'
import PropertyBrochureUpload from '@/components/property-brochure-upload'
import PropertySlugEditor from '@/components/property-slug-editor'
import StatusButtons from '@/app/(portal)/properties/[id]/status-buttons'
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type {
  PropertyContent,
  PropertyMedia,
} from '@/lib/types/property-portal'

type TeamMember = {
  id: string
  name: string
  role: string
  img_url?: string | null
  slug?: string | null
}

const PROPERTY_TYPES = [
  { value: 'office', label: 'Office' },
  { value: 'retail', label: 'Retail' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'multi-family', label: 'Multi-Family' },
  { value: 'land', label: 'Land' },
  { value: 'mixed-use', label: 'Mixed-Use' },
]

const TRANSACTION_TYPES = [
  { value: 'for-sale', label: 'For Sale' },
  { value: 'for-lease', label: 'For Lease' },
  { value: 'for-sale-or-lease', label: 'For Sale or Lease' },
]

function normalizeTransactionType(raw: string | null | undefined): string {
  if (!raw) return ''
  const v = raw.toLowerCase().trim().replace(/\s+/g, '-')
  if (v === 'sale' || v === 'for-sale') return 'for-sale'
  if (v === 'lease' || v === 'for-lease') return 'for-lease'
  if (v.includes('sale') && v.includes('lease')) return 'for-sale-or-lease'
  return ''
}

function normalizePropertyType(raw: string | null | undefined): string {
  if (!raw) return ''
  const v = raw.toLowerCase().trim().replace(/\s+/g, '-')
  if (PROPERTY_TYPES.some((t) => t.value === v)) return v
  return ''
}

const BUILDING_CLASSES = [
  { value: 'A', label: 'Class A' },
  { value: 'B', label: 'Class B' },
  { value: 'C', label: 'Class C' },
]

type InitialProperty = {
  id?: string
  title?: string
  slug?: string | null
  summary?: string
  description?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  featured?: boolean
  status?: string
  content?: Partial<PropertyContent> & { overview?: string }
  property_agents?: { team_member_id: string; role: string }[]
  property_media?: PropertyMedia[]
  property_spaces?: {
    id: string
    name: string
    size_sf: number | null
    term: string | null
    rental_rate: string | null
    space_use: string | null
    build_out: string | null
    available_date: string | null
    features: string[] | null
    display_order: number
  }[]
}

type Props = {
  teamMembers: TeamMember[]
  userId: string
  property?: InitialProperty
  autoPropertyId?: string
  marketingOrigin?: string
}

export default function PropertyEditor({
  teamMembers,
  userId,
  property,
  autoPropertyId,
  marketingOrigin,
}: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [propertyId, setPropertyId] = useState<string | undefined>(
    property?.id ?? autoPropertyId,
  )
  const [media, setMedia] = useState<PropertyMedia[]>(
    property?.property_media ?? [],
  )
  const brochures = useMemo(
    () => media.filter((m) => m.media_type === 'brochure'),
    [media],
  )

  const c = property?.content ?? {}
  const [title, setTitle] = useState(property?.title ?? '')
  const [summary, setSummary] = useState(property?.summary ?? '')
  const [description, setDescription] = useState(property?.description ?? '')
  const [address, setAddress] = useState(property?.address ?? '')
  const [city, setCity] = useState(property?.city ?? '')
  const [state, setState] = useState(property?.state ?? '')
  const [zip, setZip] = useState(property?.zip ?? '')
  const [featured, setFeatured] = useState<boolean>(property?.featured ?? false)

  const [propertyType, setPropertyType] = useState<string>(
    normalizePropertyType(c.property_type),
  )
  const [transactionType, setTransactionType] = useState<string>(() => {
    const normalized = normalizeTransactionType(c.transaction_type)
    if (normalized) return normalized
    const hasPrice = !!c.price
    const hasLease = !!c.lease_rate_sf
    if (hasPrice && hasLease) return 'for-sale-or-lease'
    if (hasLease) return 'for-lease'
    return 'for-sale'
  })
  const [sizeSfMin, setSizeSfMin] = useState<string>(() => {
    const v = c.size_sf_min ?? c.size_sf
    return v != null ? String(v) : ''
  })
  const [sizeSfMax, setSizeSfMax] = useState<string>(
    c.size_sf_max != null ? String(c.size_sf_max) : '',
  )
  const [price, setPrice] = useState<string>(c.price ?? '')
  const [leaseRateSf, setLeaseRateSf] = useState<string>(c.lease_rate_sf ?? '')
  const [yearBuilt, setYearBuilt] = useState<string>(
    c.year_built != null ? String(c.year_built) : '',
  )
  const [zoning, setZoning] = useState<string>(c.zoning ?? '')
  const [parking, setParking] = useState<string>(c.parking ?? '')
  const [highlights, setHighlights] = useState<string[]>(
    c.highlights && c.highlights.length > 0 ? c.highlights : [''],
  )

  const [lotSize, setLotSize] = useState<string>(c.lot_size ?? '')
  const [buildingClass, setBuildingClass] = useState<string>(
    c.building_class ?? '',
  )
  const [stories, setStories] = useState<string>(
    c.stories != null ? String(c.stories) : '',
  )
  const [constructionType, setConstructionType] = useState<string>(
    c.construction_type ?? '',
  )
  const [sprinklerSystem, setSprinklerSystem] = useState<string>(
    c.sprinkler_system ?? '',
  )
  const [yearRenovated, setYearRenovated] = useState<string>(
    c.year_renovated != null ? String(c.year_renovated) : '',
  )
  const [typicalFloorSize, setTypicalFloorSize] = useState<string>(
    c.typical_floor_size ?? '',
  )
  const [ceilingHeight, setCeilingHeight] = useState<string>(
    c.ceiling_height ?? '',
  )
  const [powerSupply, setPowerSupply] = useState<string>(c.power_supply ?? '')
  const [heating, setHeating] = useState<string>(c.heating ?? '')
  const [gas, setGas] = useState<string>(c.gas ?? '')
  const [water, setWater] = useState<string>(c.water ?? '')
  const [sewer, setSewer] = useState<string>(c.sewer ?? '')
  const [columnSpacing, setColumnSpacing] = useState<string>(
    c.column_spacing ?? '',
  )

  const [clearHeight, setClearHeight] = useState<string>(c.clear_height ?? '')
  const [driveInBays, setDriveInBays] = useState<string>(
    c.drive_in_bays != null ? String(c.drive_in_bays) : '',
  )
  const [exteriorDockDoors, setExteriorDockDoors] = useState<string>(
    c.exterior_dock_doors != null ? String(c.exterior_dock_doors) : '',
  )
  const [interiorDockDoors, setInteriorDockDoors] = useState<string>(
    c.interior_dock_doors != null ? String(c.interior_dock_doors) : '',
  )

  const [features, setFeatures] = useState<{ label: string; value: string }[]>(
    c.features ?? [],
  )
  const [overview, setOverview] = useState<string>(
    (c as { overview?: string }).overview ?? c.overview_html ?? '',
  )
  const [loopnetUrl, setLoopnetUrl] = useState<string>(c.loopnet_url ?? '')
  const [loopnetModalOpen, setLoopnetModalOpen] = useState(false)
  const [loopnetDraft, setLoopnetDraft] = useState('')

  const [spaces, setSpaces] = useState<EditableSpaceInput[]>(
    () =>
      (property?.property_spaces ?? [])
        .slice()
        .sort((a, b) => a.display_order - b.display_order)
        .map((s) => ({
          id: s.id,
          name: s.name ?? '',
          size_sf: s.size_sf != null ? String(s.size_sf) : '',
          term: s.term ?? '',
          rental_rate: s.rental_rate ?? '',
          space_use: s.space_use ?? '',
          build_out: s.build_out ?? '',
          available_date: s.available_date ?? '',
          features: s.features ?? [],
        })),
  )

  const [agents, setAgents] = useState<
    { team_member_id: string; role: string }[]
  >(property?.property_agents ?? [])

  const isIndustrial = propertyType.toLowerCase() === 'industrial'

  const showSale =
    transactionType === 'for-sale' || transactionType === 'for-sale-or-lease'
  const showLease =
    transactionType === 'for-lease' || transactionType === 'for-sale-or-lease'

  function clearError(key: string) {
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const effectiveStatus = (property?.status ?? 'draft') as
    | 'draft'
    | 'active'
    | 'pending'
    | 'sold'
    | 'leased'
  const isDraft = effectiveStatus === 'draft'

  async function handleSave(
    status: 'draft' | 'active' | 'pending' | 'sold' | 'leased',
  ) {
    setSaving(true)
    setErrors({})
    const data: PropertyFormData = {
      id: propertyId,
      title,
      summary,
      description,
      address,
      city,
      state,
      zip,
      featured,
      property_type: propertyType,
      transaction_type: transactionType,
      size_sf_min: sizeSfMin,
      size_sf_max: sizeSfMax,
      price,
      lease_rate_sf: leaseRateSf,
      year_built: yearBuilt,
      zoning,
      parking,
      highlights: highlights.filter(Boolean),
      agents,
      lot_size: lotSize,
      building_class: buildingClass,
      stories,
      construction_type: constructionType,
      sprinkler_system: sprinklerSystem,
      year_renovated: yearRenovated,
      typical_floor_size: typicalFloorSize,
      ceiling_height: ceilingHeight,
      power_supply: powerSupply,
      heating,
      gas,
      water,
      sewer,
      clear_height: clearHeight,
      drive_in_bays: driveInBays,
      exterior_dock_doors: exteriorDockDoors,
      interior_dock_doors: interiorDockDoors,
      column_spacing: columnSpacing,
      features: features.filter((f) => f.label || f.value),
      overview,
      loopnet_url: loopnetUrl,
      spaces,
    }
    const result = await saveProperty(data, status)
    setSaving(false)
    if (!result.success) {
      setErrors(result.errors)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    window.location.href = `/properties/${result.id}`
  }

  const errorBanner =
    errors._ ||
    errors.images ||
    errors.agents ||
    Object.keys(errors).some((k) => !['_', 'images', 'agents'].includes(k))

  return (
    <main className="pb-16 bg-white">
      {/* Sticky save bar */}
      <div className="sticky top-16 lg:top-0 z-30 border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {propertyId ? (
              <StatusButtons
                propertyId={propertyId}
                currentStatus={property?.status ?? 'draft'}
                canChangeStatus={true}
              />
            ) : (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                Draft
              </span>
            )}
            {featured && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                Featured
              </span>
            )}
            <label className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="rounded border-neutral-300"
              />
              Featured
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm text-neutral-500 hover:text-neutral-900 px-2"
            >
              Cancel
            </button>
            {isDraft ? (
              <>
                <button
                  type="button"
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 border border-neutral-300 text-neutral-700 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save Draft'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSave('active')}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Publishing…' : 'Publish'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleSave(effectiveStatus)}
                disabled={saving}
                className="inline-flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            )}
          </div>
        </div>
        {errorBanner ? (
          <div className="max-w-[1200px] mx-auto px-6 pb-3">
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {errors._ ??
                'Please fix the highlighted fields before publishing.'}
              {errors.images ? <div>⚠ {errors.images}</div> : null}
              {errors.agents ? <div>⚠ {errors.agents}</div> : null}
            </div>
          </div>
        ) : null}
      </div>

      {/* Header */}
      <div className="max-w-[1200px] mx-auto px-6 pt-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors bg-neutral-100 text-neutral-700 hover:bg-neutral-200 capitalize ${
                      errors.property_type ? 'ring-1 ring-red-400' : ''
                    }`}
                    aria-label="Property type"
                  >
                    {PROPERTY_TYPES.find((t) => t.value === propertyType)
                      ?.label ?? 'Select property type'}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[10rem]">
                  {PROPERTY_TYPES.map((t) => (
                    <DropdownMenuItem
                      key={t.value}
                      onSelect={() => {
                        setPropertyType(t.value)
                        clearError('property_type')
                      }}
                    >
                      {t.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <EditableText
              as="h1"
              value={title}
              onChange={(v) => {
                setTitle(v)
                if (v) clearError('title')
              }}
              placeholder="Add property title"
              error={!!errors.title}
              className="text-neutral-900 text-[clamp(2.2rem,0.15rem+8vw,3.125rem)] leading-[1.1] tracking-[-0.01em] font-serif font-normal mb-2 block"
              ariaLabel="Property title"
            />
            {propertyId && property?.slug ? (
              <div className="mb-3">
                <PropertySlugEditor
                  propertyId={propertyId}
                  initialSlug={property.slug}
                  marketingOrigin={marketingOrigin}
                />
              </div>
            ) : null}
            <div className="text-neutral-500 mt-1 text-[15px] flex flex-wrap items-center gap-x-1.5">
              <EditableText
                value={city}
                onChange={(v) => {
                  setCity(v)
                  if (v) clearError('city')
                }}
                placeholder="City"
                error={!!errors.city}
                ariaLabel="City"
              />
              <span>,</span>
              <EditableText
                value={state}
                onChange={(v) => {
                  setState(v)
                  if (v) clearError('state')
                }}
                placeholder="ST"
                maxLength={2}
                error={!!errors.state}
                ariaLabel="State"
                className="uppercase"
              />
              <EditableText
                value={zip}
                onChange={(v) => {
                  setZip(v)
                  if (v) clearError('zip')
                }}
                placeholder="ZIP"
                error={!!errors.zip}
                ariaLabel="ZIP"
              />
            </div>
          </div>
          {/* Transaction-type pill + contextual stats */}
          <div className="flex flex-col items-start gap-2 flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors bg-neutral-100 text-neutral-700 hover:bg-neutral-200 ${
                    errors.transaction_type ? 'ring-1 ring-red-400' : ''
                  }`}
                  aria-label="Transaction type"
                >
                  {TRANSACTION_TYPES.find((t) => t.value === transactionType)
                    ?.label ?? 'Select transaction type'}
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem]">
                {TRANSACTION_TYPES.map((t) => (
                  <DropdownMenuItem
                    key={t.value}
                    onSelect={() => {
                      setTransactionType(t.value)
                      clearError('transaction_type')
                    }}
                  >
                    {t.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex flex-row flex-wrap gap-2 md:gap-4 md:items-end">
              <div className="text-left bg-neutral-50 px-4 py-3">
                <p className="text-xs text-neutral-500">Building Size</p>
                <p className="mt-1 text-xl font-medium text-neutral-900">
                  <EditableText
                    value={sizeSfMin}
                    onChange={setSizeSfMin}
                    placeholder="0"
                    type="number"
                    ariaLabel="Minimum size in SF"
                  />
                  <span className="text-neutral-500 text-sm"> &ndash; </span>
                  <EditableText
                    value={sizeSfMax}
                    onChange={setSizeSfMax}
                    placeholder="max"
                    type="number"
                    ariaLabel="Maximum size in SF (optional)"
                  />{' '}
                  <span className="text-neutral-500 text-sm">SF</span>
                </p>
              </div>
            {showSale ? (
              <div className="text-left bg-neutral-50 px-4 py-3">
                <p className="text-xs text-neutral-500">Sale Price</p>
                <p className="mt-1 text-xl font-medium text-neutral-900">
                  <EditableText
                    value={price}
                    onChange={setPrice}
                    placeholder="$0"
                    ariaLabel="Sale price"
                  />
                </p>
              </div>
            ) : null}
            {showLease ? (
              <div className="text-left bg-neutral-50 px-4 py-3">
                <p className="text-xs text-neutral-500">Lease Rate</p>
                <p className="mt-1 text-xl font-medium text-neutral-900">
                  <EditableText
                    value={leaseRateSf}
                    onChange={setLeaseRateSf}
                    placeholder="$/SF"
                    ariaLabel="Lease rate"
                  />
                </p>
              </div>
            ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Gallery - full width */}
      <div className="max-w-[1200px] mx-auto px-6 pt-10">
        <EditableGallery
          propertyId={propertyId}
          userId={userId}
          media={media.filter((m) => m.media_type !== 'brochure')}
          onPropertyCreated={(id) => setPropertyId(id)}
        />
      </div>

      {/* Details + Sidebar */}
      <div className="max-w-[1200px] mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row lg:gap-20 gap-8 items-start">
          <div className="flex-1 min-w-0">
            {/* Summary + description */}
            <div>
              <EditableRichText
                value={summary}
                onChange={(v) => {
                  setSummary(v)
                  if (v) clearError('summary')
                }}
                placeholder="Add a 2–3 sentence summary (required to publish)"
                error={!!errors.summary}
                rows={3}
                className="text-[1.675rem] leading-tight tracking-[-0.0175em] max-w-xl text-neutral-900 mb-4 block"
                ariaLabel="Summary"
              />
              <EditableRichText
                value={description}
                onChange={setDescription}
                placeholder="Add a longer description (optional)"
                rows={5}
                className="text-neutral-700 font-light leading-relaxed"
                ariaLabel="Description"
              />
            </div>

            {/* Map / LoopNet buttons */}
            <div className="flex flex-row gap-2 my-10">
              <span className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-full text-neutral-700 bg-neutral-100">
                <MapIcon className="w-4 h-4" /> View Map
              </span>
              <button
                type="button"
                onClick={() => {
                  setLoopnetDraft(loopnetUrl)
                  setLoopnetModalOpen(true)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> Edit link
              </button>
            </div>

            <Dialog
              open={loopnetModalOpen}
              onOpenChange={setLoopnetModalOpen}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-sans text-2xl font-medium">
                    LoopNet link
                  </DialogTitle>
                  <DialogDescription>
                    Paste the full LoopNet listing URL. It will appear as a
                    &ldquo;View on LoopNet&rdquo; button on the public page.
                  </DialogDescription>
                </DialogHeader>
                <input
                  type="url"
                  value={loopnetDraft}
                  onChange={(e) => setLoopnetDraft(e.target.value)}
                  placeholder="https://www.loopnet.com/..."
                  className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
                  autoFocus
                />
                <DialogFooter>
                  <button
                    type="button"
                    onClick={() => setLoopnetModalOpen(false)}
                    className="inline-flex items-center gap-1.5 border border-neutral-300 text-neutral-700 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoopnetUrl(loopnetDraft.trim())
                      setLoopnetModalOpen(false)
                    }}
                    className="inline-flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-neutral-800 transition-colors"
                  >
                    Save
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Highlights */}
            <div className="mb-8 pb-4">
              <h3 className="text-xl font-medium text-black mb-4">Highlights</h3>
              <EditableHighlights
                value={highlights}
                onChange={setHighlights}
              />
            </div>

            {/* Features */}
            <EditableFeatures value={features} onChange={setFeatures} />

            {/* Available Spaces */}
            <EditableSpaces value={spaces} onChange={setSpaces} />

            {/* Facts — editable grid */}
            <div className="mb-8 pt-8">
              <h3 className="text-xl font-medium text-black mb-4">
                {isIndustrial ? 'Warehouse Facility Facts' : 'Property Facts'}
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                <Fact label="Year Built">
                  <EditableText
                    value={yearBuilt}
                    onChange={setYearBuilt}
                    placeholder="—"
                    type="number"
                    ariaLabel="Year Built"
                  />
                </Fact>
                <Fact label="Year Renovated">
                  <EditableText
                    value={yearRenovated}
                    onChange={setYearRenovated}
                    placeholder="—"
                    type="number"
                    ariaLabel="Year Renovated"
                  />
                </Fact>
                <Fact label="Building Class">
                  <EditableSelect
                    value={buildingClass}
                    onChange={setBuildingClass}
                    options={BUILDING_CLASSES}
                    placeholder="—"
                    ariaLabel="Building Class"
                  />
                </Fact>
                <Fact label="Stories">
                  <EditableText
                    value={stories}
                    onChange={setStories}
                    placeholder="—"
                    type="number"
                    ariaLabel="Stories"
                  />
                </Fact>
                <Fact label="Lot Size">
                  <EditableText
                    value={lotSize}
                    onChange={setLotSize}
                    placeholder="—"
                    ariaLabel="Lot Size"
                  />
                </Fact>
                <Fact label="Construction">
                  <EditableText
                    value={constructionType}
                    onChange={setConstructionType}
                    placeholder="—"
                    ariaLabel="Construction"
                  />
                </Fact>
                <Fact label="Typical Floor Size">
                  <EditableText
                    value={typicalFloorSize}
                    onChange={setTypicalFloorSize}
                    placeholder="—"
                    ariaLabel="Typical Floor Size"
                  />
                </Fact>
                <Fact label="Ceiling Height">
                  <EditableText
                    value={ceilingHeight}
                    onChange={setCeilingHeight}
                    placeholder="—"
                    ariaLabel="Ceiling Height"
                  />
                </Fact>
                <Fact label="Sprinkler System">
                  <EditableText
                    value={sprinklerSystem}
                    onChange={setSprinklerSystem}
                    placeholder="—"
                    ariaLabel="Sprinkler System"
                  />
                </Fact>
                <Fact label="Sewer">
                  <EditableText
                    value={sewer}
                    onChange={setSewer}
                    placeholder="—"
                    ariaLabel="Sewer"
                  />
                </Fact>
                <Fact label="Water">
                  <EditableText
                    value={water}
                    onChange={setWater}
                    placeholder="—"
                    ariaLabel="Water"
                  />
                </Fact>
                <Fact label="Heating">
                  <EditableText
                    value={heating}
                    onChange={setHeating}
                    placeholder="—"
                    ariaLabel="Heating"
                  />
                </Fact>
                <Fact label="Gas">
                  <EditableText
                    value={gas}
                    onChange={setGas}
                    placeholder="—"
                    ariaLabel="Gas"
                  />
                </Fact>
                <Fact label="Power Supply">
                  <EditableText
                    value={powerSupply}
                    onChange={setPowerSupply}
                    placeholder="—"
                    ariaLabel="Power Supply"
                  />
                </Fact>
                <Fact label="Zoning">
                  <EditableText
                    value={zoning}
                    onChange={setZoning}
                    placeholder="—"
                    ariaLabel="Zoning"
                  />
                </Fact>
                <Fact label="Parking">
                  <EditableText
                    value={parking}
                    onChange={setParking}
                    placeholder="—"
                    ariaLabel="Parking"
                  />
                </Fact>
                {isIndustrial && (
                  <>
                    <Fact label="Clear Height">
                      <EditableText
                        value={clearHeight}
                        onChange={setClearHeight}
                        placeholder="—"
                        ariaLabel="Clear Height"
                      />
                    </Fact>
                    <Fact label="Drive-In Bays">
                      <EditableText
                        value={driveInBays}
                        onChange={setDriveInBays}
                        placeholder="—"
                        type="number"
                        ariaLabel="Drive-In Bays"
                      />
                    </Fact>
                    <Fact label="Exterior Dock Doors">
                      <EditableText
                        value={exteriorDockDoors}
                        onChange={setExteriorDockDoors}
                        placeholder="—"
                        type="number"
                        ariaLabel="Exterior Dock Doors"
                      />
                    </Fact>
                    <Fact label="Interior Dock Doors">
                      <EditableText
                        value={interiorDockDoors}
                        onChange={setInteriorDockDoors}
                        placeholder="—"
                        type="number"
                        ariaLabel="Interior Dock Doors"
                      />
                    </Fact>
                    <Fact label="Column Spacing">
                      <EditableText
                        value={columnSpacing}
                        onChange={setColumnSpacing}
                        placeholder="—"
                        ariaLabel="Column Spacing"
                      />
                    </Fact>
                  </>
                )}
              </dl>
            </div>

            {/* Attachments (brochures) */}
            <div className="mb-8 pb-8 border-b border-neutral-200">
              <h3 className="text-xl font-medium text-black mb-3">
                Attachments
              </h3>
              {propertyId ? (
                <PropertyBrochureUpload
                  propertyId={propertyId}
                  existingBrochures={brochures.map((b) => ({
                    id: b.id,
                    url: b.url,
                    storage_path: b.storage_path,
                    display_order: b.display_order,
                    caption: b.caption ?? '',
                    filename: b.filename ?? '',
                  }))}
                />
              ) : (
                <p className="text-sm text-neutral-400 italic">
                  Save a draft first to attach brochures.
                </p>
              )}
            </div>

            {/* Mobile sidebar */}
            <div className="lg:hidden mt-8 mb-8 border border-neutral-200 bg-white">
              <div className="px-6 pt-6">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500">
                  Contacts
                </h3>
              </div>
              <div className="px-6">
                <EditableAgents
                  assignments={agents}
                  onChange={(next) => {
                    setAgents(next)
                    if (next.some((a) => a.team_member_id))
                      clearError('agents')
                  }}
                  teamMembers={teamMembers}
                  error={!!errors.agents}
                />
              </div>
              <div className="px-6 pb-6 pt-4">
                <span className="block w-full bg-neutral-900 text-white text-center py-3 rounded-full text-sm font-medium">
                  Contact For Details
                </span>
              </div>
            </div>
          </div>
          {/* Desktop sidebar */}
          <div className="hidden lg:block lg:w-[320px] flex-shrink-0 lg:sticky lg:top-24">
            <div className="border border-neutral-200 bg-white flex flex-col">
              <div className="px-6 pt-6">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500">
                  Contacts
                </h3>
              </div>
              <div className="px-6">
                <EditableAgents
                  assignments={agents}
                  onChange={(next) => {
                    setAgents(next)
                    if (next.some((a) => a.team_member_id))
                      clearError('agents')
                  }}
                  teamMembers={teamMembers}
                  error={!!errors.agents}
                />
              </div>
              <div className="px-6 pb-6 pt-4">
                <span className="block w-full bg-neutral-900 text-white text-center py-3 rounded-full text-sm font-medium">
                  Contact For Details
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </main>
  )
}

function Fact({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <dt className="text-sm font-medium text-neutral-900">{label}</dt>
      <dd className="text-sm text-neutral-500">{children}</dd>
    </div>
  )
}
