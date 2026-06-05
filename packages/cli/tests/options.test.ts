import { beforeEach, describe, it, expect, vi } from 'vitest'
import { resolve } from 'node:path'

import { promptForCreateOptions } from '../src/options'
import {
  __testClearFrameworks,
  __testRegisterFramework,
} from '@tanstack/create'
import * as create from '@tanstack/create'

import * as prompts from '../src/ui-prompts'
import * as commandLine from '../src/command-line'
import {
  getCurrentDirectoryName,
  sanitizePackageName,
} from '../src/utils'

import type { Framework } from '@tanstack/create'

import type { CliOptions } from '../src/types'

vi.mock('../src/ui-prompts')
vi.mock('../src/command-line')

beforeEach(() => {
  __testClearFrameworks()
  __testRegisterFramework({
    id: 'react',
    name: 'react',
    getAddOns: () => [
      {
        id: 'react-query',
        type: 'add-on',
        modes: ['file-router'],
      },
      {
        id: 'tanstack-chat',
        type: 'add-on',
        modes: ['file-router'],
      },
      {
        id: 'biome',
        type: 'toolchain',
        modes: ['file-router'],
      },
    ],
    supportedModes: {
      'file-router': {
        displayName: 'File Router',
        description: 'TanStack Start with file-based routing',
        forceTypescript: true,
      },
    },
  } as unknown as Framework)

  __testRegisterFramework({
    id: 'solid',
    name: 'solid',
    getAddOns: () => [],
  } as unknown as Framework)
})

const baseCliOptions: CliOptions = {
  framework: 'react',
  addOns: [],
  toolchain: undefined,
  projectName: undefined,
  git: undefined,
}

function setBasicSpies() {
  vi.spyOn(commandLine, 'listTemplateChoices').mockImplementation(async () => [])
  vi
    .spyOn(commandLine, 'resolveStarterSpecifier')
    .mockImplementation(async (value) =>
      value === 'blog'
        ? 'https://example.com/react/blog/starter.json'
        : value,
    )
  vi.spyOn(create, 'loadStarter').mockImplementation(
    async (id) =>
      ({
        id: String(id),
        name: 'Blog',
        description: 'Blog template',
        type: 'starter',
        framework: 'react',
        mode: 'file-router',
        typescript: true,
        dependsOn: [],
        files: {},
        deletedFiles: [],
      }) as any,
  )
  vi.spyOn(prompts, 'getProjectName').mockImplementation(async () => 'hello')
  vi.spyOn(prompts, 'selectTemplate').mockImplementation(async () => undefined)
  vi.spyOn(prompts, 'selectPackageManager').mockImplementation(
    async () => 'npm',
  )
  vi.spyOn(prompts, 'selectToolchain').mockImplementation(async () => undefined)
  vi.spyOn(prompts, 'selectAddOns').mockImplementation(async () => [])
}

