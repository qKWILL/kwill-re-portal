'use client'

import { useState } from 'react'
import { updatePropertyStatus } from './status-actions'

const TRANSITIONS: Record<string, { label: string; next: string; color: string }[]> = {
  draft:   [{ label: 'Publish', next: 'active', color: 'bg-green-600 hover:bg-green-700 text-white' }],
  active:  [
    { label: 'Mark Pending', next: 'pending', color: 'bg-yellow-500 hover:bg-yellow-600 text-white' },
    { label: 'Mark Sold', next: 'sold', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
    { label: 'Mark Leased', next: 'leased', color: 'bg-purple-600 hover:bg-purple-700 text-white' },
  ],
  pending: [
    { label: 'Back to Active', next: 'active', color: 'bg-green-600 hover:bg-green-700 text-white' },
    { label: 'Mark Sold', next: 'sold', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
    { label: 'Mark Leased', next: 'leased', color: 'bg-purple-600 hover:bg-purple-700 text-white' },
  ],
  sold:    [{ label: 'Reactivate', next: 'active', color: 'bg-green-600 hover:bg-green-700 text-white' }],
  leased:  [{ label: 'Reactivate', next: 'active', color: 'bg-green-600 hover:bg-green-700 text-white' }],
}

export default function StatusButtons({
  propertyId,
  currentStatus,
  canChangeStatus,
}: {
  propertyId: string
  currentStatus: string
  canChangeStatus: boolean
}) {
  const [loading, setLoading] = useState<string | null>(null)

  if (!canChangeStatus) return null

  const transitions = TRANSITIONS[currentStatus] ?? []
  if (transitions.length === 0) return null

  async function handleClick(next: string) {
    setLoading(next)
    await updatePropertyStatus(propertyId, next)
    setLoading(null)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {transitions.map(t => (
        <button
          key={t.next}
          onClick={() => handleClick(t.next)}
          disabled={loading !== null}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${t.color}`}
        >
          {loading === t.next ? 'Updating...' : t.label}
        </button>
      ))}
    </div>
  )
}
