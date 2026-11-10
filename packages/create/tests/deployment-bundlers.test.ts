import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { finalizeAddOns } from '../src/add-ons.js'
import { createApp } from '../src/create-app.js'
import { createMemoryEnvironment } from '../src/environment.js'
import { isAddOnSupportedByBundler } from '../src/build-tools.js'
import { addToApp } from '../src/add-to-app.js'
import { __testClearFrameworks, registerFramework } from '../src/frameworks.js'
import { createFrameworkDefinition as react } from '../src/frameworks/react/index.js'
import { createFrameworkDefinition as solid } from '../src/frameworks/solid/index.js'

import type { Framework, FrameworkDefinition, Options } from '../src/types.js'

const presets = {
  nitro: 'node-server',
  railway: 'node-server',
  render: 'render-com',
  vercel: 'vercel',
  netlify: 'netlify',
  cloudflare: 'cloudflare-module',
}

function frameworkFromDefinition(definition: FrameworkDefinition): Framework {
  const { addOns, base, ...rest } = definition
  return {
    ...rest,
    getFiles: async () => Object.keys(base),
    getFileContents: async (path) => base[path],
    getDeletedFiles: async () => [],
    getAddOns: () => addOns,
  }
}

async function generate(
  framework: Framework,
  bundler: string,
  ids: Array<string>,
  routerOnly = false,
) {
  const { environment, output } = createMemoryEnvironment()
  await createApp(environment, {
    projectName: 'deployment-app',
    targetDir: '/',
    framework,
    mode: 'file-router',
    bundler,
    typescript: true,
    tailwind: false,
    packageManager: 'pnpm',
    git: false,
    install: false,
    intent: false,
    chosenAddOns: await finalizeAddOns(framework, 'file-router', ids, bundler),
    addOnOptions: {},
    projectPreset: 'blank',
    routerOnly,
    includeExamples: false,
  } satisfies Options)
  return Object.fromEntries(
    Object.entries(output.files).map(([path, contents]) => [
      path.replace(/^\//, ''),
      contents,
    ]),
  )
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ version: '1.0.0' }))),
  )
})

afterEach(() => vi.unstubAllGlobals())

