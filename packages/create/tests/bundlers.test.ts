import { afterEach, describe, expect, it, vi } from 'vitest'

import { finalizeAddOns, getAllAddOns } from '../src/add-ons.js'
import { getBundlers, resolveBundler } from '../src/build-tools.js'
import { createApp } from '../src/create-app.js'
import { createMemoryEnvironment } from '../src/environment.js'
import { createFrameworkDefinition as createReactFrameworkDefinition } from '../src/frameworks/react/index.js'
import { createFrameworkDefinition as createSolidFrameworkDefinition } from '../src/frameworks/solid/index.js'

import type {
  Framework,
  FrameworkDefinition,
  Options,
  Starter,
} from '../src/types.js'

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

function createOptions(
  framework: Framework,
  bundler: string,
  routerOnly: boolean,
  blank: boolean,
): Options {
  return {
    projectName: 'bundler-app',
    targetDir: '/bundler-app',
    framework,
    mode: 'file-router',
    bundler,
    typescript: true,
    tailwind: !blank,
    packageManager: 'npm',
    git: false,
    install: false,
    intent: false,
    chosenAddOns: [],
    addOnOptions: {},
    projectPreset: blank ? 'blank' : 'default',
    routerOnly,
    includeExamples: !blank,
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('bundler project generation', () => {
  it.each([
    ['react', createReactFrameworkDefinition],
    ['solid', createSolidFrameworkDefinition],
  ])(
    '%s exposes Vite as the default and Rsbuild as a supported bundler',
    (_, createDefinition) => {
      const framework = frameworkFromDefinition(createDefinition())

      expect(getBundlers(framework).map((bundler) => bundler.id)).toEqual([
        'vite',
        'rsbuild',
      ])
      expect(resolveBundler(framework).id).toBe('vite')
    },
  )

  it('treats custom frameworks without bundler metadata as Vite-only', () => {
    const framework = {
      id: 'custom',
      name: 'Custom',
    } as Framework

    expect(getBundlers(framework).map((bundler) => bundler.id)).toEqual([
      'vite',
    ])
    expect(() => resolveBundler(framework, 'rsbuild')).toThrow(
      'Build tool "rsbuild" is not supported by Custom',
    )
  })

  it('aligns the Solid Biome schema with the pinned package version', async () => {
    const definition = createSolidFrameworkDefinition()
    const biome = definition.addOns.find((addOn) => addOn.id === 'biome')!
    const version = biome.packageAdditions!.devDependencies?.['@biomejs/biome']

    expect(version).toBe('2.4.5')
    await expect(biome.getFileContents('biome.json.ejs')).resolves.toContain(
      `/schemas/${version}/schema.json`,
    )
  })

  it.each([
    ['react', createReactFrameworkDefinition, 'shadcn'],
    ['solid', createSolidFrameworkDefinition, 'solid-ui'],
  ])(
    '%s filters the Rsbuild catalog to toolchains',
    async (_, createDefinition, incompatibleAddOn) => {
      const framework = frameworkFromDefinition(createDefinition())
      const addOns = getAllAddOns(framework, 'file-router', 'rsbuild')

      expect(addOns.length).toBeGreaterThan(0)
      expect(addOns.every((addOn) => addOn.type === 'toolchain')).toBe(true)
      await expect(
        finalizeAddOns(framework, 'file-router', ['eslint'], 'rsbuild'),
      ).resolves.toEqual(
        expect.arrayContaining([expect.objectContaining({ id: 'eslint' })]),
      )
      await expect(
        finalizeAddOns(
          framework,
          'file-router',
          [incompatibleAddOn],
          'rsbuild',
        ),
      ).rejects.toThrow('Rsbuild currently supports toolchain add-ons only')
    },
  )

  it.each([
    ['react', createReactFrameworkDefinition],
    ['solid', createSolidFrameworkDefinition],
  ])(
    '%s rejects Rsbuild templates before starting a run',
    async (_, createDefinition) => {
      const framework = frameworkFromDefinition(createDefinition())
      const options = {
        ...createOptions(framework, 'rsbuild', false, false),
        starter: { id: 'starter' } as Starter,
      }
      const { environment, output } = createMemoryEnvironment()

      await expect(createApp(environment, options)).rejects.toThrow(
        'Rsbuild does not currently support templates',
      )
      expect(output.files).toEqual({})
    },
  )

  it.each(
    [
      ['react', createReactFrameworkDefinition],
      ['solid', createSolidFrameworkDefinition],
    ].flatMap(([frameworkId, createDefinition]) =>
      ['vite', 'rsbuild'].flatMap((bundler) =>
        [false, true].flatMap((routerOnly) =>
          [false, true].map((blank) => [
            frameworkId,
            createDefinition,
            bundler,
            routerOnly,
            blank,
          ]),
        ),
      ),
    ),
  )(
    '%s generates %s config (routerOnly=%s, blank=%s)',
    async (frameworkId, createDefinition, bundler, routerOnly, blank) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(
          async () =>
            new Response(JSON.stringify({ version: '1.0.0' }), {
              status: 200,
            }),
        ),
      )

      const framework = frameworkFromDefinition(
        (createDefinition as () => FrameworkDefinition)(),
      )
      const options = createOptions(
        framework,
        bundler as string,
        routerOnly as boolean,
        blank as boolean,
      )
      const { environment, output } = createMemoryEnvironment()

      await createApp(environment, options)

      const files = Object.fromEntries(
        Object.entries(output.files).map(([path, contents]) => [
          path.slice(`${options.targetDir}/`.length),
          contents,
        ]),
      )
      const packageJSON = JSON.parse(files['package.json'])
      const config = JSON.parse(files['.cta.json'])
      const configFile = `${bundler}.config.ts`
      const otherConfig = `${bundler === 'vite' ? 'rsbuild' : 'vite'}.config.ts`

      expect(files).toHaveProperty(configFile)
      expect(files).not.toHaveProperty(otherConfig)
      expect(config.bundler).toBe(bundler)
      expect(packageJSON.scripts.dev).toBe(`${bundler} dev --port 3000`)
      expect(packageJSON.scripts.build).toBe(`${bundler} build`)
      expect(packageJSON.scripts.preview).toBe(`${bundler} preview`)
      expect(packageJSON.scripts['generate-routes']).toBe(
        bundler === 'vite' ? 'tsr generate' : 'rsbuild build',
      )

      if (bundler === 'vite') {
        expect(packageJSON.devDependencies).toHaveProperty('vite')
        expect(packageJSON.devDependencies).not.toHaveProperty('@rsbuild/core')
        expect(files['tsconfig.json']).toContain('vite/client')
      } else {
        expect(packageJSON.devDependencies).toHaveProperty('@rsbuild/core')
        expect(packageJSON.devDependencies).not.toHaveProperty('vite')
        expect(packageJSON.devDependencies).not.toHaveProperty(
          '@tanstack/devtools-vite',
        )
        expect(files['tsconfig.json']).toContain('@rsbuild/core/types')
        expect(files).not.toHaveProperty('index.html')
      }

      if (blank) {
        expect(packageJSON.dependencies).not.toHaveProperty('tailwindcss')
        expect(packageJSON.devDependencies).not.toHaveProperty(
          bundler === 'vite'
            ? '@tailwindcss/vite'
            : '@rsbuild/plugin-tailwindcss',
        )
      } else {
        expect(packageJSON.dependencies).toHaveProperty('tailwindcss')
        const tailwindPackage =
          bundler === 'vite'
            ? packageJSON.dependencies['@tailwindcss/vite']
            : packageJSON.devDependencies['@rsbuild/plugin-tailwindcss']
        expect(tailwindPackage).toBeTruthy()
      }

      const startPackage =
        frameworkId === 'react'
          ? '@tanstack/react-start'
          : '@tanstack/solid-start'
      if (routerOnly) {
        expect(packageJSON.dependencies).not.toHaveProperty(startPackage)
        expect(packageJSON.devDependencies).toHaveProperty(
          '@tanstack/router-plugin',
        )
        expect(packageJSON.scripts).not.toHaveProperty('start')
        expect(packageJSON.dependencies).not.toHaveProperty('srvx')
        expect(files[configFile]).toContain('@tanstack/router-plugin')
      } else {
        expect(packageJSON.dependencies).toHaveProperty(startPackage)
        if (bundler === 'rsbuild') {
          expect(packageJSON.scripts.start).toContain('srvx')
          expect(packageJSON.dependencies).toHaveProperty('srvx')
          expect(files[configFile]).toContain(`${startPackage}/plugin/rsbuild`)
        }
      }
    },
  )
})
