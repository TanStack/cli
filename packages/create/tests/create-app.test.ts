import { writeFiles as writeAddonFiles } from '../src/add-to-app.js'
import { describe, expect, it } from 'vitest'
import { resolve } from 'node:path'

import { createApp } from '../src/create-app.js'
import { createApp as createEdgeApp } from '../src/edge-create-app.js'

import { createMemoryEnvironment } from '../src/environment.js'
import type { AddOn, Options } from '../src/types.js'

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
  mode: 'file-router',
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

  it.each(['react', 'solid'])(
    'generates routes for %s file-router apps after install',
    async (frameworkId) => {
      const { environment, output } = createMemoryEnvironment()
      await createApp(environment, {
        ...simpleOptions,
        framework: {
          ...simpleOptions.framework,
          id: frameworkId,
        },
        install: true,
      } as Options)

      expect(output.commands).toContainEqual({
        command: 'pnpm',
        args: ['generate-routes'],
      })
    },
  )

  it('skips route generation when dependency install is skipped', async () => {
    const { environment, output } = createMemoryEnvironment()
    await createApp(environment, {
      ...simpleOptions,
      framework: {
        ...simpleOptions.framework,
        id: 'react',
      },
      install: false,
    })

    expect(output.commands).not.toContainEqual({
      command: 'pnpm',
      args: ['generate-routes'],
    })
  })

  it.each([createApp, createEdgeApp])(
    'skips intent setup and reports the follow-up when dependency install is skipped (%#)',
    async (create) => {
      const { environment, output } = createMemoryEnvironment()
      let outro = ''
      environment.outro = (message: string) => {
        outro = message
      }
      await create(environment, {
        ...simpleOptions,
        intent: true,
        install: false,
      })

      expect(output.commands).not.toContainEqual({
        command: 'pnpm',
        args: ['exec', 'intent', 'install'],
      })
      expect(outro).not.toContain('was wired up by TanStack Intent')
      expect(outro).toContain('TanStack Intent setup was skipped')
      expect(outro).toContain('pnpm install')
      expect(outro).toContain('pnpm exec intent install --map')
    },
  )

  it.each([createApp, createEdgeApp])(
    'sets up intent and reports the agent config when dependencies are installed (%#)',
    async (create) => {
      const { environment, output } = createMemoryEnvironment()
      let outro = ''
      environment.outro = (message: string) => {
        outro = message
      }
      await create(environment, {
        ...simpleOptions,
        intent: true,
        install: true,
      })

      expect(output.commands).toContainEqual({
        command: 'pnpm',
        args: ['exec', 'intent', 'install'],
      })
      expect(outro).toContain('was wired up by TanStack Intent')
      expect(outro).not.toContain('TanStack Intent setup was skipped')
    },
  )

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

  it('writes .env.example from add-on envVars metadata', async () => {
    const { environment, output } = createMemoryEnvironment()

    await createApp(environment, {
      ...simpleOptions,
      chosenAddOns: [
        {
          id: 'fake-auth',
          name: 'Fake Auth',
          type: 'add-on',
          phase: 'add-on',
          packageAdditions: { dependencies: {}, devDependencies: {} },
          routes: [],
          integrations: [],
          envVars: [
            {
              name: 'AUTH_SECRET',
              description: 'Random secret used to sign sessions',
              required: true,
            },
            {
              name: 'AUTH_URL',
              description: 'Base URL for auth callbacks',
              required: false,
            },
          ],
          getFiles: () => [],
          getFileContents: () => '',
          getDeletedFiles: () => [],
        } as unknown as AddOn,
      ],
    } as Options)

    const envExample = output.files['/.env.example']
    expect(envExample).toBeDefined()
    expect(envExample).toContain('# Fake Auth')
    expect(envExample).toContain(
      '# Random secret used to sign sessions (required)',
    )
    expect(envExample).toContain('AUTH_SECRET=')
    expect(envExample).toContain('# Base URL for auth callbacks')
    expect(envExample).toContain('AUTH_URL=')
  })

  it('does not write .env.example when no add-on declares envVars', async () => {
    const { environment, output } = createMemoryEnvironment()

    await createApp(environment, {
      ...simpleOptions,
      chosenAddOns: [],
    } as Options)

    expect(output.files['/.env.example']).toBeUndefined()
  })

  it('dedupes env vars across add-ons in .env.example', async () => {
    const { environment, output } = createMemoryEnvironment()

    await createApp(environment, {
      ...simpleOptions,
      chosenAddOns: [
        {
          id: 'addon-a',
          name: 'Addon A',
          type: 'add-on',
          phase: 'add-on',
          packageAdditions: { dependencies: {}, devDependencies: {} },
          routes: [],
          integrations: [],
          envVars: [{ name: 'SHARED_KEY', required: true }],
          getFiles: () => [],
          getFileContents: () => '',
          getDeletedFiles: () => [],
        } as unknown as AddOn,
        {
          id: 'addon-b',
          name: 'Addon B',
          type: 'add-on',
          phase: 'add-on',
          packageAdditions: { dependencies: {}, devDependencies: {} },
          routes: [],
          integrations: [],
          envVars: [{ name: 'SHARED_KEY', required: true }],
          getFiles: () => [],
          getFileContents: () => '',
          getDeletedFiles: () => [],
        } as unknown as AddOn,
      ],
    } as Options)

    const envExample = output.files['/.env.example'] || ''
    const occurrences = envExample.match(/^SHARED_KEY=/gm) || []
    expect(occurrences.length).toBe(1)
  })
})