describe('promptForCreateOptions', () => {
  //// Project name

  it('prompt for a project name', async () => {
    setBasicSpies()

    const options = await promptForCreateOptions(baseCliOptions, {})

    expect(options?.projectName).toBe('hello')
  })

  it('uses the current directory when the prompted project name is empty', async () => {
    setBasicSpies()
    vi.spyOn(prompts, 'getProjectName').mockImplementation(async () => '')

    const options = await promptForCreateOptions(baseCliOptions, {})

    expect(options?.projectName).toBe(
      sanitizePackageName(getCurrentDirectoryName()),
    )
    expect(options?.targetDir).toBe(resolve(process.cwd()))
  })

  it('uses the current directory when the prompted project name is "."', async () => {
    setBasicSpies()
    vi.spyOn(prompts, 'getProjectName').mockImplementation(async () => '.')

    const options = await promptForCreateOptions(baseCliOptions, {})

    expect(options?.projectName).toBe(
      sanitizePackageName(getCurrentDirectoryName()),
    )
    expect(options?.targetDir).toBe(resolve(process.cwd()))
  })

  it('accept incoming project name', async () => {
    setBasicSpies()

    const options = await promptForCreateOptions(
      { ...baseCliOptions, projectName: 'override' },
      {},
    )

    expect(options?.projectName).toBe('override')
  })

  //// Mode is always file-router (TanStack Start)

  it('mode should always be file-router', async () => {
    setBasicSpies()

    const options = await promptForCreateOptions(baseCliOptions, {})

    expect(options?.mode).toBe('file-router')
    expect(options?.typescript).toBe(true)
  })

  //// Tailwind is always enabled

  it('tailwind is always enabled', async () => {
    setBasicSpies()
    const options = await promptForCreateOptions(baseCliOptions, {})

    expect(options?.tailwind).toBe(true)
  })

  it('prompts for templates when none was provided', async () => {
    setBasicSpies()
    vi.spyOn(commandLine, 'listTemplateChoices').mockImplementation(async () => [
      {
        id: 'blog',
        name: 'Blog',
        description: 'Blog template',
        framework: 'react',
      },
    ])

    await promptForCreateOptions(baseCliOptions, {})

    expect(prompts.selectTemplate).toHaveBeenCalledWith([
      {
        id: 'blog',
        name: 'Blog',
        description: 'Blog template',
      },
    ])
  })

  it('skips template prompt when template was provided via CLI', async () => {
    setBasicSpies()

    await promptForCreateOptions({ ...baseCliOptions, template: 'blog' }, {})

    expect(prompts.selectTemplate).not.toHaveBeenCalled()
  })

  it('skips template prompt in router-only mode', async () => {
    setBasicSpies()

    await promptForCreateOptions({ ...baseCliOptions, routerOnly: true }, {})

    expect(prompts.selectTemplate).not.toHaveBeenCalled()
  })

  //// Package manager

  it('uses the package manager from the cli options', async () => {
    setBasicSpies()

    const options = await promptForCreateOptions(
      { ...baseCliOptions, packageManager: 'bun' },
      {},
    )

    expect(options?.packageManager).toBe('bun')
  })

  it('detects package manager from environment', async () => {
    setBasicSpies()

    process.env.npm_config_userconfig = 'blarg'

    const options = await promptForCreateOptions(
      { ...baseCliOptions, packageManager: undefined },
      {},
    )

    expect(options?.packageManager).toBe('pnpm')
  })

  //// Add-ons
  it('should be clean when no add-ons are selected', async () => {
    setBasicSpies()

    const options = await promptForCreateOptions({ ...baseCliOptions }, {})

    expect(options?.chosenAddOns).toEqual([])
  })

  it('should select biome when toolchain is specified', async () => {
    setBasicSpies()

    vi.spyOn(prompts, 'selectToolchain').mockImplementation(async () => 'biome')

    const options = await promptForCreateOptions(
      { ...baseCliOptions, toolchain: 'biome' },
      {},
    )

    expect(options?.chosenAddOns.map((a) => a.id).sort()).toEqual(['biome'])
  })

  it('should handle forced add-ons', async () => {
    setBasicSpies()

    vi.spyOn(prompts, 'selectToolchain').mockImplementation(
      async () => undefined,
    )

    const options = await promptForCreateOptions(
      { ...baseCliOptions },
      { forcedAddOns: ['react-query'] },
    )

    expect(options?.chosenAddOns.map((a) => a.id).sort()).toEqual([
      'react-query',
    ])
    expect(options?.tailwind).toBe(true)
    expect(options?.typescript).toBe(true)
  })

  it('should handle add-ons from the CLI', async () => {
    setBasicSpies()

    const options = await promptForCreateOptions(
      { ...baseCliOptions, addOns: ['biome', 'react-query'] },
      {},
    )

    expect(options?.chosenAddOns.map((a) => a.id).sort()).toEqual([
      'biome',
      'react-query',
    ])
    expect(options?.tailwind).toBe(true)
    expect(options?.typescript).toBe(true)
  })

  it('should handle user-selected add-ons', async () => {
    setBasicSpies()

    vi.spyOn(prompts, 'selectAddOns').mockImplementation(async () =>
      Promise.resolve(['biome', 'react-query']),
    )

    const options = await promptForCreateOptions(
      { ...baseCliOptions, addOns: undefined },
      {},
    )

    expect(options?.chosenAddOns.map((a) => a.id).sort()).toEqual([
      'biome',
      'react-query',
    ])
    expect(options?.tailwind).toBe(true)
    expect(options?.typescript).toBe(true)
  })
})
