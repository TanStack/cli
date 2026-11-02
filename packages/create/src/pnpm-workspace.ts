import { dirnamePath, joinPaths } from './edge-path.js'
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
        typeof value.value !== 'boolean',
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
  context: { existingProject?: boolean; workspaceWasPresent?: boolean } = {},
) {
  const dependencies = pnpmBuildDependencies(packageJSON)
  if (packageManager !== 'pnpm' || !dependencies.length) return
  const existing = environment.exists(path)
    ? await environment.readFile(path)
    : undefined
  const workspace = await mergePnpmWorkspace(existing, dependencies)
  await environment.writeFile(path, workspace)
  if (
    !context.existingProject &&
    !(context.workspaceWasPresent ?? existing !== undefined)
  ) {
    const npmrcPath = joinPaths(dirnamePath(path), '.npmrc')
    const npmrc = environment.exists(npmrcPath)
      ? await environment.readFile(npmrcPath)
      : undefined
    const compatible = await standalonePnpmNpmrc(undefined, workspace, npmrc)
    if (compatible !== undefined)
      await environment.writeFile(npmrcPath, compatible)
  }
}

export async function standalonePnpmNpmrc(
  previousWorkspace: string | undefined,
  workspace: string,
  npmrc: string | undefined,
): Promise<string | undefined> {
  if (previousWorkspace !== undefined) return undefined
  const { isScalar, isSeq, parseDocument } = await import('yaml')
  const packages = parseDocument(workspace).get('packages', true)
  if (
    !isSeq(packages) ||
    packages.items.length !== 1 ||
    !isScalar(packages.items[0]) ||
    packages.items[0].value !== '.'
  )
    return undefined
  const content = npmrc ?? ''
  const bom = content.startsWith('\uFEFF') ? '\uFEFF' : ''
  const body = bom ? content.slice(1) : content
  // Only inspect the global INI section and preserve explicit user values.
  const globalSection = body.split(/^\s*\[/m, 1)[0]
  if (/^\s*["']?ignore-workspace-root-check["']?\s*=/im.test(globalSection))
    return content
  // pnpm 9 does not read this setting from pnpm-workspace.yaml.
  return `${bom}ignore-workspace-root-check=true\n${body}`
}
