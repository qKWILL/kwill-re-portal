type PortalLoadingProps = {
  titleWidth?: string
  actionWidth?: string | null
  subtitleWidth?: string | null
  children: React.ReactNode
}

export function PortalLoading({
  titleWidth = 'w-48',
  actionWidth = 'w-32',
  subtitleWidth = null,
  children,
}: PortalLoadingProps) {
  return (
    <div className="max-w-[1200px] mx-auto px-6 pt-8 pb-16 animate-pulse">
      <div className="flex items-end justify-between gap-6 flex-wrap mb-8">
        <div className="space-y-3">
          <div className={`h-10 ${titleWidth} bg-neutral-100 rounded`} />
          {subtitleWidth ? (
            <div className={`h-3 ${subtitleWidth} bg-neutral-100 rounded`} />
          ) : null}
        </div>
        {actionWidth ? (
          <div className={`h-9 ${actionWidth} bg-neutral-100 rounded-full`} />
        ) : null}
      </div>
      {children}
    </div>
  )
}
