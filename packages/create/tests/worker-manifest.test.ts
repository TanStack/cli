import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import ts from 'typescript'
import { describe, expect, it, vi } from 'vitest'

import {
  createApp as createEdgeApp,
  createMemoryEnvironment as createEdgeMemoryEnvironment,
  finalizeAddOns as finalizeEdgeAddOns,
  getFrameworkById as getEdgeFrameworkById,
  populateAddOnOptionsDefaults as populateEdgeAddOnOptionsDefaults,
} from '../src/edge.js'
import {
  createMemoryEnvironment,
  createWorkerCreate,
  createWorkerManifestLoader,
} from '../src/worker.js'
import { createBundledWorkerManifestLoader } from '../src/generated/worker/bundled-loader.js'

import type { Options } from '../src/types.js'
import type {
  ManifestCatalog,
  WorkerManifestLoader,
  WorkerManifestModuleLoader,
} from '../src/manifest-types.js'

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function resolveSourceImport(from: string, specifier: string) {
  const resolved = resolve(dirname(from), specifier)
  const withoutJsExtension = specifier.endsWith('.js')
    ? resolved.slice(0, -'.js'.length)
    : resolved
  const candidates = [
    resolved,
    `${withoutJsExtension}.ts`,
    resolve(withoutJsExtension, 'index.ts'),
  ]

  return candidates.find((candidate) => existsSync(candidate))
}

function collectStaticImportGraph(entry: string) {
  const visited = new Set<string>()
  const pending = [entry]

  while (pending.length) {
    const file = pending.pop()!
    if (visited.has(file)) {
      continue
    }
    visited.add(file)

    const source = ts.createSourceFile(
      file,
      readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    )

    for (const statement of source.statements) {
      if (
        (ts.isImportDeclaration(statement) ||
          ts.isExportDeclaration(statement)) &&
        statement.moduleSpecifier &&
        ts.isStringLiteral(statement.moduleSpecifier)
      ) {
        const specifier = statement.moduleSpecifier.text
        if (!specifier.startsWith('.')) {
          continue
        }

        const imported = resolveSourceImport(file, specifier)
        if (imported) {
          pending.push(imported)
        }
      }
    }
  }

  return visited
}

function createTrackedLoader() {
  const bundledLoader = createBundledWorkerManifestLoader()
  const loaded = {
    catalogs: 0,
    frameworks: [] as Array<string>,
    addOns: [] as Array<string>,
  }

  const loader: WorkerManifestLoader = {
    async loadCatalog() {
      loaded.catalogs++
      return bundledLoader.loadCatalog()
    },
    async loadFramework(frameworkId) {
      loaded.frameworks.push(frameworkId)
      return bundledLoader.loadFramework(frameworkId)
    },
    async loadAddOn(frameworkId, addOnId) {
      loaded.addOns.push(`${frameworkId}:${addOnId}`)
      return bundledLoader.loadAddOn(frameworkId, addOnId)
    },
  }

  return { loader, loaded }
}

