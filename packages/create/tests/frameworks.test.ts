import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fs, vol } from 'memfs'

import {
  __testClearFrameworks,
  getFrameworks,
  getFrameworkById,
  getFrameworkByName,
  registerFramework,
} from '../src/frameworks.js'

vi.mock('node:fs', () => fs)
vi.mock('node:fs/promises', () => fs.promises)

beforeEach(() => {
  vol.reset()
  __testClearFrameworks()
})

describe('registerFramework', () => {
  it('should register a framework', async () => {
    const addOnPackageJSON = {
      id: 'test',
      name: 'Test',
      description: 'Test',
      version: '1.0.0',
    }
    const basePackageJSON = {
      name: 'Test',
      version: '1.0.0',
    }

    registerFramework({
      id: 'test',
      name: 'Test',
      addOns: [],
      description: 'Test',
      version: '1.0.0',
      base: {
        'package.json': JSON.stringify(basePackageJSON),
      },
      basePackageJSON,
      optionalPackages: {},
      supportedModes: {
        'code-router': {
          displayName: 'Code Router',
          description: 'Code Router',
          forceTypescript: false,
        },
      },
    })

    const f = getFrameworkById('test')!

    const baseFiles = await f.getFiles()
    expect(baseFiles).toEqual(['package.json'])

    const fileContents = await f.getFileContents('package.json')
    expect(fileContents).toEqual(JSON.stringify(basePackageJSON))

    expect(getFrameworkByName('Test')).not.toBeUndefined()
    expect(getFrameworkByName('test')).not.toBeUndefined()
    expect(getFrameworks().length).toEqual(1)
  })

  it('should resolve legacy react-cra framework id', () => {
    registerFramework({
      id: 'react',
      name: 'React',
      addOns: [],
      description: 'React',
      version: '1.0.0',
      base: {},
      basePackageJSON: {},
      optionalPackages: {},
      supportedModes: {
        'file-router': {
          displayName: 'File Router',
          description: 'File Router',
          forceTypescript: true,
        },
      },
    })

    expect(getFrameworkById('react-cra')?.id).toBe('react')
  })
})
