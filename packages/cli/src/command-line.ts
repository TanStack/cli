import { resolve } from 'node:path'
import fs from 'node:fs'

import {
  DEFAULT_PACKAGE_MANAGER,
  finalizeAddOns,
  getFrameworkById,
  getPackageManager,
  getRawRegistry,
  loadStarter,
  populateAddOnOptionsDefaults,
} from '@tanstack/create'

import {
  resolveProjectLocation,
  validateProjectName,
} from './utils.js'
import type { Options } from '@tanstack/create'

import type { CliOptions } from './types.js'

const SUPPORTED_LEGACY_TEMPLATES = new Set([
  'file-router',
  'typescript',
  'tsx',
])

const LEGACY_TEMPLATE_ALIASES = new Set(['javascript', 'js', 'jsx'])

function getLegacyTemplateValue(templateValue?: string) {
  if (!templateValue) {
    return undefined
  }

  const normalized = templateValue.toLowerCase().trim()
  if (
    SUPPORTED_LEGACY_TEMPLATES.has(normalized) ||
    LEGACY_TEMPLATE_ALIASES.has(normalized)
  ) {
    return normalized
  }

  return undefined
}

function slugifyStarterName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function humanizeStarterId(value: string) {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

function isLikelyStarterUrlOrPath(value: string) {
  return (
    /^https?:\/\//i.test(value) ||
    /^file:\/\//i.test(value) ||
    value.startsWith('./') ||
    value.startsWith('../') ||
    value.startsWith('/') ||
    /^[a-zA-Z]:[\\/]/.test(value)
  )
}

function getStarterIdsFromUrl(starterUrl: string) {
  const ids = new Set<string>()

  try {
    const pathname = new URL(starterUrl).pathname
    const parts = pathname.split('/').filter(Boolean)
    const lastPart = parts.at(-1)?.toLowerCase()

    if (lastPart) {
      ids.add(lastPart.replace(/\.json$/i, ''))
    }

    if (
      (lastPart === 'starter.json' || lastPart === 'template.json') &&
      parts.length >= 2
    ) {
      ids.add(parts.at(-2)!.toLowerCase())
    }
  } catch {
    // Ignore URL parse errors and rely on other id heuristics.
  }

  return ids
}

function resolveMonorepoStarterById(
  starterId: string,
  preferredFramework?: string,
) {
  const normalized = starterId.toLowerCase().trim()
  const idVariants = Array.from(
    new Set([
      normalized,
      normalized.replace(/-template$/i, ''),
      normalized.replace(/-starter$/i, ''),
    ]),
  ).filter(Boolean)

  const cwd = process.cwd()
  const rootCandidates = [
    cwd,
    resolve(cwd, '..'),
    resolve(cwd, '../..'),
    resolve(cwd, '../../..'),
  ]

  const frameworkOrder = preferredFramework
    ? [preferredFramework, ...['react', 'solid'].filter((f) => f !== preferredFramework)]
    : ['react', 'solid']

  for (const root of rootCandidates) {
    for (const framework of frameworkOrder) {
      for (const id of idVariants) {
        const templatePath = resolve(root, 'examples', framework, id, 'template.json')
        if (fs.existsSync(templatePath)) {
          return templatePath
        }

        const starterPath = resolve(root, 'examples', framework, id, 'starter.json')
        if (fs.existsSync(starterPath)) {
          return starterPath
        }
      }
    }
  }

  return undefined
}

export async function resolveStarterSpecifier(
  starterSpecifier: string,
  preferredFramework?: string,
) {
  const normalized = starterSpecifier.trim()

  if (!normalized || isLikelyStarterUrlOrPath(normalized)) {
    return normalized
  }

  const registry = await getRawRegistry()
  if (registry && registry.starters?.length) {
    const lookup = normalized.toLowerCase()
    const matches = registry.starters.filter((starter) => {
      const candidateIds = new Set<string>()
      candidateIds.add(starter.name.toLowerCase())
      candidateIds.add(slugifyStarterName(starter.name))

      for (const id of getStarterIdsFromUrl(starter.url)) {
        candidateIds.add(id)
      }

      return candidateIds.has(lookup)
    })

    const frameworkMatch = preferredFramework
      ? matches.find(
          (starter) => starter.framework.toLowerCase() === preferredFramework,
        )
      : undefined

    if (frameworkMatch) {
      return frameworkMatch.url
    }

    if (matches.length > 0) {
      return matches[0].url
    }
  }

  const monorepoStarterPath = resolveMonorepoStarterById(
    normalized,
    preferredFramework,
  )
  if (monorepoStarterPath) {
    return monorepoStarterPath
  }

  if (!registry || !registry.starters?.length) {
    throw new Error(
      `Could not resolve template id "${normalized}" because no template registry is configured. Pass a template URL (or set CTA_REGISTRY).`,
    )
  }

  const availableIds = Array.from(
    new Set(
      registry.starters.flatMap((starter) => {
        const ids = [slugifyStarterName(starter.name)]
        ids.push(...Array.from(getStarterIdsFromUrl(starter.url)))
        return ids
      }),
    ),
  )
    .filter(Boolean)
    .sort()

  throw new Error(
    `Unknown template id "${normalized}". Available built-in templates: ${availableIds.join(', ')}`,
  )
}

export async function listTemplateChoices(preferredFramework?: string): Promise<
  Array<{
    id: string
    name: string
    description?: string
    framework: string
  }>
> {
  const frameworkFilter = preferredFramework?.toLowerCase()
  const deduped = new Map<
    string,
    { id: string; name: string; description?: string; framework: string }
  >()

  const registry = await getRawRegistry()
  for (const starter of registry?.starters || []) {
    const framework = starter.framework.toLowerCase()
    if (frameworkFilter && framework !== frameworkFilter) {
      continue
    }

    const ids = Array.from(getStarterIdsFromUrl(starter.url))
    const id = ids[0] || slugifyStarterName(starter.name)
    if (!id) {
      continue
    }

    const key = `${framework}:${id}`
    if (!deduped.has(key)) {
      deduped.set(key, {
        id,
        name: starter.name,
        description: starter.description,
        framework,
      })
    }
  }

  const cwd = process.cwd()
  const rootCandidates = [
    cwd,
    resolve(cwd, '..'),
    resolve(cwd, '../..'),
    resolve(cwd, '../../..'),
  ]

  const frameworks = frameworkFilter ? [frameworkFilter] : ['react', 'solid']

  for (const root of rootCandidates) {
    for (const framework of frameworks) {
      const frameworkDir = resolve(root, 'examples', framework)
      if (!fs.existsSync(frameworkDir) || !fs.statSync(frameworkDir).isDirectory()) {
        continue
      }

      for (const entry of fs.readdirSync(frameworkDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) {
          continue
        }

        const id = entry.name
        const key = `${framework}:${id}`
        if (deduped.has(key)) {
          continue
        }

        const templatePath = resolve(frameworkDir, id, 'template.json')
        const starterPath = resolve(frameworkDir, id, 'starter.json')
        if (!fs.existsSync(templatePath) && !fs.existsSync(starterPath)) {
          continue
        }

        let name = humanizeStarterId(id)
        let description: string | undefined

        const templateInfoPath = resolve(frameworkDir, id, 'template-info.json')
        if (fs.existsSync(templateInfoPath)) {
          try {
            const info = JSON.parse(fs.readFileSync(templateInfoPath, 'utf8')) as {
              name?: string
              description?: string
            }
            if (info.name) {
              name = info.name
            }
            description = info.description
          } catch {
            // Ignore malformed template-info files and use fallback values.
          }
        }

        deduped.set(key, {
          id,
          name,
          description,
          framework,
        })
      }
    }
  }

  return Array.from(deduped.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export function validateLegacyCreateFlags(cliOptions: CliOptions): {
  warnings: Array<string>
  error?: string
} {
  const warnings: Array<string> = []
  const legacyTemplate = getLegacyTemplateValue(cliOptions.template)

  if (cliOptions.starter) {
    warnings.push(
      'The --starter flag is deprecated; prefer --template instead. Backward compatibility remains for now.',
    )
  }

  if (cliOptions.starter && cliOptions.template && !legacyTemplate) {
    warnings.push(
      'Both --starter and --template were provided. --template takes precedence.',
    )
  }

  if (cliOptions.routerOnly) {
    warnings.push(
      'The --router-only flag enables router-only compatibility mode. Start-dependent add-ons, deployment adapters, and templates are disabled; only the base template and optional toolchain are supported.',
    )
  }

  if (cliOptions.routerOnly && cliOptions.addOns) {
    warnings.push(
      'Ignoring --add-ons in router-only compatibility mode.',
    )
  }

  if (cliOptions.routerOnly && cliOptions.deployment) {
    warnings.push(
      'Ignoring --deployment in router-only compatibility mode.',
    )
  }

  if (cliOptions.routerOnly && cliOptions.starter) {
    warnings.push('Ignoring --starter/--template in router-only compatibility mode.')
  }

  if (cliOptions.routerOnly && cliOptions.templateId) {
    warnings.push('Ignoring --template-id in router-only compatibility mode.')
  }

  if (cliOptions.tailwind === true) {
    warnings.push(
      'The --tailwind flag is deprecated and ignored. Tailwind is always enabled in TanStack Start scaffolds.',
    )
  }

  if (cliOptions.tailwind === false) {
    warnings.push(
      'The --no-tailwind flag is deprecated and ignored. Tailwind opt-out is intentionally unsupported to keep add-on permutations maintainable; remove Tailwind after scaffolding if needed.',
    )
  }

  if (!legacyTemplate) {
    return { warnings }
  }

  const template = legacyTemplate

  if (template === 'javascript' || template === 'js' || template === 'jsx') {
    return {
      warnings,
      error:
        'JavaScript/JSX templates are not supported. TanStack Start file-router templates are TypeScript-only.',
    }
  }

  if (!SUPPORTED_LEGACY_TEMPLATES.has(template)) {
    return {
      warnings,
      error: `Invalid --template value: ${cliOptions.template}. Supported values are: file-router, typescript, tsx.`,
    }
  }

  warnings.push('The --template flag is deprecated and mapped for compatibility.')

  return { warnings }
}

export async function normalizeOptions(
  cliOptions: CliOptions,
  forcedAddOns?: Array<string>,
  opts?: {
    disableNameCheck?: boolean
    forcedDeployment?: string
  },
): Promise<Options | undefined> {
  const projectLocation = resolveProjectLocation({
    projectName: cliOptions.projectName,
    targetDir: cliOptions.targetDir,
  })

  if (!projectLocation && !opts?.disableNameCheck) {
    return undefined
  }

  const projectName = projectLocation?.projectName ?? ''
  const targetDir = projectLocation?.targetDir ?? resolve(process.cwd())

  if (projectName) {
    const { valid, error } = validateProjectName(projectName)
    if (!valid) {
      console.error(error)
      process.exit(1)
    }
  }

  // Mode is always file-router (TanStack Start)
  let mode = 'file-router'
  let routerOnly = !!cliOptions.routerOnly

  const legacyTemplate = getLegacyTemplateValue(cliOptions.template)

  if (!cliOptions.starter) {
    if (cliOptions.template && !legacyTemplate) {
      cliOptions.starter = cliOptions.template
    } else if (cliOptions.templateId) {
      cliOptions.starter = cliOptions.templateId
    }
  }

  const template = legacyTemplate
  if (template && template !== 'file-router') {
    routerOnly = true
  }

  if (!cliOptions.starter && cliOptions.templateId) {
    cliOptions.starter = cliOptions.templateId
  }

  const preferredFramework = (cliOptions.framework || 'react').toLowerCase()

  const starter = !routerOnly && cliOptions.starter
    ? await loadStarter(
        await resolveStarterSpecifier(cliOptions.starter, preferredFramework),
      )
    : undefined

  // TypeScript and Tailwind are always enabled with TanStack Start
  const typescript = true
  const tailwind = true

  if (starter) {
    cliOptions.framework = starter.framework
    mode = starter.mode
  }

  const framework = getFrameworkById(cliOptions.framework || 'react')!

  async function selectAddOns() {
    // Edge case for Windows Powershell
    if (Array.isArray(cliOptions.addOns) && cliOptions.addOns.length === 1) {
      const parseSeparatedArgs = cliOptions.addOns[0].split(' ')
      if (parseSeparatedArgs.length > 1) {
        cliOptions.addOns = parseSeparatedArgs
      }
    }

    if (
      Array.isArray(cliOptions.addOns) ||
      starter?.dependsOn ||
      forcedAddOns ||
      cliOptions.toolchain ||
      cliOptions.deployment
    ) {
      const selectedAddOns = new Set<string>([
        ...(routerOnly ? [] : (starter?.dependsOn || [])),
        ...(routerOnly ? [] : (forcedAddOns || [])),
      ])
      if (!routerOnly && cliOptions.addOns && Array.isArray(cliOptions.addOns)) {
        for (const a of cliOptions.addOns) {
          if (a.toLowerCase() === 'start') {
            continue
          }
          selectedAddOns.add(a)
        }
      }
      if (cliOptions.toolchain) {
        selectedAddOns.add(cliOptions.toolchain)
      }
      if (!routerOnly && cliOptions.deployment) {
        selectedAddOns.add(cliOptions.deployment)
      }

      if (!routerOnly && !cliOptions.deployment && opts?.forcedDeployment) {
        selectedAddOns.add(opts.forcedDeployment)
      }

      return await finalizeAddOns(framework, mode, Array.from(selectedAddOns))
    }

    return []
  }

  const includeExamples = cliOptions.examples ?? !routerOnly
  const chosenAddOnsRaw = await selectAddOns()
  const chosenAddOns = includeExamples
    ? chosenAddOnsRaw
    : chosenAddOnsRaw.filter((addOn) => addOn.type !== 'example')

  // Handle add-on configuration option
  let addOnOptionsFromCLI = {}
  if (cliOptions.addOnConfig) {
    try {
      addOnOptionsFromCLI = JSON.parse(cliOptions.addOnConfig)
    } catch (error) {
      console.error('Error parsing add-on config:', error)
      process.exit(1)
    }
  }

  const normalized = {
    projectName: projectName,
    targetDir,
    framework,
    mode,
    typescript,
    tailwind,
    packageManager:
      cliOptions.packageManager ||
      getPackageManager() ||
      DEFAULT_PACKAGE_MANAGER,
    git: cliOptions.git ?? true,
    install: cliOptions.install,
    intent: cliOptions.intent ?? true,
    chosenAddOns,
    addOnOptions: {
      ...populateAddOnOptionsDefaults(chosenAddOns),
      ...addOnOptionsFromCLI,
    },
    starter: starter,
  }

  ;(normalized as Options & { includeExamples?: boolean }).includeExamples =
    includeExamples
  ;(normalized as Options & { envVarValues?: Record<string, string> }).envVarValues =
    {}

  return normalized
}

export function validateDevWatchOptions(cliOptions: CliOptions): {
  valid: boolean
  error?: string
} {
  if (!cliOptions.devWatch) {
    return { valid: true }
  }

  // Validate watch path exists
  const watchPath = resolve(process.cwd(), cliOptions.devWatch)
  if (!fs.existsSync(watchPath)) {
    return {
      valid: false,
      error: `Watch path does not exist: ${watchPath}`,
    }
  }

  // Validate it's a directory
  const stats = fs.statSync(watchPath)
  if (!stats.isDirectory()) {
    return {
      valid: false,
      error: `Watch path is not a directory: ${watchPath}`,
    }
  }

  // Ensure target directory is specified
  if (!cliOptions.projectName && !cliOptions.targetDir) {
    return {
      valid: false,
      error: 'Project name or target directory is required for dev watch mode',
    }
  }

  // Check for framework structure
  const hasAddOns = fs.existsSync(resolve(watchPath, 'add-ons'))
  const hasAssets = fs.existsSync(resolve(watchPath, 'assets'))
  const hasFrameworkJson = fs.existsSync(resolve(watchPath, 'framework.json'))

  if (!hasAddOns && !hasAssets && !hasFrameworkJson) {
    return {
      valid: false,
      error: `Watch path does not appear to be a valid framework directory: ${watchPath}`,
    }
  }

  return { valid: true }
}
