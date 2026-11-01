import { beforeEach, describe, it, expect, vi } from 'vitest'
import { resolve } from 'node:path'

import { promptForAddOns, promptForCreateOptions } from '../src/options'
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
vi.mock('../src/command-line', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/command-line')>()
  return {
    ...actual,
    listTemplateChoices: vi.fn(),
    resolveStarterSpecifier: vi.fn(),
  }
})

beforeEach(() => {
  __testClearFrameworks()
  __testRegisterFramework({
    id: 'react',
    name: 'react',
    bundlers: [
      { id: 'vite', name: 'Vite', description: 'Build with Vite' },
      { id: 'rsbuild', name: 'Rsbuild', description: 'Build with Rsbuild' },
    ],
    defaultBundler: 'vite',
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
        exclusive: ['linter'],
      },
      {
        id: 'eslint',
        type: 'toolchain',
        modes: ['file-router'],
        exclusive: ['linter'],
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
    bundlers: [
      { id: 'vite', name: 'Vite', description: 'Build with Vite' },
      { id: 'rsbuild', name: 'Rsbuild', description: 'Build with Rsbuild' },
    ],
    defaultBundler: 'vite',
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
  vi.spyOn(prompts, 'selectBundler').mockImplementation(async () => 'vite')
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
    expect(
      vi.mocked(prompts.selectBundler).mock.invocationCallOrder[0],
    ).toBeLessThan(
      vi.mocked(prompts.selectTemplate).mock.invocationCallOrder[0],
    )
  })

  it('selects Rsbuild before templates and skips unsupported prompts', async () => {
    setBasicSpies()
    vi.mocked(prompts.selectBundler).mockResolvedValue('rsbuild')
    vi.mocked(prompts.selectToolchain).mockResolvedValue('biome')

    const options = await promptForCreateOptions(
      { ...baseCliOptions, buildTool: undefined, addOns: true },
      {},
    )

    expect(options?.bundler).toBe('rsbuild')
    expect(options?.chosenAddOns.map((addOn) => addOn.id)).toEqual(['biome'])
    expect(prompts.selectTemplate).not.toHaveBeenCalled()
    expect(prompts.selectDeployment).not.toHaveBeenCalled()
    expect(prompts.selectAddOns).not.toHaveBeenCalled()
  })

  it.each([
    [{ template: 'blog' }, '--starter, --template, or --template-id'],
    [{ deployment: 'cloudflare' }, '--deployment'],
    [{ addOns: ['react-query'] }, 'toolchains only'],
  ])(
    'rejects explicit %s after Rsbuild is selected interactively',
    async (flags, error) => {
      setBasicSpies()
      vi.mocked(prompts.selectBundler).mockResolvedValue('rsbuild')

      await expect(
        promptForCreateOptions(
          {
            ...baseCliOptions,
            buildTool: undefined,
            addOns: true,
            ...flags,
          },
          {},
        ),
      ).rejects.toThrow(error)
    },
  )

  it.each([
    ['file-router', false],
    ['typescript', true],
    ['tsx', true],
  ])(
    'allows the legacy %s template alias after Rsbuild is selected interactively',
    async (template, routerOnly) => {
      setBasicSpies()
      vi.mocked(prompts.selectBundler).mockResolvedValue('rsbuild')

      const options = await promptForCreateOptions(
        {
          ...baseCliOptions,
          buildTool: undefined,
          addOns: true,
          template,
        },
        {},
      )

      expect(options?.bundler).toBe('rsbuild')
      expect(options?.routerOnly).toBe(routerOnly)
    },
  )

  it('keeps toolchain selection available for blank Rsbuild projects', async () => {
    setBasicSpies()
    vi.mocked(prompts.selectBundler).mockResolvedValue('rsbuild')

    const options = await promptForCreateOptions(
      { ...baseCliOptions, buildTool: 'rsbuild', blank: true },
      {},
    )

    expect(options?.projectPreset).toBe('blank')
    expect(prompts.selectToolchain).toHaveBeenCalled()
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

  it('uses the blank preset without prompting for optional scaffold features', async () => {
    setBasicSpies()

    const options = await promptForCreateOptions(
      { ...baseCliOptions, blank: true },
      {},
    )

    expect(options?.projectPreset).toBe('blank')
    expect(options?.includeExamples).toBe(false)
    expect(options?.tailwind).toBe(false)
    expect(options?.intent).toBe(false)
    expect(prompts.selectTemplate).not.toHaveBeenCalled()
    expect(prompts.selectExamples).not.toHaveBeenCalled()
    expect(prompts.selectToolchain).not.toHaveBeenCalled()
    expect(prompts.selectDeployment).not.toHaveBeenCalled()
    expect(prompts.selectAddOns).not.toHaveBeenCalled()
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

describe('promptForAddOns', () => {
  it('does not offer a second exclusive Rsbuild toolchain', async () => {
    vi.mocked(prompts.selectAddOns).mockClear()
    vi.spyOn(create, 'readConfigFile').mockResolvedValue({
      projectName: 'test',
      framework: 'react',
      bundler: 'rsbuild',
      mode: 'file-router',
      chosenAddOns: ['eslint'],
      version: 1,
    })

    await expect(promptForAddOns()).resolves.toEqual([])
    expect(prompts.selectAddOns).not.toHaveBeenCalled()
  })
})
