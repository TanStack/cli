import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fs, vol } from 'memfs'

import { createMemoryEnvironment } from '../src/environment.js'
import {
  addToApp,
  getCurrentConfiguration,
  hasPendingGitChanges,
  runNewCommands,
  writeFiles,
} from '../src/add-to-app.js'
import {
  __testClearFrameworks,
  __testRegisterFramework,
} from '../src/frameworks.js'

import type { PersistedOptions } from '../src/config-file.js'

vi.mock('node:fs', () => fs)
vi.mock('node:fs/promises', () => fs.promises)

const fakeCTAJSON: PersistedOptions = {
  projectName: 'test',
  targetDir: '/foo',
  framework: 'test',
  mode: 'code-router',
  chosenAddOns: [],
  version: 1,
  typescript: true,
  tailwind: true,
  packageManager: 'npm',
  git: true,
}

beforeEach(() => {
  const fakeFiles = {
    'package.json': JSON.stringify({
      name: 'test',
      version: '1.0.0',
      dependencies: {},
    }),
  }

  vol.reset()
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
    getAddOns: () => [
      {
        id: 'test',
        name: 'Test',
        description: 'Test',
        version: '1.0.0',
        type: 'add-on',
        phase: 'add-on',
        modes: ['code-router', 'file-router'],
        tailwind: true,
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

const configFile: PersistedOptions = {
  projectName: 'test',
  targetDir: '/foo',
  framework: 'test',
  mode: 'code-router',
  chosenAddOns: [],
  version: 1,
  typescript: true,
  tailwind: true,
  packageManager: 'npm',
  git: true,
}

describe('getCurrentConfiguration', () => {
  it('should check for the config file', async () => {
    const { environment } = createMemoryEnvironment()
    const out = await getCurrentConfiguration(environment, '/foo')
    expect(out).toBeUndefined()
  })

  it('should read the config file', async () => {
    const { environment } = createMemoryEnvironment()

    environment.writeFile('/foo/.cta.json', JSON.stringify(configFile, null, 2))

    const out = await getCurrentConfiguration(environment, '/foo')
    expect(out).toEqual(configFile)
  })
})

describe('hasPendingGitChanges', () => {
  it('should check for pending git changes', async () => {
    const { environment } = createMemoryEnvironment()
    environment.execute = () => Promise.resolve({ stdout: '' })
    const out = await hasPendingGitChanges(environment, '/foo')
    expect(out).toBe(false)
  })

  it('should check for pending git changes', async () => {
    const { environment } = createMemoryEnvironment()
    environment.execute = () => Promise.resolve({ stdout: 'M foo' })
    const out = await hasPendingGitChanges(environment, '/foo')
    expect(out).toBe(true)
  })
})

describe('writeFiles', () => {
  it('should prompt for confirmation when not forced', async () => {
    const { environment } = createMemoryEnvironment('/foo')
    environment.writeFile('/foo/bloop.txt', 'bloop')
    environment.writeFile(
      '/foo/package.json',
      JSON.stringify(
        {
          name: 'test',
          version: '1.0.0',
          dependencies: {},
        },
        null,
        2,
      ),
    )
    environment.writeFile('/foo/bar.txt', 'bar')
    environment.confirm = () => Promise.resolve(false)
    let thrown = false
    writeFiles(
      environment,
      '/foo',
      {
        files: {
          'bar.txt': 'baz',
          'blarg.txt': 'blarg',
        },
        deletedFiles: [],
      },
      false,
    )
      .catch((e) => {
        thrown = true
      })
      .finally(() => {
        expect(thrown).toBe(true)
      })
  })

  it('should not prompt for confirmation when forced', async () => {
    const { environment, output } = createMemoryEnvironment('/foo')
    environment.startRun()
    environment.writeFile('/foo/.cta.json', JSON.stringify(configFile, null, 2))
    environment.writeFile('/foo/blooop.txt', 'blooop')
    await writeFiles(
      environment,
      '/foo',
      {
        files: {
          'bar.txt': 'baz',
          'blarg.txt': 'blarg',
        },
        deletedFiles: [],
      },
      true,
    )
    environment.finishRun()
    expect(output.files).toEqual({
      'blooop.txt': 'blooop',
      'bar.txt': 'baz',
      'blarg.txt': 'blarg',
    })
  })

  it('should handle binary files', async () => {
    const { environment, output } = createMemoryEnvironment('/foo')
    environment.startRun()
    environment.writeFile('/foo/.cta.json', JSON.stringify(configFile, null, 2))
    environment.writeFile('/foo/unchanged.jpg', 'base64::foobaz')
    environment.writeFile('/foo/changing.jpg', 'base64::foobaz')
    await writeFiles(
      environment,
      '/foo',
      {
        files: {
          'unchanged.jpg': 'base64::foobaz',
          'changing.jpg': 'base64::aGVsbG8=',
          'new.jpg': 'base64::aGVsbG8=',
        },
        deletedFiles: [],
      },
      true,
    )
    environment.finishRun()
    // It's ok for unchanged.jpg not to be written, because it matches the existing file
    expect(output.files).toEqual({
      'unchanged.jpg': 'base64::foobaz',
      'changing.jpg': 'base64::aGVsbG8=',
      'new.jpg': 'base64::aGVsbG8=',
    })
  })

  it('should handle package.json', async () => {
    const { environment, output } = createMemoryEnvironment('/foo')
    environment.startRun()
    environment.writeFile(
      '/foo/package.json',
      JSON.stringify(
        {
          name: 'test',
          version: '1.0.0',
          scripts: {
            dev: 'echo "test"',
          },
          dependencies: {
            'test-package-2': '1.0.0',
          },
        },
        null,
        2,
      ),
    )
    await writeFiles(
      environment,
      '/foo',
      {
        files: {
          'package.json': JSON.stringify(
            {
              scripts: {
                test: 'echo "test"',
              },
              dependencies: {
                'test-package': '1.0.0',
              },
            },
            null,
            2,
          ),
        },
        deletedFiles: [],
      },
      true,
    )
    environment.finishRun()
    expect(output.files).toEqual({
      'package.json': JSON.stringify(
        {
          name: 'test',
          version: '1.0.0',
          scripts: {
            dev: 'echo "test"',
            test: 'echo "test"',
          },
          dependencies: {
            'test-package-2': '1.0.0',
            'test-package': '1.0.0',
          },
          devDependencies: {},
        },
        null,
        2,
      ),
    })
  })

  it('should delete files', async () => {
    const { environment, output } = createMemoryEnvironment('/foo')
    environment.startRun()
    environment.writeFile('/foo/bloop.txt', 'bloop')
    await writeFiles(
      environment,
      '/foo',
      { files: {}, deletedFiles: ['bloop.txt'] },
      true,
    )
    environment.finishRun()
    expect(output.deletedFiles).toEqual(['bloop.txt'])
  })

  it('should normalize windows-style output paths before writing', async () => {
    const writePaths: Array<string> = []
    const environment = {
      readdir: async () => [],
      isDirectory: () => false,
      readFile: async () => '',
      exists: () => false,
      deleteFile: async () => {},
      writeFileBase64: async () => {},
      writeFile: async (path: string) => {
        writePaths.push(path)
      },
      startStep: () => {},
      finishStep: () => {},
      warn: () => {},
      confirm: async () => true,
    } as any

    await writeFiles(
      environment,
      'C:\\Users\\marv\\workspace\\fenbi-tanstack',
      {
        files: {
          'Users/marv/workspace/fenbi-tanstack/src/components.json': '{}',
        },
        deletedFiles: [],
      },
      true,
    )

    expect(writePaths).toHaveLength(1)
    expect(writePaths[0]).toMatch(/components\.json$/)
    expect(writePaths[0]).not.toMatch(
      /Users[\\/]marv[\\/]workspace[\\/]fenbi-tanstack[\\/]Users[\\/]marv[\\/]workspace[\\/]fenbi-tanstack/,
    )
  })
})

describe('runNewCommands', () => {
  it('should run new commands', async () => {
    const { environment, output } = createMemoryEnvironment('/foo')
    environment.startRun()
    await runNewCommands(environment, fakeCTAJSON, '/foo', {
      commands: [{ command: 'echo', args: ['bloop'] }],
    })
    environment.finishRun()
    expect(output.commands).toEqual([{ command: 'echo', args: ['bloop'] }])
  })
})

describe('addToApp', () => {
  it('should add an add-on', async () => {
    const { environment, output } = createMemoryEnvironment('/foo')
    environment.startRun()
    environment.writeFile(
      '/foo/.cta.json',
      JSON.stringify(fakeCTAJSON, null, 2),
    )
    environment.writeFile(
      '/foo/package.json',
      JSON.stringify(
        {
          name: 'test',
          version: '1.0.0',
          scripts: {},
          dependencies: {},
          devDependencies: {},
        },
        null,
        2,
      ),
    )
    await addToApp(environment, ['test'], '/foo', {
      forced: true,
    })
    environment.finishRun()
    expect(output.files).toEqual({
      'jack.txt': 'foo',
      'package.json': JSON.stringify(
        {
          name: 'test',
          version: '1.0.0',
          scripts: {},
          dependencies: {
            'test-package': '1.0.0',
          },
          devDependencies: {},
        },
        null,
        2,
      ),
    })
  })

  it('enables Tailwind when an add-on requires it', async () => {
    const { environment } = createMemoryEnvironment('/foo')
    environment.startRun()
    environment.writeFile(
      '/foo/.cta.json',
      JSON.stringify({ ...fakeCTAJSON, tailwind: false }, null, 2),
    )
    environment.writeFile(
      '/foo/package.json',
      JSON.stringify(
        {
          name: 'test',
          version: '1.0.0',
          scripts: {},
          dependencies: {},
          devDependencies: {},
        },
        null,
        2,
      ),
    )

    await addToApp(environment, ['test'], '/foo', {
      forced: true,
    })

    const persisted = JSON.parse(await environment.readFile('/foo/.cta.json'))
    expect(persisted.tailwind).toBe(true)
  })
})
