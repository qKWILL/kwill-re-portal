'use client'

import { X } from 'lucide-react'

type Props = {
  value: string[]
  onChange: (value: string[]) => void
}

export function EditableHighlights({ value, onChange }: Props) {
  const items = value.length === 0 ? [''] : value

  function update(i: number, text: string) {
    const next = [...items]
    next[i] = text
    onChange(next)
  }
  function add() {
    onChange([...items, ''])
  }
  function remove(i: number) {
    const next = items.filter((_, idx) => idx !== i)
    onChange(next.length === 0 ? [''] : next)
  }

  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
      {items.map((h, i) => (
        <li
          key={i}
          className="flex gap-2 text-sm text-neutral-500 font-light leading-relaxed group"
        >
          <span aria-hidden="true" className="text-neutral-400">
            &mdash;
          </span>
          <input
            value={h}
            placeholder="New highlight"
            onChange={(e) => update(i, e.target.value)}
            className="flex-1 bg-transparent outline-none border-b border-transparent focus:border-neutral-300 hover:border-neutral-200 text-sm text-neutral-700"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition"
            aria-label={`Remove highlight ${i + 1}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </li>
      ))}
      <li>
        <button
          type="button"
          onClick={add}
          className="text-xs text-neutral-500 hover:text-neutral-900 underline"
        >
          + Add highlight
        </button>
      </li>
    </ul>
  )
}
