'use client'

import { X, Plus } from 'lucide-react'
import type { ExperienceEntry } from '@/lib/utils/team-experience'

type Props = {
  value: ExperienceEntry[]
  onChange: (next: ExperienceEntry[]) => void
}

export function EditableExperience({ value, onChange }: Props) {
  function update(i: number, key: keyof ExperienceEntry, text: string) {
    const next = [...value]
    next[i] = { ...next[i], [key]: text }
    onChange(next)
  }
  function add() {
    onChange([...value, { company: '', role: '' }])
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-3 max-w-3xl">
      {value.length === 0 ? (
        <p className="text-sm text-neutral-400 italic">
          No experience added yet.
        </p>
      ) : null}

      {value.map((entry, i) => (
        <div
          key={i}
          className="relative rounded-md border border-neutral-200 p-4 pr-10"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1">
                Company
              </label>
              <input
                value={entry.company}
                onChange={(e) => update(i, 'company', e.target.value)}
                placeholder="e.g. Umoja Supply Chain Solutions"
                className="w-full border border-neutral-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1">
                Role
              </label>
              <input
                value={entry.role}
                onChange={(e) => update(i, 'role', e.target.value)}
                placeholder="e.g. Investment Banking Analyst"
                className="w-full border border-neutral-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => remove(i)}
            className="absolute top-3 right-3 text-neutral-400 hover:text-red-500"
            aria-label={`Remove experience ${i + 1}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 underline"
      >
        <Plus className="w-3.5 h-3.5" /> Add experience
      </button>
    </div>
  )
}
