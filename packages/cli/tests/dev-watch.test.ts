import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'
import {
  createMemoryEnvironment,
  createReactFrameworkDefinition,
} from '@tanstack/create'

import { DevWatchManager } from '../src/dev-watch'

import type {
  Framework,
  FrameworkDefinition,
  Options,
} from '@tanstack/create'

function frameworkFromDefinition(definition: FrameworkDefinition): Framework {
  const { addOns, base, ...framework } = definition

  return {
    ...framework,
    getFiles: () => Promise.resolve(Object.keys(base)),
    getFileContents: (path) => Promise.resolve(base[path]),
    getDeletedFiles: () => Promise.resolve([]),
    getAddOns: () => addOns,
  }
}

describe('DevWatchManager', () => {
  it('preserves bundler metadata when rebuilding a watched framework', async () => {
    const watchPath = await mkdtemp(join(tmpdir(), 'tanstack-dev-watch-'))
    const baseDirectory = join(watchPath, 'project', 'base')
    await mkdir(baseDirectory, { recursive: true })
    await writeFile(join(baseDirectory, 'package.json'), '{}')

    try {
      const framework = frameworkFromDefinition(
        createReactFrameworkDefinition(),
      )
      const { environment } = createMemoryEnvironment()
      const cliOptions: Options = {
        projectName: 'dev-watch-app',
        targetDir: join(watchPath, 'target'),
        framework,
        mode: 'file-router',
        bundler: 'rsbuild',
        typescript: true,
        tailwind: true,
        packageManager: 'npm',
        git: false,
        install: true,
        intent: false,
        chosenAddOns: [],
        addOnOptions: {},
      }
      const manager = new DevWatchManager({
        watchPath,
        targetDir: cliOptions.targetDir,
        framework,
        cliOptions,
        packageManager: 'npm',
        environment,
      })
      const refreshedFramework = (
        manager as unknown as {
          createFrameworkDefinitionFromWatchPath: () => FrameworkDefinition | null
        }
      ).createFrameworkDefinitionFromWatchPath()

      expect(refreshedFramework?.bundlers).toEqual(framework.bundlers)
      expect(refreshedFramework?.defaultBundler).toBe(
        framework.defaultBundler,
      )
    } finally {
      await rm(watchPath, { recursive: true, force: true })
    }
  })
})
