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
  json?: boolean
  starter?: string
  templateId?: string
  targetDir?: string
  interactive?: boolean
  nonInteractive?: boolean
  yes?: boolean
  devWatch?: string
  runDev?: boolean
  install?: boolean
  addOnConfig?: string
  force?: boolean
  routerOnly?: boolean
  template?: string
  tailwind?: boolean
  examples?: boolean
}
