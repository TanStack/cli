import { intro } from '@clack/prompts'

import {
  finalizeAddOns,
  getFrameworkById,
  getFrameworks,
  getPackageManager,
  loadStarter,
  populateAddOnOptionsDefaults,
  readConfigFile,
} from '@tanstack/create'

import {
  getProjectName,
  promptForAddOnOptions,
  promptForEnvVars,
  selectAddOns,
  selectDeployment,
  selectExamples,
  selectFramework,
  selectGit,
  selectInstall,
  selectPackageManager,
  selectTemplate,
  selectToolchain,
} from './ui-prompts.js'
import {
  listTemplateChoices,
  resolveStarterSpecifier,
} from './command-line.js'

import {
  resolveProjectLocation,
  validateProjectName,
} from './utils.js'
import type { Options } from '@tanstack/create'

import type { CliOptions } from './types.js'

export async function promptForCreateOptions(
  cliOptions: CliOptions,
  {
    forcedAddOns = [],
    forcedDeployment,
    showDeploymentOptions = true,
    defaultFrameworkId,
  }: {
    forcedAddOns?: Array<string>
    forcedDeployment?: string
    showDeploymentOptions?: boolean
    defaultFrameworkId?: string
  },
): Promise<Required<Options> | undefined> {
  const options = {} as Required<Options>

  if (cliOptions.framework) {
    options.framework = getFrameworkById(cliOptions.framework)!
  } else {
    const availableFrameworks = getFrameworks()
    if (defaultFrameworkId || availableFrameworks.length <= 1) {
      options.framework = getFrameworkById(defaultFrameworkId || 'react')!
    } else {
      options.framework = await selectFramework(
        availableFrameworks,
        defaultFrameworkId,
      )
    }
  }

  const projectLocation = resolveProjectLocation({
    projectName: cliOptions.projectName ?? (await getProjectName()),
    targetDir: cliOptions.targetDir,
    emptyProjectNameIsCurrentDirectory: true,
  })

  if (!projectLocation) {
    throw new Error('Project name or target directory is required')
  }

  options.projectName = projectLocation.projectName
  options.targetDir = projectLocation.targetDir

  const { valid, error } = validateProjectName(options.projectName)
  if (!valid) {
    console.error(error)
    process.exit(1)
  }

  // Mode is always file-router (TanStack Start)
  options.mode = 'file-router'
  const template = cliOptions.template?.toLowerCase().trim()
  const isLegacyTemplate =
    template &&
    ['file-router', 'typescript', 'tsx', 'javascript', 'js', 'jsx'].includes(
      template,
    )
  const routerOnly =
    !!cliOptions.routerOnly ||
    (isLegacyTemplate ? template !== 'file-router' : false)

  if (!cliOptions.starter) {
    if (cliOptions.template && !isLegacyTemplate) {
      cliOptions.starter = cliOptions.template
    } else if (cliOptions.templateId) {
      cliOptions.starter = cliOptions.templateId
    }
  }

  if (!routerOnly && !cliOptions.starter) {
    const starterChoices = await listTemplateChoices(options.framework.id)
    const selectedTemplateId = await selectTemplate(
      starterChoices.map((choice) => ({
        id: choice.id,
        name: choice.name,
        description: choice.description,
      })),
    )
    if (selectedTemplateId) {
      cliOptions.starter = selectedTemplateId
    }
  }

  const starter = !routerOnly && cliOptions.starter
    ? await loadStarter(
        await resolveStarterSpecifier(cliOptions.starter, options.framework.id),
      )
    : undefined

  if (starter) {
    options.framework = getFrameworkById(starter.framework) || options.framework
    options.mode = starter.mode
  }

  // TypeScript is always enabled with file-router
  options.typescript = true

  // Package manager selection
  if (cliOptions.packageManager) {
    options.packageManager = cliOptions.packageManager
  } else {
    const detectedPackageManager = await getPackageManager()
    options.packageManager =
      detectedPackageManager || (await selectPackageManager())
  }

  // Toolchain selection
  const toolchain = await selectToolchain(
    options.framework,
    cliOptions.toolchain,
  )

  // Deployment selection
  let deployment: string | undefined
  if (routerOnly) {
    deployment = undefined
  } else if (cliOptions.deployment) {
    deployment = cliOptions.deployment
  } else if (showDeploymentOptions) {
    deployment = await selectDeployment(
      options.framework,
      cliOptions.deployment,
      forcedDeployment,
    )
  } else {
    deployment = forcedDeployment
  }

  // Add-ons selection
  const addOns: Set<string> = new Set()

  // Examples/demo pages are enabled by default
  const includeExamples =
    cliOptions.examples ?? (routerOnly ? false : await selectExamples())
  ;(options as Required<Options> & { includeExamples?: boolean }).includeExamples =
    includeExamples

  if (toolchain) {
    addOns.add(toolchain)
  }
  if (deployment) {
    addOns.add(deployment)
  }

  if (!routerOnly) {
    for (const addOn of starter?.dependsOn || []) {
      addOns.add(addOn)
    }
    for (const addOn of forcedAddOns) {
      addOns.add(addOn)
    }
  }

  if (!routerOnly && Array.isArray(cliOptions.addOns)) {
    for (const addOn of cliOptions.addOns) {
      if (addOn.toLowerCase() === 'start') {
        continue
      }
      addOns.add(addOn)
    }
  } else if (!routerOnly) {
    for (const addOn of await selectAddOns(
      options.framework,
      options.mode,
      'add-on',
      'What add-ons would you like for your project?',
      forcedAddOns,
    )) {
      addOns.add(addOn)
    }

    if (includeExamples) {
      for (const addOn of await selectAddOns(
        options.framework,
        options.mode,
        'example',
        'Would you like an example?',
        forcedAddOns,
        false,
      )) {
        addOns.add(addOn)
      }
    }
  }

  const chosenAddOns = Array.from(
    await finalizeAddOns(options.framework, options.mode, Array.from(addOns)),
  )
  options.chosenAddOns = includeExamples
    ? chosenAddOns
    : chosenAddOns.filter((addOn) => addOn.type !== 'example')

  // Tailwind is always enabled
  options.tailwind = true

  // Prompt for add-on options in interactive mode
  if (Array.isArray(cliOptions.addOns)) {
    // Non-interactive mode: use defaults
    options.addOnOptions = populateAddOnOptionsDefaults(options.chosenAddOns)
  } else {
    // Interactive mode: prompt for options
    const userOptions = await promptForAddOnOptions(
      options.chosenAddOns.map((a) => a.id),
      options.framework,
    )
    const defaultOptions = populateAddOnOptionsDefaults(options.chosenAddOns)
    // Merge user options with defaults
    options.addOnOptions = { ...defaultOptions, ...userOptions }
  }

  // Prompt for env vars exposed by selected add-ons in interactive mode
  const envVarValues = Array.isArray(cliOptions.addOns)
    ? {}
    : await promptForEnvVars(options.chosenAddOns)
  ;(options as Required<Options> & { envVarValues?: Record<string, string> }).envVarValues =
    envVarValues

  options.git = cliOptions.git ?? (await selectGit())
  options.install = cliOptions.install ?? (await selectInstall())

  if (starter) {
    options.starter = starter
  }

  return options
}

export async function promptForAddOns(): Promise<Array<string>> {
  const config = await readConfigFile(process.cwd())

  if (!config) {
    console.error('No config file found')
    process.exit(1)
  }

  const framework = getFrameworkById(config.framework)

  if (!framework) {
    console.error(`Unknown framework: ${config.framework}`)
    process.exit(1)
  }

  intro(`Adding new add-ons to '${config.projectName}'`)

  const addOns: Set<string> = new Set()

  for (const addOn of await selectAddOns(
    framework,
    config.mode!,
    'add-on',
    'What add-ons would you like for your project?',
    config.chosenAddOns,
  )) {
    addOns.add(addOn)
  }

  for (const addOn of await selectAddOns(
    framework,
    config.mode!,
    'example',
    'Would you like any examples?',
    config.chosenAddOns,
  )) {
    addOns.add(addOn)
  }

  return Array.from(addOns)
}
