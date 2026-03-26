'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

type Submission = {
  id: number
  first_name: string
  email: string
  company_size: string
  message: string
  division: string | null
  created_at: string
}

export default function SubmissionsClient({ submissions }: { submissions: Submission[] }) {
  const [expanded, setExpanded] = useState<number | null>(null)
  const [reviewed, setReviewed] = useState<Set<number>>(new Set())

  function toggleExpand(id: number) {
    setExpanded(prev => prev === id ? null : id)
  }

  function toggleReviewed(id: number) {
    setReviewed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (!submissions.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <p className="text-gray-500 text-sm">No submissions yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {submissions.map(s => (
        <div key={s.id}
          className={`bg-white border rounded-lg overflow-hidden transition-colors ${
            reviewed.has(s.id) ? 'border-gray-100 opacity-60' : 'border-gray-200'
          }`}>
          {/* Row */}
          <div className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50"
            onClick={() => toggleExpand(s.id)}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <p className="font-medium text-gray-900 text-sm">{s.first_name}</p>
                <p className="text-sm text-gray-500">{s.email}</p>
                {s.division && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs hidden sm:inline">
                    {s.division}
                  </span>
                )}
                {s.company_size && (
                  <span className="text-xs text-gray-400 hidden md:inline">{s.company_size}</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{s.message}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <p className="text-xs text-gray-400 hidden sm:block">
                {new Date(s.created_at).toLocaleDateString()}
              </p>
              <button
                onClick={e => { e.stopPropagation(); toggleReviewed(s.id) }}
                className={`text-xs px-2 py-1 rounded border transition-colors ${
                  reviewed.has(s.id)
                    ? 'border-green-300 text-green-700 bg-green-50'
                    : 'border-gray-300 text-gray-500 hover:bg-gray-100'
                }`}>
                {reviewed.has(s.id) ? 'Reviewed' : 'Mark reviewed'}
              </button>
              {expanded === s.id
                ? <ChevronUp className="w-4 h-4 text-gray-400" />
                : <ChevronDown className="w-4 h-4 text-gray-400" />
              }
            </div>
          </div>

          {/* Expanded message */}
          {expanded === s.id && (
            <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50">
              <p className="text-xs font-medium text-gray-500 mb-1">Message</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{s.message}</p>
              <div className="flex gap-6 mt-3">
                {s.company_size && (
                  <div>
                    <p className="text-xs text-gray-400">Company size</p>
                    <p className="text-sm text-gray-700">{s.company_size}</p>
                  </div>
                )}
                {s.division && (
                  <div>
                    <p className="text-xs text-gray-400">Division</p>
                    <p className="text-sm text-gray-700">{s.division}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400">Submitted</p>
                  <p className="text-sm text-gray-700">{new Date(s.created_at).toLocaleString()}</p>
                </div>
              </div>
              <a href={`mailto:${s.email}`}
                className="inline-block mt-3 text-xs text-blue-600 hover:underline">
                Reply to {s.email} →
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
