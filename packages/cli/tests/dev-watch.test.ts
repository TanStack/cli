import { execFile } from 'node:child_process'
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import { describe, expect, it } from 'vitest'
import {
  createMemoryEnvironment,
  createReactFrameworkDefinition,
} from '@tanstack/create'

import { DevWatchManager } from '../src/dev-watch'

import type { Framework, FrameworkDefinition, Options } from '@tanstack/create'

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
  it('syncs the second edit to the generated app', async () => {
    const fixture = fileURLToPath(
      new URL('./fixtures/dev-watch-rebuild.mjs', import.meta.url),
    )
    const root = await mkdtemp(join(tmpdir(), 'tanstack-watch-refresh-'))
    try {
      const { stdout } = await promisify(execFile)(
        process.execPath,
        ['--import', 'tsx', fixture, root],
        {
          cwd: fileURLToPath(new URL('../', import.meta.url)),
          timeout: 20_000,
        },
      )
      expect(stdout).toContain('WATCH_REFRESH_VERIFIED')
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  }, 25_000)

  it('removes every temporary directory after repeated failed rebuilds', async () => {
    const fixture = fileURLToPath(
      new URL('./fixtures/dev-watch-rebuild.mjs', import.meta.url),
    )
    const root = await mkdtemp(join(tmpdir(), 'tanstack-watch-fail-'))
    const ownedPrefix = join(tmpdir(), 'tanstack-dev-watch-')
    try {
      const { stdout, stderr } = await promisify(execFile)(
        process.execPath,
        ['--import', 'tsx', fixture, root, 'fail'],
        {
          cwd: fileURLToPath(new URL('../', import.meta.url)),
          timeout: 20_000,
        },
      )
      expect(stdout, stderr).toContain('WATCH_FAILED_BUILD_CLEANUP_VERIFIED')
      const directories: Array<string> = JSON.parse(
        await readFile(join(root, 'failed-paths.json'), 'utf8'),
      )
      expect(directories).toHaveLength(2)
      for (const directory of directories) {
        expect(directory.startsWith(ownedPrefix)).toBe(true)
        await expect(access(directory)).rejects.toMatchObject({
          code: 'ENOENT',
        })
      }
    } finally {
      const directories: Array<string> = await readFile(
        join(root, 'failed-paths.json'),
        'utf8',
      )
        .then((contents) => JSON.parse(contents))
        .catch(() => [])
      for (const directory of directories) {
        if (directory.startsWith(ownedPrefix)) {
          await rm(directory, { recursive: true, force: true })
        }
      }
      await rm(root, { recursive: true, force: true })
    }
  }, 25_000)

  it('cleans up when shutdown interrupts temporary directory allocation', async () => {
    const fixture = fileURLToPath(
      new URL('./fixtures/dev-watch-rebuild.mjs', import.meta.url),
    )
    const root = await mkdtemp(join(tmpdir(), 'tanstack-watch-cancel-'))
    const ownedPrefix = join(tmpdir(), 'tanstack-dev-watch-')
    let temporaryDirectory: string | undefined
    try {
      await promisify(execFile)(
        process.execPath,
        ['--import', 'tsx', fixture, root, 'cancel'],
        {
          cwd: fileURLToPath(new URL('../', import.meta.url)),
          timeout: 20_000,
        },
      )
      temporaryDirectory = await readFile(join(root, 'created-path'), 'utf8')
      expect(temporaryDirectory.startsWith(ownedPrefix)).toBe(true)
      await expect(access(temporaryDirectory)).rejects.toMatchObject({
        code: 'ENOENT',
      })
    } finally {
      if (temporaryDirectory?.startsWith(ownedPrefix)) {
        await rm(temporaryDirectory, { recursive: true, force: true })
      }
      await rm(root, { recursive: true, force: true })
    }
  }, 25_000)

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
      expect(refreshedFramework?.defaultBundler).toBe(framework.defaultBundler)
    } finally {
      await rm(watchPath, { recursive: true, force: true })
    }
  })
})
