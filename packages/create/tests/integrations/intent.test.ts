import { describe, expect, it } from 'vitest'
import { createMemoryEnvironment } from '../../src/environment.js'
import { setupIntent } from '../../src/integrations/intent.js'
import type { Options } from '../../src/types.js'

const options: Options = {
  projectName: 'test',
  targetDir: '/test',
  framework: {
    id: 'test',
    name: 'Test',
    description: '',
    version: '1.0.0',
    basePackageJSON: {},
    optionalPackages: {},
    supportedModes: {},
    getFiles: async () => [],
    getFileContents: async () => '',
    getDeletedFiles: async () => [],
    getAddOns: () => [],
  },
  mode: 'file-router',
  packageManager: 'pnpm',
  typescript: true,
  tailwind: false,
  git: false,
  intent: true,
  install: true,
  chosenAddOns: [],
  addOnOptions: {},
}

describe('intent', () => {
  it('skips when disabled', async () => {
    const { environment, output } = createMemoryEnvironment()
    environment.startRun()
    await setupIntent(environment, '/test', { ...options, intent: false })
    environment.finishRun()
    expect(output.commands).toEqual([])
  })
  it('runs install when dependencies are installed', async () => {
    const { environment, output } = createMemoryEnvironment()
    environment.startRun()
    await setupIntent(environment, '/test', options)
    environment.finishRun()
    expect(output.commands).toEqual([
      { command: 'pnpm', args: ['dlx', '@tanstack/intent', 'install'] },
    ])
  })
  it('skips the command and reports no configured step without dependencies', async () => {
    const { environment, output } = createMemoryEnvironment()
    const messages: Array<string> = []
    environment.finishStep = (_id, message) => {
      messages.push(message)
    }
    environment.startRun()
    await setupIntent(environment, '/test', { ...options, install: false })
    environment.finishRun()
    expect(output.commands).toEqual([])
    expect(messages).toEqual([
      'TanStack Intent setup skipped: dependencies not installed',
    ])
  })
})
