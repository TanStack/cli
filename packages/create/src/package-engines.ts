import { Range, minVersion, subset } from 'semver'
import type { Comparator } from 'semver'

function stableComparators(comparators: ReadonlyArray<Comparator>) {
  return comparators.map((comparator) => {
    if (!comparator.value || comparator.semver.prerelease.length === 0) {
      return comparator.value
    }

    const { major, minor, patch } = comparator.semver
    const version = `${major}.${minor}.${patch}`
    switch (comparator.operator) {
      case '>':
      case '>=':
        return `>=${version}`
      case '<':
      case '<=':
        return `<${version}`
      default:
        // Equality to a prerelease cannot admit any stable version.
        return '<0.0.0-0'
    }
  })
}

function prereleaseTuples(comparators: ReadonlyArray<Comparator>) {
  return new Set(
    comparators.flatMap((comparator) => {
      if (!comparator.value || comparator.semver.prerelease.length === 0) {
        return []
      }
      const { major, minor, patch } = comparator.semver
      return [`${major}.${minor}.${patch}`]
    }),
  )
}

function intersectRanges(base: string, overlay: string) {
  const intersections = new Set<string>()
  function addIntersection(comparators: Array<string>) {
    const intersection = new Range([...new Set(comparators)].join(' '))
    if (minVersion(intersection)) {
      intersections.add(intersection.range || '*')
    }
  }

  const leftRange = new Range(base)
  const rightRange = new Range(overlay)
  for (const left of leftRange.set) {
    for (const right of rightRange.set) {
      // Opt-in applies to a comparator set, so handle stable versions separately.
      const leftStable = stableComparators(left)
      const rightStable = stableComparators(right)
      if (subset(leftStable.join(' '), rightStable.join(' '))) {
        addIntersection(leftStable)
      } else if (subset(rightStable.join(' '), leftStable.join(' '))) {
        addIntersection(rightStable)
      } else {
        addIntersection([...leftStable, ...rightStable])
      }

      const rightTuples = prereleaseTuples(right)
      for (const tuple of prereleaseTuples(left)) {
        if (!rightTuples.has(tuple)) continue
        // Admit only the prerelease tuple explicitly allowed by both sides.
        addIntersection([
          ...left.map((comparator) => comparator.value),
          ...right.map((comparator) => comparator.value),
          `>=${tuple}-0`,
          `<${tuple}`,
        ])
      }
    }
  }
  // A bare wildcard makes node-semver discard other prerelease alternatives.
  if (intersections.size > 1 && intersections.delete('*')) {
    intersections.add('0.0.0')
    intersections.add('>0.0.0')
  }
  return intersections
}

export function mergePackageEngines(
  base?: Record<string, string>,
  overlay?: Record<string, string>,
) {
  if (!base && !overlay) return undefined

  const engines = { ...base, ...overlay }
  for (const [engine, range] of Object.entries(overlay ?? {})) {
    const existing = base?.[engine]
    if (existing === undefined) continue

    const intersections = intersectRanges(existing, range)
    if (intersections.size === 0) {
      throw new Error(
        `Incompatible engines.${engine} requirements: "${existing}" and "${range}"`,
      )
    }

    engines[engine] = [...intersections].join(' || ')
  }
  return engines
}
