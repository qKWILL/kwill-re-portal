import type { Property } from '@/lib/types/property-portal'

export function PropertySidebar({ property: _property }: { property: Property }) {
  return (
    <div className="h-full border border-neutral-200 bg-white flex flex-col">
      <div className="px-6 pb-6 pt-6 mt-auto">
        <span className="block w-full bg-neutral-900 text-white text-center py-3 rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors">
          Contact For Details
        </span>
      </div>
    </div>
  )
}
