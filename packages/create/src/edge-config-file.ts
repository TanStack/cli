import { CONFIG_FILE } from './constants.js'
import { joinPaths } from './edge-path.js'

import type { Environment, Options } from './types.js'

export type PersistedOptions = Omit<
  Partial<Options>,
  'addOns' | 'chosenAddOns' | 'framework' | 'starter' | 'targetDir'
> & {
  framework: string
  version: number
  chosenAddOns: Array<string>
  starter?: string
}

function createPersistedOptions(options: Options): PersistedOptions {
  const { chosenAddOns, framework, targetDir: _targetDir, ...rest } = options
  return {
    ...rest,
    version: 1,
    framework: framework.id,
    chosenAddOns: chosenAddOns.map((addOn) => addOn.id),
    starter: options.starter?.id ?? undefined,
  }
}

export async function writeConfigFileToEnvironment(
  environment: Environment,
  options: Options,
) {
  await environment.writeFile(
    joinPaths(options.targetDir, CONFIG_FILE),
    JSON.stringify(createPersistedOptions(options), null, 2),
  )
}
