import { PortalLoading } from '@/components/portal-loading'

export default function SubmissionsLoading() {
  return (
    <PortalLoading titleWidth="w-56" actionWidth={null} subtitleWidth="w-32">
      <div className="flex gap-2 mb-6 flex-wrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-28 bg-neutral-100 rounded-full" />
        ))}
      </div>
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-5 py-3 border-b border-neutral-100 last:border-0"
          >
            <div className="h-4 w-24 bg-neutral-100 rounded" />
            <div className="h-4 flex-1 bg-neutral-100 rounded" />
            <div className="h-3 w-16 bg-neutral-100 rounded" />
          </div>
        ))}
      </div>
    </PortalLoading>
  )
}
