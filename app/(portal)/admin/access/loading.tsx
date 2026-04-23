import { PortalLoading } from "@/components/portal-loading";

export default function AccessLoading() {
  return (
    <PortalLoading titleWidth="w-28" actionWidth="w-28">
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 py-3 border-b border-neutral-100"
          >
            <div className="h-10 w-10 rounded-full bg-neutral-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 bg-neutral-100 rounded" />
              <div className="h-3 w-1/4 bg-neutral-100 rounded" />
            </div>
            <div className="h-6 w-20 bg-neutral-100 rounded-full" />
          </div>
        ))}
      </div>
    </PortalLoading>
  );
}
