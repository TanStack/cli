import fs from 'node:fs'
import { resolve } from 'node:path'
import { Command, InvalidArgumentError, Option } from 'commander'
import { cancel, confirm, intro, isCancel, log } from '@clack/prompts'
import chalk from 'chalk'
import semver from 'semver'

import {
  SUPPORTED_PACKAGE_MANAGERS,
  addToApp,
  compileAddOn,
  compileStarter,
  createApp,
  devAddOn,
  getAllAddOns,
  getFrameworkByName,
  getFrameworks,
  initAddOn,
  initStarter,
} from '@tanstack/create'
import {
  LIBRARY_GROUPS,
  fetchDocContent,
  fetchLibraries,
  fetchPartners,
  searchTanStackDocs,
} from './discovery.js'
import {
  getTelemetryStatus,
  setTelemetryEnabled,
} from './telemetry-config.js'
import { TelemetryClient, createTelemetryClient } from './telemetry.js'

import { promptForAddOns, promptForCreateOptions } from './options.js'
import {
  normalizeOptions,
  validateDevWatchOptions,
  validateLegacyCreateFlags,
} from './command-line.js'

import { createUIEnvironment } from './ui-environment.js'
import { DevWatchManager } from './dev-watch.js'

import type { CliOptions } from './types.js'
import type {
  FrameworkDefinition,
  Options,
  PackageManager,
} from '@tanstack/create'

// Read version from package.json
const packageJsonPath = new URL('../package.json', import.meta.url)
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
const VERSION = packageJson.version

function isLocalPath(value: string) {
  return (
    value.startsWith('./') ||
    value.startsWith('../') ||
    value.startsWith('/') ||
    /^[a-zA-Z]:[\\/]/.test(value)
  )
}

function isRemoteUrl(value: string) {
  return /^https?:\/\//i.test(value) || /^file:\/\//i.test(value)
}

function sanitizeId(value: string) {
  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return undefined
  }

  return normalized.replace(/[^a-z0-9._:/-]/g, '-')
}

function sanitizeIdList(values: Array<string>) {
  return Array.from(
    new Set(
      values
        .map((value) => sanitizeId(value))
        .filter((value): value is string => Boolean(value)),
    ),
  )
}

const AGENT_FLAG = '--agent'

function addHiddenAgentFlag<T extends Command>(cmd: T) {
  if (cmd.options.some((option) => option.long === AGENT_FLAG)) {
    return cmd
  }

  cmd.addOption(
    new Option(AGENT_FLAG, 'internal: invocation originated from an agent').hideHelp(),
  )

  return cmd
}

function getInvocationTelemetryProperties() {
  return {
    invoked_by_agent: process.argv.includes(AGENT_FLAG),
  }
}

function getStarterTelemetryProperties(value?: string) {
  if (!value) {
    return {}
  }

  if (isRemoteUrl(value)) {
    return {
      starter_kind: 'remote_url',
    }
  }

  if (isLocalPath(value)) {
    return {
      starter_kind: 'local_path',
    }
  }

  return {
    starter_id: sanitizeId(value),
    starter_kind: 'built_in',
  }
}

function getLengthBucket(value: string) {
  const length = value.trim().length
  if (length === 0) {
    return 'empty'
  }

  if (length <= 10) {
    return '1_10'
  }

  if (length <= 25) {
    return '11_25'
  }

  if (length <= 50) {
    return '26_50'
  }

  return '51_plus'
}

function getCreateCommandVariant(options: CliOptions) {
  if (options.listAddOns) {
    return 'list_add_ons'
  }

  if (options.addonDetails) {
    return 'addon_details'
  }

  if (options.devWatch) {
    return 'dev_watch'
  }

  return 'scaffold'
}

function getCreateTelemetryProperties(projectName: string, options: CliOptions) {
  const addOnIds = Array.isArray(options.addOns)
    ? sanitizeIdList(options.addOns)
    : undefined

  return {
    ...getStarterTelemetryProperties(options.starter || options.templateId || options.template),
    add_on_count: addOnIds?.length,
    add_on_ids: addOnIds,
    addon_details_id: options.addonDetails
      ? sanitizeId(options.addonDetails)
      : undefined,
    command_variant: getCreateCommandVariant(options),
    deployment: options.deployment ? sanitizeId(options.deployment) : undefined,
    examples: options.examples,
    framework: options.framework ? sanitizeId(options.framework) : undefined,
    git: options.git,
    install: options.install !== false,
    interactive: !!options.interactive,
    json: !!options.json,
    non_interactive: !!options.nonInteractive || !!options.yes,
    package_manager: options.packageManager,
    project_name_provided: Boolean(projectName),
    router_only: !!options.routerOnly,
    target_dir_flag: Boolean(options.targetDir),
    toolchain:
      typeof options.toolchain === 'string' ? sanitizeId(options.toolchain) : undefined,
    yes: !!options.yes,
  }
}

function getResolvedCreateTelemetryProperties(
  finalOptions: Options,
  cliOptions: CliOptions,
) {
  const includeExamples =
    (<Options & { includeExamples?: boolean }>finalOptions).includeExamples !== false
  const addOnIds = sanitizeIdList(finalOptions.chosenAddOns.map((addOn) => addOn.id))
  const deployment = finalOptions.chosenAddOns.find(
    (addOn) => addOn.type === 'deployment',
  )
  const toolchain = finalOptions.chosenAddOns.find(
    (addOn) => addOn.type === 'toolchain',
  )

  return {
    ...getStarterTelemetryProperties(
      finalOptions.starter?.id || cliOptions.starter || cliOptions.templateId || cliOptions.template,
    ),
    add_on_count: addOnIds.length,
    add_on_ids: addOnIds,
    deployment: deployment ? sanitizeId(deployment.id) : undefined,
    examples: includeExamples,
    framework: sanitizeId(finalOptions.framework.id),
    git: finalOptions.git,
    install: finalOptions.install !== false,
    package_manager: finalOptions.packageManager,
    router_only: !!cliOptions.routerOnly,
    toolchain: toolchain ? sanitizeId(toolchain.id) : undefined,
  }
}

function formatErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'An unknown error occurred'
}

export function cli({
  name,
  appName,
  forcedAddOns = [],
  forcedDeployment,
  defaultFramework,
  frameworkDefinitionInitializers,
  showDeploymentOptions = false,
  legacyAutoCreate = false,
  defaultRouterOnly = false,
}: {
  name: string
  appName: string
  forcedAddOns?: Array<string>
  forcedDeployment?: string
  defaultFramework?: string
  frameworkDefinitionInitializers?: Array<() => FrameworkDefinition>
  showDeploymentOptions?: boolean
  legacyAutoCreate?: boolean
  defaultRouterOnly?: boolean
}) {
  let currentTelemetry: TelemetryClient | undefined
  const environment = createUIEnvironment(appName, false, () => currentTelemetry)

  const program = new Command()

  async function confirmTargetDirectorySafety(
    targetDir: string,
    forced?: boolean,
  ) {
    if (forced) {
      return
    }

    if (!fs.existsSync(targetDir)) {
      return
    }

    if (!fs.statSync(targetDir).isDirectory()) {
      throw new Error(`Target path exists and is not a directory: ${targetDir}`)
    }

    if (fs.readdirSync(targetDir).length === 0) {
      return
    }

    const shouldContinue = await confirm({
      message: `Target directory "${targetDir}" already exists and is not empty. Continue anyway?`,
      initialValue: false,
    })

    if (isCancel(shouldContinue) || !shouldContinue) {
      cancel('Operation cancelled.')
      process.exit(0)
    }
  }

  const availableFrameworks = getFrameworks().map((f) => f.name)

  function resolveBuiltInDevWatchPath(frameworkId: string): string {
    const candidates = [
      resolve(process.cwd(), 'packages/create/src/frameworks', frameworkId),
      resolve(process.cwd(), '../create/src/frameworks', frameworkId),
    ]

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate
      }
    }

    return candidates[0]
  }

  async function startDevWatchMode(projectName: string, options: CliOptions) {
    // Validate dev watch options
    const validation = validateDevWatchOptions({ ...options, projectName })
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // Enter dev watch mode
    if (!projectName && !options.targetDir) {
      throw new Error('Project name/target directory is required for dev watch mode')
    }

    if (!options.framework) {
      throw new Error('Failed to detect framework')
    }

    const framework = getFrameworkByName(options.framework)
    if (!framework) {
      throw new Error('Failed to detect framework')
    }

    // First, create the app normally using the standard flow
    const normalizedOpts = await normalizeOptions(
      {
        ...options,
        projectName,
        framework: framework.id,
      },
      forcedAddOns,
    )

    if (!normalizedOpts) {
      throw new Error('Failed to normalize options')
    }

    currentTelemetry?.mergeProperties(
      getResolvedCreateTelemetryProperties(normalizedOpts, options),
    )

    normalizedOpts.targetDir =
      options.targetDir || resolve(process.cwd(), projectName)

    // Create the initial app with minimal output for dev watch mode
    console.log(chalk.bold('\ndev-watch'))
    console.log(chalk.gray('├─') + ' ' + `creating initial ${appName} app...`)
    if (normalizedOpts.install !== false) {
      console.log(
        chalk.gray('├─') + ' ' + chalk.yellow('⟳') + ' installing packages...',
      )
    }
    const silentEnvironment = createUIEnvironment(appName, true, () => currentTelemetry)
    await confirmTargetDirectorySafety(normalizedOpts.targetDir, options.force)
    await createApp(silentEnvironment, normalizedOpts)
    console.log(chalk.gray('└─') + ' ' + chalk.green('✓') + ` app created`)

    // Now start the dev watch mode
    const manager = new DevWatchManager({
      watchPath: options.devWatch!,
      targetDir: normalizedOpts.targetDir,
      framework,
      cliOptions: normalizedOpts,
      packageManager: normalizedOpts.packageManager,
      runDevCommand: options.runDev,
      environment,
      frameworkDefinitionInitializers,
    })

    await manager.start()
  }

  const toolchains = new Set<string>()
  for (const framework of getFrameworks()) {
    for (const addOn of framework.getAddOns()) {
      if (addOn.type === 'toolchain') {
        toolchains.add(addOn.id)
      }
    }
  }

  const deployments = new Set<string>()
  for (const framework of getFrameworks()) {
    for (const addOn of framework.getAddOns()) {
      if (addOn.type === 'deployment') {
        deployments.add(addOn.id)
      }
    }
  }

  // Mode is always file-router (TanStack Start)
  const defaultMode = 'file-router'
  const categoryAliases: Record<string, string> = {
    db: 'database',
    postgres: 'database',
    sql: 'database',
    login: 'auth',
    authentication: 'auth',
    hosting: 'deployment',
    deploy: 'deployment',
    serverless: 'deployment',
    errors: 'monitoring',
    logging: 'monitoring',
    content: 'cms',
    'api-keys': 'api',
    grid: 'data-grid',
    review: 'code-review',
    courses: 'learning',
  }

  function printJson(data: unknown) {
    console.log(JSON.stringify(data, null, 2))
  }

  function parsePositiveInteger(value: string) {
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new InvalidArgumentError('Value must be a positive integer')
    }
    return parsed
  }

  async function runWithTelemetry<T>(
    command: string,
    opts: {
      json?: boolean
      properties?: Record<string, unknown>
    },
    action: (telemetry: TelemetryClient) => Promise<T>,
  ) {
    const telemetry = await createTelemetryClient({ json: opts.json })
    const startedAt = Date.now()
    currentTelemetry = telemetry
    telemetry.captureCommandStarted(command, {
      ...getInvocationTelemetryProperties(),
      ...opts.properties,
      cli_version: VERSION,
    })

    try {
      const result = await action(telemetry)
      await telemetry.captureCommandCompleted(command, Date.now() - startedAt)
      return result
    } catch (error) {
      await telemetry.captureCommandFailed(command, Date.now() - startedAt, error)
      throw error
    } finally {
      currentTelemetry = undefined
    }
  }

  program
    .name(name)
    .description(`${appName} CLI`)
    .version(VERSION, '-v, --version', 'output the current version')

  addHiddenAgentFlag(program)

  // Helper to create the create command action handler
  async function handleCreate(projectName: string, options: CliOptions) {
    try {
      await runWithTelemetry(
        'create',
        {
          json: options.json,
          properties: getCreateTelemetryProperties(projectName, options),
        },
        async (telemetry) => {
          const legacyCreateFlags = validateLegacyCreateFlags(options)
          if (legacyCreateFlags.error) {
            throw new Error(legacyCreateFlags.error)
          }

          for (const warning of legacyCreateFlags.warnings) {
            log.warn(warning)
          }

          if (options.listAddOns) {
            const addOns = await getAllAddOns(
              getFrameworkByName(options.framework || defaultFramework || 'React')!,
              defaultMode,
            )
            const visibleAddOns = addOns.filter((a) => !forcedAddOns.includes(a.id))
            telemetry.mergeProperties({
              result_count: visibleAddOns.length,
            })
            if (options.json) {
              printJson(
                visibleAddOns.map((addOn) => ({
                  id: addOn.id,
                  name: addOn.name,
                  description: addOn.description,
                  type: addOn.type,
                  category: addOn.category,
                  phase: addOn.phase,
                  modes: addOn.modes,
                  link: addOn.link,
                  warning: addOn.warning,
                  exclusive: addOn.exclusive,
                  dependsOn: addOn.dependsOn,
                  options: addOn.options,
                })),
              )
              return
            }

            let hasConfigurableAddOns = false
            for (const addOn of visibleAddOns) {
              const hasOptions =
                addOn.options && Object.keys(addOn.options).length > 0
              const optionMarker = hasOptions ? '*' : ' '
              if (hasOptions) hasConfigurableAddOns = true
              console.log(
                `${optionMarker} ${chalk.bold(addOn.id)}: ${addOn.description}`,
              )
            }
            if (hasConfigurableAddOns) {
              console.log('\n* = has configuration options')
            }
            return
          }

          if (options.addonDetails) {
            const addOns = await getAllAddOns(
              getFrameworkByName(options.framework || defaultFramework || 'React')!,
              defaultMode,
            )
            const addOn =
              addOns.find((a) => a.id === options.addonDetails) ??
              addOns.find(
                (a) => a.id.toLowerCase() === options.addonDetails!.toLowerCase(),
              )
            if (!addOn) {
              throw new Error(`Add-on '${options.addonDetails}' not found`)
            }

            telemetry.mergeProperties({
              add_on_file_count: (await addOn.getFiles()).length,
            })

            if (options.json) {
              const files = await addOn.getFiles()
              printJson({
                id: addOn.id,
                name: addOn.name,
                description: addOn.description,
                type: addOn.type,
                category: addOn.category,
                phase: addOn.phase,
                modes: addOn.modes,
                link: addOn.link,
                warning: addOn.warning,
                exclusive: addOn.exclusive,
                dependsOn: addOn.dependsOn,
                options: addOn.options,
                routes: addOn.routes,
                packageAdditions: addOn.packageAdditions,
                shadcnComponents: addOn.shadcnComponents,
                integrations: addOn.integrations,
                readme: addOn.readme,
                files,
                author: addOn.author,
                version: addOn.version,
                license: addOn.license,
              })
              return
            }

            console.log(
              `${chalk.bold.cyan('Add-on Details:')} ${chalk.bold(addOn.name)}`,
            )
            console.log(`${chalk.bold('ID:')} ${addOn.id}`)
            console.log(`${chalk.bold('Description:')} ${addOn.description}`)
            console.log(`${chalk.bold('Type:')} ${addOn.type}`)
            console.log(`${chalk.bold('Phase:')} ${addOn.phase}`)
            console.log(`${chalk.bold('Supported Modes:')} ${addOn.modes.join(', ')}`)

            if (addOn.link) {
              console.log(`${chalk.bold('Link:')} ${chalk.blue(addOn.link)}`)
            }

            if (addOn.dependsOn && addOn.dependsOn.length > 0) {
              console.log(
                `${chalk.bold('Dependencies:')} ${addOn.dependsOn.join(', ')}`,
              )
            }

            if (addOn.options && Object.keys(addOn.options).length > 0) {
              console.log(`\n${chalk.bold.yellow('Configuration Options:')}`)
              for (const [optionName, option] of Object.entries(addOn.options)) {
                if ('type' in option) {
                  const opt = option as any
                  console.log(`  ${chalk.bold(optionName)}:`)
                  console.log(`    Label: ${opt.label}`)
                  if (opt.description) {
                    console.log(`    Description: ${opt.description}`)
                  }
                  console.log(`    Type: ${opt.type}`)
                  console.log(`    Default: ${opt.default}`)
                  if (opt.type === 'select' && opt.options) {
                    console.log(`    Available values:`)
                    for (const choice of opt.options) {
                      console.log(`      - ${choice.value}: ${choice.label}`)
                    }
                  }
                }
              }
            } else {
              console.log(`\n${chalk.gray('No configuration options available')}`)
            }

            if (addOn.routes && addOn.routes.length > 0) {
              console.log(`\n${chalk.bold.green('Routes:')}`)
              for (const route of addOn.routes) {
                console.log(`  ${chalk.bold(route.url)} (${route.name})`)
                console.log(`    File: ${route.path}`)
              }
            }
            return
          }

          if (options.devWatch) {
            await startDevWatchMode(projectName, options)
            return
          }

          const cliOptions = {
            projectName,
            ...options,
          } as CliOptions

          if (defaultRouterOnly && cliOptions.routerOnly === undefined) {
            cliOptions.routerOnly = true
          }

          if (
            cliOptions.routerOnly !== true &&
            cliOptions.template &&
            ['file-router', 'typescript', 'tsx', 'javascript', 'js', 'jsx'].includes(
              cliOptions.template.toLowerCase(),
            ) &&
            cliOptions.template.toLowerCase() !== 'file-router'
          ) {
            cliOptions.routerOnly = true
          }

          cliOptions.framework = getFrameworkByName(
            options.framework || defaultFramework || 'React',
          )!.id

          const nonInteractive = !!cliOptions.nonInteractive || !!cliOptions.yes
          if (cliOptions.interactive && nonInteractive) {
            throw new Error(
              'Cannot combine --interactive with --non-interactive/--yes.',
            )
          }

          const addOnsFlagPassed = process.argv.includes('--add-ons')
          const wantsInteractiveMode =
            !nonInteractive &&
            (cliOptions.interactive ||
              (cliOptions.addOns === true && addOnsFlagPassed))

          let finalOptions: Options | undefined
          if (wantsInteractiveMode) {
            cliOptions.addOns = true
          } else {
            finalOptions = await normalizeOptions(
              cliOptions,
              forcedAddOns,
              { forcedDeployment },
            )
          }

          if (nonInteractive) {
            if (cliOptions.addOns === true) {
              throw new Error(
                'When using --non-interactive/--yes, pass explicit add-ons via --add-ons <ids>.',
              )
            }
          }

          if (finalOptions) {
            intro(`Creating a new ${appName} app in ${projectName}...`)
          } else {
            if (nonInteractive) {
              throw new Error(
                'Project name is required in non-interactive mode. Pass [project-name] or --target-dir.',
              )
            }
            intro(`Let's configure your ${appName} application`)
            finalOptions = await promptForCreateOptions(cliOptions, {
              forcedAddOns,
              showDeploymentOptions,
            })
          }

          if (!finalOptions) {
            throw new Error('No options were provided')
          }

          telemetry.mergeProperties(
            getResolvedCreateTelemetryProperties(finalOptions, cliOptions),
          )

          ;(finalOptions as Options & { routerOnly?: boolean }).routerOnly =
            !!cliOptions.routerOnly

          if (options.targetDir) {
            finalOptions.targetDir = options.targetDir
          } else if (finalOptions.targetDir) {
            // Keep the normalized target dir.
          } else if (projectName === '.') {
            finalOptions.targetDir = resolve(process.cwd())
          } else {
            finalOptions.targetDir = resolve(process.cwd(), finalOptions.projectName)
          }

          await confirmTargetDirectorySafety(finalOptions.targetDir, options.force)
          await createApp(environment, finalOptions)
        },
      )
    } catch (error) {
      log.error(formatErrorMessage(error))
      process.exit(1)
    }
  }

  // Helper to configure create command options
  function configureCreateCommand(cmd: Command) {
    addHiddenAgentFlag(cmd)
    cmd.argument('[project-name]', 'name of the project')

    if (!defaultFramework) {
      cmd.option<string>(
        '--framework <type>',
        `project framework (${availableFrameworks.join(', ')})`,
        (value) => {
          if (value.toLowerCase() === 'react-cra') {
            return 'react'
          }

          if (
            !availableFrameworks.some(
              (f) => f.toLowerCase() === value.toLowerCase(),
            )
          ) {
            throw new InvalidArgumentError(
              `Invalid framework: ${value}. Only the following are allowed: ${availableFrameworks.join(', ')}`,
            )
          }
          return value
        },
        defaultFramework || 'React',
      )
    }

    cmd
      .option(
        '--starter [url-or-id]',
        'DEPRECATED: use --template. Initializes from a template URL or built-in id',
        false,
      )
      .option('--template-id <id>', 'initialize using a built-in template id')
      .option(
        '--template [url-or-id]',
        'initialize this project from a template URL or built-in template id',
      )
      .option('--no-install', 'skip installing dependencies')
      .option<PackageManager>(
        `--package-manager <${SUPPORTED_PACKAGE_MANAGERS.join('|')}>`,
        `Explicitly tell the CLI to use this package manager`,
        (value) => {
          if (!SUPPORTED_PACKAGE_MANAGERS.includes(value as PackageManager)) {
            throw new InvalidArgumentError(
              `Invalid package manager: ${value}. The following are allowed: ${SUPPORTED_PACKAGE_MANAGERS.join(
                ', ',
              )}`,
            )
          }
          return value as PackageManager
        },
      )
      .option(
        '--dev-watch <path>',
        'Watch a framework directory for changes and auto-rebuild',
      )
      .option('--run-dev', 'Run the app dev server alongside dev-watch', false)
      .option(
        '--router-only',
        'Use router-only compatibility mode (file-based routing without TanStack Start)',
      )
      .option(
        '--tailwind',
        'Deprecated: compatibility flag; Tailwind is always enabled',
      )
      .option(
        '--no-tailwind',
        'Deprecated: compatibility flag; Tailwind opt-out is ignored',
      )
      .option('--examples', 'include demo/example pages')
      .option('--no-examples', 'exclude demo/example pages')

    if (deployments.size > 0) {
      cmd.option<string>(
        `--deployment <${Array.from(deployments).join('|')}>`,
        `Explicitly tell the CLI to use this deployment adapter`,
        (value) => {
          if (!deployments.has(value)) {
            throw new InvalidArgumentError(
              `Invalid adapter: ${value}. The following are allowed: ${Array.from(
                deployments,
              ).join(', ')}`,
            )
          }
          return value
        },
      )
    }

    if (toolchains.size > 0) {
      cmd
        .option<string>(
          `--toolchain <${Array.from(toolchains).join('|')}>`,
          `Explicitly tell the CLI to use this toolchain`,
          (value) => {
            if (!toolchains.has(value)) {
              throw new InvalidArgumentError(
                `Invalid toolchain: ${value}. The following are allowed: ${Array.from(
                  toolchains,
                ).join(', ')}`,
              )
            }
            return value
          },
        )
        .option('--no-toolchain', 'skip toolchain selection')
    }

    cmd
      .option('--interactive', 'interactive mode', false)
      .option('--non-interactive', 'skip prompts and use defaults', false)
      .option('-y, --yes', 'accept defaults and skip prompts', false)
      .option<Array<string> | boolean>(
        '--add-ons [...add-ons]',
        'pick from a list of available add-ons (comma separated list)',
        (value: string) => {
          let addOns: Array<string> | boolean = !!value
          if (typeof value === 'string') {
            addOns = value.split(',').map((addon) => addon.trim())
          }
          return addOns
        },
      )
      .option('--list-add-ons', 'list all available add-ons', false)
      .option(
        '--addon-details <addon-id>',
        'show detailed information about a specific add-on',
      )
      .option('--json', 'output JSON for automation', false)
      .option('--git', 'create a git repository')
      .option('--no-git', 'do not create a git repository')
      .option(
        '--target-dir <path>',
        'the target directory for the application root',
      )
      .option(
        '--add-on-config <config>',
        'JSON string with add-on configuration options',
      )
      .option(
        '-f, --force',
        'force project creation even if the target directory is not empty',
        false,
      )

    return cmd
  }

  // === CREATE SUBCOMMAND ===
  // Creates a TanStack Start app (file-router mode).
  const createCommand = program
    .command('create')
    .description(`Create a new TanStack Start application`)

  configureCreateCommand(createCommand)
  createCommand.action(handleCreate)

  // === DEV SUBCOMMAND ===
  const devCommand = program
    .command('dev')
    .description(
      'Create a sandbox app and watch built-in framework templates/add-ons',
    )

  configureCreateCommand(devCommand)
  devCommand.action(async (projectName: string, options: CliOptions) => {
    try {
      await runWithTelemetry(
        'dev',
        {
          properties: {
            framework: options.framework
              ? sanitizeId(options.framework)
              : sanitizeId(defaultFramework || 'react'),
            install: options.install !== false,
            run_dev: true,
          },
        },
        async () => {
          const frameworkName = options.framework || defaultFramework || 'React'
          const framework = getFrameworkByName(frameworkName)
          if (!framework) {
            throw new Error(`Unknown framework: ${frameworkName}`)
          }

          const watchPath = resolveBuiltInDevWatchPath(framework.id)
          const devOptions: CliOptions = {
            ...options,
            framework: framework.name,
            devWatch: watchPath,
            runDev: true,
            install: options.install ?? true,
          }

          await startDevWatchMode(projectName, devOptions)
        },
      )
    } catch (error) {
      log.error(formatErrorMessage(error))
      process.exit(1)
    }
  })

  // === LIBRARIES SUBCOMMAND ===
  program
    .command('libraries')
    .description('List TanStack libraries')
    .addOption(
      new Option(AGENT_FLAG, 'internal: invocation originated from an agent').hideHelp(),
    )
    .option(
      '--group <group>',
      `filter by group (${LIBRARY_GROUPS.join(', ')})`,
    )
    .option('--json', 'output JSON for automation', false)
    .action(async (options: { group?: string; json: boolean }) => {
      try {
        await runWithTelemetry(
          'libraries',
          {
            json: options.json,
            properties: {
              group: options.group ? sanitizeId(options.group) : undefined,
              json: options.json,
            },
          },
          async (telemetry) => {
            const data = await fetchLibraries()
            let libraries = data.libraries

            if (
              options.group &&
              Object.prototype.hasOwnProperty.call(data.groups, options.group)
            ) {
              const groupIds = data.groups[options.group]
              libraries = libraries.filter((lib) => groupIds.includes(lib.id))
            }

            const groupName = options.group
              ? data.groupNames[options.group] || options.group
              : 'All Libraries'

            const payload = {
              group: groupName,
              count: libraries.length,
              libraries: libraries.map((lib) => ({
                id: lib.id,
                name: lib.name,
                tagline: lib.tagline,
                description: lib.description,
                frameworks: lib.frameworks,
                latestVersion: lib.latestVersion,
                docsUrl: lib.docsUrl,
                githubUrl: lib.githubUrl,
              })),
            }

            telemetry.mergeProperties({
              result_count: payload.count,
            })

            if (options.json) {
              printJson(payload)
              return
            }

            console.log(chalk.bold(groupName))
            for (const lib of payload.libraries) {
              console.log(
                `${chalk.bold(lib.id)} (${lib.latestVersion}) - ${lib.tagline}`,
              )
            }
          },
        )
      } catch (error) {
        log.error(formatErrorMessage(error))
        process.exit(1)
      }
    })

  // === DOC SUBCOMMAND ===
  program
    .command('doc')
    .description('Fetch a TanStack documentation page')
    .addOption(
      new Option(AGENT_FLAG, 'internal: invocation originated from an agent').hideHelp(),
    )
    .argument('<library>', 'library ID (eg. query, router, table)')
    .argument('<path>', 'documentation path (eg. framework/react/overview)')
    .option('--docs-version <version>', 'docs version (default: latest)', 'latest')
    .option('--json', 'output JSON for automation', false)
    .action(
      async (
        libraryId: string,
        path: string,
        options: { docsVersion: string; json: boolean },
      ) => {
        try {
          await runWithTelemetry(
            'doc',
            {
              json: options.json,
              properties: {
                doc_path_depth: path.split('/').filter(Boolean).length,
                docs_version: sanitizeId(options.docsVersion),
                json: options.json,
                library: sanitizeId(libraryId),
              },
            },
            async (telemetry) => {
              const data = await fetchLibraries()
              const library = data.libraries.find((l) => l.id === libraryId)

              if (!library) {
                throw new Error(
                  `Library "${libraryId}" not found. Use \`tanstack libraries\` to see available libraries.`,
                )
              }

              if (
                options.docsVersion !== 'latest' &&
                !library.availableVersions.includes(options.docsVersion)
              ) {
                throw new Error(
                  `Version "${options.docsVersion}" not found for ${library.name}. Available: ${library.availableVersions.join(', ')}`,
                )
              }

              const branch =
                options.docsVersion === 'latest' ||
                options.docsVersion === library.latestVersion
                  ? library.latestBranch || 'main'
                  : options.docsVersion

              const docsRoot = library.docsRoot || 'docs'
              const filePath = `${docsRoot}/${path}.md`
              const content = await fetchDocContent(library.repo, branch, filePath)

              if (!content) {
                throw new Error(
                  `Document not found: ${library.name} / ${path} (version: ${options.docsVersion})`,
                )
              }

              const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
              let title = path.split('/').pop() || 'Untitled'
              let docContent = content

              if (frontmatterMatch && frontmatterMatch[1]) {
                const frontmatter = frontmatterMatch[1]
                const titleMatch = frontmatter.match(/title:\s*['"]?([^'"\n]+)['"]?/) 
                if (titleMatch && titleMatch[1]) {
                  title = titleMatch[1]
                }
                docContent = content.slice(frontmatterMatch[0].length).trim()
              }

              const payload = {
                title,
                content: docContent,
                url: `https://tanstack.com/${libraryId}/${options.docsVersion}/docs/${path}`,
                library: library.name,
                version:
                  options.docsVersion === 'latest'
                    ? library.latestVersion
                    : options.docsVersion,
              }

              telemetry.mergeProperties({
                content_length_bucket: getLengthBucket(docContent),
              })

              if (options.json) {
                printJson(payload)
                return
              }

              console.log(chalk.bold(payload.title))
              console.log(chalk.blue(payload.url))
              console.log('')
              console.log(payload.content)
            },
          )
        } catch (error) {
          log.error(formatErrorMessage(error))
          process.exit(1)
        }
      },
    )

  // === SEARCH-DOCS SUBCOMMAND ===
  program
    .command('search-docs')
    .description('Search TanStack documentation')
    .addOption(
      new Option(AGENT_FLAG, 'internal: invocation originated from an agent').hideHelp(),
    )
    .argument('<query>', 'search query')
    .option('--library <id>', 'filter to specific library')
    .option('--framework <name>', 'filter to specific framework')
    .option('--limit <n>', 'max results (default: 10, max: 50)', parsePositiveInteger, 10)
    .option('--json', 'output JSON for automation', false)
    .action(
      async (
        query: string,
        options: {
          library?: string
          framework?: string
          limit: number
          json: boolean
        },
      ) => {
        try {
          await runWithTelemetry(
            'search-docs',
            {
              json: options.json,
              properties: {
                framework: options.framework
                  ? sanitizeId(options.framework)
                  : undefined,
                has_query: query.trim().length > 0,
                json: options.json,
                library: options.library ? sanitizeId(options.library) : undefined,
                limit: options.limit,
                query_length_bucket: getLengthBucket(query),
              },
            },
            async (telemetry) => {
              const payload = await searchTanStackDocs({
                query,
                library: options.library,
                framework: options.framework,
                limit: options.limit,
              })

              telemetry.mergeProperties({
                result_count: payload.totalHits,
              })

              if (options.json) {
                printJson(payload)
                return
              }

              for (const result of payload.results) {
                console.log(
                  `${chalk.bold(result.title)} [${result.library}]\n${chalk.blue(result.url)}\n${result.snippet}\n`,
                )
              }
            },
          )
        } catch (error) {
          log.error(formatErrorMessage(error))
          process.exit(1)
        }
      },
    )

  // === ECOSYSTEM SUBCOMMAND ===
  program
    .command('ecosystem')
    .description('List TanStack ecosystem partners')
    .addOption(
      new Option(AGENT_FLAG, 'internal: invocation originated from an agent').hideHelp(),
    )
    .option('--category <category>', 'filter by category')
    .option('--library <id>', 'filter by TanStack library')
    .option('--json', 'output JSON for automation', false)
    .action(
      async (options: { category?: string; library?: string; json: boolean }) => {
        try {
          await runWithTelemetry(
            'ecosystem',
            {
              json: options.json,
              properties: {
                category: options.category ? sanitizeId(options.category) : undefined,
                json: options.json,
                library: options.library ? sanitizeId(options.library) : undefined,
              },
            },
            async (telemetry) => {
              const data = await fetchPartners()

              let resolvedCategory: string | undefined
              if (options.category) {
                const normalized = options.category.toLowerCase().trim()
                resolvedCategory = categoryAliases[normalized] || normalized
                if (!data.categories.includes(resolvedCategory)) {
                  resolvedCategory = undefined
                }
              }

              const library = options.library?.toLowerCase().trim()
              const partners = data.partners
                .filter((partner) =>
                  resolvedCategory ? partner.category === resolvedCategory : true,
                )
                .filter((partner) =>
                  library ? partner.libraries.some((l) => l === library) : true,
                )
                .map((partner) => ({
                  id: partner.id,
                  name: partner.name,
                  tagline: partner.tagline,
                  description: partner.description,
                  category: partner.category,
                  categoryLabel: partner.categoryLabel,
                  url: partner.url,
                  libraries: partner.libraries,
                }))

              const payload = {
                query: {
                  category: options.category,
                  categoryResolved: resolvedCategory,
                  library: options.library,
                },
                count: partners.length,
                partners,
              }

              telemetry.mergeProperties({
                category_resolved: resolvedCategory
                  ? sanitizeId(resolvedCategory)
                  : undefined,
                result_count: payload.count,
              })

              if (options.json) {
                printJson(payload)
                return
              }

              for (const partner of partners) {
                console.log(
                  `${chalk.bold(partner.name)} [${partner.category}] - ${partner.description}\n${chalk.blue(partner.url)}`,
                )
              }
            },
          )
        } catch (error) {
          log.error(formatErrorMessage(error))
          process.exit(1)
        }
      },
    )

  // === PIN-VERSIONS SUBCOMMAND ===
  program
    .command('pin-versions')
    .description('Pin versions of the TanStack libraries')
    .addOption(
      new Option(AGENT_FLAG, 'internal: invocation originated from an agent').hideHelp(),
    )
    .action(async () => {
      try {
        await runWithTelemetry('pin-versions', {}, async (telemetry) => {
          if (!fs.existsSync('package.json')) {
            throw new Error('package.json not found')
          }
          const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))

          const packages: Record<string, string> = {
            '@tanstack/react-router': '',
            '@tanstack/router-generator': '',
            '@tanstack/react-router-devtools': '',
            '@tanstack/react-start': '',
            '@tanstack/react-start-config': '',
            '@tanstack/router-plugin': '',
            '@tanstack/react-start-client': '',
            '@tanstack/react-start-plugin': '1.115.0',
            '@tanstack/react-start-server': '',
            '@tanstack/start-server-core': '1.115.0',
          }

          function sortObject(obj: Record<string, string>): Record<string, string> {
            return Object.keys(obj)
              .sort()
              .reduce<Record<string, string>>((acc, key) => {
                acc[key] = obj[key]
                return acc
              }, {})
          }

          if (!packageJson.dependencies['@tanstack/react-start']) {
            throw new Error('@tanstack/react-start not found in dependencies')
          }
          let changed = 0
          const startVersion = packageJson.dependencies[
            '@tanstack/react-start'
          ].replace(/^\^/, '')
          for (const pkg of Object.keys(packages)) {
            if (!packageJson.dependencies[pkg]) {
              packageJson.dependencies[pkg] = packages[pkg].length
                ? semver.maxSatisfying(
                    [startVersion, packages[pkg]],
                    `^${packages[pkg]}`,
                  )!
                : startVersion
              changed++
            } else {
              if (packageJson.dependencies[pkg].startsWith('^')) {
                packageJson.dependencies[pkg] = packageJson.dependencies[
                  pkg
                ].replace(/^\^/, '')
                changed++
              }
            }
          }
          telemetry.mergeProperties({
            changed_count: changed,
          })
          packageJson.dependencies = sortObject(packageJson.dependencies)
          if (changed > 0) {
            fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2))
            console.log(
              `${changed} packages updated.

Remove your node_modules directory and package lock file and re-install.`,
            )
          } else {
            console.log(
              'No changes needed. The relevant TanStack packages are already pinned.',
            )
          }
        })
      } catch (error) {
        log.error(formatErrorMessage(error))
        process.exit(1)
      }
    })

  const telemetryCommand = program.command('telemetry')
  telemetryCommand
    .command('status')
    .description('Show anonymous telemetry status')
    .addOption(
      new Option(AGENT_FLAG, 'internal: invocation originated from an agent').hideHelp(),
    )
    .option('--json', 'output JSON for automation', false)
    .action(async (options: { json: boolean }) => {
      const status = await getTelemetryStatus({ createIfMissing: true })
      const payload = {
        configPath: status.configPath,
        disabledBy: status.disabledBy,
        distinctId: status.distinctId,
        enabled: status.enabled,
        noticeVersion: status.noticeVersion,
      }

      if (options.json) {
        printJson(payload)
        return
      }

      console.log(`Telemetry ${status.enabled ? 'enabled' : 'disabled'}`)
      console.log(`Config: ${status.configPath}`)
      if (status.disabledBy) {
        console.log(`Disabled by: ${status.disabledBy}`)
      }
    })

  telemetryCommand
    .command('enable')
    .description('Enable anonymous telemetry')
    .addOption(
      new Option(AGENT_FLAG, 'internal: invocation originated from an agent').hideHelp(),
    )
    .action(async () => {
      await setTelemetryEnabled(true)
      console.log('Anonymous telemetry enabled')
    })

  telemetryCommand
    .command('disable')
    .description('Disable anonymous telemetry')
    .addOption(
      new Option(AGENT_FLAG, 'internal: invocation originated from an agent').hideHelp(),
    )
    .action(async () => {
      await setTelemetryEnabled(false)
      console.log('Anonymous telemetry disabled')
    })

  // === ADD SUBCOMMAND ===
  program
    .command('add')
    .addOption(
      new Option(AGENT_FLAG, 'internal: invocation originated from an agent').hideHelp(),
    )
    .argument(
      '[add-on...]',
      'Name of the add-ons (or add-ons separated by spaces or commas)',
    )
    .option('--forced', 'Force the add-on to be added', false)
    .action(async (addOns: Array<string>, options: { forced: boolean }) => {
      try {
        await runWithTelemetry(
          'add',
          {
            properties: {
              forced: options.forced,
            },
          },
          async (telemetry) => {
            const parsedAddOns: Array<string> = []
            for (const addOn of addOns) {
              if (addOn.includes(',') || addOn.includes(' ')) {
                parsedAddOns.push(
                  ...addOn.split(/[\s,]+/).map((addon) => addon.trim()),
                )
              } else {
                parsedAddOns.push(addOn.trim())
              }
            }

            if (parsedAddOns.length < 1) {
              const selectedAddOns = await promptForAddOns()
              telemetry.mergeProperties({
                add_on_count: selectedAddOns.length,
                add_on_ids: sanitizeIdList(selectedAddOns),
                prompted: true,
              })
              if (selectedAddOns.length) {
                await addToApp(environment, selectedAddOns, resolve(process.cwd()), {
                  forced: options.forced,
                })
              }
              return
            }

            telemetry.mergeProperties({
              add_on_count: parsedAddOns.length,
              add_on_ids: sanitizeIdList(parsedAddOns),
              prompted: false,
            })
            await addToApp(environment, parsedAddOns, resolve(process.cwd()), {
              forced: options.forced,
            })
          },
        )
      } catch (error) {
        log.error(formatErrorMessage(error))
        process.exit(1)
      }
    })

  // === ADD-ON SUBCOMMAND ===
  const addOnCommand = program.command('add-on')
  addOnCommand
    .command('init')
    .description('Initialize an add-on from the current project')
    .addOption(
      new Option(AGENT_FLAG, 'internal: invocation originated from an agent').hideHelp(),
    )
    .action(async () => {
      try {
        await runWithTelemetry('add-on:init', {}, async () => {
          await initAddOn(environment)
        })
      } catch (error) {
        log.error(formatErrorMessage(error))
        process.exit(1)
      }
    })
  addOnCommand
    .command('compile')
    .description('Update add-on from the current project')
    .addOption(
      new Option(AGENT_FLAG, 'internal: invocation originated from an agent').hideHelp(),
    )
    .action(async () => {
      try {
        await runWithTelemetry('add-on:compile', {}, async () => {
          await compileAddOn(environment)
        })
      } catch (error) {
        log.error(formatErrorMessage(error))
        process.exit(1)
      }
    })
  addOnCommand
    .command('dev')
    .description(
      'Watch project files and continuously refresh .add-on and add-on.json',
    )
    .addOption(
      new Option(AGENT_FLAG, 'internal: invocation originated from an agent').hideHelp(),
    )
    .action(async () => {
      try {
        await runWithTelemetry('add-on:dev', {}, async () => {
          await devAddOn(environment)
        })
      } catch (error) {
        log.error(formatErrorMessage(error))
        process.exit(1)
      }
    })

  // === TEMPLATE SUBCOMMAND ===
  const templateCommand = program.command('template')
  templateCommand
    .command('init')
    .description('Initialize a project template from the current project')
    .addOption(
      new Option(AGENT_FLAG, 'internal: invocation originated from an agent').hideHelp(),
    )
    .action(async () => {
      try {
        await runWithTelemetry('template:init', {}, async () => {
          await initStarter(environment)
        })
      } catch (error) {
        log.error(formatErrorMessage(error))
        process.exit(1)
      }
    })
  templateCommand
    .command('compile')
    .description('Compile the template JSON file for the current project')
    .addOption(
      new Option(AGENT_FLAG, 'internal: invocation originated from an agent').hideHelp(),
    )
    .action(async () => {
      try {
        await runWithTelemetry('template:compile', {}, async () => {
          await compileStarter(environment)
        })
      } catch (error) {
        log.error(formatErrorMessage(error))
        process.exit(1)
      }
    })

  // Legacy alias for template command
  const starterCommand = program.command('starter')
  starterCommand
    .command('init')
    .description('Deprecated alias: initialize a project template')
    .addOption(
      new Option(AGENT_FLAG, 'internal: invocation originated from an agent').hideHelp(),
    )
    .action(async () => {
      try {
        await runWithTelemetry('starter:init', {}, async () => {
          await initStarter(environment)
        })
      } catch (error) {
        log.error(formatErrorMessage(error))
        process.exit(1)
      }
    })
  starterCommand
    .command('compile')
    .description('Deprecated alias: compile the template JSON file')
    .addOption(
      new Option(AGENT_FLAG, 'internal: invocation originated from an agent').hideHelp(),
    )
    .action(async () => {
      try {
        await runWithTelemetry('starter:compile', {}, async () => {
          await compileStarter(environment)
        })
      } catch (error) {
        log.error(formatErrorMessage(error))
        process.exit(1)
      }
    })

  // === LEGACY AUTO-CREATE MODE ===
  // For backward compatibility with cli-aliases (create-tsrouter-app, etc.)
  // If legacyAutoCreate is true and no subcommand is provided, treat the first
  // argument as a project name and auto-invoke create behavior
  if (legacyAutoCreate) {
    // Configure the main program with create options for legacy mode
    configureCreateCommand(program)
    program.action(handleCreate)
  }

  program.parse()
}
