import { describe, expect, it } from 'vitest'

import { createMemoryEnvironment } from '../../src/environment.js'
import { setupIntent } from '../../src/integrations/intent.js'
import type { Options } from '../../src/types.js'

describe('intent', () => {
  it('should skip if intent is disabled', async () => {
    const { environment, output } = createMemoryEnvironment()
    environment.startRun()
    await setupIntent(environment, '/test', {
      intent: false,
      packageManager: 'bun',
    } as Options)
    environment.finishRun()

    expect(output.commands).toEqual([])
  })

  it('should write intent.skills and run install', async () => {
    const { environment, output } = createMemoryEnvironment()
    environment.startRun()
    await environment.writeFile(
      '/package.json',
      JSON.stringify({ name: 'test' }),
    )
    await setupIntent(environment, '/', {
      intent: true,
      packageManager: 'bun',
    } as Options)
    environment.finishRun()

    expect(JSON.parse(output.files['/package.json']).intent).toEqual({
      skills: ['@tanstack/*'],
    })
    expect(output.commands).toEqual([
      {
        command: 'bunx',
        args: ['--bun', '@tanstack/intent@latest', 'install'],
      },
    ])
  })
})
