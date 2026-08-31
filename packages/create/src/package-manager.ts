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

export function getPackageManagerExecuteCommand(
  packagerManager: PackageManager,
  pkg: string,
  args: Array<string> = [],
) {
  switch (packagerManager) {
    case 'yarn':
      return { command: 'yarn', args: ['dlx', pkg, ...args] }
    case 'pnpm':
      return { command: 'pnpm', args: ['dlx', pkg, ...args] }
    case 'bun':
      return { command: 'bunx', args: ['--bun', pkg, ...args] }
    case 'deno':
      return { command: 'deno', args: ['run', `npm:${pkg}`, ...args] }
    default:
      return { command: 'npx', args: ['-y', pkg, ...args] }
  }
}

export const INTENT_PACKAGE = '@tanstack/intent'

export function intentCommand(
  packageManager: PackageManager,
  args: Array<string>,
) {
  const { command, args: commandArgs } = getPackageManagerExecuteCommand(
    packageManager,
    INTENT_PACKAGE,
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
) {
  const { command, args: commandArgs } = getPackageManagerInstallCommand(
    packagerManager,
    pkg,
  )
  return environment.execute(command, commandArgs, cwd)
}

export function translateExecuteCommand(
  packageManager: PackageManager,
  command: { command: string; args?: Array<string> },
): { command: string; args: Array<string> } {
  const args = command.args || []
  const parsed = parseExecuteCommand(command.command, args)
  if (parsed) {
    return getPackageManagerExecuteCommand(packageManager, parsed.pkg, parsed.args)
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
