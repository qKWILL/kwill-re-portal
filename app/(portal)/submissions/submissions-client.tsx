'use client'

import { useState, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { X } from 'lucide-react'
import AnimatedTabs from '@/components/ui/AnimatedTabs'
import type { SubmissionRow } from '@/lib/cached-data'
import {
  SUBMISSION_TABS,
  DEFAULT_SUBMISSION_TAB,
  findSubmissionTab,
  type SubmissionTabKey,
} from './tabs'

interface SubmissionsClientProps {
  submissions: SubmissionRow[]
  activeTab: SubmissionTabKey
  tabCounts: Record<SubmissionTabKey, number>
  activePropertyId: string | null
  activePropertyTitle: string | null
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const sameYear = d.getFullYear() === now.getFullYear()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
  return d.toLocaleDateString(
    [],
    sameYear
      ? { month: 'short', day: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' },
  )
}

export default function SubmissionsClient({
  submissions,
  activeTab,
  tabCounts,
  activePropertyId,
  activePropertyTitle,
}: SubmissionsClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [expanded, setExpanded] = useState<number | null>(null)

  const pushParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams?.toString() ?? '')
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') {
          next.delete(key)
        } else {
          next.set(key, value)
        }
      }
      const qs = next.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
    },
    [router, pathname, searchParams],
  )

  const handleTabChange = (key: string) => {
    pushParams({ tab: key === DEFAULT_SUBMISSION_TAB ? null : key })
  }

  const handleClearProperty = () => {
    pushParams({ property: null })
  }

  const activeTabConfig = findSubmissionTab(activeTab)!
  const tabKeys = SUBMISSION_TABS.map((t) => t.key)
  const formatTabLabel = (key: string) => {
    const tab = findSubmissionTab(key)
    if (!tab) return key
    const count = tabCounts[key as SubmissionTabKey] ?? 0
    return `${tab.label} (${count})`
  }

  return (
    <>
      <div className="mb-6">
        <AnimatedTabs
          filters={tabKeys}
          activeFilter={activeTab}
          onFilterChange={(f) => handleTabChange(f)}
          formatLabel={formatTabLabel}
        />
      </div>

      {activePropertyId ? (
        <div className="mb-4">
          <button
            type="button"
            onClick={handleClearProperty}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 hover:bg-neutral-200 transition-colors"
            title="Clear property filter"
          >
            <span className="max-w-[260px] truncate">
              Property: {activePropertyTitle ?? 'Unknown'}
            </span>
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : null}

      {submissions.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center">
          <p className="text-neutral-500 text-sm">
            No {activeTabConfig.label.toLowerCase()} yet
            {activePropertyId ? ' for this property' : ''}.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden divide-y divide-neutral-100">
          {submissions.map((s) => {
            const isOpen = expanded === s.id
            const propertyTitle = s.property?.title ?? null
            const propertyId = s.property?.id ?? s.property_id ?? null
            const isBrochure = s.submission_type === 'brochure_download'
            const primaryLine =
              isBrochure && propertyTitle ? propertyTitle : s.message
            const secondaryLine = isBrochure && propertyTitle ? s.message : null
            return (
              <div key={s.id} className={isOpen ? 'bg-neutral-50' : ''}>
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : s.id)}
                  className="w-full flex items-baseline gap-4 px-5 py-3 text-left hover:bg-neutral-50 transition-colors"
                >
                  <span className="font-semibold text-sm text-neutral-900 w-40 shrink-0 truncate">
                    {s.first_name}
                  </span>
                  <span className="flex-1 min-w-0 text-sm text-neutral-700 truncate">
                    <span className="text-neutral-900">{primaryLine}</span>
                    {secondaryLine ? (
                      <span className="text-neutral-400"> — {secondaryLine}</span>
                    ) : null}
                  </span>
                  <span className="text-xs text-neutral-400 shrink-0 tabular-nums">
                    {formatDate(s.created_at)}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-2 border-t border-neutral-100">
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-neutral-500 mb-4">
                      <span>
                        <span className="text-neutral-400">From </span>
                        <span className="text-neutral-700">{s.first_name}</span>
                        <span className="text-neutral-400"> &lt;{s.email}&gt;</span>
                      </span>
                      {s.company_size && s.company_size !== 'Not specified' && (
                        <span>
                          <span className="text-neutral-400">Company size </span>
                          <span className="text-neutral-700">{s.company_size}</span>
                        </span>
                      )}
                      {s.division && !isBrochure && (
                        <span>
                          <span className="text-neutral-400">Division </span>
                          <span className="text-neutral-700">{s.division}</span>
                        </span>
                      )}
                      {propertyId && propertyTitle ? (
                        <span>
                          <span className="text-neutral-400">Property </span>
                          <Link
                            href={`/properties/${propertyId}`}
                            className="text-neutral-700 underline decoration-neutral-300 hover:decoration-neutral-700"
                          >
                            {propertyTitle}
                          </Link>
                        </span>
                      ) : null}
                      <span>
                        <span className="text-neutral-400">Received </span>
                        <span className="text-neutral-700">
                          {new Date(s.created_at).toLocaleString()}
                        </span>
                      </span>
                    </div>

                    <p className="text-sm text-neutral-800 whitespace-pre-wrap leading-relaxed">
                      {s.message}
                    </p>

                    <div className="mt-5">
                      <a
                        href={`mailto:${s.email}`}
                        className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
                      >
                        Reply
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
