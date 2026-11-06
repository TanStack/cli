import { parse as parseJsonc } from 'jsonc-parser'
import { parse as parseYaml } from 'yaml'
import { dirnamePath, joinPaths, normalizePath } from './edge-path.js'
import type { ParseError } from 'jsonc-parser'
import type { Environment } from './types.js'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function workspacePatterns(value: unknown, nestedKey?: string): boolean {
  if (value == null) return false
  if (nestedKey && isRecord(value)) return workspacePatterns(value[nestedKey])
  if (
    !Array.isArray(value) ||
    value.some((pattern) => typeof pattern !== 'string')
  ) {
    throw new TypeError('Workspace patterns must be an array of strings')
  }
  // Like Intent 0.5.6, even an empty array declares a workspace root.
  return true
}

/** Match Intent 0.5.6 project-context/workspace-patterns and getConfigDirs.
 * The scaffold target will own the generated package.json, including before
 * that file exists. Workspace discovery is independent of membership globs.
 */
export async function readIntentConfigManifests(
  environment: Environment,
  targetDir: string,
  packageJSON: Record<string, any>,
): Promise<Array<Record<string, any>>> {
  const target = normalizePath(targetDir)
  const manifests: Array<Record<string, any>> = []
  let dir = target
  for (;;) {
    let manifest: Record<string, any> = {}
    let isWorkspace = false
    for (const source of [
      'pnpm-workspace.yaml',
      'package.json',
      'deno.json',
      'deno.jsonc',
    ]) {
      const path = joinPaths(dir, source)
      if (source === 'package.json') {
        // Upstream reads package.json outside the recoverable workspace-format
        // catch: malformed manifests during discovery must fail, not be repaired.
        const value: unknown =
          dir === target
            ? packageJSON
            : environment.exists(path)
              ? JSON.parse(await environment.readFile(path))
              : {}
        if (!isRecord(value))
          throw new Error(
            `Invalid Intent policy manifest ${path}: expected a JSON object.`,
          )
        manifest = value
      } else if (!environment.exists(path)) {
        continue
      }
      try {
        if (source === 'package.json') {
          isWorkspace = workspacePatterns(manifest.workspaces, 'packages')
        } else {
          const content = await environment.readFile(path)
          let value: unknown
          if (source === 'pnpm-workspace.yaml') {
            value = parseYaml(content)
          } else {
            const errors: Array<ParseError> = []
            value = parseJsonc(content, errors, { allowTrailingComma: true })
            if (errors.length) throw new SyntaxError(`Invalid JSONC in ${path}`)
          }
          isWorkspace =
            isRecord(value) &&
            workspacePatterns(
              source === 'pnpm-workspace.yaml'
                ? value.packages
                : value.workspace,
              source === 'pnpm-workspace.yaml' ? undefined : 'members',
            )
        }
      } catch (error) {
        environment.warn(
          'Invalid workspace configuration',
          `${path}: ${String(error)}`,
        )
      }
      if (isWorkspace) break
    }
    // pnpm is checked before package.json in Intent. A pnpm root's manifest
    // still contributes policy, even when workspace discovery skipped reading it.
    if (
      isWorkspace &&
      dir !== target &&
      environment.exists(joinPaths(dir, 'package.json'))
    ) {
      const value: unknown = JSON.parse(
        await environment.readFile(joinPaths(dir, 'package.json')),
      )
      if (!isRecord(value))
        throw new Error(
          `Invalid Intent policy manifest ${dir}: expected a JSON object.`,
        )
      manifest = value
    }
    manifests.push(dir === target ? packageJSON : manifest)
    if (isWorkspace) return manifests
    if (environment.exists(joinPaths(dir, '.git'))) break
    const parent = dirnamePath(dir)
    if (parent === dir) break
    dir = parent
  }
  // With no workspace, getConfigDirs stops at the owning package, not .git/root.
  return [packageJSON]
}
