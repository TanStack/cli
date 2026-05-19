import { resolve } from 'node:path'

import { packageManagerExecute } from '../package-manager.js'

import type { Environment, Options } from '../types.js'

export async function setupIntent(
  environment: Environment,
  targetDir: string,
  options: Options,
) {
  if (!options.intent) {
    return
  }

  const s = environment.spinner()
  s.start('Setting up TanStack Intent skill mappings...')
  environment.startStep({
    id: 'setup-intent',
    type: 'command',
    message: 'Setting up TanStack Intent skill mappings...',
  })

  try {
    await packageManagerExecute(
      environment,
      resolve(targetDir),
      options.packageManager,
      '@tanstack/intent',
      ['install', '--map'],
    )
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
      `Continuing without it. You can run it later with: npx @tanstack/intent install\n\n${message}`,
    )
  }
}
