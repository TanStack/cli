import { basename, resolve } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  normalizeOptions,
  validateLegacyCreateFlags,
} from '../src/command-line.js'
import {
  sanitizePackageName,
  getCurrentDirectoryName,
} from '../src/utils.js'
import {
  __testRegisterFramework,
  __testClearFrameworks,
} from '@tanstack/create'

beforeEach(() => {
  __testClearFrameworks()
})

describe('sanitizePackageName', () => {
  it('should convert to lowercase', () => {
    expect(sanitizePackageName('MyProject')).toBe('myproject')
  })

  it('should replace spaces with hyphens', () => {
    expect(sanitizePackageName('my project')).toBe('my-project')
  })

  it('should replace underscores with hyphens', () => {
    expect(sanitizePackageName('my_project')).toBe('my-project')
  })

  it('should remove invalid characters', () => {
    expect(sanitizePackageName('my@project!')).toBe('myproject')
  })

  it('should ensure it starts with a letter', () => {
    expect(sanitizePackageName('123project')).toBe('project')
    expect(sanitizePackageName('_myproject')).toBe('myproject')
  })

  it('should collapse multiple hyphens', () => {
    expect(sanitizePackageName('my--project')).toBe('my-project')
  })

  it('should remove trailing hyphen', () => {
    expect(sanitizePackageName('myproject-')).toBe('myproject')
  })
})

describe('getCurrentDirectoryName', () => {
  it('should return the basename of the current working directory', () => {
    expect(getCurrentDirectoryName()).toBe(basename(process.cwd()))
  })
})

describe('normalizeOptions', () => {
  it('should return undefined if project name is not provided', async () => {
    const options = await normalizeOptions({})
    expect(options).toBeUndefined()
  })

  it('should handle "." as project name by using sanitized current directory name', async () => {
    const options = await normalizeOptions({
      projectName: '.',
    })
    const expectedName = sanitizePackageName(getCurrentDirectoryName())
    expect(options?.projectName).toBe(expectedName)
    expect(options?.targetDir).toBe(resolve(process.cwd()))
  })

  it('should always enable typescript (file-router/TanStack Start requires it)', async () => {
    const options = await normalizeOptions({
      projectName: 'test',
    })
    expect(options?.typescript).toBe(true)
    expect(options?.mode).toBe('file-router')
  })

  it('tailwind is always enabled', async () => {
    const options = await normalizeOptions({
      projectName: 'test',
    })
    expect(options?.tailwind).toBe(true)

    const solidOptions = await normalizeOptions({
      projectName: 'test',
      framework: 'solid',
    })
    expect(solidOptions?.tailwind).toBe(true)
  })

  it('should handle a starter url', async () => {
    __testRegisterFramework({
      id: 'solid',
      name: 'Solid',
      getAddOns: () => [
        {
          id: 'nitro',
          name: 'nitro',
          modes: ['file-router'],
          default: true,
        },
      ],
      supportedModes: {
        'code-router': {
          displayName: 'Code Router',
          description: 'TanStack Router using code to define the routes',
          forceTypescript: false,
        },
        'file-router': {
          displayName: 'File Router',
          description: 'TanStack Router using files to define the routes',
          forceTypescript: true,
        },
      },
    })
    fetch.mockResponseOnce(
      JSON.stringify({
        id: 'https://github.com/cta-dev/cta-starter-solid',
        typescript: false,
        framework: 'solid',
        mode: 'file-router',
        type: 'starter',
        description: 'A starter for Solid',
        name: 'My Solid Starter',
        dependsOn: [],
        files: {},
        deletedFiles: [],
      }),
    )

    const options = await normalizeOptions({
      projectName: 'test',
      starter: 'https://github.com/cta-dev/cta-starter-solid',
      deployment: 'nitro',
    })
    expect(options?.mode).toBe('file-router')
    expect(options?.tailwind).toBe(true)
    expect(options?.typescript).toBe(true)
    expect(options?.framework?.id).toBe('solid')
  })

  it('should default to react-cra if no framework is provided', async () => {
    __testRegisterFramework({
      id: 'react-cra',
      name: 'react',
    })
    const options = await normalizeOptions({
      projectName: 'test',
    })
    expect(options?.framework?.id).toBe('react-cra')
  })

  it('should handle forced addons', async () => {
    __testRegisterFramework({
      id: 'react-cra',
      name: 'react',
      getAddOns: () => [
        {
          id: 'foo',
          name: 'foobar',
          modes: ['file-router'],
        },
        {
          id: 'nitro',
          name: 'nitro',
          modes: ['file-router'],
          default: true,
        },
      ],
    })
    const options = await normalizeOptions(
      {
        projectName: 'test',
        framework: 'react-cra',
      },
      ['foo'],
    )
    expect(options?.chosenAddOns.map((a) => a.id).includes('foo')).toBe(true)
  })

  it('should handle additional addons from the CLI', async () => {
    __testRegisterFramework({
      id: 'react-cra',
      name: 'react',
      getAddOns: () => [
        {
          id: 'foo',
          name: 'foobar',
          modes: ['file-router'],
        },
        {
          id: 'baz',
          name: 'baz',
          modes: ['file-router'],
        },
        {
          id: 'nitro',
          name: 'nitro',
          modes: ['file-router'],
          default: true,
        },
      ],
    })
    const options = await normalizeOptions(
      {
        projectName: 'test',
        addOns: ['baz'],
        framework: 'react-cra',
      },
      ['foo'],
    )
    expect(options?.chosenAddOns.map((a) => a.id).includes('foo')).toBe(true)
    expect(options?.chosenAddOns.map((a) => a.id).includes('baz')).toBe(true)
    expect(options?.tailwind).toBe(true)
    expect(options?.typescript).toBe(true)
  })

  it('should ignore legacy start add-on id from exported commands', async () => {
    __testRegisterFramework({
      id: 'react-cra',
      name: 'react',
      getAddOns: () => [
        {
          id: 'tanstack-query',
          name: 'TanStack Query',
          modes: ['file-router'],
        },
        {
          id: 'nitro',
          name: 'nitro',
          modes: ['file-router'],
          default: true,
        },
      ],
    })

    const options = await normalizeOptions({
      projectName: 'test',
      addOns: ['start', 'tanstack-query'],
      framework: 'react-cra',
    })

    expect(options?.chosenAddOns.map((a) => a.id)).toContain('tanstack-query')
    expect(options?.chosenAddOns.map((a) => a.id)).not.toContain('start')
  })

  it('should handle toolchain as an addon', async () => {
    __testRegisterFramework({
      id: 'react-cra',
      name: 'react',
      getAddOns: () => [
        {
          id: 'biome',
          name: 'Biome',
          modes: ['file-router', 'code-router'],
        },
        {
          id: 'nitro',
          name: 'nitro',
          modes: ['file-router', 'code-router'],
          default: true,
        },
      ],
    })
    const options = await normalizeOptions({
      projectName: 'test',
      toolchain: 'biome',
    })
    expect(options?.chosenAddOns.map((a) => a.id).includes('biome')).toBe(true)
    expect(options?.tailwind).toBe(true)
    expect(options?.typescript).toBe(true)
  })

  it('should handle the funky Windows edge case with CLI parsing', async () => {
    __testRegisterFramework({
      id: 'react-cra',
      name: 'react',
      getAddOns: () => [
        {
          id: 'foo',
          name: 'foobar',
          modes: ['file-router', 'code-router'],
        },
        {
          id: 'baz',
          name: 'baz',
          modes: ['file-router', 'code-router'],
        },
        {
          id: 'nitro',
          name: 'nitro',
          modes: ['file-router', 'code-router'],
          default: true,
        },
      ],
    })
    const options = await normalizeOptions({
      projectName: 'test',
      addOns: ['baz foo'],
    })
    expect(options?.chosenAddOns.map((a) => a.id).includes('foo')).toBe(true)
    expect(options?.chosenAddOns.map((a) => a.id).includes('baz')).toBe(true)
  })
})

