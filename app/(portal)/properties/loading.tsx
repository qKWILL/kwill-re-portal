import { PortalLoading } from '@/components/portal-loading'

export default function PropertiesLoading() {
  return (
    <PortalLoading titleWidth="w-48" actionWidth="w-32">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[4/3] w-full bg-neutral-100 rounded-lg" />
            <div className="h-4 w-3/4 bg-neutral-100 rounded" />
            <div className="h-3 w-1/2 bg-neutral-100 rounded" />
          </div>
        ))}
      </div>
    </PortalLoading>
  )
}
