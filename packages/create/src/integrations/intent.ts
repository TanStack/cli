import { resolve } from 'node:path'

import {
  INTENT_PACKAGE,
  intentCommand,
  packageManagerExecute,
} from '../package-manager.js'

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
  s.start('Setting up TanStack Intent skill discovery...')
  environment.startStep({
    id: 'setup-intent',
    type: 'command',
    message: 'Setting up TanStack Intent skill discovery...',
  })

  try {
    const packageJsonPath = resolve(targetDir, 'package.json')
    if (environment.exists(packageJsonPath)) {
      const packageJSON = JSON.parse(
        await environment.readFile(packageJsonPath),
      )
      if (!packageJSON.intent?.skills) {
        packageJSON.intent = {
          ...packageJSON.intent,
          skills: ['@tanstack/*'],
        }
        await environment.writeFile(
          packageJsonPath,
          JSON.stringify(packageJSON, null, 2),
        )
      }
    }

    await packageManagerExecute(
      environment,
      resolve(targetDir),
      options.packageManager,
      INTENT_PACKAGE,
      ['install'],
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
      `Continuing without it. You can run it later with: ${intentCommand(options.packageManager, ['install'])}\n\n${message}`,
    )
  }
}
