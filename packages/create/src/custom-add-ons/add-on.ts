import { readFile, watch } from 'node:fs/promises'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'

import { AddOnCompiledSchema } from '../types.js'
import { createIgnore, recursivelyGatherFiles } from '../file-helpers.js'
import {
  compareFilesRecursively,
  createAppOptionsFromPersisted,
  createPackageAdditions,
  readCurrentProjectOptions,
  runCreateApp,
} from './shared.js'

import type { PersistedOptions } from '../config-file.js'
import type {
  AddOn,
  AddOnCompiled,
  AddOnInfo,
  Environment,
  Options,
} from '../types.js'

const ADD_ON_DIR = '.add-on'

export const ADD_ON_IGNORE_FILES: Array<string> = [
  'main.jsx',
  'App.jsx',
  'main.tsx',
  'App.tsx',
  'routeTree.gen.ts',
]

const INFO_FILE = '.add-on/info.json'
const COMPILED_FILE = 'add-on.json'

const ASSETS_DIR = 'assets'

const ADD_ON_DEV_IGNORE_PREFIXES = [
  '.add-on/',
  '.git/',
  'node_modules/',
  '.turbo/',
  'dist/',
]

function shouldIgnoreDevPath(path: string) {
  const normalized = path.replace(/\\/g, '/')
  if (normalized === COMPILED_FILE) return true
  return ADD_ON_DEV_IGNORE_PREFIXES.some((prefix) =>
    normalized.startsWith(prefix),
  )
}

