function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xl font-medium text-black mb-3">{children}</h3>
  )
}

export function PropertyFeatures({
  features,
}: {
  features: { label: string; value: string }[] | undefined
}) {
  if (!features || features.length === 0) return null

  return (
    <div className="mb-8 py-8 bg-neutral-50 px-8">
      <SectionHeading>Features</SectionHeading>
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
        {features.map((feature) => (
          <div key={feature.label}>
            <dt className="text-sm font-medium text-neutral-900">
              {feature.label}
            </dt>
            <dd className="text-sm text-neutral-500">{feature.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
