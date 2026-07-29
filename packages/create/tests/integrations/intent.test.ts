import { describe, expect, it } from 'vitest'

import { createMemoryEnvironment } from '../../src/environment.js'
import { setupIntent } from '../../src/integrations/intent.js'

import type { Options } from '../../src/types.js'

describe('intent', () => {
  it('should skip if intent is not enabled', async () => {
    const { environment, output } = createMemoryEnvironment()
    environment.startRun()
    await setupIntent(environment, '/test', {
      packageManager: 'pnpm',
      intent: false,
      projectName: 'test',
      typescript: true,
      spinner: () => ({
        start: () => {},
        stop: () => {},
      }),
    } as unknown as Options)
    environment.finishRun()

    expect(output.commands).toEqual([])
  })

  it('should run the intent install command when dependencies are installed', async () => {
    const { environment, output } = createMemoryEnvironment()
    environment.startRun()
    await setupIntent(environment, '/test', {
      packageManager: 'pnpm',
      intent: true,
      install: true,
      projectName: 'test',
      typescript: true,
      spinner: () => ({
        start: () => {},
        stop: () => {},
      }),
    } as unknown as Options)
    environment.finishRun()

    expect(output.commands).toEqual([
      {
        command: 'pnpm',
        args: ['dlx', '@tanstack/intent', 'install', '--map'],
      },
    ])
  })

  it('should skip the intent install command when dependency install is skipped', async () => {
    const { environment, output } = createMemoryEnvironment()
    environment.startRun()
    await setupIntent(environment, '/test', {
      packageManager: 'pnpm',
      intent: true,
      install: false,
      projectName: 'test',
      typescript: true,
      spinner: () => ({
        start: () => {},
        stop: () => {},
      }),
    } as unknown as Options)
    environment.finishRun()

    expect(output.commands).toEqual([])
  })
})
