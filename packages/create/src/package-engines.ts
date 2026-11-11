import { Range, subset } from 'semver'

export function mergePackageEngines(
  base?: Record<string, string>,
  overlay?: Record<string, string>,
) {
  if (!base && !overlay) return undefined

  const engines = { ...base, ...overlay }
  for (const [engine, range] of Object.entries(overlay ?? {})) {
    const existing = base?.[engine]
    if (!existing || subset(range, existing)) continue
    if (subset(existing, range)) {
      engines[engine] = existing
      continue
    }

    // Both requirements must hold, including every alternative of OR ranges.
    engines[engine] = new Range(existing).set
      .flatMap((left) =>
        new Range(range).set.map((right) =>
          [...left, ...right].map((comparator) => comparator.value).join(' '),
        ),
      )
      .join(' || ')
  }
  return engines
}
