function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xl font-medium text-black mb-3">{children}</h3>
  )
}

export function PropertyOverview({ html }: { html: string | undefined }) {
  if (!html) return null

  return (
    <div className="mb-8 p-8 border-b border-neutral-200">
      <SectionHeading>Property Overview</SectionHeading>
      <div
        className="text-[15px] text-neutral-700 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_p]:mb-4"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
