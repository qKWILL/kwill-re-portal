import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SubmissionsClient from './submissions-client'
import {
  SUBMISSION_TABS,
  DEFAULT_SUBMISSION_TAB,
  findSubmissionTab,
  type SubmissionTabKey,
} from './tabs'

function normalizeTab(raw: string | string[] | undefined): SubmissionTabKey {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (value && findSubmissionTab(value)) {
    return value as SubmissionTabKey
  }
  return DEFAULT_SUBMISSION_TAB
}

function normalizePropertyParam(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (!value) return null
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return UUID_RE.test(value) ? value : null
}

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string; tab?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const activeTab = normalizeTab(params.tab)
  const propertyFilter = normalizePropertyParam(params.property)
  const tabConfig = findSubmissionTab(activeTab)!

  let query = supabase
    .from('form_submissions')
    .select('*, property:properties(id, title)')
    .order('created_at', { ascending: false })

  query = query.eq('submission_type', tabConfig.submissionType)
  if (tabConfig.division) {
    query = query.eq('division', tabConfig.division)
  }
  if (propertyFilter) {
    query = query.eq('property_id', propertyFilter)
  }

  const { data: submissions } = await query

  const tabCountEntries = await Promise.all(
    SUBMISSION_TABS.map(async (t) => {
      let countQuery = supabase
        .from('form_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('submission_type', t.submissionType)
      if (t.division) countQuery = countQuery.eq('division', t.division)
      if (propertyFilter) countQuery = countQuery.eq('property_id', propertyFilter)
      const { count } = await countQuery
      return [t.key, count ?? 0] as const
    }),
  )
  const tabCounts = Object.fromEntries(tabCountEntries) as Record<
    SubmissionTabKey,
    number
  >

  let propertyChipTitle: string | null = null
  if (propertyFilter) {
    const { data: propertyRow } = await supabase
      .from('properties')
      .select('title')
      .eq('id', propertyFilter)
      .maybeSingle()
    propertyChipTitle = propertyRow?.title ?? null
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 pt-8 pb-16">
      <div className="mb-6">
        <h1 className="text-neutral-900 text-[clamp(2.2rem,0.15rem+8vw,3.125rem)] leading-[1.1] tracking-[-0.01em] font-serif font-normal">
          Submissions
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {submissions?.length ?? 0} in {tabConfig.label}
        </p>
      </div>
      <SubmissionsClient
        submissions={submissions ?? []}
        activeTab={activeTab}
        tabCounts={tabCounts}
        activePropertyId={propertyFilter}
        activePropertyTitle={propertyChipTitle}
      />
    </div>
  )
}
