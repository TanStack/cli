import { renderForOptions } from './edge-render.js'
import { relativePath } from './edge-file-helpers.js'
import { joinPaths } from './edge-path.js'
import { formatCommand } from './utils.js'
import {
  getPackageManagerExecuteCommand,
  getPackageManagerInstallCommand,
  getPackageManagerScriptCommand,
} from './package-manager.js'

import type {
  AddOn,
  Environment,
  Integration,
  IntegrationWithSource,
  Options,
} from './types.js'

function convertDotFilesAndPaths(path: string) {
  return path
    .split('/')
    .map((segment) => segment.replace(/^_dot_/, '.'))
    .join('/')
}

function normalizeSourceExtension(target: string, typescript: boolean) {
  if (!typescript) {
    return target
  }

  const normalizedTarget = target.replace(/\\/g, '/')

  if (!normalizedTarget.startsWith('src/')) {
    return target
  }

  if (normalizedTarget.endsWith('.js')) {
    return `${target.slice(0, -3)}.ts`
  }

  if (normalizedTarget.endsWith('.jsx')) {
    return `${target.slice(0, -4)}.tsx`
  }

  return target
}

export function createTemplateFile(environment: Environment, options: Options) {
  function getPackageManagerAddScript(
    packageName: string,
    isDev: boolean = false,
  ) {
    return formatCommand(
      getPackageManagerInstallCommand(
        options.packageManager,
        packageName,
        isDev,
      ),
    )
  }
  function getPackageManagerRunScript(
    scriptName: string,
    args: Array<string> = [],
  ) {
    return formatCommand(
      getPackageManagerScriptCommand(options.packageManager, [
        scriptName,
        ...args,
      ]),
    )
  }
  function getPackageManagerExecuteScript(
    pkg: string,
    args: Array<string> = [],
  ) {
    return formatCommand(
      getPackageManagerExecuteCommand(options.packageManager, pkg, args),
    )
  }

  class IgnoreFileError extends Error {
    constructor() {
      super('ignoreFile')
      this.name = 'IgnoreFileError'
    }
  }

  const integrations: Array<IntegrationWithSource> = []
  for (const addOn of options.chosenAddOns) {
    if (addOn.integrations) {
      for (const integration of addOn.integrations) {
        integrations.push({
          ...integration,
          _sourceId: addOn.id,
          _sourceName: addOn.name,
        })
      }
    }
  }

  const routes: Array<Required<AddOn>['routes'][number]> = []
  for (const addOn of options.chosenAddOns) {
    if (addOn.routes) {
      routes.push(...addOn.routes)
    }
  }

  const addOnEnabled = options.chosenAddOns.reduce<Record<string, boolean>>(
    (acc, addOn) => {
      acc[addOn.id] = true
      return acc
    },
    {},
  )

  return async function templateFile(file: string, content: string) {
    const localRelativePath = (path: string, stripExtension: boolean = false) =>
      relativePath(file, path, stripExtension)

    const integrationImportContent = (integration: Integration) =>
      integration.import ||
      `import ${integration.jsName} from '${localRelativePath(integration.path || '')}'`

    const integrationImportCode = (integration: Integration) =>
      integration.code || integration.jsName

    const templateValues = {
      packageManager: options.packageManager,
      projectName: options.projectName,
      typescript: true,
      tailwind: true,
      js: 'ts',
      jsx: 'tsx',
      fileRouter: options.mode === 'file-router',
      codeRouter: options.mode === 'code-router',
      routerOnly: options.routerOnly === true,
      includeExamples: options.includeExamples !== false,
      addOnEnabled,
      addOnOption: options.addOnOptions,
      addOns: options.chosenAddOns,
      integrations,
      routes,

      getPackageManagerAddScript,
      getPackageManagerRunScript,
      getPackageManagerExecuteScript,

      relativePath: (path: string, stripExtension: boolean = false) =>
        relativePath(file, path, stripExtension),

      integrationImportContent,
      integrationImportCode,

      renderTemplate: (templateContent: string) => {
        return renderForOptions(options, templateContent, templateValues)
      },

      ignoreFile: () => {
        throw new IgnoreFileError()
      },
    }

    let ignoreFile = false

    if (file.endsWith('.ejs')) {
      try {
        content = renderForOptions(options, content, templateValues)
      } catch (error) {
        if (error instanceof IgnoreFileError) {
          ignoreFile = true
        } else {
          const message = error instanceof Error ? error.message : String(error)
          environment.error(`EJS error in file ${file}`, message)
          throw error
        }
      }
    }

    if (ignoreFile) {
      return
    }

    let target = convertDotFilesAndPaths(file.replace('.ejs', ''))
    target = normalizeSourceExtension(target, options.typescript)

    const prefixMatch = target.match(/^(.+\/)?__([^_]+)__(.+)$/)
    if (prefixMatch) {
      const [, directory, , filename] = prefixMatch
      target = (directory || '') + filename
    }

    let append = false
    if (target.endsWith('.append')) {
      append = true
      target = target.replace('.append', '')
    }

    if (append) {
      await environment.appendFile(joinPaths(options.targetDir, target), content)
    } else {
      await environment.writeFile(joinPaths(options.targetDir, target), content)
    }
  }
}