describe.each([createApp, createEdgeApp])(
  'Intent scaffold policy (%#)',
  (create) => {
    it.each([true, false])(
      'includes the local dependency and exact policy with install=%s',
      async (install) => {
        const { environment, output } = createMemoryEnvironment()
        await create(environment, { ...simpleOptions, intent: true, install })
        const pkg = JSON.parse(output.files['/package.json'])
        expect(pkg.devDependencies['@tanstack/intent']).toBeDefined()
        expect(pkg.intent.skills).toEqual([
          'file-router',
          'tailwindcss',
          'typescript',
        ])
        expect(pkg.intent.skills).not.toContain('@tanstack/*')
        expect(
          output.commands.some(
            (c) => c.args.join(' ') === 'exec intent install',
          ),
        ).toBe(install)
      },
    )
    it.each([
      { skills: [], exclude: ['private'] },
      { skills: ['allowed#specific'], exclude: ['private'] },
      { skills: 'malformed', exclude: ['private'] },
    ])(
      'preserves the startup policy before framework assets overwrite package.json: %j',
      async (intent) => {
        const { environment } = createMemoryEnvironment()
        await environment.writeFile(
          '/app/package.json',
          JSON.stringify({ intent }),
        )
        await create(environment, {
          ...simpleOptions,
          targetDir: '/app',
          intent: true,
          install: false,
          framework: {
            ...simpleOptions.framework,
            getFiles: async () => ['package.json'],
            getFileContents: async () =>
              JSON.stringify({ intent: { skills: ['*'] } }),
          },
        })
        expect(
          JSON.parse(await environment.readFile('/app/package.json')).intent,
        ).toEqual(intent)
      },
    )
    it.each(['dependencies', 'devDependencies'] as const)(
      'preserves an existing Intent pin in %s while creating',
      async (field) => {
        const { environment } = createMemoryEnvironment()
        await environment.writeFile(
          '/app/package.json',
          JSON.stringify({ [field]: { '@tanstack/intent': '0.4.0' } }),
        )
        await create(environment, {
          ...simpleOptions,
          targetDir: '/app',
          intent: true,
          install: false,
        })
        const pkg = JSON.parse(await environment.readFile('/app/package.json'))
        expect(pkg[field]['@tanstack/intent']).toBe('0.4.0')
        const other =
          field === 'dependencies' ? 'devDependencies' : 'dependencies'
        expect(pkg[other]).not.toHaveProperty('@tanstack/intent')
      },
    )
    it('does not add Intent when disabled', async () => {
      const { environment, output } = createMemoryEnvironment()
      await create(environment, { ...simpleOptions, intent: false })
      const pkg = JSON.parse(output.files['/package.json'])
      expect(pkg.devDependencies).not.toHaveProperty('@tanstack/intent')
      expect(pkg).not.toHaveProperty('intent')
    })
    it('keeps the existing policy through add-to-app generation and merge', async () => {
      const generated = createMemoryEnvironment()
      await create(
        generated.environment,
        { ...simpleOptions, targetDir: '/app', intent: true },
        { existingProject: true },
      )
      const { environment, output } = createMemoryEnvironment()
      environment.startRun()
      const intent = { skills: [], exclude: ['private'] }
      await environment.writeFile(
        '/app/package.json',
        JSON.stringify({ intent }),
      )
      await writeAddonFiles(
        environment,
        '/app',
        {
          files: {
            '/app/package.json': generated.output.files['/app/package.json'],
          },
          deletedFiles: [],
        },
        true,
      )
      expect(
        JSON.parse(await environment.readFile('/app/package.json')).intent,
      ).toEqual(intent)
      environment.finishRun()
    })
  },
)
