import { PortalLoading } from '@/components/portal-loading'

export default function TeamLoading() {
  return (
    <PortalLoading titleWidth="w-32" actionWidth="w-32">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <div className="h-16 w-16 rounded-full bg-neutral-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 bg-neutral-100 rounded" />
              <div className="h-3 w-1/2 bg-neutral-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </PortalLoading>
  )
}
