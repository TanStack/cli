import { describe, expect, it, vi } from 'vitest'
import { createApp as createNodeApp } from '../src/create-app.js'
import { createApp as createEdgeApp } from '../src/edge-create-app.js'
import { createMemoryEnvironment } from '../src/edge-environment.js'
import type { AddOn, Framework, Options } from '../src/types.js'

const commandAddOn: AddOn = {
  id: 'command-approval',
  name: 'Command approval',
  description: 'Version-aware command fixture',
  type: 'add-on',
  phase: 'add-on',
  modes: ['file-router'],
  command: {
    command: 'npx',
    args: ['storybook', 'init'],
    allowBuilds: ['esbuild'],
  },
  getFiles: async () => [],
  getFileContents: async () => '',
  getDeletedFiles: async () => [],
}

const framework: Framework = {
  id: 'version-fixture',
  name: 'Version fixture',
  description: 'Version fixture',
  version: '1.0.0',
  basePackageJSON: {},
  optionalPackages: {},
  supportedModes: {
    'file-router': {
      displayName: 'File router',
      description: '',
      forceTypescript: true,
    },
  },
  getFiles: async () => [],
  getFileContents: async () => '',
  getDeletedFiles: async () => [],
  getAddOns: () => [commandAddOn],
}

const options: Options = {
  projectName: 'version-fixture',
  targetDir: '/app',
  framework,
  mode: 'file-router',
  typescript: true,
  tailwind: false,
  packageManager: 'pnpm',
  git: false,
  install: false,
  intent: false,
  chosenAddOns: [commandAddOn],
  addOnOptions: {},
}

for (const [runtime, createApp] of Object.entries({
  Node: createNodeApp,
  edge: createEdgeApp,
})) {
  describe(`${runtime} pnpm command planning`, () => {
    it.each(['9.15.5', '10.1.0', '10.2.0', '11.22.0'])(
      'uses the selected pnpm %s version without recording a probe command',
      async (version) => {
        const { environment, output } = createMemoryEnvironment('/app')
        const lookup = vi.fn(async () => version)
        environment.getPackageManagerVersion = lookup
        await createApp(environment, options)
        expect(lookup).toHaveBeenCalledExactlyOnceWith('pnpm', '/app')
        expect(output.commands).toEqual([
          {
            command: 'pnpm',
            args: [
              ...(['10.2.0', '11.22.0'].includes(version)
                ? ['--allow-build=esbuild']
                : []),
              'dlx',
              'storybook',
              'init',
            ],
          },
        ])
      },
    )

    it.each(['10.1.0', '10.2.0'])(
      'applies the same approval boundary to starter commands on pnpm %s',
      async (version) => {
        const { environment, output } = createMemoryEnvironment('/app')
        const lookup = vi.fn(async () => version)
        environment.getPackageManagerVersion = lookup
        await createApp(environment, {
          ...options,
          chosenAddOns: [],
          starter: {
            ...commandAddOn,
            type: 'starter',
            framework: framework.id,
            mode: 'file-router',
            typescript: true,
            files: {},
            deletedFiles: [],
          },
        })
        expect(lookup).toHaveBeenCalledExactlyOnceWith('pnpm', '/app')
        expect(output.commands).toEqual([
          {
            command: 'pnpm',
            args: [
              ...(version === '10.2.0' ? ['--allow-build=esbuild'] : []),
              'dlx',
              'storybook',
              'init',
            ],
          },
        ])
      },
    )

    it.each(['not-a-version', '10.2.0-', '10.2.0+build warning', '10.2.0-alpha.01', '01.2.0', '10.2.0+', 'rejected'])(
      'keeps plain dlx when optional version detection is %s',
      async (result) => {
        const { environment, output } = createMemoryEnvironment('/app')
        environment.getPackageManagerVersion = async () => {
          if (result === 'rejected') throw new Error('Version probe unavailable')
          return result
        }
        await createApp(environment, options)
        expect(output.commands).toEqual([{
          command: 'pnpm', args: ['dlx', 'storybook', 'init'],
        }])
      },
    )

    it.each(['10.2.0-rc.1', '10.2.0+build.01', '11.22.0-rc.1+git.sha'])(
      'keeps approvals for the valid detected version %s',
      async (version) => {
        const { environment, output } = createMemoryEnvironment('/app')
        environment.getPackageManagerVersion = async () => version
        await createApp(environment, options)
        expect(output.commands[0].args).toEqual([
          '--allow-build=esbuild', 'dlx', 'storybook', 'init',
        ])
      },
    )

    it('uses explicit target versions in memory plans without probing the host', async () => {
      const { environment, output } = createMemoryEnvironment('/app')
      const lookup = vi.fn(async () => '11.22.0')
      environment.getPackageManagerVersion = lookup
      await createApp(environment, options, { packageManagerVersion: '10.1.0' })
      expect(lookup).not.toHaveBeenCalled()
      expect(output.commands[0].args).toEqual(['dlx', 'storybook', 'init'])
    })

    it('does not probe pnpm for projects without command build approvals', async () => {
      const { environment } = createMemoryEnvironment('/app')
      const lookup = vi.fn(async () => '11.22.0')
      environment.getPackageManagerVersion = lookup
      await createApp(environment, { ...options, chosenAddOns: [] })
      expect(lookup).not.toHaveBeenCalled()
    })
  })
}
