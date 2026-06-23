import { createPackageJSON } from './edge-package-json.js'
import { createTemplateFile } from './edge-template-file.js'
import { formatCommand } from './utils.js'
import { isBase64, isDemoFilePath } from './edge-file-helpers.js'
import { basenamePath, joinPaths, normalizePath } from './edge-path.js'
import { resolvePackageJSONLatest } from './npm-resolver.js'
import { writeConfigFileToEnvironment } from './edge-config-file.js'
import {
  getPackageManagerExecuteCommand,
  getPackageManagerScriptCommand,
  packageManagerInstall,
  translateExecuteCommand,
} from './package-manager.js'

import type { Environment, FileBundleHandler, Options } from './types.js'

function stripExamplesFromOptions(options: Options): Options {
  if (options.includeExamples !== false) {
    return options
  }

  const chosenAddOns = options.chosenAddOns
    .filter((addOn) => addOn.type !== 'example')
    .map((addOn) => {
      const filteredRoutes = (addOn.routes || []).filter(
        (route) =>
          !isDemoFilePath(route.path) &&
          !(route.url && route.url.startsWith('/demo')),
      )

      const filteredIntegrations = (addOn.integrations || []).filter(
        (integration) => !isDemoFilePath(integration.path),
      )

      return {
        ...addOn,
        routes: filteredRoutes,
        integrations: filteredIntegrations,
        getFiles: async () => {
          const files = await addOn.getFiles()
          return files.filter((file) => !isDemoFilePath(file))
        },
        getDeletedFiles: async () => {
          const deletedFiles = await addOn.getDeletedFiles()
          return deletedFiles.filter((file) => !isDemoFilePath(file))
        },
      }
    })

  return {
    ...options,
    chosenAddOns,
  }
}

async function writeFiles(environment: Environment, options: Options) {
  const templateFileFromContent = createTemplateFile(environment, options)

  async function writeFileBundle(bundle: FileBundleHandler) {
    const files = await bundle.getFiles()

    for (const file of files) {
      const contents = await bundle.getFileContents(file)

      if (isBase64(contents)) {
        await environment.writeFileBase64(
          joinPaths(options.targetDir, file),
          contents,
        )
      } else {
        await templateFileFromContent(file, contents)
      }
    }

    const deletedFiles = await bundle.getDeletedFiles()
    for (const file of deletedFiles) {
      await environment.deleteFile(joinPaths(options.targetDir, file))
    }
  }

  environment.startStep({
    id: 'write-framework-files',
    type: 'file',
    message: 'Writing framework files...',
  })
  await writeFileBundle(options.framework)
  environment.finishStep('write-framework-files', 'Framework files written')

  let wroteAddonFiles = false
  for (const type of ['add-on', 'example', 'toolchain', 'deployment']) {
    for (const phase of ['setup', 'add-on', 'example']) {
      for (const addOn of options.chosenAddOns.filter(
        (addOn) => addOn.phase === phase && addOn.type === type,
      )) {
        environment.startStep({
          id: 'write-addon-files',
          type: 'file',
          message: `Writing ${addOn.name} files...`,
        })
        await writeFileBundle(addOn)
        wroteAddonFiles = true
      }
    }
  }
  if (wroteAddonFiles) {
    environment.finishStep('write-addon-files', 'Add-on files written')
  }

  if (options.starter) {
    environment.startStep({
      id: 'write-starter-files',
      type: 'file',
      message: 'Writing starter files...',
    })
    await writeFileBundle(options.starter)
    environment.finishStep('write-starter-files', 'Starter files written')
  }

  environment.startStep({
    id: 'write-package-json',
    type: 'file',
    message: 'Writing package.json...',
  })
  const packageJSON = await resolvePackageJSONLatest(createPackageJSON(options))
  await environment.writeFile(
    joinPaths(options.targetDir, './package.json'),
    JSON.stringify(packageJSON, null, 2),
  )
  environment.finishStep('write-package-json', 'Package.json written')

  environment.startStep({
    id: 'write-config-file',
    type: 'file',
    message: 'Writing config file...',
  })
  await writeConfigFileToEnvironment(environment, options)
  environment.finishStep('write-config-file', 'Config file written')
}

