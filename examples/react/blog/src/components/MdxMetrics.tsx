export function MdxMetrics({
  items,
}: {
  items: Array<{ label: string; value: string }>
}) {
  return (
    <div className="not-prose my-6 grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-3"
        >
          <p className="m-0 text-xs uppercase tracking-[0.12em] text-[var(--sea-ink-soft)]">
            {item.label}
          </p>
          <p className="m-0 mt-1 text-lg font-semibold text-[var(--sea-ink)]">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  )
}
