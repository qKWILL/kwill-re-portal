import SubmissionsClient from './submissions-client'
import {
  DEFAULT_SUBMISSION_TAB,
  findSubmissionTab,
  type SubmissionTabKey,
} from './tabs'
import {
  getSubmissionsList,
  getSubmissionTabCounts,
  getPropertiesList,
} from '@/lib/cached-data'
import { getPortalSession } from '@/lib/auth'

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
  const params = await searchParams
  const activeTab = normalizeTab(params.tab)
  const propertyFilter = normalizePropertyParam(params.property)
  const tabConfig = findSubmissionTab(activeTab)!

  const [, submissions, tabCounts, propertiesForTitle] = await Promise.all([
    getPortalSession(),
    getSubmissionsList(activeTab, propertyFilter),
    getSubmissionTabCounts(propertyFilter),
    propertyFilter ? getPropertiesList() : Promise.resolve([]),
  ])

  const propertyChipTitle = propertyFilter
    ? (propertiesForTitle.find((p) => p.id === propertyFilter)?.title ?? null)
    : null

  return (
    <div className="max-w-[1200px] mx-auto px-6 pt-8 pb-16">
      <div className="mb-6">
        <h1 className="text-neutral-900 text-[clamp(2.2rem,0.15rem+8vw,3.125rem)] leading-[1.1] tracking-[-0.01em] font-serif font-normal">
          Submissions
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {submissions.length} in {tabConfig.label}
        </p>
      </div>
      <SubmissionsClient
        submissions={submissions}
        activeTab={activeTab}
        tabCounts={tabCounts}
        activePropertyId={propertyFilter}
        activePropertyTitle={propertyChipTitle}
      />
    </div>
  )
}
