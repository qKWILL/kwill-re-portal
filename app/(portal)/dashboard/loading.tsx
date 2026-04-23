import { PortalLoading } from '@/components/portal-loading'

export default function DashboardLoading() {
  return (
    <PortalLoading titleWidth="w-72" actionWidth="w-60" subtitleWidth="w-48">
      <div className="grid gap-6 mb-8 lg:grid-cols-2">
        <div className="bg-white border border-neutral-200 rounded-lg h-64" />
        <div className="bg-white border border-neutral-200 rounded-lg h-64" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-40 bg-neutral-100 rounded-lg" />
        <div className="h-40 bg-neutral-100 rounded-lg" />
      </div>
    </PortalLoading>
  )
}
