import { describe, expect, it } from 'vitest'

import { createMemoryEnvironment } from '../src/environment.js'
import { createTemplateFile } from '../src/template-file.js'
import { FILE_ROUTER } from '../src/constants.js'

import type { AddOn, Integration, Options } from '../src/types.js'

const simpleOptions = {
  projectName: 'test',
  targetDir: '/test',
  framework: {
    id: 'test',
    name: 'Test',
  },
  chosenAddOns: [],
  packageManager: 'pnpm',
  typescript: true,
  tailwind: true,
  mode: FILE_ROUTER,
} as unknown as Options

describe('createTemplateFile', () => {
  it('should template a simple file', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, simpleOptions)
    environment.startRun()
    await templateFile('test.ts', 'let a = 1')
    environment.finishRun()

    expect(output.files['/test/test.ts'].trim()).toEqual('let a = 1')
  })

  it('should handle ignore files', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
    } as unknown as Options)
    environment.startRun()
    await templateFile('test.ts.ejs', '<% ignoreFile() %>let a = 1')
    environment.finishRun()

    expect(output.files['/test/test.ts']).toBeUndefined()
  })

  it('should handle append files', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, simpleOptions)
    environment.startRun()
    await templateFile('test.txt.ejs', 'Line 1\n')
    await templateFile('test.txt.append', 'Line 2\n')
    environment.finishRun()

    expect(output.files['/test/test.txt']).toEqual('Line 1\nLine 2\n')
  })

  it('should handle enabled add-ons', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
      chosenAddOns: [
        {
          id: 'test1',
          name: 'Test 1',
        },
        {
          id: 'test2',
          name: 'Test 2',
        },
      ] as Array<AddOn>,
    })
    environment.startRun()
    await templateFile(
      'test.txt.ejs',
      "Addons: <%= Object.keys(addOnEnabled).join(', ') %>",
    )
    environment.finishRun()

    expect(output.files['/test/test.txt']).toEqual('Addons: test1, test2')
  })

  it('should handle relative paths', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, simpleOptions)
    environment.startRun()
    await templateFile(
      'src/test/test.txt.ejs',
      "import { foo } from '<%= relativePath('foo.ts') %>'",
    )
    environment.finishRun()

    expect(output.files['/test/src/test/test.txt']).toEqual(
      "import { foo } from '../../foo.ts'",
    )
  })

  it('should handle routes', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
      chosenAddOns: [
        {
          id: 'test',
          name: 'Test',
          routes: [
            {
              path: '/test',
              name: 'Test',
              url: '/test',
              jsName: 'test',
            },
          ],
        } as AddOn,
      ],
    })

    environment.startRun()
    await templateFile(
      'test.txt.ejs',
      "<%= routes.map((route) => route.url).join(', ') %>",
    )
    environment.finishRun()

    expect(output.files['/test/test.txt']).toEqual('/test')
  })

  it('should handle integrations', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
      chosenAddOns: [
        {
          id: 'test',
          name: 'Test',
          integrations: [
            {
              type: 'header-user',
              path: '/test',
              jsName: 'test',
            } as Integration,
          ],
        } as AddOn,
      ],
    })

    environment.startRun()
    await templateFile(
      'test.txt.ejs',
      "<%= integrations.map((integration) => integration.path).join(', ') %>",
    )
    environment.finishRun()

    expect(output.files['/test/test.txt']).toEqual('/test')
  })

  it('should handle package manager', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, simpleOptions)
    environment.startRun()
    await templateFile(
      'foo.txt.ejs',
      "<%= getPackageManagerAddScript('foo') %>",
    )
    await templateFile(
      'foo-dev.txt.ejs',
      "<%= getPackageManagerAddScript('foo', true) %>",
    )
    await templateFile(
      'run-dev.txt.ejs',
      "<%= getPackageManagerRunScript('dev') %>",
    )
    environment.finishRun()

    expect(output.files['/test/foo.txt']).toEqual('pnpm add foo')
    expect(output.files['/test/foo-dev.txt']).toEqual('pnpm add foo --dev')
    expect(output.files['/test/run-dev.txt']).toEqual('pnpm dev')
  })

  it('should handle package manager execute script', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, simpleOptions)
    environment.startRun()
    await templateFile(
      'exec.txt.ejs',
      "<%= getPackageManagerExecuteScript('shadcn', ['add', 'button']) %>",
    )
    environment.finishRun()

    expect(output.files['/test/exec.txt']).toEqual('pnpm dlx shadcn add button')
  })

  it('should normalize src js files to ts when typescript is enabled', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, simpleOptions)

    environment.startRun()
    await templateFile('src/lib/auth.js', 'export const auth = true')
    await templateFile('src/lib/auth-client.js', 'export const authClient = true')
    await templateFile('src/db.js', 'export const db = true')
    await templateFile('vite.config.js', 'export default {}')
    environment.finishRun()

    expect(output.files['/test/src/lib/auth.ts']).toBeDefined()
    expect(output.files['/test/src/lib/auth-client.ts']).toBeDefined()
    expect(output.files['/test/src/db.ts']).toBeDefined()
    expect(output.files['/test/vite.config.js']).toBeDefined()
  })

  it('should normalize src jsx files to tsx when typescript is enabled', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, simpleOptions)

    environment.startRun()
    await templateFile('src/components/auth-button.jsx', 'export default function AuthButton() { return <button>Auth</button> }')
    environment.finishRun()

    expect(output.files['/test/src/components/auth-button.tsx']).toBeDefined()
  })
})
