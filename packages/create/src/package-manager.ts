import type { Environment } from './types.js'

export const SUPPORTED_PACKAGE_MANAGERS = [
  'npm',
  'yarn',
  'pnpm',
  'bun',
  'deno',
] as const
export type PackageManager = (typeof SUPPORTED_PACKAGE_MANAGERS)[number]
export const DEFAULT_PACKAGE_MANAGER: PackageManager = 'npm'

export function validatePackageManagerSupport(
  packageManager: PackageManager,
  addOns: Array<{
    name: string
    supportedPackageManagers?: Array<PackageManager>
  }>,
) {
  const unsupported = addOns.find(
    (addOn) =>
      addOn.supportedPackageManagers &&
      !addOn.supportedPackageManagers.includes(packageManager),
  )

  const supportedPackageManagers = unsupported?.supportedPackageManagers
  if (!unsupported || !supportedPackageManagers) return

  throw new Error(
    `${unsupported.name} does not support the ${packageManager} package manager. Choose ${supportedPackageManagers.join(', ')}.`,
  )
}

export function getPackageManager(): PackageManager | undefined {
  const userAgent = process.env.npm_config_user_agent

  if (userAgent === undefined) {
    return DEFAULT_PACKAGE_MANAGER
  }

  const packageManager = SUPPORTED_PACKAGE_MANAGERS.find((manager) =>
    userAgent.startsWith(manager),
  )

  return packageManager
}

export function getPackageManagerScriptCommand(
  packagerManager: PackageManager,
  args: Array<string> = [],
) {
  switch (packagerManager) {
    case 'yarn':
      return { command: 'yarn', args: ['run', ...args] }
    case 'pnpm':
      return { command: 'pnpm', args: [...args] }
    case 'bun':
      return { command: 'bun', args: ['--bun', 'run', ...args] }
    case 'deno':
      return { command: 'deno', args: ['task', ...args] }
    default:
      return { command: 'npm', args: ['run', ...args] }
  }
}

// Full SemVer grammar requires non-empty suffixes and valid numeric identifiers.
const PNPM_VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/

export async function detectPnpmVersion(environment: Environment, cwd: string) {
  try {
    const detected = await environment.getPackageManagerVersion?.('pnpm', cwd)
    const version = typeof detected === 'string' ? detected.trim() : undefined
    return version && PNPM_VERSION_PATTERN.test(version) ? version : undefined
  } catch {
    return undefined
  }
}

export type ExecuteCommandOptions = {
  /**
   * Package names that are allowed to run postinstall/build scripts while the
   * executed package is being installed. Supported by pnpm 10.2 and newer.
   */
  allowBuilds?: Array<string>
  /** Unknown versions retain the compatible plain dlx command. */
  packageManagerVersion?: string
}

export function getPackageManagerExecuteCommand(
  packagerManager: PackageManager,
  pkg: string,
  args: Array<string> = [],
  options: ExecuteCommandOptions = {},
) {
  switch (packagerManager) {
    case 'yarn':
      return { command: 'yarn', args: ['dlx', pkg, ...args] }
    case 'pnpm': {
      const version = options.packageManagerVersion
      const parsedVersion = version?.match(PNPM_VERSION_PATTERN)
      if (version !== undefined && !parsedVersion && options.allowBuilds?.length)
        throw new Error(`Invalid pnpm version: ${version}`)
      const supportsAllowBuild = parsedVersion && (
        Number(parsedVersion[1]) > 10 ||
        (Number(parsedVersion[1]) === 10 && Number(parsedVersion[2]) >= 2))
      const allowBuildFlags = supportsAllowBuild
        ? (options.allowBuilds || []).map((name) => `--allow-build=${name}`)
        : []
      return {
        command: 'pnpm',
        args: [...allowBuildFlags, 'dlx', pkg, ...args],
      }
    }
    case 'bun':
      return { command: 'bunx', args: ['--bun', pkg, ...args] }
    case 'deno':
      return { command: 'deno', args: ['run', `npm:${pkg}`, ...args] }
    default:
      return { command: 'npx', args: ['-y', pkg, ...args] }
  }
}

