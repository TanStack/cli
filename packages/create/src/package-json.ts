import { render } from 'ejs'
import { formatCommand, sortObject } from './utils.js'
import { getPackageManagerExecuteCommand } from './package-manager.js'
import type { Options } from './types.js'

export function mergePackageJSON(
  packageJSON: Record<string, any>,
  overlayPackageJSON?: Record<string, any>,
) {
  const mergedPackageJSON: Record<string, any> = {
    ...packageJSON,
    ...(overlayPackageJSON || {}),
    dependencies: {
      ...packageJSON.dependencies,
      ...(overlayPackageJSON?.dependencies || {}),
    },
    devDependencies: {
      ...packageJSON.devDependencies,
      ...(overlayPackageJSON?.devDependencies || {}),
    },
    scripts: {
      ...packageJSON.scripts,
      ...(overlayPackageJSON?.scripts || {}),
    },
  }

  const baseOnlyBuiltDependencies = Array.isArray(
    packageJSON.pnpm?.onlyBuiltDependencies,
  )
    ? packageJSON.pnpm.onlyBuiltDependencies
    : []
  const overlayOnlyBuiltDependencies = Array.isArray(
    overlayPackageJSON?.pnpm?.onlyBuiltDependencies,
  )
    ? overlayPackageJSON.pnpm.onlyBuiltDependencies
    : []

  const onlyBuiltDependencies = [
    ...new Set([
      ...baseOnlyBuiltDependencies,
      ...overlayOnlyBuiltDependencies,
    ]),
  ]

  if (packageJSON.pnpm || overlayPackageJSON?.pnpm) {
    mergedPackageJSON.pnpm = {
      ...packageJSON.pnpm,
      ...overlayPackageJSON?.pnpm,
    }

    if (onlyBuiltDependencies.length) {
      mergedPackageJSON.pnpm.onlyBuiltDependencies = onlyBuiltDependencies
    }
  }

  return mergedPackageJSON
}

export function createPackageJSON(options: Options) {
  const packageManager = options.packageManager
  const blank = options.projectPreset === 'blank'
  const includeDevtools =
    !blank ||
    options.chosenAddOns.some((addOn) =>
      addOn.integrations?.some(
        (integration) => integration.type === 'devtools',
      ),
    )

  function getPackageManagerExecuteScript(
    pkg: string,
    args: Array<string> = [],
  ) {
    return formatCommand(getPackageManagerExecuteCommand(packageManager, pkg, args))
  }

  let packageJSON = {
    ...JSON.parse(JSON.stringify(options.framework.basePackageJSON)),
    name: options.projectName,
  }

  const additions: Array<Record<string, any> | undefined> = [
    options.framework.optionalPackages.typescript,
    includeDevtools ? options.framework.optionalPackages.devtools : undefined,
    !blank && options.includeExamples !== false
      ? options.framework.optionalPackages.examples
      : undefined,
    options.tailwind
      ? options.framework.optionalPackages.tailwindcss
      : undefined,
    options.mode ? options.framework.optionalPackages[options.mode] : undefined,
  ]
  for (const addition of additions.filter(Boolean)) {
    packageJSON = mergePackageJSON(packageJSON, addition)
  }

  for (const addOn of options.chosenAddOns) {
    let addOnPackageJSON = addOn.packageAdditions

    // Process EJS template if present
    if (addOn.packageTemplate) {
      const templateValues = {
        packageManager: options.packageManager,
        projectName: options.projectName,
        typescript: true,
        tailwind: options.tailwind,
        blank,
        js: 'ts',
        jsx: 'tsx',
        fileRouter: options.mode === 'file-router',
        codeRouter: options.mode === 'code-router',
        routerOnly: options.routerOnly === true,
        addOnEnabled: options.chosenAddOns.reduce<Record<string, boolean>>(
          (acc, addon) => {
            acc[addon.id] = true
            return acc
          },
          {},
        ),
        addOnOption: options.addOnOptions,
        addOns: options.chosenAddOns,
        getPackageManagerExecuteScript,
      }

      try {
        const renderedTemplate = render(addOn.packageTemplate, templateValues)
        addOnPackageJSON = JSON.parse(renderedTemplate)
      } catch (error) {
        console.error(
          `Error processing package.json.ejs for add-on ${addOn.id}:`,
          error,
        )
        // Fall back to packageAdditions if template processing fails
      }
    }

    packageJSON = mergePackageJSON(packageJSON, addOnPackageJSON)
  }

  if (options.starter) {
    packageJSON = mergePackageJSON(
      packageJSON,
      options.starter.packageAdditions,
    )
  }

  if (options.routerOnly) {
    if (options.framework.id === 'react') {
      delete packageJSON.dependencies?.['@tanstack/react-start']
      delete packageJSON.dependencies?.['@tanstack/react-router-ssr-query']
      packageJSON.devDependencies = {
        ...(packageJSON.devDependencies ?? {}),
        '@tanstack/router-plugin':
          packageJSON.devDependencies?.['@tanstack/router-plugin'] ?? 'latest',
      }
    }

    if (options.framework.id === 'solid') {
      delete packageJSON.dependencies?.['@tanstack/solid-start']
      delete packageJSON.dependencies?.['@tanstack/solid-router-ssr-query']
      delete packageJSON.scripts?.start
      packageJSON.devDependencies = {
        ...(packageJSON.devDependencies ?? {}),
        '@tanstack/router-plugin':
          packageJSON.devDependencies?.['@tanstack/router-plugin'] ?? 'latest',
      }
    }
  }

  packageJSON.dependencies = sortObject(
    (packageJSON.dependencies ?? {}) as Record<string, string>,
  )
  packageJSON.devDependencies = sortObject(
    (packageJSON.devDependencies ?? {}) as Record<string, string>,
  )

  return packageJSON
}
