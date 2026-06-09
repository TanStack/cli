import {
  cancel,
  confirm,
  isCancel,
  multiselect,
  note,
  password,
  select,
  text,
} from '@clack/prompts'

import {
  DEFAULT_PACKAGE_MANAGER,
  SUPPORTED_PACKAGE_MANAGERS,
  getAllAddOns,
} from '@tanstack/create'

import {
  isCurrentDirectoryProjectNameInput,
  validateProjectName,
} from './utils.js'
import type { AddOn, PackageManager } from '@tanstack/create'

import type { Framework } from '@tanstack/create/dist/types/types.js'

export async function selectFramework(
  frameworks: Array<Framework>,
  defaultFrameworkId?: string,
): Promise<Framework> {
  const initialValue =
    (defaultFrameworkId &&
      frameworks.find(
        (f) => f.id.toLowerCase() === defaultFrameworkId.toLowerCase(),
      )?.id) ||
    frameworks[0].id

  const selected = await select({
    message: 'Select framework:',
    options: frameworks.map((f) => ({ value: f.id, label: f.name })),
    initialValue,
  })

  if (isCancel(selected)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  const framework = frameworks.find((f) => f.id === selected)
  if (!framework) {
    throw new Error(`Unknown framework: ${selected}`)
  }
  return framework
}

export async function selectInstall(): Promise<boolean> {
  const install = await confirm({
    message: 'Would you like to install dependencies now?',
    initialValue: true,
  })
  if (isCancel(install)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }
  return install
}

export async function getProjectName(): Promise<string> {
  const value = await text({
    message: 'Project name (leave empty to use current directory)',
    // Clack prints `undefined` on blank submit when placeholder is omitted.
    placeholder: '',
    validate(value) {
      const projectName = value ?? ''

      if (isCurrentDirectoryProjectNameInput(projectName)) {
        return
      }

      const { valid, error } = validateProjectName(projectName)
      if (!valid) {
        return error
      }
    },
  })

  if (isCancel(value)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  return (value ?? '').trim()
}

export async function selectPackageManager(): Promise<PackageManager> {
  const packageManager = await select({
    message: 'Select package manager:',
    options: SUPPORTED_PACKAGE_MANAGERS.map((pm) => ({
      value: pm,
      label: pm,
    })),
    initialValue: DEFAULT_PACKAGE_MANAGER,
  })
  if (isCancel(packageManager)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }
  return packageManager
}

export async function selectTemplate(
  templates: Array<{ id: string; name: string; description?: string }>,
): Promise<string | undefined> {
  if (templates.length === 0) {
    return undefined
  }

  const selected = await select({
    message: 'Would you like to start from a template?',
    options: [
      {
        value: undefined,
        label: 'None (base starter)',
        hint: 'Two-page baseline (Home + About)',
      },
      ...templates.map((template) => ({
        value: template.id,
        label: template.name,
        hint: template.description,
      })),
    ],
    initialValue: undefined,
  })

  if (isCancel(selected)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  return selected
}

export async function selectAddOns(
  framework: Framework,
  mode: string,
  type: string,
  message: string,
  forcedAddOns: Array<string> = [],
  allowMultiple: boolean = true,
): Promise<Array<string>> {
  const allAddOns = await getAllAddOns(framework, mode)
  const addOns = allAddOns.filter((addOn) => addOn.type === type)
  if (addOns.length === 0) {
    return []
  }

  if (allowMultiple) {
    const selectableAddOns = addOns.filter(
      (addOn) => !forcedAddOns.includes(addOn.id),
    )

    if (selectableAddOns.length === 0) {
      return []
    }

    note(
      'Use ↑/↓ to navigate • Space to select/deselect • Enter to confirm',
      'Keyboard Shortcuts',
    )

    const value = await multiselect({
      message: `${message} (Space to toggle, Enter to confirm)`,
      options: selectableAddOns.map((addOn) => ({
        value: addOn.id,
        label: addOn.name,
        hint: addOn.description,
      })),
      maxItems: selectableAddOns.length,
      required: false,
    })

    if (isCancel(value)) {
      cancel('Operation cancelled.')
      process.exit(0)
    }

    return value
  } else {
    const value = await select({
      message,
      options: [
        {
          value: 'none',
          label: 'None',
        },
        ...addOns
          .filter((addOn) => !forcedAddOns.includes(addOn.id))
          .map((addOn) => ({
            value: addOn.id,
            label: addOn.name,
            hint: addOn.description,
          })),
      ],
      initialValue: 'none',
    })

    if (isCancel(value)) {
      cancel('Operation cancelled.')
      process.exit(0)
    }

    return value === 'none' ? [] : [value]
  }
}

export async function selectGit(): Promise<boolean> {
  const git = await confirm({
    message: 'Would you like to initialize a new git repository?',
    initialValue: true,
  })
  if (isCancel(git)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }
  return git
}

export async function selectExamples(): Promise<boolean> {
  const includeExamples = await confirm({
    message: 'Would you like to include demo/example pages?',
    initialValue: true,
  })
  if (isCancel(includeExamples)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }
  return includeExamples
}

export async function selectToolchain(
  framework: Framework,
  toolchain?: string | false,
): Promise<string | undefined> {
  if (toolchain === false) {
    return undefined
  }

  const toolchains = new Set<AddOn>()
  for (const addOn of framework.getAddOns()) {
    if (addOn.type === 'toolchain') {
      toolchains.add(addOn)
      if (toolchain && addOn.id === toolchain) {
        return toolchain
      }
    }
  }

  const tc = await select({
    message: 'Select toolchain',
    options: [
      {
        value: undefined,
        label: 'None',
      },
      ...Array.from(toolchains).map((tc) => ({
        value: tc.id,
        label: tc.name,
      })),
    ],
    initialValue: undefined,
  })

  if (isCancel(tc)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  return tc
}

export async function promptForAddOnOptions(
  addOnIds: Array<string>,
  framework: Framework,
): Promise<Record<string, Record<string, any>>> {
  const addOnOptions: Record<string, Record<string, any>> = {}

  for (const addOnId of addOnIds) {
    const addOn = framework.getAddOns().find((a) => a.id === addOnId)
    if (!addOn || !addOn.options) continue

    addOnOptions[addOnId] = {}

    for (const [optionName, option] of Object.entries(addOn.options)) {
      const value = await select({
        message: `${addOn.name}: ${option.label}`,
        options: option.options.map((opt) => ({
          value: opt.value,
          label: opt.label,
        })),
        initialValue: option.default,
      })

      if (isCancel(value)) {
        cancel('Operation cancelled.')
        process.exit(0)
      }

      addOnOptions[addOnId][optionName] = value
    }
  }

  return addOnOptions
}

export async function promptForEnvVars(
  addOns: Array<AddOn>,
): Promise<Record<string, string>> {
  const envVars = new Map<
    string,
    {
      name: string
      description?: string
      required?: boolean
      default?: string
      secret?: boolean
    }
  >()

  for (const addOn of addOns as Array<any>) {
    for (const envVar of addOn.envVars || []) {
      if (!envVars.has(envVar.name)) {
        envVars.set(envVar.name, envVar)
      }
    }
  }

  const result: Record<string, string> = {}

  for (const envVar of envVars.values()) {
    const label = envVar.description
      ? `${envVar.name} (${envVar.description})`
      : envVar.name

    const value = envVar.secret
      ? await password({
          message: `Enter ${label}`,
          validate: envVar.required
            ? (v) =>
                v && v.trim().length > 0
                  ? undefined
                  : `${envVar.name} is required`
            : undefined,
        })
      : await text({
          message: `Enter ${label}`,
          defaultValue: envVar.default,
          validate: envVar.required
            ? (v) =>
                v && v.trim().length > 0
                  ? undefined
                  : `${envVar.name} is required`
            : undefined,
        })

    if (isCancel(value)) {
      cancel('Operation cancelled.')
      process.exit(0)
    }

    if (value && value.trim()) {
      result[envVar.name] = value.trim()
    }
  }

  return result
}

export async function selectDeployment(
  framework: Framework,
  deployment?: string,
  forcedDeployment?: string,
): Promise<string | undefined> {
  const deployments = new Set<AddOn>()
  let initialValue: string | undefined = undefined
  for (const addOn of framework
    .getAddOns()
    .sort((a, b) => a.name.localeCompare(b.name))) {
    if (addOn.type === 'deployment') {
      deployments.add(addOn)
      if (deployment && addOn.id === deployment) {
        return deployment
      }
      if (forcedDeployment && addOn.id === forcedDeployment) {
        initialValue = addOn.id
      } else if (!initialValue && addOn.default) {
        initialValue = addOn.id
      }
    }
  }

  if (deployments.size === 0) {
    return undefined
  }

  const dp = await select({
    message: 'Select deployment adapter:',
    options: [
      { value: undefined, label: 'None' },
      ...Array.from(deployments).map((d) => ({
        value: d.id,
        label: d.name,
      })),
    ],
    initialValue,
  })

  if (isCancel(dp)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  return dp
}
