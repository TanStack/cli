import { resolve } from 'node:path'
import { ensureIntentPolicy } from '../intent-policy.js'

import { getIntentExecuteCommand, intentCommand } from '../package-manager.js'

import type { Environment, Options } from '../types.js'

export async function setupIntent(
  environment: Environment,
  targetDir: string,
  options: Options,
) {
  if (!options.intent) {
    return
  }

  if (options.install === false) {
    environment.startStep({
      id: 'setup-intent',
      type: 'info',
      message: 'Skipping TanStack Intent setup...',
    })
    environment.finishStep(
      'setup-intent',
      'TanStack Intent setup skipped: dependencies not installed',
    )
    return
  }

  const s = environment.spinner()
  s.start('Setting up TanStack Intent skill discovery...')
  environment.startStep({
    id: 'setup-intent',
    type: 'command',
    message: 'Setting up TanStack Intent skill discovery...',
  })

  try {
    await ensureIntentPolicy(environment, resolve(targetDir))
    const { command, args } = getIntentExecuteCommand(options.packageManager, [
      'install',
    ])
    await environment.execute(command, args, resolve(targetDir))
    environment.finishStep('setup-intent', 'TanStack Intent configured')
    s.stop('TanStack Intent configured')
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error'
    environment.finishStep(
      'setup-intent',
      `TanStack Intent setup skipped: ${message}`,
    )
    s.stop('TanStack Intent setup skipped')
    environment.warn(
      'TanStack Intent setup failed',
      `Continuing without it. You can run it later with: ${intentCommand(options.packageManager, ['install'])}\n\n${message}`,
    )
  }
}