describe('validateLegacyCreateFlags', () => {
  it('returns no warnings or errors without legacy flags', () => {
    const result = validateLegacyCreateFlags({})
    expect(result.warnings).toEqual([])
    expect(result.error).toBeUndefined()
  })

  it('warns when --router-only is used', () => {
    const result = validateLegacyCreateFlags({ routerOnly: true })
    expect(result.error).toBeUndefined()
    expect(result.warnings[0]).toContain('--router-only')
  })

  it('warns when --tailwind is used', () => {
    const result = validateLegacyCreateFlags({ tailwind: true })
    expect(result.error).toBeUndefined()
    expect(result.warnings[0]).toContain('--tailwind')
  })

  it('warns heavily when --no-tailwind is used', () => {
    const result = validateLegacyCreateFlags({ tailwind: false })
    expect(result.error).toBeUndefined()
    expect(result.warnings[0]).toContain('--no-tailwind')
    expect(result.warnings[0]).toContain('intentionally unsupported')
  })

  it('errors for JavaScript templates', () => {
    const result = validateLegacyCreateFlags({ template: 'javascript' })
    expect(result.error).toContain('JavaScript/JSX templates are not supported')
  })

  it('errors for unknown template values', () => {
    const result = validateLegacyCreateFlags({ template: 'foo' })
    expect(result.error).toContain('Invalid --template value')
  })

  it('warns for supported deprecated template values', () => {
    const result = validateLegacyCreateFlags({ template: 'tsx' })
    expect(result.error).toBeUndefined()
    expect(result.warnings[0]).toContain('--template')
  })
})
