import { satisfies } from 'semver'
import { describe, expect, it } from 'vitest'

import { finalizeAddOns } from '../src/add-ons.js'
import { createPackageJSON, mergePackageJSON } from '../src/package-json.js'
import {
  createPackageJSON as createEdgePackageJSON,
  mergePackageJSON as mergeEdgePackageJSON,
} from '../src/edge-package-json.js'
import { getFrameworkById } from '../src/edge.js'
import { createFrameworkDefinition } from '../src/frameworks/react/index.js'

import type { Framework, Options } from '../src/types.js'

describe.each([
  ['Node', mergePackageJSON],
  ['edge', mergeEdgePackageJSON],
] as const)('%s package engines', (_runtime, merge) => {
  it.each([false, true])(
    'preserves the higher minimum in either overlay order (reverse=%s)',
    (reverse) => {
      const packages = [
        { engines: { node: '>=22.22.0', npm: '>=10' } },
        { engines: { node: '>=22.11.0', pnpm: '>=9' } },
      ]
      if (reverse) packages.reverse()
      const engines = merge(packages[0], packages[1]).engines as Record<
        string,
        string
      >
      expect(engines).toEqual({ node: '>=22.22.0', npm: '>=10', pnpm: '>=9' })
      expect(satisfies('22.21.0', engines.node)).toBe(false)
      expect(satisfies('22.22.0', engines.node)).toBe(true)
    },
  )

  it('intersects upper bounds and alternative major ranges', () => {
    const engines = merge(
      { engines: { node: '^20.19.0 || ^22.12.0 || ^24.0.0' } },
      { engines: { node: '>=22.22.0 <25' } },
    ).engines as Record<string, string>
    for (const version of [
      '20.19.0',
      '21.0.0',
      '22.21.0',
      '23.0.0',
      '25.0.0',
    ]) {
      expect(satisfies(version, engines.node), version).toBe(false)
    }
    for (const version of ['22.22.0', '24.0.0']) {
      expect(satisfies(version, engines.node), version).toBe(true)
    }
  })

  it('does not relax mutually incompatible requirements', () => {
    const engines = merge(
      { engines: { node: '<22' } },
      { engines: { node: '>=22.22.0' } },
    ).engines as Record<string, string>
    for (const version of ['20.19.0', '22.21.0', '22.22.0', '24.0.0']) {
      expect(satisfies(version, engines.node), version).toBe(false)
    }
  })
})

describe.each([
  ['Node', createPackageJSON],
  ['edge', createEdgePackageJSON],
] as const)('%s Nitro and WorkOS scaffolds', (runtime, create) => {
  it.each(
    ['nitro', 'railway', 'render', 'vercel'].flatMap((deployment) =>
      [false, true].map((workosFirst) => [deployment, workosFirst] as const),
    ),
  )(
    'preserves Nitro engines with %s (WorkOS first=%s)',
    async (deployment, workosFirst) => {
      const { addOns, base, ...definition } = createFrameworkDefinition()
      const framework: Framework =
        runtime === 'edge'
          ? getFrameworkById('react')!
          : {
              ...definition,
              getAddOns: () => addOns,
              getFiles: async () => Object.keys(base),
              getFileContents: async (path) => base[path],
              getDeletedFiles: async () => [],
            }
      const ids = workosFirst ? ['workos', deployment] : [deployment, 'workos']
      const pkg = create({
        framework,
        projectName: 'nitro-workos',
        targetDir: '/',
        bundler: 'vite',
        mode: 'file-router',
        typescript: true,
        tailwind: false,
        packageManager: 'pnpm',
        chosenAddOns: await finalizeAddOns(framework, 'file-router', ids),
        addOnOptions: {},
        projectPreset: 'blank',
      } satisfies Options)
      expect(pkg.engines).toEqual({ node: '>=22.22.0' })
      expect(pkg.dependencies).toMatchObject({
        nitro: '3.0.261103-rc',
        '@workos-inc/node': '^10.8.0',
      })
    },
  )
})
