import { renderForOptions } from './edge-render.js'
import { formatCommand, sortObject } from './utils.js'
import { getPackageManagerExecuteCommand } from './package-manager.js'

import type { Options } from './types.js'

export function mergePackageJSON(
  packageJSON: Record<string, unknown>,
  overlayPackageJSON?: Record<string, unknown>,
) {
  const packageDependencies =
    packageJSON.dependencies && typeof packageJSON.dependencies === 'object'
      ? (packageJSON.dependencies as Record<string, string>)
      : {}
  const overlayDependencies =
    overlayPackageJSON?.dependencies &&
    typeof overlayPackageJSON.dependencies === 'object'
      ? (overlayPackageJSON.dependencies as Record<string, string>)
      : {}
  const packageDevDependencies =
    packageJSON.devDependencies && typeof packageJSON.devDependencies === 'object'
      ? (packageJSON.devDependencies as Record<string, string>)
      : {}
  const overlayDevDependencies =
    overlayPackageJSON?.devDependencies &&
    typeof overlayPackageJSON.devDependencies === 'object'
      ? (overlayPackageJSON.devDependencies as Record<string, string>)
      : {}
  const packageScripts =
    packageJSON.scripts && typeof packageJSON.scripts === 'object'
      ? (packageJSON.scripts as Record<string, string>)
      : {}
  const overlayScripts =
    overlayPackageJSON?.scripts && typeof overlayPackageJSON.scripts === 'object'
      ? (overlayPackageJSON.scripts as Record<string, string>)
      : {}

  const mergedPackageJSON: Record<string, unknown> = {
    ...packageJSON,
    ...(overlayPackageJSON || {}),
    dependencies: {
      ...packageDependencies,
      ...overlayDependencies,
    },
    devDependencies: {
      ...packageDevDependencies,
      ...overlayDevDependencies,
    },
    scripts: {
      ...packageScripts,
      ...overlayScripts,
    },
  }

  const packagePnpm =
    packageJSON.pnpm && typeof packageJSON.pnpm === 'object'
      ? (packageJSON.pnpm as Record<string, unknown>)
      : undefined
  const overlayPnpm =
    overlayPackageJSON?.pnpm && typeof overlayPackageJSON.pnpm === 'object'
      ? (overlayPackageJSON.pnpm as Record<string, unknown>)
      : undefined

  const baseOnlyBuiltDependencies = Array.isArray(
    packagePnpm?.onlyBuiltDependencies,
  )
    ? packagePnpm.onlyBuiltDependencies
    : []
  const overlayOnlyBuiltDependencies = Array.isArray(
    overlayPnpm?.onlyBuiltDependencies,
  )
    ? overlayPnpm.onlyBuiltDependencies
    : []

  const onlyBuiltDependencies = [
    ...new Set([
      ...baseOnlyBuiltDependencies,
      ...overlayOnlyBuiltDependencies,
    ]),
  ]

  if (packagePnpm || overlayPnpm) {
    mergedPackageJSON.pnpm = {
      ...packagePnpm,
      ...overlayPnpm,
    }

    if (onlyBuiltDependencies.length) {
      const mergedPnpm = mergedPackageJSON.pnpm as Record<string, unknown>
      mergedPnpm.onlyBuiltDependencies = onlyBuiltDependencies
    }
  }

  return mergedPackageJSON
}

export function createPackageJSON(options: Options) {
  const packageManager = options.packageManager
  const bundler = options.bundler ?? 'vite'
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

  let packageJSON: Record<string, unknown> = {
    ...(JSON.parse(
      JSON.stringify(options.framework.basePackageJSON),
    ) as Record<string, unknown>),
    name: options.projectName,
  }

  const additions: Array<Record<string, unknown> | undefined> = [
    options.framework.optionalPackages.typescript,
    options.framework.optionalPackages.bundlers?.[bundler],
    includeDevtools ? options.framework.optionalPackages.devtools : undefined,
    includeDevtools
      ? options.framework.optionalPackages.bundlerDevtools?.[bundler]
      : undefined,
    !blank && options.includeExamples !== false
      ? options.framework.optionalPackages.examples
      : undefined,
    options.tailwind
      ? options.framework.optionalPackages.tailwindcss
      : undefined,
    options.tailwind
      ? options.framework.optionalPackages.bundlerTailwindcss?.[bundler]
      : undefined,
    options.mode ? options.framework.optionalPackages[options.mode] : undefined,
    options.mode === 'file-router'
      ? options.framework.optionalPackages.bundlerFileRouter?.[bundler]
      : undefined,
  ]
  for (const addition of additions.filter(
    (addition): addition is Record<string, unknown> => Boolean(addition),
  )) {
    packageJSON = mergePackageJSON(packageJSON, addition)
  }

  for (const addOn of options.chosenAddOns) {
    let addOnPackageJSON = addOn.packageAdditions as
      | Record<string, unknown>
      | undefined

    if (addOn.packageTemplate) {
      const templateValues = {
        packageManager: options.packageManager,
        projectName: options.projectName,
        bundler,
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
        addOnPackageJSON = JSON.parse(
          renderForOptions(options, addOn.packageTemplate, templateValues),
        )
      } catch (error) {
        console.error(
          `Error processing package.json.ejs for add-on ${addOn.id}:`,
          error,
        )
      }
    }

    packageJSON = mergePackageJSON(packageJSON, addOnPackageJSON)
  }

  if (options.starter) {
    packageJSON = mergePackageJSON(
      packageJSON,
      options.starter.packageAdditions as Record<string, unknown> | undefined,
    )
  }

  const dependencies = packageJSON.dependencies as
    | Record<string, string>
    | undefined
  const devDependencies = packageJSON.devDependencies as
    | Record<string, string>
    | undefined
  const scripts = packageJSON.scripts as Record<string, string> | undefined

  if (options.routerOnly) {
    delete dependencies?.srvx
    delete scripts?.start

    if (options.framework.id === 'react') {
      delete dependencies?.['@tanstack/react-start']
      delete dependencies?.['@tanstack/react-router-ssr-query']
      packageJSON.devDependencies = {
        ...(devDependencies ?? {}),
        '@tanstack/router-plugin':
          devDependencies?.['@tanstack/router-plugin'] ?? 'latest',
      }
    }

    if (options.framework.id === 'solid') {
      delete dependencies?.['@tanstack/solid-start']
      delete dependencies?.['@tanstack/solid-router-ssr-query']
      packageJSON.devDependencies = {
        ...(devDependencies ?? {}),
        '@tanstack/router-plugin':
          devDependencies?.['@tanstack/router-plugin'] ?? 'latest',
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
