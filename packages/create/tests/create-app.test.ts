import { describe, expect, it } from 'vitest'
import { resolve } from 'node:path'

import { createApp } from '../src/create-app.js'

import { createMemoryEnvironment } from '../src/environment.js'
import { FILE_ROUTER } from '../src/constants.js'
import { AddOn, Options } from '../src/types.js'

const simpleOptions = {
  projectName: 'test',
  targetDir: '/',
  framework: {
    id: 'test',
    name: 'Test',
    basePackageJSON: {
      scripts: {
        dev: 'react-scripts start',
      },
    },
    optionalPackages: {
      typescript: {
        devDependencies: {
          typescript: '^5.0.0',
        },
      },
      tailwindcss: {
        dependencies: {
          tailwindcss: '^3.0.0',
        },
      },
      'file-router': {
        dependencies: {
          'file-router': '^1.0.0',
        },
      },
    },
    getFiles: () => ['src/test.txt'],
    getFileContents: () => 'Hello',
    getDeletedFiles: () => [],
  },
  chosenAddOns: [],
  packageManager: 'pnpm',
  typescript: true,
  tailwind: true,
  mode: FILE_ROUTER,
  variableValues: {},
} as unknown as Options

describe('createApp', () => {
  it('should create an app', async () => {
    const { environment, output } = createMemoryEnvironment()
    await createApp(environment, simpleOptions)

    expect(output.files['/src/test.txt']).toEqual('Hello')
  })

  it('should create an app - not silent', async () => {
    const { environment, output } = createMemoryEnvironment()
    await createApp(environment, {
      ...simpleOptions,
      targetDir: '/foo/bar/baz',
    })

    const cwd = process.cwd()

    expect(output.files[resolve(cwd, '/foo/bar/baz/src/test.txt')]).toEqual(
      'Hello',
    )
  })

  it('should create an app - with a starter', async () => {
    const { environment, output } = createMemoryEnvironment()
    await createApp(environment, {
      ...simpleOptions,
      starter: {
        command: {
          command: 'echo',
          args: ['Hello'],
        },
        getFiles: () => ['src/test2.txt'],
        getFileContents: () => 'Hello-2',
        getDeletedFiles: () => [],
      } as unknown as AddOn,
    })

    expect(output.files['/src/test2.txt']).toEqual('Hello-2')
    expect(output.commands.some(({ command }) => command === 'echo')).toBe(true)
  })

  it('should create an app - with a add-on', async () => {
    const { environment, output } = createMemoryEnvironment()
    await createApp(environment, {
      ...simpleOptions,
      git: true,
      chosenAddOns: [
        {
          type: 'add-on',
          phase: 'add-on',
          warning: 'This is a warning',
          command: {
            command: 'echo',
            args: ['Hello'],
          },
          packageAdditions: {
            dependencies: {},
            devDependencies: {},
          },
          getFiles: () => ['src/test2.txt', 'public/foo.jpg'],
          getFileContents: () => 'base64::aGVsbG8=',
          getDeletedFiles: () => [],
        } as unknown as AddOn,
      ],
    })

    // This is ok, we convert to binary right at the end of the process
    expect(output.files['/src/test2.txt']).toEqual('base64::aGVsbG8=')
    expect(output.commands.some(({ command }) => command === 'echo')).toBe(true)
  })

  it('should strip demo files from add-ons when includeExamples is false', async () => {
    const { environment, output } = createMemoryEnvironment()

    const demoFiles = [
      'src/routes/demo/form.simple.tsx',
      'src/routes/demo.form.tsx',
      'src/routes/example.chat.tsx',
      'src/components/demo-AIAssistant.tsx',
      'src/components/demo.FormComponents.tsx',
      'src/hooks/demo-useAudioRecorder.ts',
      'src/hooks/demo.form.ts',
      'src/lib/demo-store.ts',
      'src/lib/demo.ai-hook.ts',
      'src/data/demo-guitars.ts',
      'src/store/demo.hooks.ts',
      'src/store/demo.store.ts',
      'src/demo.index.css',
      'public/demo-neon.svg',
      'public/example-guitar-flowers.jpg',
    ]
    const keepFiles = [
      'src/routes/index.tsx',
      'src/components/Header.tsx',
      'src/lib/utils.ts',
    ]
    const allFiles = [...demoFiles, ...keepFiles]

    await createApp(environment, {
      ...simpleOptions,
      includeExamples: false,
      chosenAddOns: [
        {
          id: 'test-addon',
          type: 'add-on',
          phase: 'add-on',
          packageAdditions: { dependencies: {}, devDependencies: {} },
          routes: [],
          integrations: [],
          getFiles: () => allFiles,
          getFileContents: () => 'content',
          getDeletedFiles: () => [],
        } as unknown as AddOn,
      ],
    } as Options)

    for (const file of demoFiles) {
      expect(output.files[`/${file}`]).toBeUndefined()
    }
    for (const file of keepFiles) {
      expect(output.files[`/${file}`]).toBeDefined()
    }
  })

  it('should keep demo files from add-ons when includeExamples is true', async () => {
    const { environment, output } = createMemoryEnvironment()

    await createApp(environment, {
      ...simpleOptions,
      includeExamples: true,
      chosenAddOns: [
        {
          id: 'test-addon',
          type: 'add-on',
          phase: 'add-on',
          packageAdditions: { dependencies: {}, devDependencies: {} },
          routes: [],
          integrations: [],
          getFiles: () => ['src/components/demo-AIAssistant.tsx'],
          getFileContents: () => 'content',
          getDeletedFiles: () => [],
        } as unknown as AddOn,
      ],
    } as Options)

    expect(output.files['/src/components/demo-AIAssistant.tsx']).toBeDefined()
  })
})
