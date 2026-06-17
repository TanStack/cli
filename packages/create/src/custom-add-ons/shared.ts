import { readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createApp } from '../create-app.js'
import { createMemoryEnvironment } from '../environment.js'
import { finalizeAddOns, populateAddOnOptionsDefaults } from '../add-ons.js'
import { getFrameworkById } from '../frameworks.js'
import { readConfigFileFromEnvironment } from '../config-file.js'
import { readFileHelper, toCleanPath } from '../file-helpers.js'
import { loadStarter } from '../custom-add-ons/starter.js'

import type { Environment, Options, SerializedOptions } from '../types.js'
import type { PersistedOptions } from '../config-file.js'

export function createPackageAdditions(
  originalPackageJson: Record<string, any>,
  currentPackageJson: Record<string, any>,
) {
  const packageAdditions: Record<string, any> = {}

  const scripts: Record<string, any> = {}
  for (const script of Object.keys(currentPackageJson.scripts || {})) {
    if (
      originalPackageJson.scripts[script] !== currentPackageJson.scripts[script]
    ) {
      scripts[script] = currentPackageJson.scripts[script]
    }
  }
  packageAdditions.scripts = Object.keys(scripts).length ? scripts : undefined

  const dependencies: Record<string, string> = {}
  for (const dependency of Object.keys(currentPackageJson.dependencies || {})) {
    if (
      originalPackageJson.dependencies[dependency] !==
      currentPackageJson.dependencies[dependency]
    ) {
      dependencies[dependency] = currentPackageJson.dependencies[dependency]
    }
  }
  packageAdditions.dependencies = Object.keys(dependencies).length
    ? dependencies
    : undefined

  const devDependencies: Record<string, string> = {}
  for (const dependency of Object.keys(
    currentPackageJson.devDependencies || {},
  )) {
    if (
      originalPackageJson.devDependencies[dependency] !==
      currentPackageJson.devDependencies[dependency]
    ) {
      devDependencies[dependency] =
        currentPackageJson.devDependencies[dependency]
    }
  }
  packageAdditions.devDependencies = Object.keys(devDependencies).length
    ? devDependencies
    : undefined

  return packageAdditions
}

export async function createAppOptionsFromPersisted(
  json: PersistedOptions,
): Promise<Options> {
  /* eslint-disable unused-imports/no-unused-vars */
  const { version, ...rest } = json
  /* eslint-enable unused-imports/no-unused-vars */
  const framework = getFrameworkById(rest.framework)
  const chosenAddOns = await finalizeAddOns(framework!, json.mode!, [
    ...json.chosenAddOns,
  ])
  return {
    ...rest,
    mode: json.mode!,
    projectName: json.projectName!,
    typescript: json.typescript!,
    tailwind: json.tailwind!,
    git: json.git!,
    packageManager: json.packageManager!,
    targetDir: '',
    framework: framework!,
    starter: json.starter ? await loadStarter(json.starter) : undefined,
    chosenAddOns,
    addOnOptions: populateAddOnOptionsDefaults(chosenAddOns),
    intent: json.intent ?? false,
  }
}

export function createSerializedOptionsFromPersisted(
  json: PersistedOptions,
): SerializedOptions {
  /* eslint-disable unused-imports/no-unused-vars */
  const { version, ...rest } = json
  /* eslint-enable unused-imports/no-unused-vars */
  return {
    ...rest,
    mode: json.mode!,
    projectName: json.projectName!,
    typescript: json.typescript!,
    tailwind: json.tailwind!,
    git: json.git!,
    packageManager: json.packageManager!,
    targetDir: '',
    framework: json.framework,
    starter: json.starter,
    addOnOptions: {},
    intent: json.intent ?? false,
  }
}

export async function runCreateApp(options: Required<Options>) {
  const { environment, output } = createMemoryEnvironment()

  const targetDir = resolve(process.cwd())

  await createApp(environment, {
    ...options,
    targetDir,
  })

  output.files = Object.fromEntries(
    Object.entries(output.files).map(([key, value]) => [
      toCleanPath(key, targetDir),
      value,
    ]),
  )

  return output
}

export async function compareFilesRecursively(
  path: string,
  ignore: (filePath: string) => boolean,
  original: Record<string, string>,
  changedFiles: Record<string, string>,
) {
  const files = await readdir(path, { withFileTypes: true })
  for (const file of files) {
    const filePath = `${path}/${file.name}`
    if (!ignore(file.name)) {
      if (file.isDirectory()) {
        await compareFilesRecursively(filePath, ignore, original, changedFiles)
      } else {
        const contents = await readFileHelper(filePath)
        if (!original[filePath] || original[filePath] !== contents) {
          changedFiles[filePath] = contents
        }
      }
    }
  }
}

export async function readCurrentProjectOptions(environment: Environment) {
  const persistedOptions = await readConfigFileFromEnvironment(
    environment,
    process.cwd(),
  )
  if (!persistedOptions) {
    environment.error(
      'There is no .cta.json file in your project.',
      `This is probably because this was created with an older version of create-tsrouter-app.`,
    )
    process.exit(1)
  }
  return persistedOptions
}
