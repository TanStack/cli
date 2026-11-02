import type { Environment } from './types.js'

export function pnpmBuildDependencies(
  packageJSON: Record<string, unknown>,
): Array<string> {
  const pnpm = packageJSON.pnpm
  if (!pnpm || typeof pnpm !== 'object' || !('onlyBuiltDependencies' in pnpm))
    return []
  return Array.isArray(pnpm.onlyBuiltDependencies)
    ? pnpm.onlyBuiltDependencies.filter(
        (name): name is string => typeof name === 'string',
      )
    : []
}

export async function mergePnpmWorkspace(
  existing: string | undefined,
  dependencies: ReadonlyArray<string>,
  existingDependencies: ReadonlyArray<string> = [],
): Promise<string> {
  const { Document, isMap, isScalar, isSeq, parseDocument } = await import(
    'yaml'
  )
  const doc =
    existing === undefined ? new Document({}) : parseDocument(existing)
  if (doc.errors.length)
    throw new Error(`Invalid pnpm-workspace.yaml: ${doc.errors[0].message}`)
  if (doc.contents !== null && !isMap(doc.contents))
    throw new Error('pnpm-workspace.yaml must contain a mapping')
  if (!doc.has('packages')) doc.set('packages', doc.createNode(['.']))
  const legacy = doc.get('onlyBuiltDependencies', true)
  const names = new Set(dependencies)
  if (isSeq(legacy)) {
    for (const item of legacy.items)
      if (isScalar(item) && typeof item.value === 'string')
        names.add(item.value)
  }
  const approvals = doc.get('allowBuilds', true)
  if (approvals !== undefined && !isMap(approvals))
    throw new Error('pnpm allowBuilds must contain a mapping')
  // Existing denials and version/pattern rules are user policy, do not broaden them.
  const customPolicy =
    isMap(approvals) &&
    approvals.items.some(
      ({ key, value }) =>
        !isScalar(key) ||
        typeof key.value !== 'string' ||
        /[*?{}[\]]|.+@/.test(key.value.replace(/^@/, '')) ||
        !isScalar(value) ||
        value.value !== true,
    )
  const missing = [...names].filter(
    (name) =>
      (!isMap(approvals) || !approvals.has(name)) &&
      !(customPolicy && existingDependencies.includes(name)),
  )
  if (customPolicy && missing.length)
    throw new Error(
      `Update the existing pnpm allowBuilds policy for: ${missing.join(', ')}`,
    )
  if (!approvals) doc.set('allowBuilds', doc.createNode({}))
  for (const name of missing) doc.setIn(['allowBuilds', name], true)
  return doc.toString()
}

export async function writePnpmWorkspace(
  environment: Environment,
  path: string,
  packageManager: string,
  packageJSON: Record<string, unknown>,
) {
  const dependencies = pnpmBuildDependencies(packageJSON)
  if (packageManager !== 'pnpm' || !dependencies.length) return
  const existing = environment.exists(path)
    ? await environment.readFile(path)
    : undefined
  await environment.writeFile(
    path,
    await mergePnpmWorkspace(existing, dependencies),
  )
}
