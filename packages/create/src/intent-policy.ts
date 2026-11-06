import { readIntentConfigManifests } from './intent-project.js'
import { joinPaths, normalizePath } from './edge-path.js'
import type { Environment } from './types.js'

/** Retain the user's Intent policy, version, and dependency location on merge. */
export function preserveIntentConfiguration(
  packageJSON: Record<string, any>,
  existing: Record<string, any>,
) {
  if (Object.prototype.hasOwnProperty.call(existing, 'intent')) {
    packageJSON.intent = existing.intent
  }
  const fields = ['dependencies', 'devDependencies'] as const
  const hasIntent = fields.some((field) =>
    Object.prototype.hasOwnProperty.call(
      existing[field] ?? {},
      '@tanstack/intent',
    ),
  )
  if (!hasIntent) return
  for (const field of fields) {
    delete packageJSON[field]?.['@tanstack/intent']
    if (
      Object.prototype.hasOwnProperty.call(
        existing[field] ?? {},
        '@tanstack/intent',
      )
    ) {
      packageJSON[field] = {
        ...packageJSON[field],
        '@tanstack/intent': existing[field]['@tanstack/intent'],
      }
    }
  }
}

/** Seed only the selected direct packages, without replacing an existing policy. */
export async function configureIntentPolicy(
  environment: Environment,
  targetDir: string,
  packageJSON: Record<string, any>,
  context: {
    existingProject?: boolean
    existingPackageJSON?: Record<string, any>
  } = {},
) {
  // add-to-app generates in an empty memory filesystem before merging into the
  // real project. Its overlay must never introduce a new permission policy.
  if (context.existingProject) return

  const dir = normalizePath(targetDir)
  const localPath = joinPaths(dir, 'package.json')
  const existing =
    context.existingPackageJSON ??
    (environment.exists(localPath)
      ? JSON.parse(await environment.readFile(localPath))
      : {})
  preserveIntentConfiguration(packageJSON, existing)

  const manifests = await readIntentConfigManifests(
    environment,
    dir,
    packageJSON,
  )

  // Preserve malformed values too: Intent must report them, not the scaffold
  // silently repairing them. null/omitted skills inherit from ancestors.
  const localIntent = packageJSON.intent
  if (
    localIntent !== undefined &&
    (!localIntent ||
      typeof localIntent !== 'object' ||
      Array.isArray(localIntent))
  )
    return
  if (localIntent?.skills != null) return

  for (const ancestor of manifests.slice(1)) {
    if (ancestor.intent !== undefined) {
      const intent = ancestor.intent
      if (
        !intent ||
        typeof intent !== 'object' ||
        Array.isArray(intent) ||
        intent.skills != null
      )
        return
    }
  }

  const packages = [
    ...new Set([
      ...Object.keys(packageJSON.dependencies ?? {}),
      ...Object.keys(packageJSON.devDependencies ?? {}),
    ]),
  ]
    .filter(
      (name) =>
        name !== '@tanstack/intent' &&
        /^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/.test(name),
    )
    .sort()
  packageJSON.intent = { ...localIntent, skills: packages }
}
