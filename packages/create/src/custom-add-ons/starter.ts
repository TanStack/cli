import { readFile } from 'node:fs/promises'
import { existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { StarterCompiledSchema } from '../types.js'
import { createIgnore } from '../file-helpers.js'
import {
  compareFilesRecursively,
  createAppOptionsFromPersisted,
  createPackageAdditions,
  readCurrentProjectOptions,
  runCreateApp,
} from './shared.js'

import type { PersistedOptions } from '../config-file.js'
import type {
  Environment,
  Options,
  Starter,
  StarterCompiled,
  StarterInfo,
} from '../types.js'

const INFO_FILE = 'template-info.json'
const LEGACY_INFO_FILE = 'starter-info.json'
const COMPILED_FILE = 'template.json'
const LEGACY_COMPILED_FILE = 'starter.json'

export async function readOrGenerateStarterInfo(
  options: PersistedOptions,
): Promise<StarterInfo> {
  const info = existsSync(INFO_FILE)
    ? JSON.parse((await readFile(INFO_FILE)).toString())
    : existsSync(LEGACY_INFO_FILE)
      ? JSON.parse((await readFile(LEGACY_INFO_FILE)).toString())
    : {
        id: `${options.projectName}-template`,
        name: `${options.projectName} Template`,
        version: '0.0.1',
        description: 'Project template',
        author: 'Jane Smith <jane.smith@example.com>',
        license: 'MIT',
        link: `https://github.com/jane-smith/${options.projectName}-template`,
        shadcnComponents: [],
        framework: options.framework,
        mode: options.mode!,
        routes: [],
        warning: '',
        type: 'starter',
        packageAdditions: {
          scripts: {},
          dependencies: {},
          devDependencies: {},
        },
        dependsOn: options.chosenAddOns,
        typescript: true,
      }

  if (!info.version) {
    info.version = '0.0.1'
  }

  return info
}

async function loadCurrentStarterInfo(environment: Environment) {
  const persistedOptions = await readCurrentProjectOptions(environment)
  const info = await readOrGenerateStarterInfo(persistedOptions)

  const output = await runCreateApp(
    (await createAppOptionsFromPersisted(
      persistedOptions,
    )) as Required<Options>,
  )

  return { info, output }
}

export async function updateStarterInfo(environment: Environment) {
  const { info, output } = await loadCurrentStarterInfo(environment)

  const generatedPackageJson =
    output.files['./package.json'] ?? output.files['package.json']
  if (!generatedPackageJson) {
    throw new Error('Unable to find generated package.json in template output')
  }

  info.packageAdditions = createPackageAdditions(
    JSON.parse(generatedPackageJson),
    JSON.parse((await readFile('package.json')).toString()),
  )

  writeFileSync(INFO_FILE, JSON.stringify(info, null, 2))
  writeFileSync(LEGACY_INFO_FILE, JSON.stringify(info, null, 2))
}

export async function compileStarter(environment: Environment) {
  const { info, output } = await loadCurrentStarterInfo(environment)

  const ignore = createIgnore(process.cwd())
  const changedFiles: Record<string, string> = {}
  await compareFilesRecursively('.', ignore, output.files, changedFiles)

  const deletedFiles: Array<string> = []
  for (const file of Object.keys(output.files)) {
    if (!existsSync(resolve(process.cwd(), file))) {
      deletedFiles.push(file)
    }
  }

  const compiledInfo: StarterCompiled = {
    ...info,
    files: changedFiles,
    deletedFiles,
  }

  writeFileSync(COMPILED_FILE, JSON.stringify(compiledInfo, null, 2))
  writeFileSync(LEGACY_COMPILED_FILE, JSON.stringify(compiledInfo, null, 2))
}

export async function initStarter(environment: Environment) {
  await updateStarterInfo(environment)
  await compileStarter(environment)
}

export async function loadStarter(url: string): Promise<Starter> {
  const absoluteLocalPath = resolve(process.cwd(), url)
  const localPath = existsSync(url)
    ? url
    : existsSync(absoluteLocalPath)
      ? absoluteLocalPath
      : undefined

  const jsonContent = localPath
    ? JSON.parse((await readFile(localPath)).toString())
    : await (await fetch(url)).json()

  const checked = StarterCompiledSchema.safeParse(jsonContent)
  if (!checked.success) {
    throw new Error(`Invalid starter: ${url}`)
  }

  const starter = checked.data
  starter.id = localPath ?? url
  return {
    ...starter,
    getFiles: () => Promise.resolve(Object.keys(starter.files)),
    getFileContents: (path: string) => Promise.resolve(starter.files[path]),
    getDeletedFiles: () => Promise.resolve(starter.deletedFiles),
  }
}