export function camelCase(str: string) {
  return str
    .split(/(\.|-|\/)/)
    .filter((part) => /^[a-zA-Z]+$/.test(part))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

export function templatize(routeCode: string, routeFile: string) {
  let code = routeCode

  // Replace the import
  code = code.replace(
    /import { createFileRoute } from ['"]@tanstack\/react-router['"]/g,
    `import { createFileRoute } from '@tanstack/react-router'`,
  )

  // Extract route path and definition, then transform the route declaration
  const routeMatch = code.match(
    /export\s+const\s+Route\s*=\s*createFileRoute\(['"]([^'"]+)['"]\)\s*\(\{([^}]+)\}\)/,
  )

  let path = ''

  if (routeMatch) {
    const fullMatch = routeMatch[0]
    path = routeMatch[1]
    const routeDefinition = routeMatch[2]
    code = code.replace(
      fullMatch,
      `export const Route = createFileRoute('${path}')({${routeDefinition}})`,
    )
  } else {
    console.error(`No route found in the file: ${routeFile}`)
  }

  const name = basename(path)
    .replace('.tsx', '')
    .replace(/^demo/, '')
    .replace('.', ' ')
    .trim()

  const jsName = camelCase(basename(path))

  return { url: path, code, name, jsName }
}

export async function validateAddOnSetup(environment: Environment) {
  const options = await readCurrentProjectOptions(environment)

  if (options.mode === 'code-router') {
    environment.error(
      'This project is using code-router mode.',
      'To create an add-on, the project must not use code-router mode.',
    )
    process.exit(1)
  }
}

export async function readOrGenerateAddOnInfo(
  options: PersistedOptions,
): Promise<AddOnInfo> {
  const info = existsSync(INFO_FILE)
    ? JSON.parse((await readFile(INFO_FILE)).toString())
    : ({
        id: `${options.projectName}-add-on`,
        name: `${options.projectName}-add-on`,
        version: '0.0.1',
        description: 'Add-on',
        author: 'Jane Smith <jane.smith@example.com>',
        license: 'MIT',
        link: `https://github.com/jane-smith/${options.projectName}-add-on`,
        shadcnComponents: [],
        framework: options.framework,
        modes: [options.mode],
        routes: [],
        warning: '',
        phase: 'add-on',
        type: 'add-on',
        packageAdditions: {
          scripts: {},
          dependencies: {},
          devDependencies: {},
        },
        dependsOn: options.chosenAddOns,
      } as AddOnInfo)

  if (!info.version) {
    info.version = '0.0.1'
  }

  return info
}

export async function generateProject(persistedOptions: PersistedOptions) {
  const info = await readOrGenerateAddOnInfo(persistedOptions)

  const output = await runCreateApp(
    (await createAppOptionsFromPersisted(
      persistedOptions,
    )) as Required<Options>,
  )

  return { info, output }
}

export async function buildAssetsDirectory(
  output: {
    files: Record<string, string>
  },
  info: AddOnInfo,
) {
  const assetsDir = resolve(ADD_ON_DIR, ASSETS_DIR)
  const ignore = createIgnore(process.cwd())

  if (!existsSync(assetsDir)) {
    const changedFiles: Record<string, string> = {}
    await compareFilesRecursively('.', ignore, output.files, changedFiles)

    for (const file of Object.keys(changedFiles).filter(
      (file) => !ADD_ON_IGNORE_FILES.includes(basename(file)),
    )) {
      mkdirSync(dirname(resolve(assetsDir, file)), {
        recursive: true,
      })
      if (file.includes('/routes/')) {
        const { url, code, name, jsName } = templatize(changedFiles[file], file)
        info.routes ||= []
        if (!info.routes.find((r) => r.url === url)) {
          info.routes.push({
            url,
            name,
            jsName,
            path: file,
          })
        }
        writeFileSync(resolve(assetsDir, `${file}.ejs`), code)
      } else {
        writeFileSync(resolve(assetsDir, file), changedFiles[file])
      }
    }
  }
}

export async function updateAddOnInfo(environment: Environment) {
  const { info, output } = await generateProject(
    await readCurrentProjectOptions(environment),
  )

  info.packageAdditions = createPackageAdditions(
    JSON.parse(output.files['./package.json']),
    JSON.parse((await readFile('package.json')).toString()),
  )

  await buildAssetsDirectory(output, info)

  mkdirSync(resolve(dirname(INFO_FILE)), { recursive: true })
  writeFileSync(INFO_FILE, JSON.stringify(info, null, 2))
}

export async function compileAddOn(environment: Environment) {
  const info = await readOrGenerateAddOnInfo(
    await readCurrentProjectOptions(environment),
  )

  const assetsDir = resolve(ADD_ON_DIR, ASSETS_DIR)

  const compiledInfo: AddOnCompiled = {
    ...info,
    files: await recursivelyGatherFiles(assetsDir),
    deletedFiles: [],
  }

  writeFileSync(COMPILED_FILE, JSON.stringify(compiledInfo, null, 2))
}

export async function initAddOn(environment: Environment) {
  await validateAddOnSetup(environment)
  await updateAddOnInfo(environment)
  await compileAddOn(environment)
}

export async function devAddOn(environment: Environment) {
  await initAddOn(environment)

  environment.info(
    'Add-on dev mode is running.',
    'Watching project files and recompiling add-on output on changes. Press Ctrl+C to stop.',
  )

  const abortController = new AbortController()
  let debounceTimeout: ReturnType<typeof setTimeout> | undefined

  const rerun = async () => {
    try {
      await updateAddOnInfo(environment)
      await compileAddOn(environment)
      environment.info('Add-on updated.', 'Compiled add-on.json and refreshed .add-on')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      environment.error('Failed to rebuild add-on.', message)
    }
  }

  process.once('SIGINT', () => {
    abortController.abort()
  })

  try {
    for await (const event of watch(process.cwd(), {
      recursive: true,
      signal: abortController.signal,
    })) {
      const file = event.filename?.toString()
      if (!file || shouldIgnoreDevPath(file)) continue

      if (debounceTimeout) {
        clearTimeout(debounceTimeout)
      }

      debounceTimeout = setTimeout(() => {
        void rerun()
      }, 200)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!message.includes('aborted')) {
      throw error
    }
  }
}

export async function loadRemoteAddOn(url: string): Promise<AddOn> {
  const response = await fetch(url)
  const jsonContent = await response.json()

  const checked = AddOnCompiledSchema.safeParse(jsonContent)
  if (!checked.success) {
    throw new Error(`Invalid add-on: ${url}`)
  }

  const addOn = checked.data
  addOn.id = url
  const out = {
    ...addOn,
    getFiles: () => Promise.resolve(Object.keys(addOn.files)),
    getFileContents: (path: string) => Promise.resolve(addOn.files[path]),
    getDeletedFiles: () => Promise.resolve(addOn.deletedFiles),
  }
  return out
}