async function runSpecialSteps(
  environment: Environment,
  options: Options,
  specialSteps: Array<string>,
) {
  if (!specialSteps.length) {
    return
  }

  environment.startStep({
    id: 'special-steps',
    type: 'command',
    message: 'Running special steps...',
  })

  for (const step of specialSteps) {
    if (step === 'rimraf-node-modules') {
      await environment.rimraf(joinPaths(options.targetDir, 'node_modules'))
      for (const lockFile of [
        'package-lock.json',
        'yarn.lock',
        'pnpm-lock.yaml',
      ]) {
        const lockFilePath = joinPaths(options.targetDir, lockFile)
        if (environment.exists(lockFilePath)) {
          await environment.deleteFile(lockFilePath)
        }
      }
      continue
    }

    if (step === 'post-init-script') {
      const packageJsonPath = joinPaths(options.targetDir, 'package.json')
      if (!environment.exists(packageJsonPath)) {
        environment.warn(
          'Warning',
          'No package.json found, skipping post-create-init script',
        )
        continue
      }

      const packageJson = JSON.parse(await environment.readFile(packageJsonPath))
      const postCreateInit = packageJson.scripts?.['post-create-init']
      if (postCreateInit) {
        const { command, args } = getPackageManagerScriptCommand(
          options.packageManager,
          ['post-create-init'],
        )
        await environment.execute(command, args, options.targetDir, {
          inherit: true,
        })
      }
      continue
    }

    environment.error(`Special step ${step} not found`)
  }

  environment.finishStep('special-steps', 'Special steps complete')
}

async function installShadcnComponents(
  environment: Environment,
  targetDir: string,
  options: Options,
) {
  if (!options.chosenAddOns.find((a) => a.id === 'shadcn')) {
    return
  }

  const shadcnComponents = new Set<string>()
  for (const addOn of options.chosenAddOns) {
    if (addOn.shadcnComponents) {
      for (const component of addOn.shadcnComponents) {
        shadcnComponents.add(component)
      }
    }
  }
  if (options.starter?.shadcnComponents) {
    for (const component of options.starter.shadcnComponents) {
      shadcnComponents.add(component)
    }
  }

  if (shadcnComponents.size > 0) {
    environment.startStep({
      id: 'install-shadcn-components',
      type: 'command',
      message: `Installing shadcn components (${Array.from(shadcnComponents).join(', ')})...`,
    })

    const { command, args } = getPackageManagerExecuteCommand(
      options.packageManager,
      'shadcn@latest',
      ['add', '--silent', '--yes', ...Array.from(shadcnComponents)],
    )
    await environment.execute(command, args, normalizePath(targetDir))

    environment.finishStep(
      'install-shadcn-components',
      'Shadcn components installed',
    )
  }
}

async function setupIntent(
  environment: Environment,
  targetDir: string,
  options: Options,
) {
  if (!options.intent) {
    return
  }

  environment.startStep({
    id: 'setup-intent',
    type: 'command',
    message: 'Setting up TanStack Intent skill mappings...',
  })

  const { command, args } = getPackageManagerExecuteCommand(
    options.packageManager,
    '@tanstack/intent',
    ['install', '--map'],
  )
  await environment.execute(command, args, normalizePath(targetDir))
  environment.finishStep('setup-intent', 'TanStack Intent configured')
}

