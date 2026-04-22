'use client'

export type ViewMode = 'grid' | 'list'

type Props = {
  value: ViewMode
  onChange: (v: ViewMode) => void
}

export function ViewToggle({ value, onChange }: Props) {
  return (
    <div
      role="group"
      aria-label="View mode"
      className="inline-flex items-center rounded-full border border-neutral-200 p-0.5"
    >
      <button
        type="button"
        onClick={() => onChange('grid')}
        aria-pressed={value === 'grid'}
        className={`inline-flex items-center justify-center px-3 h-8 rounded-full text-xs font-medium transition-colors ${
          value === 'grid'
            ? 'bg-neutral-200 text-neutral-900'
            : 'text-neutral-500 hover:text-neutral-900'
        }`}
      >
        Grid
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        aria-pressed={value === 'list'}
        className={`inline-flex items-center justify-center px-3 h-8 rounded-full text-xs font-medium transition-colors ${
          value === 'list'
            ? 'bg-neutral-200 text-neutral-900'
            : 'text-neutral-500 hover:text-neutral-900'
        }`}
      >
        List
      </button>
    </div>
  )
}