describe('@tanstack/create/worker manifest loading', () => {
  it('preserves loader method context and retries failed chunk loads', async () => {
    const manifestCatalog: ManifestCatalog = {
      frameworks: [
        {
          id: 'react',
          name: 'React',
          description: '',
          version: '1.0.0',
          basePackageJSON: {},
          optionalPackages: {},
          supportedModes: {
            'file-router': {
              displayName: 'File Router',
              description: '',
              forceTypescript: true,
            },
          },
          addOns: [
            {
              id: 'retry',
              name: 'Retry',
              description: '',
              type: 'add-on',
              phase: 'add-on',
              modes: ['file-router'],
            },
          ],
        },
      ],
    }
    let frameworkLoads = 0
    let addOnLoads = 0
    const moduleLoader: WorkerManifestModuleLoader & {
      catalog: ManifestCatalog
    } = {
      catalog: manifestCatalog,
      async loadCatalog() {
        return this.catalog
      },
      async loadFramework() {
        frameworkLoads++
        if (frameworkLoads === 1) {
          throw new Error('temporary framework load failure')
        }

        return {
          framework: {
            id: 'react',
            base: {
              'package.json': '{}',
            },
          },
          renderManifestTemplate: () => '',
        }
      },
      async loadAddOn() {
        addOnLoads++
        if (addOnLoads === 1) {
          throw new Error('temporary add-on load failure')
        }

        return {
          addOn: {
            id: 'retry',
            name: 'Retry',
            description: '',
            type: 'add-on',
            phase: 'add-on',
            modes: ['file-router'],
            files: {
              'src/retry.ts': '',
            },
            deletedFiles: [],
          },
          renderManifestTemplate: () => '',
        }
      },
    }
    const workerCreate = createWorkerCreate(
      createWorkerManifestLoader(moduleLoader),
    )
    const framework = await workerCreate.getFrameworkById('react')

    await expect(framework!.getFiles()).rejects.toThrow(
      'temporary framework load failure',
    )
    await expect(framework!.getFiles()).resolves.toEqual(['package.json'])

    const addOn = framework!.getAddOns()[0]!
    await expect(addOn.getFiles()).rejects.toThrow(
      'temporary add-on load failure',
    )
    await expect(addOn.getFiles()).resolves.toEqual(['src/retry.ts'])
  })

  it('keeps the worker entrypoint away from generated manifest modules', () => {
    const graph = collectStaticImportGraph(resolve(packageDir, 'src/worker.ts'))
    const relativeGraph = Array.from(graph).map((file) =>
      file.slice(packageDir.length + 1).replace(/\\/g, '/'),
    )
    const totalBytes = Array.from(graph).reduce(
      (sum, file) => sum + statSync(file).size,
      0,
    )

    expect(relativeGraph).not.toContain('src/generated/create-manifest.ts')
    expect(relativeGraph.some((file) => file.startsWith('src/generated/'))).toBe(
      false,
    )
    expect(totalBytes).toBeLessThan(160_000)
  })

  it('loads only selected manifest chunks and matches edge generation', async () => {
    try {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => {
          return new Response(JSON.stringify({ version: '1.0.0' }), {
            status: 200,
          })
        }),
      )

      const { loader, loaded } = createTrackedLoader()
      const workerCreate = createWorkerCreate(loader)

      const framework = await workerCreate.getFrameworkById('react')
      expect(framework).toBeDefined()
      expect(loaded).toEqual({
        catalogs: 1,
        frameworks: [],
        addOns: [],
      })

      const featureIds = workerCreate
        .getAllAddOns(framework!, 'file-router')
        .map((addOn) => addOn.id)
      expect(featureIds).toContain('tanstack-query')
      expect(featureIds).toContain('cloudflare')
      expect(loaded.frameworks).toEqual([])
      expect(loaded.addOns).toEqual([])

      const chosenAddOns = await workerCreate.finalizeAddOns(
        framework!,
        'file-router',
        ['tanstack-query', 'cloudflare', 'biome'],
      )
      expect(loaded.addOns.sort()).toEqual([
        'react:biome',
        'react:cloudflare',
        'react:tanstack-query',
      ])

      const addOnOptions =
        workerCreate.populateAddOnOptionsDefaults(chosenAddOns)
      const { environment, output } = createMemoryEnvironment('/worker-app')

      await workerCreate.createApp(environment, {
        projectName: 'worker-app',
        targetDir: '/worker-app',
        framework: framework!,
        mode: 'file-router',
        typescript: true,
        tailwind: true,
        packageManager: 'pnpm',
        git: false,
        install: false,
        intent: false,
        chosenAddOns,
        addOnOptions,
        includeExamples: false,
      } satisfies Options)

      expect(loaded.frameworks).toEqual(['react'])

      const edgeFramework = getEdgeFrameworkById('react')
      expect(edgeFramework).toBeDefined()
      const edgeChosenAddOns = await finalizeEdgeAddOns(
        edgeFramework!,
        'file-router',
        ['tanstack-query', 'cloudflare', 'biome'],
      )
      const edgeAddOnOptions =
        populateEdgeAddOnOptionsDefaults(edgeChosenAddOns)
      const { environment: edgeEnvironment, output: edgeOutput } =
        createEdgeMemoryEnvironment('/worker-app')

      await createEdgeApp(edgeEnvironment, {
        projectName: 'worker-app',
        targetDir: '/worker-app',
        framework: edgeFramework!,
        mode: 'file-router',
        typescript: true,
        tailwind: true,
        packageManager: 'pnpm',
        git: false,
        install: false,
        intent: false,
        chosenAddOns: edgeChosenAddOns,
        addOnOptions: edgeAddOnOptions,
        includeExamples: false,
      } satisfies Options)

      expect(output.files).toEqual(edgeOutput.files)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