describe.each([
  ['react', react],
  ['solid', solid],
] as const)('%s deployments', (_id, definition) => {
  it.each(Object.entries(presets))(
    'generates the %s Nitro Rsbuild adapter',
    async (id, preset) => {
      const files = await generate(
        frameworkFromDefinition(definition()),
        'rsbuild',
        [id],
      )
      const pkg = JSON.parse(files['package.json'])
      const config = files['rsbuild.config.ts']

      expect(config).toContain("import { nitro } from 'nitro/rsbuild'")
      expect(config).toContain('installDevServerMiddleware: false')
      expect(config).toContain(`nitro({ preset: '${preset}' })`)
      expect(config.indexOf('tanstackStart({')).toBeLessThan(
        config.indexOf('nitro({'),
      )
      expect(files).not.toHaveProperty('vite.config.ts')
      expect(pkg.dependencies.nitro).toBe('3.0.261103-rc')
      expect(pkg.dependencies.db0).toBe('^0.4.1')
      expect(pkg.dependencies.unstorage).toBe('^2.0.0-alpha.10')
      expect(pkg.dependencies).not.toHaveProperty('srvx')
      expect(pkg.devDependencies['@rsbuild/core']).toBe('^2.3.0')
      expect(pkg.engines.node).toBe('>=22.22.0')
      expect(pkg.scripts.build).toBe('rsbuild build')
      expect(pkg.scripts.start).toBe(
        ['nitro', 'railway', 'render'].includes(id)
          ? 'node .output/server/index.mjs'
          : 'rsbuild preview',
      )
      expect({
        ...pkg.dependencies,
        ...pkg.devDependencies,
      }).not.toHaveProperty('@cloudflare/vite-plugin')
      expect({
        ...pkg.dependencies,
        ...pkg.devDependencies,
      }).not.toHaveProperty('@netlify/vite-plugin-tanstack-start')

      if (id === 'cloudflare') {
        expect(JSON.parse(files['wrangler.jsonc'])).not.toHaveProperty('main')
        expect(pkg.scripts.deploy).toBe(
          'pnpm run build && wrangler deploy --config .output/server/wrangler.json',
        )
        expect(pkg.devDependencies.wrangler).toBeDefined()
      } else if (id === 'netlify') {
        expect(files['netlify.toml']).toContain('command = "rsbuild build"')
        expect(files['netlify.toml']).toContain('publish = "dist"')
      } else if (id === 'vercel') {
        expect(JSON.parse(files['vercel.json'])).toMatchObject({
          framework: null,
          buildCommand: 'pnpm build',
        })
      } else if (id === 'render') {
        expect(files['render.yaml']).toContain('value: render-com')
        expect(files['render.yaml']).toContain('startCommand: pnpm start')
      }
    },
  )

  it.each(Object.keys(presets))('preserves the %s Vite adapter', async (id) => {
    const files = await generate(
      frameworkFromDefinition(definition()),
      'vite',
      [id],
    )
    const pkg = JSON.parse(files['package.json'])
    expect(files).not.toHaveProperty('rsbuild.config.ts')
    expect(files['vite.config.ts']).not.toContain('nitro/rsbuild')
    if (id === 'cloudflare') {
      expect(pkg.engines).toBeUndefined()
      expect(JSON.parse(files['wrangler.jsonc']).main).toBe(
        `@tanstack/${_id}-start/server-entry`,
      )
      expect(pkg.scripts.deploy).toBe('pnpm run build && wrangler deploy')
    } else if (id === 'netlify') {
      expect(pkg.engines).toBeUndefined()
      expect(files['netlify.toml']).toContain('publish = "dist/client"')
      expect(
        pkg.devDependencies['@netlify/vite-plugin-tanstack-start'],
      ).toBeDefined()
    } else {
      expect(pkg.dependencies.nitro).toBe('3.0.261103-rc')
      expect(pkg.engines.node).toBe('>=22.22.0')
    }
  })

  it('rejects conflicting deployment adapters and router-only deployments', async () => {
    const framework = frameworkFromDefinition(definition())
    await expect(
      generate(framework, 'rsbuild', ['nitro', 'vercel']),
    ).rejects.toThrow('Only one deployment adapter')
    await expect(
      generate(framework, 'rsbuild', ['nitro'], true),
    ).rejects.toThrow('require TanStack Start')
  })

  it('adds a deployment to an existing Rsbuild app and rejects a second adapter', async () => {
    __testClearFrameworks()
    registerFramework(definition())
    const files = await generate(
      frameworkFromDefinition(definition()),
      'rsbuild',
      [],
    )
    const { environment } = createMemoryEnvironment('/')
    environment.startRun()
    for (const [path, content] of Object.entries(files)) {
      await environment.writeFile(`/${path}`, content)
    }

    await addToApp(environment, ['nitro'], '/', { forced: true })
    expect(await environment.readFile('/rsbuild.config.ts')).toContain(
      "nitro({ preset: 'node-server' })",
    )
    expect(
      JSON.parse(await environment.readFile('/package.json')).scripts.start,
    ).toBe('node .output/server/index.mjs')
    await expect(
      addToApp(environment, ['vercel'], '/', { forced: true }),
    ).rejects.toThrow('mutually exclusive')
    expect(
      JSON.parse(await environment.readFile('/.cta.json')).chosenAddOns,
    ).toEqual(['nitro'])
  })
})

it('keeps Vite-only deployment adapters out of the Rsbuild catalog', () => {
  expect(
    isAddOnSupportedByBundler(
      { type: 'deployment', integrations: [{ type: 'vite-plugin' }] },
      'rsbuild',
    ),
  ).toBe(false)
})
