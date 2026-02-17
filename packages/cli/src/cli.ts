import fs from 'node:fs'
import { resolve } from 'node:path'
import { Command, InvalidArgumentError } from 'commander'
import { intro, log } from '@clack/prompts'
import chalk from 'chalk'
import semver from 'semver'

import {
  SUPPORTED_PACKAGE_MANAGERS,
  addToApp,
  compileAddOn,
  compileStarter,
  createApp,
  createSerializedOptions,
  getAllAddOns,
  getFrameworkByName,
  getFrameworks,
  initAddOn,
  initStarter,
} from '@tanstack/create'

import { launchUI } from '@tanstack/create-ui'

import { runMCPServer } from './mcp.js'

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

export function cli({
  name,
  appName,
  forcedAddOns = [],
  forcedDeployment,
  defaultFramework,
  webBase,
  frameworkDefinitionInitializers,
  showDeploymentOptions = false,
  legacyAutoCreate = false,
}: {
  name: string
  appName: string
  forcedAddOns?: Array<string>
  forcedDeployment?: string
  defaultFramework?: string
  webBase?: string
  frameworkDefinitionInitializers?: Array<() => FrameworkDefinition>
  showDeploymentOptions?: boolean
  legacyAutoCreate?: boolean
}) {
  const environment = createUIEnvironment(appName, false)

  const program = new Command()

  const availableFrameworks = getFrameworks().map((f) => f.name)

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

  program
    .name(name)
    .description(`${appName} CLI`)
    .version(VERSION, '-v, --version', 'output the current version')

  // Helper to create the create command action handler
  async function handleCreate(projectName: string, options: CliOptions) {
    const legacyCreateFlags = validateLegacyCreateFlags(options)
    if (legacyCreateFlags.error) {
      log.error(legacyCreateFlags.error)
      process.exit(1)
    }

    for (const warning of legacyCreateFlags.warnings) {
      log.warn(warning)
    }

    if (options.listAddOns) {
      const addOns = await getAllAddOns(
        getFrameworkByName(options.framework || defaultFramework || 'React')!,
        defaultMode,
      )
      let hasConfigurableAddOns = false
      for (const addOn of addOns.filter((a) => !forcedAddOns.includes(a.id))) {
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
          (a) =>
            a.id.toLowerCase() === options.addonDetails!.toLowerCase(),
        )
      if (!addOn) {
        console.error(`Add-on '${options.addonDetails}' not found`)
        process.exit(1)
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
          if (option && typeof option === 'object' && 'type' in option) {
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
      // Validate dev watch options
      const validation = validateDevWatchOptions({ ...options, projectName })
      if (!validation.valid) {
        console.error(validation.error)
        process.exit(1)
      }

      // Enter dev watch mode
      if (!projectName && !options.targetDir) {
        console.error(
          'Project name/target directory is required for dev watch mode',
        )
        process.exit(1)
      }

      if (!options.framework) {
        console.error('Failed to detect framework')
        process.exit(1)
      }

      const framework = getFrameworkByName(options.framework)
      if (!framework) {
        console.error('Failed to detect framework')
        process.exit(1)
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

      normalizedOpts.targetDir =
        options.targetDir || resolve(process.cwd(), projectName)

      // Create the initial app with minimal output for dev watch mode
      console.log(chalk.bold('\ndev-watch'))
      console.log(chalk.gray('├─') + ' ' + `creating initial ${appName} app...`)
      if (normalizedOpts.install !== false) {
        console.log(chalk.gray('├─') + ' ' + chalk.yellow('⟳') + ' installing packages...')
      }
      const silentEnvironment = createUIEnvironment(appName, true)
      await createApp(silentEnvironment, normalizedOpts)
      console.log(chalk.gray('└─') + ' ' + chalk.green('✓') + ` app created`)

      // Now start the dev watch mode
      const manager = new DevWatchManager({
        watchPath: options.devWatch,
        targetDir: normalizedOpts.targetDir,
        framework,
        cliOptions: normalizedOpts,
        packageManager: normalizedOpts.packageManager,
        environment,
        frameworkDefinitionInitializers,
      })

      await manager.start()
      return
    }

    try {
      const cliOptions = {
        projectName,
        ...options,
      } as CliOptions

      cliOptions.framework = getFrameworkByName(
        options.framework || defaultFramework || 'React',
      )!.id

      let finalOptions: Options | undefined
      if (cliOptions.interactive || cliOptions.addOns === true) {
        cliOptions.addOns = true
      } else {
        finalOptions = await normalizeOptions(
          cliOptions,
          forcedAddOns,
          { forcedDeployment },
        )
      }

      if (options.ui) {
        const optionsFromCLI = await normalizeOptions(
          cliOptions,
          forcedAddOns,
          { disableNameCheck: true, forcedDeployment },
        )
        const uiOptions = {
          ...createSerializedOptions(optionsFromCLI!),
          projectName: 'my-app',
          targetDir: resolve(process.cwd(), 'my-app'),
        }
        launchUI({
          mode: 'setup',
          options: uiOptions,
          forcedRouterMode: defaultMode,
          forcedAddOns,
          environmentFactory: () => createUIEnvironment(appName, false),
          webBase,
          showDeploymentOptions,
        })
        return
      }

      if (finalOptions) {
        intro(`Creating a new ${appName} app in ${projectName}...`)
      } else {
        intro(`Let's configure your ${appName} application`)
        finalOptions = await promptForCreateOptions(cliOptions, {
          forcedAddOns,
          showDeploymentOptions,
        })
      }

      if (!finalOptions) {
        throw new Error('No options were provided')
      }

      // Determine target directory:
      // 1. Use --target-dir if provided
      // 2. Use targetDir from normalizeOptions if set (handles "." case)
      // 3. If original projectName was ".", use current directory
      // 4. Otherwise, use project name as subdirectory
      if (options.targetDir) {
        finalOptions.targetDir = options.targetDir
      } else if (finalOptions.targetDir) {
        // Keep the targetDir from normalizeOptions (handles "." case)
      } else if (projectName === '.') {
        finalOptions.targetDir = resolve(process.cwd())
      } else {
        finalOptions.targetDir = resolve(process.cwd(), finalOptions.projectName)
      }

      await createApp(environment, finalOptions)
    } catch (error) {
      log.error(
        error instanceof Error ? error.message : 'An unknown error occurred',
      )
      process.exit(1)
    }
  }

  // Helper to configure create command options
  function configureCreateCommand(cmd: Command) {
    cmd.argument('[project-name]', 'name of the project')

    if (!defaultFramework) {
      cmd.option<string>(
        '--framework <type>',
        `project framework (${availableFrameworks.join(', ')})`,
        (value) => {
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
        '--starter [url]',
        'initialize this project from a starter URL',
        false,
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
      .option(
        '--router-only',
        'Deprecated: compatibility flag from create-tsrouter-app',
      )
      .option(
        '--template <type>',
        'Deprecated: compatibility flag from create-tsrouter-app',
      )
      .option(
        '--tailwind',
        'Deprecated: compatibility flag; Tailwind is always enabled',
      )
      .option(
        '--no-tailwind',
        'Deprecated: compatibility flag; Tailwind opt-out is ignored',
      )

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
      .option('--no-git', 'do not create a git repository')
      .option(
        '--target-dir <path>',
        'the target directory for the application root',
      )
      .option('--ui', 'Launch the UI for project creation')
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

  // === MCP SUBCOMMAND ===
  program
    .command('mcp')
    .description('Run the MCP (Model Context Protocol) server')
    .option('--sse', 'Run in SSE mode instead of stdio', false)
    .action(async (options: { sse: boolean }) => {
      await runMCPServer(options.sse, {
        forcedAddOns,
        appName,
      })
    })

  // === PIN-VERSIONS SUBCOMMAND ===
  program
    .command('pin-versions')
    .description('Pin versions of the TanStack libraries')
    .action(async () => {
      if (!fs.existsSync('package.json')) {
        console.error('package.json not found')
        return
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
        console.error('@tanstack/react-start not found in dependencies')
        return
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

  // === ADD SUBCOMMAND ===
  program
    .command('add')
    .argument(
      '[add-on...]',
      'Name of the add-ons (or add-ons separated by spaces or commas)',
    )
    .option('--forced', 'Force the add-on to be added', false)
    .option('--ui', 'Add with the UI')
    .action(async (addOns: Array<string>, options: { forced: boolean; ui: boolean }) => {
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
      if (options.ui) {
        launchUI({
          mode: 'add',
          addOns: parsedAddOns,
          projectPath: resolve(process.cwd()),
          forcedRouterMode: defaultMode,
          forcedAddOns,
          environmentFactory: () => createUIEnvironment(appName, false),
          webBase,
          showDeploymentOptions,
        })
      } else if (parsedAddOns.length < 1) {
        const selectedAddOns = await promptForAddOns()
        if (selectedAddOns.length) {
          await addToApp(environment, selectedAddOns, resolve(process.cwd()), {
            forced: options.forced,
          })
        }
      } else {
        await addToApp(environment, parsedAddOns, resolve(process.cwd()), {
          forced: options.forced,
        })
      }
    })

  // === ADD-ON SUBCOMMAND ===
  const addOnCommand = program.command('add-on')
  addOnCommand
    .command('init')
    .description('Initialize an add-on from the current project')
    .action(async () => {
      await initAddOn(environment)
    })
  addOnCommand
    .command('compile')
    .description('Update add-on from the current project')
    .action(async () => {
      await compileAddOn(environment)
    })

  // === STARTER SUBCOMMAND ===
  const starterCommand = program.command('starter')
  starterCommand
    .command('init')
    .description('Initialize a project starter from the current project')
    .action(async () => {
      await initStarter(environment)
    })
  starterCommand
    .command('compile')
    .description('Compile the starter JSON file for the current project')
    .action(async () => {
      await compileStarter(environment)
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
