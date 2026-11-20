import { afterEach, describe, expect, it, vi } from 'vitest'
import { finalizeAddOns, populateAddOnOptionsDefaults } from '../src/add-ons.js'
import { createApp } from '../src/create-app.js'
import { createMemoryEnvironment } from '../src/environment.js'
import { createFrameworkDefinition as react } from '../src/frameworks/react/index.js'
import { createFrameworkDefinition as solid } from '../src/frameworks/solid/index.js'
import type { Framework, Options } from '../src/types.js'

afterEach(() => vi.unstubAllGlobals())

describe.each([['react', react], ['solid', solid]] as const)('Biome presets for %s', (id, define) => {
  it.each(['recommended', 'ultracite', undefined])('renders the %s preset without changing the default package set', async (preset) => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ version: '1.0.0' }))))
    const { addOns, base, ...definition } = define()
    const framework = {
      ...definition,
      getFiles: async () => Object.keys(base),
      getFileContents: async (path: string) => base[path],
      getDeletedFiles: async () => [],
      getAddOns: () => addOns,
    } as Framework
    const selected = await finalizeAddOns(framework, 'file-router', ['biome'])
    const { environment, output } = createMemoryEnvironment()
    await createApp(environment, {
      projectName: 'preset-app', targetDir: '/preset-app', framework, mode: 'file-router',
      bundler: 'vite', typescript: true, tailwind: true, packageManager: 'npm',
      git: false, install: false, intent: false, chosenAddOns: selected,
      ...(preset === undefined ? {} : { addOnOptions: { ...populateAddOnOptionsDefaults(selected), biome: { preset } } }),
    } as Options)
    const pkg = JSON.parse(output.files['/preset-app/package.json'])
    const config = JSON.parse(output.files['/preset-app/biome.json'])
    expect(pkg.devDependencies['@biomejs/biome']).toBe(preset === 'ultracite' ? '2.6.7' : '2.4.5')
    expect(config.$schema).toContain(`/schemas/${pkg.devDependencies['@biomejs/biome']}/schema.json`)
    if (preset === 'ultracite') {
      expect(pkg.devDependencies.ultracite).toBe('8.3.1')
      expect(config.extends).toEqual(['ultracite/biome/core', `ultracite/biome/${id}`])
      expect(config.overrides[0].linter.rules.style.useFilenamingConvention.level).toBe('error')
    } else {
      expect(pkg.devDependencies.ultracite).toBeUndefined()
      expect(config.extends).toBeUndefined()
      expect(config.overrides).toBeUndefined()
    }
  })
})