async function runCommandsAndInstallDependencies(
  environment: Environment,
  options: Options,
) {
  const s = environment.spinner()

  if (options.git) {
    s.start('Initializing git repository...')
    environment.startStep({
      id: 'initialize-git-repository',
      type: 'command',
      message: 'Initializing git repository...',
    })

    await environment.execute('git', ['init'], normalizePath(options.targetDir))

    environment.finishStep(
      'initialize-git-repository',
      'Initialized git repository',
    )
    s.stop('Initialized git repository')
  }

  const specialSteps = new Set<string>()
  for (const addOn of options.chosenAddOns) {
    for (const step of addOn.createSpecialSteps || []) {
      specialSteps.add(step)
    }
  }
  if (specialSteps.size) {
    await runSpecialSteps(environment, options, Array.from(specialSteps))
  }

  if (options.install !== false) {
    s.start(`Installing dependencies via ${options.packageManager}...`)
    environment.startStep({
      id: 'install-dependencies',
      type: 'package-manager',
      message: `Installing dependencies via ${options.packageManager}...`,
    })
    await packageManagerInstall(
      environment,
      options.targetDir,
      options.packageManager,
    )
    environment.finishStep('install-dependencies', 'Installed dependencies')
    s.stop('Installed dependencies')
  } else {
    s.start('Skipping dependency installation...')
    environment.startStep({
      id: 'skip-dependencies',
      type: 'info',
      message: 'Skipping dependency installation...',
    })
    environment.finishStep('skip-dependencies', 'Dependency installation skipped')
    s.stop('Dependency installation skipped')
  }

  const postInitSpecialSteps = new Set<string>()
  for (const addOn of options.chosenAddOns) {
    for (const step of addOn.postInitSpecialSteps || []) {
      postInitSpecialSteps.add(step)
    }
  }
  if (postInitSpecialSteps.size) {
    await runSpecialSteps(
      environment,
      options,
      Array.from(postInitSpecialSteps),
    )
  }

  for (const phase of ['setup', 'add-on', 'example']) {
    for (const addOn of options.chosenAddOns.filter(
      (addOn) =>
        addOn.phase === phase && addOn.command && addOn.command.command,
    )) {
      s.start(`Running commands for ${addOn.name}...`)
      const translated = translateExecuteCommand(options.packageManager, {
        command: addOn.command!.command,
        args: addOn.command!.args || [],
      })
      const cmd = formatCommand(translated)
      environment.startStep({
        id: 'run-commands',
        type: 'command',
        message: cmd,
      })
      await environment.execute(
        translated.command,
        translated.args,
        options.targetDir,
        { inherit: true },
      )
      environment.finishStep('run-commands', 'Setup commands complete')
      s.stop(`${addOn.name} commands complete`)
    }
  }

  if (
    options.starter &&
    options.starter.command &&
    options.starter.command.command
  ) {
    s.start(`Setting up starter ${options.starter.name}...`)
    const starterTranslated = translateExecuteCommand(options.packageManager, {
      command: options.starter.command.command,
      args: options.starter.command.args || [],
    })
    const cmd = formatCommand(starterTranslated)
    environment.startStep({
      id: 'run-starter-command',
      type: 'command',
      message: cmd,
    })

    await environment.execute(
      starterTranslated.command,
      starterTranslated.args,
      options.targetDir,
      { inherit: true },
    )

    environment.finishStep('run-starter-command', 'Starter command complete')
    s.stop(`${options.starter.name} commands complete`)
  }

  await installShadcnComponents(environment, options.targetDir, options)
  await setupIntent(environment, options.targetDir, options)

  if (shouldGenerateRoutes(options)) {
    s.start('Generating route tree...')
    const command = getPackageManagerScriptCommand(options.packageManager, [
      'generate-routes',
    ])
    const cmd = formatCommand(command)
    environment.startStep({
      id: 'generate-routes',
      type: 'command',
      message: cmd,
    })
    await environment.execute(
      command.command,
      command.args,
      options.targetDir,
      {
        inherit: true,
      },
    )
    environment.finishStep('generate-routes', 'Route tree generated')
    s.stop('Route tree generated')
  }
}

function shouldGenerateRoutes(options: Options) {
  return (
    options.install !== false &&
    options.mode === 'file-router' &&
    (options.framework.id === 'react' || options.framework.id === 'solid')
  )
}

async function seedEnvValues(environment: Environment, options: Options) {
  const envVarValues = options.envVarValues || {}
  const entries = Object.entries(envVarValues)
  if (entries.length === 0) return

  const envLocalPath = joinPaths(options.targetDir, '.env.local')
  if (!environment.exists(envLocalPath)) {
    return
  }

  let envContents = await environment.readFile(envLocalPath)
  for (const [key, value] of entries) {
    const escapedValue = value.replace(/\n/g, '\\n')
    const nextLine = `${key}=${escapedValue}`
    const pattern = new RegExp(`^${key}=.*$`, 'm')

    if (pattern.test(envContents)) {
      envContents = envContents.replace(pattern, nextLine)
    } else {
      envContents += `${envContents.endsWith('\n') ? '' : '\n'}${nextLine}\n`
    }
  }

  await environment.writeFile(envLocalPath, envContents)
}

