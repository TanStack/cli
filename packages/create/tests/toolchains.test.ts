import { afterEach, describe, expect, it, vi } from 'vitest'

import { finalizeAddOns, getAllAddOns } from '../src/add-ons.js'
import { createApp } from '../src/create-app.js'
import { createMemoryEnvironment } from '../src/environment.js'
import { createFrameworkDefinition as createReactFrameworkDefinition } from '../src/frameworks/react/index.js'
import { createFrameworkDefinition as createSolidFrameworkDefinition } from '../src/frameworks/solid/index.js'

import type { Framework, FrameworkDefinition } from '../src/types.js'

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

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('toolchains', () => {
  it.each([
    ['react', createReactFrameworkDefinition],
    ['solid', createSolidFrameworkDefinition],
  ])('%s includes Oxlint as a toolchain', (_, createDefinition) => {
    const framework = frameworkFromDefinition(createDefinition())
    const toolchains = getAllAddOns(framework, 'file-router')
      .filter((addOn) => addOn.type === 'toolchain')
      .map((addOn) => addOn.id)

    expect(toolchains).toContain('oxlint')
  })

  it.each([
    ['react', createReactFrameworkDefinition, true],
    ['solid', createSolidFrameworkDefinition, false],
  ])(
    '%s generates an Oxlint lint setup',
    async (_, createDefinition, usesReactPlugin) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(
          async () =>
            new Response(JSON.stringify({ version: '1.0.0' }), {
              status: 200,
            }),
        ),
      )

      const framework = frameworkFromDefinition(createDefinition())
      const chosenAddOns = await finalizeAddOns(framework, 'file-router', [
        'oxlint',
      ])
      const { environment, output } = createMemoryEnvironment()

      await createApp(environment, {
        projectName: 'oxlint-app',
        targetDir: '/oxlint-app',
        framework,
        mode: 'file-router',
        typescript: true,
        tailwind: true,
        packageManager: 'pnpm',
        git: false,
        install: false,
        intent: false,
        chosenAddOns,
        addOnOptions: {},
      })

      const packageJSON = JSON.parse(output.files['/oxlint-app/package.json'])
      const oxlintConfig = JSON.parse(
        output.files['/oxlint-app/.oxlintrc.json'],
      )
      const readme = output.files['/oxlint-app/README.md']

      expect(packageJSON.scripts.lint).toBe('oxlint')
      expect(packageJSON.scripts).not.toHaveProperty('format')
      expect(packageJSON.scripts).not.toHaveProperty('check')
      expect(packageJSON.devDependencies).toHaveProperty('oxlint')
      expect(packageJSON.devDependencies).not.toHaveProperty('@biomejs/biome')
      expect(packageJSON.devDependencies).not.toHaveProperty('eslint')
      expect(packageJSON.devDependencies).not.toHaveProperty('prettier')

      expect(oxlintConfig.ignorePatterns).toContain('src/routeTree.gen.ts')
      expect(oxlintConfig.plugins.includes('react')).toBe(usesReactPlugin)
      expect(oxlintConfig.rules['react/rules-of-hooks']).toBe(
        usesReactPlugin ? 'error' : undefined,
      )

      expect(readme).toContain('## Linting\n')
      expect(readme).toContain('[Oxlint]')
      expect(readme).not.toContain('## Linting & Formatting')
    },
  )
})
