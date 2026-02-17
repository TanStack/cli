import type { PackageManager } from '@tanstack/create'

export interface CliOptions {
  framework?: string
  packageManager?: PackageManager
  toolchain?: string | false
  deployment?: string
  projectName?: string
  git?: boolean
  addOns?: Array<string> | boolean
  listAddOns?: boolean
  addonDetails?: string
  mcp?: boolean
  mcpSse?: boolean
  starter?: string
  targetDir?: string
  interactive?: boolean
  ui?: boolean
  devWatch?: string
  install?: boolean
  addOnConfig?: string
  force?: boolean
  routerOnly?: boolean
  template?: string
  tailwind?: boolean
}
