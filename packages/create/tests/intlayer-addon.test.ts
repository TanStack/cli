import { afterEach, describe, expect, it, vi } from 'vitest'

import { finalizeAddOns, populateAddOnOptionsDefaults } from '../src/add-ons.js'
import { createApp } from '../src/create-app.js'
import { createMemoryEnvironment } from '../src/environment.js'
import { createFrameworkDefinition as createReactFrameworkDefinition } from '../src/frameworks/react/index.js'
import { createFrameworkDefinition as createSolidFrameworkDefinition } from '../src/frameworks/solid/index.js'

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

const frameworks = {
  react: {
    createDefinition: createReactFrameworkDefinition,
    ui: 'react-intlayer',
  },
  solid: {
    createDefinition: createSolidFrameworkDefinition,
    ui: 'solid-intlayer',
  },
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Intlayer add-on', () => {
  it.each([
    ['react', true],
    ['react', false],
    ['solid', true],
    ['solid', false],
  ] as const)(
    '%s: adds the Vite plugin and localized routes (examples: %s)',
    async (frameworkId, includeExamples) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(
          async () =>
            new Response(JSON.stringify({ version: '1.0.0' }), { status: 200 }),
        ),
      )

      const framework = frameworkFromDefinition(
        frameworks[frameworkId].createDefinition(),
      )
      const chosenAddOns = await finalizeAddOns(framework, 'file-router', [
        'intlayer',
      ])
      const { environment, output } = createMemoryEnvironment()

      await createApp(environment, {
        projectName: 'intlayer-app',
        targetDir: '/intlayer-app',
        framework,
        mode: 'file-router',
        typescript: true,
        tailwind: true,
        packageManager: 'pnpm',
        git: false,
        install: false,
        intent: false,
        includeExamples,
        chosenAddOns,
        addOnOptions: populateAddOnOptionsDefaults(chosenAddOns),
      } as Options)

      const files = output.files
      const viteConfig = files['/intlayer-app/vite.config.ts']
      expect(viteConfig).toContain("import { intlayer } from 'vite-intlayer'")
      expect(viteConfig).toContain('intlayer()')

      const localeDir = '/intlayer-app/src/routes/{-$locale}'
      expect(files[`${localeDir}/route.tsx`]).toContain('<IntlayerProvider')
      // The demo page is an example: it is left out when examples are off.
      const demo = files[`${localeDir}/demo.intlayer.tsx`]
      if (includeExamples) {
        expect(demo).toContain("createFileRoute('/{-$locale}/demo/intlayer')")
      } else {
        expect(demo).toBeUndefined()
      }
      expect(files['/intlayer-app/.gitignore']).toContain('.intlayer')

      const packageJSON = JSON.parse(files['/intlayer-app/package.json'])
      expect(packageJSON.dependencies).toHaveProperty(
        frameworks[frameworkId].ui,
      )
      expect(packageJSON.devDependencies).toHaveProperty('vite-intlayer')
    },
  )
})
