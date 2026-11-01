/**
 * Resolves npm package versions at generation time.
 *
 * When a template specifies "latest" for a package, we fetch the actual
 * current version from the npm registry and pin it exactly, so generated
 * projects don't silently drift over time.
 */

export async function resolveNpmVersion(pkg: string): Promise<string | null> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${pkg}/latest`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const data = (await res.json()) as { version?: string }
    const version = data.version ?? null
    return version
  } catch {
    return null
  }
}

/**
 * Walk a deps object and resolve any "latest" values to pinned versions.
 * Non-"latest" values are left untouched.
 */
export async function resolveLatestVersions(
  deps: Record<string, string>,
): Promise<Record<string, string>> {
  const entries = Object.entries(deps)
  const resolved = await Promise.all(
    entries.map(async ([name, version]) => {
      if (version !== 'latest') return [name, version] as const
      const pinned = await resolveNpmVersion(name)
      return [name, pinned ?? 'latest'] as const
    }),
  )
  return Object.fromEntries(resolved)
}

/**
 * Resolve all "latest" version specifiers in a package.json object's
 * dependencies and devDependencies in-place, returning a new object.
 */
export async function resolvePackageJSONLatest(
  packageJSON: Record<string, any>,
): Promise<Record<string, any>> {
  const result = { ...packageJSON }

  if (result.dependencies) {
    result.dependencies = await resolveLatestVersions(result.dependencies)
  }
  if (result.devDependencies) {
    result.devDependencies = await resolveLatestVersions(result.devDependencies)
  }

  return result
}
