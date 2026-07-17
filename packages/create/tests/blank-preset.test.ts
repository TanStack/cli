import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  finalizeAddOns,
  populateAddOnOptionsDefaults,
} from '../src/add-ons.js'
import { createApp } from '../src/create-app.js'
import { createMemoryEnvironment } from '../src/environment.js'
import { createPackageJSON as createEdgePackageJSON } from '../src/edge-package-json.js'
import { createFrameworkDefinition as createReactFrameworkDefinition } from '../src/frameworks/react/index.js'
import { createFrameworkDefinition as createSolidFrameworkDefinition } from '../src/frameworks/solid/index.js'
import { createPackageJSON as createNodePackageJSON } from '../src/package-json.js'

import type { Framework, FrameworkDefinition, Options } from '../src/types.js'

const BLANK_FILE_ALLOWLIST = [
  '.cta.json',
  '.gitignore',
  '.vscode/settings.json',
  'README.md',
  'package.json',
  'src/router.tsx',
  'src/routes/__root.tsx',
  'src/routes/index.tsx',
  'src/styles.css',
  'tsconfig.json',
  'tsr.config.json',
  'vite.config.ts',
]

const BLANK_DEPENDENCY_ALLOWLIST = [
  '@tanstack/react-router',
  '@tanstack/react-start',
  'react',
  'react-dom',
]

const BLANK_DEV_DEPENDENCY_ALLOWLIST = [
  '@tanstack/router-cli',
  '@types/node',
  '@types/react',
  '@types/react-dom',
  '@vitejs/plugin-react',
  'typescript',
  'vite',
]

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

