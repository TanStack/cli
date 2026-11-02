import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  finalizeAddOns,
  getAllAddOns,
  populateAddOnOptionsDefaults,
} from '../src/add-ons.js'
import { createApp } from '../src/create-app.js'
import { createMemoryEnvironment } from '../src/environment.js'
import { createFrameworkDefinition as createReactFrameworkDefinition } from '../src/frameworks/react/index.js'
import { createFrameworkDefinition as createSolidFrameworkDefinition } from '../src/frameworks/solid/index.js'

import type { PackageManager } from '../src/package-manager.js'
import type { Framework, FrameworkDefinition, Options } from '../src/types.js'

function frameworkFromDefinition(definition: FrameworkDefinition): Framework {
  const { addOns, base, ...framework } = definition

  return {
    ...framework,
    getFiles: () => Promise.resolve(Object.keys(base)),
    getFileContents: (path: string) => Promise.resolve(base[path]),
    getDeletedFiles: () => Promise.resolve([]),
    getAddOns: () => addOns,
  }
}

async function generateApp(
  definition: FrameworkDefinition,
  addOnIds: Array<string>,
  addOnOptions: Options['addOnOptions'] = {},
  packageManager: PackageManager = 'pnpm',
) {
  const framework = frameworkFromDefinition(definition)
  const chosenAddOns = await finalizeAddOns(framework, 'file-router', addOnIds)
  const defaultAddOnOptions = populateAddOnOptionsDefaults(chosenAddOns)
  const targetDir = '/partner-app'
  const { environment, output } = createMemoryEnvironment(targetDir)

  await createApp(environment, {
    projectName: 'partner-app',
    targetDir,
    framework,
    mode: 'file-router',
    typescript: true,
    tailwind: true,
    packageManager,
    git: false,
    install: false,
    intent: false,
    chosenAddOns,
    addOnOptions: {
      ...defaultAddOnOptions,
      ...addOnOptions,
    },
    includeExamples: true,
  } satisfies Options)

  return output
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(JSON.stringify({ version: '1.0.0' }), { status: 200 }),
    ),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('partner add-on scaffolds', () => {
  it('generates Clerk with its full-stack SDK and ordered middleware', async () => {
    const output = await generateApp(createReactFrameworkDefinition(), [
      'clerk',
    ])
    const packageJSON = JSON.parse(output.files['package.json'])
    const envLocal = output.files['.env.local']
    const envExample = output.files['.env.example']
    const start = output.files['src/start.ts']
    const header = output.files['src/integrations/clerk/header-user.tsx']
    const demo = output.files['src/routes/demo/clerk.tsx']

    expect(packageJSON.dependencies).toHaveProperty(
      '@clerk/tanstack-react-start',
    )
    expect(packageJSON.dependencies).not.toHaveProperty('@clerk/clerk-react')
    expect(envLocal).toContain('VITE_CLERK_PUBLISHABLE_KEY=')
    expect(envLocal).toContain('CLERK_SECRET_KEY=')
    expect(envExample).toContain('VITE_CLERK_PUBLISHABLE_KEY=')
    expect(envExample).toContain('CLERK_SECRET_KEY=')
    expect(start).toContain(
      "import { clerkMiddleware } from '@clerk/tanstack-react-start/server'",
    )
    expect(start).toContain('clerkMiddleware()')
    expect(start.indexOf('csrfMiddleware,')).toBeLessThan(
      start.lastIndexOf('clerkMiddleware'),
    )
    expect(output.files['src/integrations/clerk/provider.tsx']).toContain(
      "from '@clerk/tanstack-react-start'",
    )
    expect(header).toContain('<Show when="signed-in">')
    expect(header).toContain('<Show when="signed-out">')
    expect(header).not.toContain('<SignedIn>')
    expect(header).not.toContain('<SignedOut>')
    expect(demo).toContain("from '@clerk/tanstack-react-start'")
    expect(demo).toContain('<Show when="signed-in">')
    expect(demo).toContain('<Show when="signed-out">')
    expect(demo).not.toContain('<SignedIn>')
    expect(demo).not.toContain('<SignedOut>')
  })

  it('generates WorkOS with server auth, callback routes, and ordered middleware', async () => {
    const output = await generateApp(createReactFrameworkDefinition(), [
      'workos',
    ])
    const packageJSON = JSON.parse(output.files['package.json'])
    const envLocal = output.files['.env.local']
    const envExample = output.files['.env.example']
    const start = output.files['src/start.ts']

    expect(packageJSON.engines).toEqual({ node: '>=22.11.0' })
    expect(packageJSON.dependencies).toHaveProperty(
      '@workos/authkit-tanstack-react-start',
    )
    expect(packageJSON.dependencies).toHaveProperty('@workos-inc/node')
    expect(packageJSON.dependencies).not.toHaveProperty(
      '@workos-inc/authkit-react',
    )
    expect(envLocal).toContain('WORKOS_CLIENT_ID=')
    expect(envLocal).toContain('WORKOS_API_KEY=')
    expect(envLocal).toContain(
      'WORKOS_REDIRECT_URI=http://localhost:3000/api/auth/callback',
    )
    expect(envLocal).toContain('WORKOS_COOKIE_PASSWORD=')
    expect(envExample).toContain('WORKOS_CLIENT_ID=')
    expect(envExample).toContain('WORKOS_API_KEY=')
    expect(envExample).toContain('WORKOS_REDIRECT_URI=')
    expect(envExample).toContain('WORKOS_COOKIE_PASSWORD=')
    expect(start).toContain(
      "import { authkitMiddleware } from '@workos/authkit-tanstack-react-start'",
    )
    expect(start).toContain('authkitMiddleware()')
    expect(start.indexOf('csrfMiddleware,')).toBeLessThan(
      start.lastIndexOf('authkitMiddleware'),
    )
    expect(output.files['src/routes/api/auth/callback.tsx']).toContain(
      'handleCallbackRoute()',
    )
    expect(output.files['src/routes/api/auth/sign-in.tsx']).toContain(
      'getSignInUrl(',
    )
    expect(output.files['src/integrations/workos/provider.tsx']).toContain(
      "from '@workos/authkit-tanstack-react-start/client'",
    )
  })

  it.each([
    ['React', createReactFrameworkDefinition],
    ['Solid', createSolidFrameworkDefinition],
  ])(
    'generates a Railpack-compatible %s deployment',
    async (_name, createFrameworkDefinition) => {
      const output = await generateApp(createFrameworkDefinition(), ['railway'])
      const packageJSON = JSON.parse(output.files['package.json'])
      const readme = output.files['README.md']

      expect(packageJSON.dependencies).toHaveProperty(
        'nitro',
        '3.0.260610-beta',
      )
      expect(packageJSON.dependencies).not.toHaveProperty('nitro-nightly')
      expect(Object.values(packageJSON.dependencies)).not.toContain(
        'npm:nitro-nightly@latest',
      )
      expect(packageJSON.scripts.start).toBe('node .output/server/index.mjs')
      expect(output.files['nixpacks.toml']).toBeUndefined()
      expect(output.deletedFiles).toContain('nixpacks.toml')
      expect(readme).toContain("Railway's Railpack builder")
      expect(readme).toContain('node .output/server/index.mjs')
      expect(readme).not.toContain('Nixpacks')
      expect(readme).not.toContain('dist/client')
    },
  )

  it.each([
    ['React', createReactFrameworkDefinition],
    ['Solid', createSolidFrameworkDefinition],
  ])(
    '%s partner deployment hosts only support file-router',
    (_name, createFrameworkDefinition) => {
      const definition = createFrameworkDefinition()
      const framework = frameworkFromDefinition(definition)
      const fileRouterIds = getAllAddOns(framework, 'file-router').map(
        (addOn) => addOn.id,
      )
      const codeRouterIds = getAllAddOns(framework, 'code-router').map(
        (addOn) => addOn.id,
      )

      for (const addOnId of ['render', 'vercel']) {
        expect(
          definition.addOns.find((addOn) => addOn.id === addOnId)?.modes,
        ).toEqual(['file-router'])
        expect(fileRouterIds).toContain(addOnId)
        expect(codeRouterIds).not.toContain(addOnId)
      }
    },
  )

  it('rejects Deno for Render', async () => {
    await expect(
      generateApp(
        createReactFrameworkDefinition(),
        ['render'],
        {},
        'deno',
      ),
    ).rejects.toThrow(
      'Render does not support the deno package manager. Choose npm, yarn, pnpm, bun.',
    )
  })

  it('rejects Deno for Vercel', async () => {
    await expect(
      generateApp(
        createReactFrameworkDefinition(),
        ['vercel'],
        {},
        'deno',
      ),
    ).rejects.toThrow(
      'Vercel does not support the deno package manager. Choose npm, yarn, pnpm, bun.',
    )
  })

  it.each([
    ['React', createReactFrameworkDefinition],
    ['Solid', createSolidFrameworkDefinition],
  ])(
    'generates a Render Blueprint for %s',
    async (_name, createFrameworkDefinition) => {
      const output = await generateApp(createFrameworkDefinition(), ['render'])
      const bunOutput = await generateApp(
        createFrameworkDefinition(),
        ['render'],
        {},
        'bun',
      )
      const packageJSON = JSON.parse(output.files['package.json'])
      const renderYaml = output.files['render.yaml']
      const bunRenderYaml = bunOutput.files['render.yaml']
      const readme = output.files['README.md']

      expect(packageJSON.dependencies).toHaveProperty(
        'nitro',
        '3.0.260610-beta',
      )
      expect(packageJSON.scripts.start).toBe('node .output/server/index.mjs')
      expect(renderYaml).toContain('name: tanstack-start-app')
      expect(renderYaml).toContain('buildCommand: pnpm install && pnpm build')
      expect(renderYaml).toContain('startCommand: pnpm start')
      expect(renderYaml).not.toContain('key: BUN_VERSION')
      expect(bunRenderYaml).toContain('key: BUN_VERSION')
      expect(bunRenderYaml).toContain("value: '1.3.14'")
      expect(renderYaml).toContain('value: render-com')
      expect(renderYaml).toContain('value: 0.0.0.0')
      expect(output.files['render.yaml.ejs']).toBeUndefined()
      expect(readme).toContain('New > Blueprint')
      expect(readme).not.toContain('Deploy to Render button')
      expect(readme).not.toContain('render.com/deploy')
    },
  )

  it.each([
    ['npm', 'npm install && npm run build', 'npm run start'],
    ['yarn', 'yarn install && yarn run build', 'yarn run start'],
    ['pnpm', 'pnpm install && pnpm build', 'pnpm start'],
    ['bun', 'bun install && bun --bun run build', 'bun --bun run start'],
  ] as const)(
    'uses %s commands in the Render Blueprint',
    async (packageManager, buildCommand, startCommand) => {
      const output = await generateApp(
        createReactFrameworkDefinition(),
        ['render'],
        {},
        packageManager,
      )
      const renderYaml = output.files['render.yaml']

      expect(renderYaml).toContain(`buildCommand: ${buildCommand}`)
      expect(renderYaml).toContain(`startCommand: ${startCommand}`)
      if (packageManager === 'bun') {
        expect(renderYaml).toContain('key: BUN_VERSION')
        expect(renderYaml).toContain("value: '1.3.14'")
      } else {
        expect(renderYaml).not.toContain('key: BUN_VERSION')
      }
    },
  )

  it.each([
    ['React', createReactFrameworkDefinition],
    ['Solid', createSolidFrameworkDefinition],
  ])(
    'generates a Vercel Build Output API deployment for %s',
    async (_name, createFrameworkDefinition) => {
      const definition = createFrameworkDefinition()
      const vercel = definition.addOns.find((addOn) => addOn.id === 'vercel')
      const output = await generateApp(definition, ['vercel'])
      const packageJSON = JSON.parse(output.files['package.json'])
      const vercelJSON = JSON.parse(output.files['vercel.json'])
      const viteConfig = output.files['vite.config.ts']
      const readme = output.files['README.md']

      expect(vercel?.partner).toEqual({ id: 'vercel', tier: 'gold' })
      expect(vercel?.supportedPackageManagers).toEqual([
        'npm',
        'yarn',
        'pnpm',
        'bun',
      ])
      expect(packageJSON.dependencies).toHaveProperty(
        'nitro',
        '3.0.260610-beta',
      )
      expect(vercelJSON).toEqual({
        $schema: 'https://openapi.vercel.sh/vercel.json',
        framework: 'tanstack-start',
      })
      expect(viteConfig).toContain("import { nitro } from 'nitro/vite'")
      expect(viteConfig).toContain('nitro()')
      expect(viteConfig).not.toContain('NITRO_PRESET')
      expect(output.files['src/server.ts']).toBeUndefined()
      expect(readme).toContain('Add New > Project')
      expect(readme).not.toContain('vercel.com/new/clone')
    },
  )

  it.each([
    ['React', createReactFrameworkDefinition],
    ['Solid', createSolidFrameworkDefinition],
  ])(
    'approves Netlify build dependencies for pnpm in %s projects',
    async (_name, createFrameworkDefinition) => {
      const output = await generateApp(createFrameworkDefinition(), ['netlify'])
      const packageJSON = JSON.parse(output.files['package.json'])
      const pnpmWorkspace = output.files['pnpm-workspace.yaml']

      expect(packageJSON.pnpm.onlyBuiltDependencies).toContain('sharp')
      expect(pnpmWorkspace).toContain('sharp: true')
      expect(pnpmWorkspace).not.toContain('workerd: true')
    },
  )

  it.each(['postgres', 'mysql', 'sqlite'])(
    'approves Prisma build dependencies for pnpm with %s',
    async (database) => {
      const output = await generateApp(
        createReactFrameworkDefinition(),
        ['prisma'],
        { prisma: { database } },
      )
      const packageJSON = JSON.parse(output.files['package.json'])
      const pnpmWorkspace = output.files['pnpm-workspace.yaml']

      expect(packageJSON.pnpm.onlyBuiltDependencies).toEqual(
        expect.arrayContaining(['@prisma/engines', 'prisma']),
      )
      expect(pnpmWorkspace).toContain("'@prisma/engines': true")
      expect(pnpmWorkspace).toContain('prisma: true')

      if (database === 'sqlite') {
        expect(packageJSON.pnpm.onlyBuiltDependencies).toContain(
          'better-sqlite3',
        )
        expect(pnpmWorkspace).toContain('better-sqlite3: true')
      } else {
        expect(packageJSON.pnpm.onlyBuiltDependencies).not.toContain(
          'better-sqlite3',
        )
        expect(pnpmWorkspace).not.toContain('better-sqlite3: true')
      }
    },
  )

  it('generates a URL-driven, env-aware Prisma MySQL setup', async () => {
    const output = await generateApp(
      createReactFrameworkDefinition(),
      ['prisma'],
      { prisma: { database: 'mysql' } },
    )
    const databaseUrl = output.files['src/database-url.ts']
    const db = output.files['src/db.ts']
    const seed = output.files['prisma/seed.ts']
    const demo = output.files['src/routes/demo/prisma.tsx']

    expect(databaseUrl).toContain('process.env.DATABASE_URL')
    expect(databaseUrl).toContain("throw new Error('DATABASE_URL is required')")
    expect(db).toContain('new PrismaMariaDb(getDatabaseUrl())')
    expect(seed).toContain('new PrismaMariaDb(getDatabaseUrl())')
    expect(db).not.toContain('host: "localhost"')
    expect(seed).not.toContain('host: "localhost"')
    expect(demo).toContain('.validator(')
    expect(demo).not.toContain('.inputValidator(')
    expect(demo).toContain('pnpm db:generate')
    expect(demo).toContain('pnpm db:push')
    expect(demo).toContain('pnpm db:studio')
    expect(demo).not.toContain('pnpm dlx prisma')
  })

  it.each([
    ['React', createReactFrameworkDefinition],
    ['Solid', createSolidFrameworkDefinition],
  ])(
    'approves Cloudflare build dependencies for pnpm in %s projects',
    async (_name, createFrameworkDefinition) => {
      const output = await generateApp(createFrameworkDefinition(), [
        'cloudflare',
      ])
      const packageJSON = JSON.parse(output.files['package.json'])
      const pnpmWorkspace = output.files['pnpm-workspace.yaml']

      expect(packageJSON.pnpm.onlyBuiltDependencies).toEqual(
        expect.arrayContaining(['sharp', 'workerd']),
      )
      expect(pnpmWorkspace).toContain('sharp: true')
      expect(pnpmWorkspace).toContain('workerd: true')
    },
  )

  it('generates Sentry with privacy-conscious sampling defaults', async () => {
    const output = await generateApp(createReactFrameworkDefinition(), [
      'sentry',
    ])
    const packageJSON = JSON.parse(output.files['package.json'])
    const instrumentation = output.files['instrument.server.mjs']

    expect(packageJSON.dependencies).toHaveProperty(
      '@sentry/tanstackstart-react',
      '^10.67.0',
    )
    expect(packageJSON.pnpm.onlyBuiltDependencies).toContain('@sentry/cli')
    expect(output.files['pnpm-workspace.yaml']).toContain("'@sentry/cli': true")
    expect(instrumentation).toContain('userInfo: false')
    expect(instrumentation).toContain('httpBodies: []')
    expect(instrumentation).toContain('tracesSampleRate: 0.1')
    expect(instrumentation).not.toContain('sendDefaultPii')
    expect(instrumentation).not.toContain('replaysSessionSampleRate')
    expect(instrumentation).not.toContain('replaysOnErrorSampleRate')
  })

  it.each([[['clerk', 'sentry', 'railway']], [['railway', 'sentry', 'clerk']]])(
    'composes Clerk, Sentry, and Railway independent of selection order: %j',
    async (addOnIds) => {
      const output = await generateApp(
        createReactFrameworkDefinition(),
        addOnIds,
      )
      const packageJSON = JSON.parse(output.files['package.json'])

      expect(output.files['src/start.ts']).toContain('clerkMiddleware()')
      expect(packageJSON.dependencies).toHaveProperty('nitro')
      expect(packageJSON.dependencies).not.toHaveProperty('nitro-nightly')
      expect(packageJSON.scripts.start).toContain(
        '--import ./.output/server/instrument.server.mjs',
      )
      expect(packageJSON.scripts.start).toContain('.output/server/index.mjs')
      expect(output.files['instrument.server.mjs']).toBeDefined()
      expect(output.files['nixpacks.toml']).toBeUndefined()
    },
  )

  it('starts Render through the Sentry-aware package script', async () => {
    const output = await generateApp(createReactFrameworkDefinition(), [
      'sentry',
      'render',
    ])
    const packageJSON = JSON.parse(output.files['package.json'])

    expect(packageJSON.scripts.start).toContain(
      '--import ./.output/server/instrument.server.mjs',
    )
    expect(output.files['render.yaml']).toContain('startCommand: pnpm start')
  })

  it.each([[['sentry', 'vercel']], [['vercel', 'sentry']]])(
    'composes Sentry with Vercel independent of selection order: %j',
    async (addOnIds) => {
      const output = await generateApp(
        createReactFrameworkDefinition(),
        addOnIds,
      )
      const packageJSON = JSON.parse(output.files['package.json'])
      const serverEntry = output.files['src/server.ts']
      const viteConfig = output.files['vite.config.ts']

      expect(packageJSON.scripts.build).toBe('vite build')
      expect(packageJSON.scripts.build).not.toContain('.output/server')
      expect(packageJSON.scripts.dev).toBe(
        'dotenv -e .env.local -- vite dev --port 3000',
      )
      expect(packageJSON.scripts.dev).not.toContain('NODE_OPTIONS')
      expect(packageJSON.scripts.start).toBe('node .output/server/index.mjs')
      expect(serverEntry).toContain("import '../instrument.server.mjs'")
      expect(serverEntry).toContain('wrapFetchWithSentry')
      expect(serverEntry).toContain('createServerEntry')
      expect(viteConfig).not.toContain('rollupConfig')
      expect(viteConfig).not.toContain('external:')
    },
  )
})
