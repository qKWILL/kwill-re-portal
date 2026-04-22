'use client'

import { X } from 'lucide-react'

type Feature = { label: string; value: string }
type Props = {
  value: Feature[]
  onChange: (value: Feature[]) => void
}

export function EditableFeatures({ value, onChange }: Props) {
  function update(i: number, key: keyof Feature, text: string) {
    const next = [...value]
    next[i] = { ...next[i], [key]: text }
    onChange(next)
  }
  function add() {
    onChange([...value, { label: '', value: '' }])
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }

  return (
    <div className="mb-8 pb-8 border-b border-neutral-200">
      <h3 className="text-xl font-medium text-black mb-3">Features</h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
        {value.map((feature, i) => (
          <div key={i} className="group relative">
            <input
              value={feature.label}
              placeholder="Label"
              onChange={(e) => update(i, 'label', e.target.value)}
              className="block w-full bg-transparent outline-none border-b border-transparent focus:border-neutral-300 hover:border-neutral-200 text-sm font-medium text-neutral-900"
            />
            <input
              value={feature.value}
              placeholder="Value"
              onChange={(e) => update(i, 'value', e.target.value)}
              className="block w-full bg-transparent outline-none border-b border-transparent focus:border-neutral-300 hover:border-neutral-200 text-sm text-neutral-500 mt-0.5"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute -right-1 top-0 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition"
              aria-label={`Remove feature ${i + 1}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <div>
          <button
            type="button"
            onClick={add}
            className="text-xs text-neutral-500 hover:text-neutral-900 underline"
          >
            + Add feature
          </button>
        </div>
      </dl>
    </div>
  )
}