function createBlankOptions(framework: Framework): Options {
  return {
    projectName: 'blank-app',
    targetDir: '/blank-app',
    framework,
    mode: 'file-router',
    typescript: true,
    tailwind: false,
    packageManager: 'npm',
    git: false,
    install: false,
    intent: false,
    chosenAddOns: [],
    addOnOptions: {},
    projectPreset: 'blank',
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('blank project preset', () => {
  it('renders only the blank file allowlist', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ version: '1.0.0' }), { status: 200 }),
      ),
    )

    const framework = frameworkFromDefinition(createReactFrameworkDefinition())
    const options = createBlankOptions(framework)
    const { environment, output } = createMemoryEnvironment()

    await createApp(environment, options)

    const files = Object.fromEntries(
      Object.entries(output.files).map(([path, contents]) => [
        path.slice(`${options.targetDir}/`.length),
        contents,
      ]),
    )

    expect(Object.keys(files).sort()).toEqual(BLANK_FILE_ALLOWLIST)

    const config = JSON.parse(files['.cta.json'])
    expect(config.projectPreset).toBe('blank')
    expect(config.tailwind).toBe(false)

    expect(files['src/routes/__root.tsx']).not.toMatch(
      /TanStack(?:Router)?Devtools/,
    )
    expect(files['src/router.tsx']).not.toContain(
      'setupRouterSsrQueryIntegration',
    )
    expect(files['src/styles.css']).not.toContain('tailwindcss')
    expect(files['vite.config.ts']).not.toMatch(/devtools|tailwindcss/)
    expect(files['README.md']).not.toMatch(/Tailwind CSS|Vitest/)
  })

  it('uses only blank dependencies and keeps Node and edge composition equal', () => {
    const framework = frameworkFromDefinition(createReactFrameworkDefinition())
    const options = createBlankOptions(framework)

    const nodePackageJSON = createNodePackageJSON(options)
    const edgePackageJSON = createEdgePackageJSON(options)

    expect(edgePackageJSON).toEqual(nodePackageJSON)
    expect(Object.keys(nodePackageJSON.scripts).sort()).toEqual([
      'build',
      'dev',
      'generate-routes',
      'preview',
    ])
    expect(Object.keys(nodePackageJSON.dependencies).sort()).toEqual(
      BLANK_DEPENDENCY_ALLOWLIST,
    )
    expect(Object.keys(nodePackageJSON.devDependencies).sort()).toEqual(
      BLANK_DEV_DEPENDENCY_ALLOWLIST,
    )
  })

  it('keeps the Solid blank preset equally lean', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ version: '1.0.0' }), { status: 200 }),
      ),
    )

    const framework = frameworkFromDefinition(createSolidFrameworkDefinition())
    const options = createBlankOptions(framework)
    const { environment, output } = createMemoryEnvironment()

    await createApp(environment, options)

    const files = Object.keys(output.files)
      .map((path) => path.slice(`${options.targetDir}/`.length))
      .sort()
    const packageJSON = createNodePackageJSON(options)

    expect(files).toEqual(BLANK_FILE_ALLOWLIST)
    expect(Object.keys(packageJSON.dependencies).sort()).toEqual([
      '@tanstack/solid-router',
      '@tanstack/solid-start',
      'solid-js',
    ])
    expect(Object.keys(packageJSON.devDependencies).sort()).toEqual([
      '@tanstack/router-cli',
      'typescript',
      'vite',
      'vite-plugin-solid',
    ])
  })

  it('lets an explicit styling add-on opt back into Tailwind', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ version: '1.0.0' }), { status: 200 }),
      ),
    )

    const framework = frameworkFromDefinition(createReactFrameworkDefinition())
    const chosenAddOns = await finalizeAddOns(framework, 'file-router', [
      'shadcn',
    ])
    const options = {
      ...createBlankOptions(framework),
      tailwind: chosenAddOns.some((addOn) => addOn.tailwind === true),
      chosenAddOns,
      addOnOptions: populateAddOnOptionsDefaults(chosenAddOns),
    }
    const { environment, output } = createMemoryEnvironment()

    await createApp(environment, options)

    const packageJSON = createNodePackageJSON(options)
    expect(options.tailwind).toBe(true)
    expect(packageJSON.dependencies).toMatchObject({
      '@tailwindcss/vite': '^4.1.18',
      tailwindcss: '^4.1.18',
    })
    expect(packageJSON.devDependencies).toMatchObject({
      '@tailwindcss/typography': '^0.5.16',
    })
    expect(output.files['/blank-app/src/styles.css']).toContain(
      "@plugin '@tailwindcss/typography'",
    )
    expect(output.files['/blank-app/vite.config.ts']).toContain('tailwindcss()')
  })

  it('keeps Shopify storefront styling in the blank preset', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ version: '1.0.0' }), { status: 200 }),
      ),
    )

    const framework = frameworkFromDefinition(createReactFrameworkDefinition())
    const chosenAddOns = await finalizeAddOns(framework, 'file-router', [
      'shopify',
    ])
    const options = {
      ...createBlankOptions(framework),
      tailwind: chosenAddOns.some((addOn) => addOn.tailwind === true),
      chosenAddOns,
      addOnOptions: populateAddOnOptionsDefaults(chosenAddOns),
    }
    const { environment, output } = createMemoryEnvironment()

    await createApp(environment, options)

    const packageJSON = createNodePackageJSON(options)
    expect(options.tailwind).toBe(true)
    expect(packageJSON.dependencies).toMatchObject({
      '@tailwindcss/vite': '^4.1.18',
      tailwindcss: '^4.1.18',
    })
    expect(output.files['/blank-app/src/styles.css']).toContain(
      '@import "tailwindcss"',
    )
    expect(output.files['/blank-app/vite.config.ts']).toContain('tailwindcss()')
    expect(output.files['/blank-app/src/routes/shop.index.tsx']).toContain(
      'tracking-tight',
    )
  })

  it('does not keep Tailwind for a stripped add-on demo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ version: '1.0.0' }), { status: 200 }),
      ),
    )

    const framework = frameworkFromDefinition(createReactFrameworkDefinition())
    const chosenAddOns = await finalizeAddOns(framework, 'file-router', [
      'posthog',
    ])
    const options = {
      ...createBlankOptions(framework),
      tailwind: chosenAddOns.some((addOn) => addOn.tailwind === true),
      chosenAddOns,
    }
    const { environment, output } = createMemoryEnvironment()

    await createApp(environment, options)

    const packageJSON = createNodePackageJSON(options)
    expect(options.tailwind).toBe(false)
    expect(packageJSON.dependencies).not.toHaveProperty('@tailwindcss/vite')
    expect(packageJSON.dependencies).not.toHaveProperty('tailwindcss')
    expect(output.files['/blank-app/src/styles.css']).not.toContain(
      'tailwindcss',
    )
    expect(output.files).not.toHaveProperty(
      '/blank-app/src/routes/demo/posthog.tsx',
    )
  })
})
