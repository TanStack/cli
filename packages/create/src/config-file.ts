import { resolve } from 'node:path'

import { CONFIG_FILE } from './constants.js'
import { createDefaultEnvironment } from './environment.js'

import type { Environment, Options } from './types.js'

export type PersistedOptions = Omit<
  Partial<Options>,
  | 'addOns'
  | 'chosenAddOns'
  | 'envVarValues'
  | 'framework'
  | 'starter'
  | 'targetDir'
> & {
  framework: string
  version: number
  chosenAddOns: Array<string>
  starter?: string
}

function createPersistedOptions(options: Options): PersistedOptions {
  /* eslint-disable unused-imports/no-unused-vars */
  const { chosenAddOns, envVarValues, framework, targetDir, ...rest } = options
  /* eslint-enable unused-imports/no-unused-vars */
  return {
    ...rest,
    version: 1,
    framework: options.framework.id,
    chosenAddOns: options.chosenAddOns.map((addOn) => addOn.id),
    starter: options.starter?.id ?? undefined,
  }
}

export async function writeConfigFileToEnvironment(
  environment: Environment,
  options: Options,
) {
  await environment.writeFile(
    resolve(options.targetDir, CONFIG_FILE),
    JSON.stringify(createPersistedOptions(options), null, 2),
  )
}

export async function readConfigFileFromEnvironment(
  environment: Environment,
  targetDir: string,
): Promise<PersistedOptions | null> {
  try {
    const configFile = resolve(targetDir, CONFIG_FILE)
    const config = await environment.readFile(configFile)

    const originalJSON = JSON.parse(config)

    // Look for markers out outdated config files and upgrade the format on the fly (it will be written in the updated version after we add add-ons)
    if (originalJSON.existingAddOns) {
      if (originalJSON.framework === 'react-cra') {
        originalJSON.framework = 'react'
      }
      originalJSON.chosenAddOns = originalJSON.existingAddOns
      delete originalJSON.existingAddOns
      delete originalJSON.addOns
      if (originalJSON.toolchain && originalJSON.toolchain !== 'none') {
        originalJSON.chosenAddOns.push(originalJSON.toolchain)
      }
      delete originalJSON.toolchain
      delete originalJSON.variableValues
    }

    if (originalJSON.framework === 'react-cra') {
      originalJSON.framework = 'react'
    }

    delete originalJSON.envVarValues

    return originalJSON
  } catch {
    return null
  }
}

export async function readConfigFile(
  targetDir: string,
): Promise<PersistedOptions | null> {
  return readConfigFileFromEnvironment(createDefaultEnvironment(), targetDir)
}
