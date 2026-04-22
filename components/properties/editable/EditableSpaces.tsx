'use client'

import { X, Plus } from 'lucide-react'

export type EditableSpaceInput = {
  id?: string
  name: string
  size_sf: string
  term: string
  rental_rate: string
  space_use: string
  build_out: string
  available_date: string
  features: string[]
}

type Props = {
  value: EditableSpaceInput[]
  onChange: (next: EditableSpaceInput[]) => void
}

const FIELDS: {
  key: keyof Omit<EditableSpaceInput, 'id' | 'features'>
  label: string
  placeholder?: string
  type?: string
}[] = [
  { key: 'name', label: 'Space', placeholder: 'Suite 200' },
  { key: 'size_sf', label: 'Size (SF)', placeholder: '12,500', type: 'number' },
  { key: 'term', label: 'Term', placeholder: '5 years' },
  { key: 'rental_rate', label: 'Rental Rate', placeholder: '$25/SF/YR' },
  { key: 'space_use', label: 'Space Use', placeholder: 'Office' },
  { key: 'build_out', label: 'Build-Out', placeholder: 'Full build-out' },
  { key: 'available_date', label: 'Available', placeholder: 'Immediate' },
]

export function EditableSpaces({ value, onChange }: Props) {
  function update<K extends keyof EditableSpaceInput>(
    i: number,
    key: K,
    v: EditableSpaceInput[K],
  ) {
    const next = [...value]
    next[i] = { ...next[i], [key]: v }
    onChange(next)
  }
  function add() {
    onChange([
      ...value,
      {
        name: '',
        size_sf: '',
        term: '',
        rental_rate: '',
        space_use: '',
        build_out: '',
        available_date: '',
        features: [],
      },
    ])
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }
  function updateFeature(i: number, fi: number, v: string) {
    const next = [...value]
    const features = [...next[i].features]
    features[fi] = v
    next[i] = { ...next[i], features }
    onChange(next)
  }
  function addFeature(i: number) {
    const next = [...value]
    next[i] = { ...next[i], features: [...next[i].features, ''] }
    onChange(next)
  }
  function removeFeature(i: number, fi: number) {
    const next = [...value]
    next[i] = {
      ...next[i],
      features: next[i].features.filter((_, idx) => idx !== fi),
    }
    onChange(next)
  }

  return (
    <section className="my-4 py-4">
      <h3 className="text-xl font-medium text-black mb-3">
        All Available Spaces ({value.length})
      </h3>

      <div className="space-y-3">
        {value.map((space, i) => (
          <div
            key={space.id ?? i}
            className="relative rounded-md border border-neutral-200 p-4 pr-10"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1">
                    {f.label}
                  </label>
                  <input
                    type={f.type ?? 'text'}
                    value={space[f.key]}
                    onChange={(e) => update(i, f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full border border-neutral-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1">
                Features
              </label>
              <div className="space-y-2">
                {space.features.map((feature, fi) => (
                  <div key={fi} className="flex gap-2">
                    <input
                      value={feature}
                      onChange={(e) => updateFeature(i, fi, e.target.value)}
                      placeholder="Feature"
                      className="flex-1 border border-neutral-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
                    />
                    <button
                      type="button"
                      onClick={() => removeFeature(i, fi)}
                      className="text-neutral-400 hover:text-red-500"
                      aria-label="Remove feature"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addFeature(i)}
                  className="text-xs text-neutral-500 hover:text-neutral-900 underline"
                >
                  + Add feature
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-3 right-3 text-neutral-400 hover:text-red-500"
              aria-label={`Remove space ${i + 1}`}
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
          <Plus className="w-3.5 h-3.5" /> Add space
        </button>
      </div>
    </section>
  )
}
