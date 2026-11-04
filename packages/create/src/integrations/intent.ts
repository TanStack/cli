import { resolve } from 'node:path'

import { getIntentExecuteCommand, intentCommand } from '../package-manager.js'

import type { Environment, Options } from '../types.js'

export async function setupIntent(
  environment: Environment,
  targetDir: string,
  options: Options,
) {
  if (!options.intent) {
    return false
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
    return false
  }

  const s = environment.spinner()
  s.start('Setting up TanStack Intent skill discovery...')
  environment.startStep({
    id: 'setup-intent',
    type: 'command',
    message: 'Setting up TanStack Intent skill discovery...',
  })

  try {
    const { command, args } = getIntentExecuteCommand(options.packageManager, [
      'install',
    ])
    const result = await environment.execute(command, args, resolve(targetDir))
    const message = result.failed
      ? 'TanStack Intent setup failed'
      : 'TanStack Intent configured'
    environment.finishStep('setup-intent', message)
    s.stop(message)
    return !result.failed
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
    return false
  }
}