async function writeEnvExample(environment: Environment, options: Options) {
  const envExamplePath = joinPaths(options.targetDir, '.env.example')
  const existing = environment.exists(envExamplePath)
    ? await environment.readFile(envExamplePath)
    : ''

  const declared = new Set<string>()
  for (const match of existing.matchAll(/^([A-Z_][A-Z0-9_]*)=/gm)) {
    declared.add(match[1])
  }

  const sections: Array<string> = []
  for (const addOn of options.chosenAddOns) {
    const lines: Array<string> = []
    for (const envVar of addOn.envVars || []) {
      if (declared.has(envVar.name)) continue
      declared.add(envVar.name)
      if (envVar.description) {
        const required = envVar.required ? ' (required)' : ''
        lines.push(`# ${envVar.description}${required}`)
      }
      lines.push(`${envVar.name}=`)
    }
    if (lines.length > 0) {
      sections.push(`# ${addOn.name}\n${lines.join('\n')}`)
    }
  }

  if (sections.length === 0) return

  const additions = sections.join('\n\n')
  const newContent = existing
    ? `${existing.trimEnd()}\n\n${additions}\n`
    : `${additions}\n`

  await environment.writeFile(envExamplePath, newContent)
}

const SHIPPING_CATEGORIES = new Set(['auth', 'database', 'orm', 'deploy'])

function buildNextSteps(options: Options): string {
  const collectedEnv = new Set(Object.keys(options.envVarValues || {}))
  const listedEnvVars = new Set<string>()
  const envVarLines: Array<string> = []
  const docLines: Array<string> = []

  for (const addOn of options.chosenAddOns) {
    if (addOn.link && addOn.category && SHIPPING_CATEGORIES.has(addOn.category)) {
      docLines.push(`  - ${addOn.name} (${addOn.category}): ${addOn.link}`)
    }

    for (const envVar of addOn.envVars || []) {
      if (listedEnvVars.has(envVar.name)) continue
      listedEnvVars.add(envVar.name)
      const required = envVar.required ? ' (required)' : ''
      const status = collectedEnv.has(envVar.name)
        ? ' - already set from your input'
        : ' - needs a value'
      const desc = envVar.description ? ` - ${envVar.description}` : ''
      envVarLines.push(`  - ${envVar.name}${required}${desc}${status}`)
    }
  }

  const sections: Array<string> = []
  if (envVarLines.length > 0) {
    sections.push(
      `Environment variables (review/fill in .env.local before deploying):\n${envVarLines.join('\n')}`,
    )
  }
  if (docLines.length > 0) {
    sections.push(`Docs for the integrations you picked:\n${docLines.join('\n')}`)
  }
  if (options.intent) {
    sections.push(
      `Working with an AI agent? Your agent config (AGENTS.md / CLAUDE.md) was wired up by TanStack Intent\nwith explicit skill mappings for the libraries you installed. Try asking your agent:\n  - "migrate this Next.js page to TanStack Start"\n  - "add a protected /dashboard route"\n  - "show me how to use TanStack Router search params"`,
    )
  }

  return sections.length > 0 ? `\nNext steps:\n\n${sections.join('\n\n')}\n` : ''
}

function report(environment: Environment, options: Options) {
  const warnings: Array<string> = []
  for (const addOn of options.chosenAddOns) {
    if (addOn.warning) {
      warnings.push(addOn.warning)
    }
  }

  if (warnings.length > 0) {
    environment.warn('Warnings', warnings.join('\n'))
  }

  let errorStatement = ''
  if (environment.getErrors().length) {
    errorStatement = `

Errors were encountered during the creation of your app:

${environment.getErrors().join('\n')}`
  }

  const targetDir = normalizePath(options.targetDir)
  const isCurrentDirectory = targetDir === '.'
  const locationMessage = isCurrentDirectory
    ? `Your ${environment.appName} app is ready.`
    : `Your ${environment.appName} app is ready in '${basenamePath(targetDir)}'.`
  const cdInstruction = isCurrentDirectory
    ? ''
    : `% cd ${options.projectName}
`

  const nextSteps = buildNextSteps(options)

  environment.outro(
    `${locationMessage}

Use the following commands to start your app:
${cdInstruction}% ${formatCommand(
      getPackageManagerScriptCommand(options.packageManager, ['dev']),
    )}
${nextSteps}
Please read the README.md file for information on testing, styling, adding routes, etc.${errorStatement}`,
  )
}

export async function createApp(environment: Environment, options: Options) {
  const effectiveOptions = stripExamplesFromOptions(options)

  environment.startRun()
  await writeFiles(environment, effectiveOptions)
  await seedEnvValues(environment, effectiveOptions)
  await writeEnvExample(environment, effectiveOptions)
  await runCommandsAndInstallDependencies(environment, effectiveOptions)
  environment.finishRun()

  report(environment, effectiveOptions)
}
