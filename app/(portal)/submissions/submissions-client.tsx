'use client'

import { useState } from 'react'

type Submission = {
  id: number
  first_name: string
  email: string
  company_size: string
  message: string
  division: string | null
  created_at: string
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
  return d.toLocaleDateString([], sameYear
    ? { month: 'short', day: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function SubmissionsClient({ submissions }: { submissions: Submission[] }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  if (!submissions.length) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center">
        <p className="text-neutral-500 text-sm">No submissions yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden divide-y divide-neutral-100">
      {submissions.map(s => {
        const isOpen = expanded === s.id
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
                <span className="text-neutral-900">
                  {s.division ? `${s.division} inquiry` : 'New inquiry'}
                </span>
                <span className="text-neutral-400"> — {s.message}</span>
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
                  {s.company_size && (
                    <span>
                      <span className="text-neutral-400">Company size </span>
                      <span className="text-neutral-700">{s.company_size}</span>
                    </span>
                  )}
                  {s.division && (
                    <span>
                      <span className="text-neutral-400">Division </span>
                      <span className="text-neutral-700">{s.division}</span>
                    </span>
                  )}
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
  )
}
