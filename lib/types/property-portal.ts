export interface Property {
  id: string
  title: string
  slug: string
  status: 'draft' | 'active' | 'pending' | 'sold' | 'leased'
  summary: string
  description: string
  address: string
  city: string
  state: string
  zip: string
  featured: boolean
  content: PropertyContent
  lat: number | null
  lng: number | null
  created_at: string
  updated_at: string
  agents: PropertyAgent[]
  media: PropertyMedia[]
  spaces: PropertySpace[]
  tenants: PropertyTenant[]
}

export interface PropertyContent {
  property_type: string
  transaction_type: string
  size_sf: number | null
  size_sf_min?: number | null
  size_sf_max?: number | null
  price: string | null
  lease_rate_sf: string | null
  year_built: number | null
  zoning: string | null
  parking: string | null
  highlights: string[]
  lot_size?: string
  building_class?: string
  stories?: number
  construction_type?: string
  sprinkler_system?: string
  year_renovated?: number
  typical_floor_size?: string
  ceiling_height?: string
  power_supply?: string
  heating?: string
  gas?: string
  water?: string
  sewer?: string
  clear_height?: string
  drive_in_bays?: number
  exterior_dock_doors?: number
  interior_dock_doors?: number
  column_spacing?: string
  features?: { label: string; value: string }[]
  overview_html?: string
  loopnet_url?: string
}

export interface PropertyAgentTeamMember {
  id: string
  name: string
  role: string
  img_url?: string | null
  slug?: string | null
}

export interface PropertyAgent {
  team_member_id: string
  role: string
  team_member: PropertyAgentTeamMember
}

export interface PropertyMedia {
  id: string
  url: string
  storage_path: string
  media_type: string
  display_order: number
  caption: string | null
  filename?: string | null
}

export interface PropertySpace {
  id: string
  name: string
  size_sf: number | null
  term: string | null
  rental_rate: string | null
  space_use: string | null
  build_out: string | null
  available_date: string | null
  features: string[]
  display_order: number
}

export interface PropertyTenant {
  id: string
  floor: string | null
  tenant_name: string
  industry: string | null
  display_order: number
}

export function isBrochure(media: PropertyMedia): boolean {
  return media.media_type === 'brochure' || media.url.toLowerCase().endsWith('.pdf')
}

export function isFloorPlan(media: PropertyMedia): boolean {
  return media.media_type === 'floor_plan'
}

export function getPropertyImages(media: PropertyMedia[]): PropertyMedia[] {
  return media
    .filter(
      (m) => !isBrochure(m) && !isFloorPlan(m) && m.media_type !== 'site_plan',
    )
    .sort((a, b) => a.display_order - b.display_order)
}

export function getPropertyBrochures(media: PropertyMedia[]): PropertyMedia[] {
  return media.filter(isBrochure)
}

export function getPropertyFloorPlans(media: PropertyMedia[]): PropertyMedia[] {
  return media.filter(isFloorPlan)
}
