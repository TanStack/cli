import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fs, vol } from 'memfs'

import {
  compareFilesRecursively,
  createAppOptionsFromPersisted,
  createPackageAdditions,
  createSerializedOptionsFromPersisted,
  readCurrentProjectOptions,
} from '../../src/custom-add-ons/shared.js'
import { createMemoryEnvironment } from '../../src/environment.js'
import {
  __testClearFrameworks,
  __testRegisterFramework,
} from '../../src/frameworks.js'

import type { PersistedOptions } from '../../src/config-file.js'

vi.mock('node:fs', () => fs)
vi.mock('node:fs/promises', () => fs.promises)

beforeEach(() => {
  vol.reset()

  const fakeFiles = {
    'package.json': JSON.stringify({
      name: 'test',
      version: '1.0.0',
      dependencies: {},
    }),
  }

  __testClearFrameworks()
  __testRegisterFramework({
    id: 'test',
    name: 'Test',
    description: 'Test',
    version: '1.0.0',
    baseDirectory: '/foo',
    addOnsDirectories: [],
    basePackageJSON: {},
    optionalPackages: {},
    supportedModes: {
      'code-router': {
        displayName: 'Code Router',
        description: 'Code Router',
      },
      'file-router': {
        displayName: 'File Router',
        description: 'File Router',
      },
    },
    getAddOns: () => [
      {
        id: 'test',
        name: 'Test',
        description: 'Test',
        version: '1.0.0',
        type: 'add-on',
        phase: 'add-on',
        modes: ['code-router', 'file-router'],
        command: {
          command: 'echo',
          args: ['baz'],
        },
        packageAdditions: {
          dependencies: {
            'test-package': '1.0.0',
          },
        },
        dependsOn: [],
        getFiles: () => Promise.resolve(['jack.txt']),
        getFileContents: () => Promise.resolve('foo'),
        getDeletedFiles: () => Promise.resolve([]),
      },
    ],
    getFiles: () => Promise.resolve(Object.keys(fakeFiles)),
    getFileContents: (path) => Promise.resolve(fakeFiles[path]),
    getDeletedFiles: () => Promise.resolve([]),
  })
})

describe('createAppOptionsFromPersisted', () => {
  it('should create live options from persisted options', async () => {
    const persistedOptions = {
      projectName: 'test-project',
      framework: 'test',
      mode: 'code-router',
      typescript: true,
      tailwind: true,
      git: true,
      packageManager: 'npm',
      targetDir: '',
      starter: undefined,
      chosenAddOns: [],
      version: 1,
    } as PersistedOptions
    const appOptions = await createAppOptionsFromPersisted(persistedOptions)
    expect(appOptions.framework.id).toEqual('test')
    expect(appOptions.mode).toEqual('code-router')
    expect(appOptions.typescript).toEqual(true)
    expect(appOptions.tailwind).toEqual(true)
    expect(appOptions.git).toEqual(true)
    expect(appOptions.packageManager).toEqual('npm')
    expect(appOptions.targetDir).toEqual('')
    expect(appOptions.starter).toEqual(undefined)
    expect(appOptions.chosenAddOns).toEqual([])
    expect(appOptions.chosenAddOns).toEqual([])
  })
})

describe('createSerializedOptionsFromPersisted', () => {
  it('should create serialized options from persisted options', async () => {
    const persistedOptions = {
      projectName: 'test-project',
      framework: 'test',
      mode: 'code-router',
      typescript: true,
      tailwind: true,
      git: true,
      packageManager: 'npm',
      targetDir: '',
      starter: undefined,
      chosenAddOns: [],
      version: 1,
    } as PersistedOptions
    const appOptions =
      await createSerializedOptionsFromPersisted(persistedOptions)
    expect(appOptions.framework).toEqual('test')
    expect(appOptions.mode).toEqual('code-router')
    expect(appOptions.typescript).toEqual(true)
    expect(appOptions.tailwind).toEqual(true)
    expect(appOptions.git).toEqual(true)
    expect(appOptions.packageManager).toEqual('npm')
    expect(appOptions.targetDir).toEqual('')
    expect(appOptions.starter).toEqual(undefined)
    expect(appOptions.chosenAddOns).toEqual([])
    expect(appOptions.chosenAddOns).toEqual([])
  })
})

describe('createPackageAdditions', () => {
  it('should handles scripts', () => {
    const packageAdditions = createPackageAdditions(
      {
        scripts: {
          dev: 'vinxi dev',
        },
      },
      {
        scripts: {
          dev: 'vinxi dev',
          foo: 'bar',
        },
      },
    )
    expect(packageAdditions).toEqual({
      scripts: {
        foo: 'bar',
      },
    })
  })

  it('should handles dependencies', () => {
    const packageAdditions = createPackageAdditions(
      {
        dependencies: {
          react: '^18.0.0',
        },
        devDependencies: {
          'foo-dev-dependency': '^18.0.0',
          'updated-dev-dependency': '^18.0.0',
        },
      },
      {
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^20.0.0',
        },
        devDependencies: {
          'foo-dev-dependency': '^18.0.0',
          'bar-dev-dependency': '^18.0.0',
          'updated-dev-dependency': '^20.0.0',
        },
      },
    )
    expect(packageAdditions).toEqual({
      dependencies: {
        'react-dom': '^20.0.0',
      },
      devDependencies: {
        'bar-dev-dependency': '^18.0.0',
        'updated-dev-dependency': '^20.0.0',
      },
    })
  })
})

describe('readCurrentProjectOptions', () => {
  it('should read the current project options', async () => {
    const { environment } = createMemoryEnvironment()
    environment.writeFile(
      '.cta.json',
      JSON.stringify({
        projectName: 'test-project',
        framework: 'test',
        mode: 'code-router',
        typescript: true,
        tailwind: true,
        git: true,
        packageManager: 'npm',
        targetDir: '',
        starter: undefined,
        chosenAddOns: [],
        version: 1,
      }),
    )
    const options = await readCurrentProjectOptions(environment)
    expect(options).toEqual({
      bundler: 'vite',
      chosenAddOns: [],
      framework: 'test',
      git: true,
      mode: 'code-router',
      packageManager: 'npm',
      projectName: 'test-project',
      tailwind: true,
      targetDir: '',
      typescript: true,
      version: 1,
    })
  })
})

describe('compareFilesRecursively', () => {
  it('should compare files recursively', async () => {
    vol.mkdirSync('/foo')
    vol.writeFileSync('/foo/.gitignore', 'foo')
    vol.writeFileSync('/foo/bar.txt', 'bar')
    vol.writeFileSync('/foo/baz.txt', 'baz')
    vol.writeFileSync('/foo/qux.txt', 'qux')
    vol.mkdirSync('/foo/bar')
    vol.writeFileSync('/foo/bar/baz.txt', 'baz')
    vol.writeFileSync('/foo/bar/qux.txt', 'qux')
    const changedFiles = {}
    await compareFilesRecursively(
      '/foo',
      () => false,
      {
        '/foo/.gitignore': '.gitignore',
        '/foo/bar.txt': 'bar',
      },
      changedFiles,
    )
    expect(changedFiles).toEqual({
      '/foo/.gitignore': 'foo',
      '/foo/bar/baz.txt': 'baz',
      '/foo/bar/qux.txt': 'qux',
      '/foo/baz.txt': 'baz',
      '/foo/qux.txt': 'qux',
    })
  })
})
