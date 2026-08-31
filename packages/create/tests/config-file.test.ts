import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fs, vol } from 'memfs'
import { resolve } from 'node:path'

import {
  readConfigFileFromEnvironment,
  writeConfigFileToEnvironment,
} from '../src/config-file.js'
import { CONFIG_FILE } from '../src/constants.js'
import { createMemoryEnvironment } from '../src/environment.js'
import type { AddOn, Environment, Framework, Options } from '../src/types.js'

vi.mock('node:fs', () => fs)
vi.mock('node:fs/promises', () => fs.promises)

beforeEach(() => {
  vol.reset()
})

describe('writeConfigFile', () => {
  it('should write the config file', async () => {
    const targetDir = 'test-dir'
    const options = {
      framework: {
        id: 'react',
        getAddOns: () => [],
      } as unknown as Framework,
      chosenAddOns: [
        {
          id: 'add-on-1',
          description: 'Add-on 1',
          modes: ['file-router'],
        } as AddOn,
      ],
      targetDir,
      envVarValues: {
        API_SECRET: 'do-not-persist',
      },
    } as unknown as Options
    const persistedOptions = {
      version: 1,
      framework: options.framework.id,
      chosenAddOns: options.chosenAddOns.map((addOn) => addOn.id),
    }
    const env = {
      writeFile: (path, optionsString) => {
        expect(path).toEqual(resolve(targetDir, CONFIG_FILE))
        expect(optionsString).toEqual(JSON.stringify(persistedOptions, null, 2))
      },
    } as Environment
    await writeConfigFileToEnvironment(env, options)
  })
})

describe('readConfigFileFromEnvironment', () => {
  it('should read the config file', async () => {
    const targetDir = 'test-dir'
    const persistedOptions = {
      version: 1,
      framework: 'react',
      chosenAddOns: ['add-on-1'],
    }
    const { environment } = createMemoryEnvironment()
    environment.writeFile(
      resolve(targetDir, CONFIG_FILE),
      JSON.stringify(persistedOptions, null, 2),
    )
    const config = await readConfigFileFromEnvironment(environment, targetDir)
    expect(config).toEqual({ ...persistedOptions, bundler: 'vite' })
  })

  it('should upgrade old config files', async () => {
    const targetDir = 'test-dir'
    const persistedOptions = {
      framework: 'react',
      projectName: 'foo',
      typescript: false,
      tailwind: false,
      packageManager: 'pnpm',
      toolchain: 'none',
      mode: 'code-router',
      git: true,
      variableValues: {},
      envVarValues: {
        API_SECRET: 'legacy-secret',
      },
      version: 1,
      existingAddOns: [],
    }
    const { output, environment } = createMemoryEnvironment()
    environment.writeFile(
      resolve(targetDir, CONFIG_FILE),
      JSON.stringify(persistedOptions, null, 2),
    )
    const config = await readConfigFileFromEnvironment(environment, targetDir)

    environment.finishRun()

    expect(config).toEqual({
      framework: 'react',
      bundler: 'vite',
      projectName: 'foo',
      typescript: false,
      tailwind: false,
      packageManager: 'pnpm',
      chosenAddOns: [],
      git: true,
      mode: 'code-router',
      version: 1,
    })
  })
})