export const INTENT_PACKAGE = '@tanstack/intent'

export function getIntentExecuteCommand(
  packageManager: PackageManager,
  args: Array<string>,
) {
  switch (packageManager) {
    case 'bun':
      return {
        command: 'bunx',
        args: ['--no-install', '--package', INTENT_PACKAGE, 'intent', ...args],
      }
    case 'pnpm':
    case 'yarn':
      return { command: packageManager, args: ['exec', 'intent', ...args] }
    // Intent's Deno fallback requires npm; it must not download a temporary CLI.
    case 'deno':
    default:
      return { command: 'npm', args: ['exec', '--no', '--', 'intent', ...args] }
  }
}

export function intentCommand(
  packageManager: PackageManager,
  args: Array<string>,
) {
  const { command, args: commandArgs } = getIntentExecuteCommand(
    packageManager,
    args,
  )
  return [command, ...commandArgs].join(' ')
}

export function getPackageManagerInstallCommand(
  packagerManager: PackageManager,
  pkg?: string,
  isDev: boolean = false,
) {
  if (pkg) {
    switch (packagerManager) {
      case 'yarn':
      case 'pnpm':
        return {
          command: packagerManager,
          args: ['add', pkg, isDev ? '--dev' : ''],
        }
      default:
        return {
          command: packagerManager,
          args: ['install', pkg, isDev ? '-D' : ''],
        }
    }
  } else {
    return {
      command: packagerManager,
      args: ['install'],
    }
  }
}

export function packageManagerInstall(
  environment: Environment,
  cwd: string,
  packagerManager: PackageManager,
  pkg?: string,
  options?: { updateLockfile?: boolean },
) {
  const { command, args: commandArgs } = getPackageManagerInstallCommand(
    packagerManager,
    pkg,
  )
  // Adding an add-on intentionally changes package.json, including in CI.
  if (packagerManager === 'pnpm' && options?.updateLockfile && !pkg) {
    commandArgs.push('--no-frozen-lockfile')
  }
  return environment.execute(command, commandArgs, cwd)
}

export function translateExecuteCommand(
  packageManager: PackageManager,
  command: {
    command: string
    args?: Array<string>
    allowBuilds?: Array<string>
  },
  packageManagerVersion?: string,
): { command: string; args: Array<string> } {
  const args = command.args || []
  const parsed = parseExecuteCommand(command.command, args)
  if (parsed) {
    return getPackageManagerExecuteCommand(
      packageManager,
      parsed.pkg,
      parsed.args,
      { allowBuilds: command.allowBuilds, packageManagerVersion },
    )
  }
  return { command: command.command, args }
}

function parseExecuteCommand(
  command: string,
  args: Array<string>,
): { pkg: string; args: Array<string> } | null {
  if (command === 'npx') {
    const filtered = args[0] === '-y' ? args.slice(1) : args
    const [pkg, ...rest] = filtered
    return pkg ? { pkg, args: rest } : null
  }
  if (command === 'pnpx' || command === 'bunx') {
    const filtered = command === 'bunx' && args[0] === '--bun' ? args.slice(1) : args
    const [pkg, ...rest] = filtered
    return pkg ? { pkg, args: rest } : null
  }
  if ((command === 'pnpm' || command === 'yarn') && args[0] === 'dlx') {
    const [, pkg, ...rest] = args
    return pkg ? { pkg, args: rest } : null
  }
  if (command === 'deno' && args[0] === 'run' && args[1]?.startsWith('npm:')) {
    const pkg = args[1].slice(4)
    return pkg ? { pkg, args: args.slice(2) } : null
  }
  return null
}

export function packageManagerExecute(
  environment: Environment,
  cwd: string,
  packagerManager: PackageManager,
  pkg: string,
  args: Array<string>,
) {
  const { command, args: commandArgs } = getPackageManagerExecuteCommand(
    packagerManager,
    pkg,
    args,
  )
  return environment.execute(command, commandArgs, cwd)
}
