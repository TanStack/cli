import z from 'zod'

import type { PackageManager } from './package-manager.js'

export type StatusStepType =
  | 'file'
  | 'command'
  | 'info'
  | 'package-manager'
  | 'other'

export const AddOnSelectOptionSchema = z.object({
  type: z.literal('select'),
  label: z.string(),
  description: z.string().optional(),
  default: z.string(),
  options: z.array(
    z.object({
      value: z.string(),
      label: z.string(),
    }),
  ),
})

export const AddOnOptionSchema = z.discriminatedUnion('type', [
  AddOnSelectOptionSchema,
])

export const AddOnOptionsSchema = z.record(z.string(), AddOnOptionSchema)

export const AddOnBaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  author: z.string().optional(),
  version: z.string().optional(),
  link: z.string().optional(),
  license: z.string().optional(),
  warning: z.string().optional(),
  tailwind: z.boolean().optional().default(true),
  type: z.enum(['add-on', 'example', 'starter', 'toolchain', 'deployment']),
  category: z
    .enum([
      'tanstack',
      'database',
      'orm',
      'auth',
      'deploy',
      'styling',
      'monitoring',
      'cms',
      'api',
      'analytics',
      'i18n',
      'tooling',
      'other',
    ])
    .optional(),
  exclusive: z
    .array(z.enum(['orm', 'auth', 'deploy', 'database', 'linter']))
    .optional(),
  color: z.string().optional(),
  priority: z.number().optional(),
  command: z
    .object({
      command: z.string(),
      args: z.array(z.string()).optional(),
    })
    .optional(),
  routes: z
    .array(
      z.object({
        url: z.string().optional(),
        name: z.string().optional(),
        path: z.string(),
        jsName: z.string(),
      }),
    )
    .optional(),
  packageAdditions: z
    .object({
      dependencies: z.record(z.string(), z.string()).optional(),
      devDependencies: z.record(z.string(), z.string()).optional(),
      scripts: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
  shadcnComponents: z.array(z.string()).optional(),
  dependsOn: z.array(z.string()).optional(),
  smallLogo: z.string().optional(),
  logo: z.string().optional(),
  addOnSpecialSteps: z.array(z.string()).optional(),
  createSpecialSteps: z.array(z.string()).optional(),
  postInitSpecialSteps: z.array(z.string()).optional(),
  options: AddOnOptionsSchema.optional(),
  default: z.boolean().optional(),
})

export const StarterSchema = AddOnBaseSchema.extend({
  framework: z.string(),
  mode: z.string(),
  typescript: z.boolean(),
  tailwind: z.boolean(),
  banner: z.string().optional(),
})

export const StarterCompiledSchema = StarterSchema.extend({
  files: z.record(z.string(), z.string()),
  deletedFiles: z.array(z.string()),
})

export const IntegrationSchema = z.object({
  type: z.string().optional(),
  path: z.string().optional(),
  jsName: z.string().optional(),
  import: z.string().optional(),
  code: z.string().optional(),
})

export const AddOnInfoSchema = AddOnBaseSchema.extend({
  modes: z.array(z.string()),
  integrations: z.array(IntegrationSchema).optional(),
  phase: z.enum(['setup', 'add-on']),
  readme: z.string().optional(),
})

export const AddOnCompiledSchema = AddOnInfoSchema.extend({
  files: z.record(z.string(), z.string()),
  deletedFiles: z.array(z.string()),
  packageTemplate: z.string().optional(),
})

export type AddOnSelectOption = z.infer<typeof AddOnSelectOptionSchema>

export type AddOnOption = z.infer<typeof AddOnOptionSchema>

export type AddOnOptions = z.infer<typeof AddOnOptionsSchema>

export type Integration = z.infer<typeof IntegrationSchema>

export type AddOnBase = z.infer<typeof AddOnBaseSchema>

export type StarterInfo = z.infer<typeof StarterSchema>

export type StarterCompiled = z.infer<typeof StarterCompiledSchema>

export type AddOnInfo = z.infer<typeof AddOnInfoSchema>

export type AddOnCompiled = z.infer<typeof AddOnCompiledSchema>

export interface AddOnSelection {
  id: string
  enabled: boolean
  options: Record<string, any>
}

export type FileBundleHandler = {
  getFiles: () => Promise<Array<string>>
  getFileContents: (path: string) => Promise<string>
  getDeletedFiles: () => Promise<Array<string>>
}

export type AddOn = AddOnCompiled & FileBundleHandler

export type Starter = StarterCompiled & FileBundleHandler

export type FrameworkDefinition = {
  id: string
  name: string
  description: string
  version: string

  base: Record<string, string>
  addOns: Array<AddOn>
  basePackageJSON: Record<string, any>
  optionalPackages: Record<string, any>

  supportedModes: Record<
    string,
    {
      displayName: string
      description: string
      forceTypescript: boolean
    }
  >
}

export type Framework = Omit<FrameworkDefinition, 'base' | 'addOns'> &
  FileBundleHandler & {
    getAddOns: () => Array<AddOn>
  }

export interface Options {
  projectName: string
  targetDir: string

  framework: Framework
  mode: string

  typescript: boolean
  tailwind: boolean

  packageManager: PackageManager
  git: boolean
  install?: boolean

  chosenAddOns: Array<AddOn>
  addOnOptions: Record<string, Record<string, any>>
  starter?: Starter | undefined
}

export type SerializedOptions = Omit<
  Options,
  'chosenAddOns' | 'starter' | 'framework'
> & {
  chosenAddOns: Array<string>
  starter?: string | undefined
  framework: string
}

type ProjectEnvironment = {
  startRun: () => void
  finishRun: () => void
  getErrors: () => Array<string>
}

type FileEnvironment = {
  appendFile: (path: string, contents: string) => Promise<void>
  copyFile: (from: string, to: string) => Promise<void>
  writeFile: (path: string, contents: string) => Promise<void>
  writeFileBase64: (path: string, base64Contents: string) => Promise<void>
  execute: (
    command: string,
    args: Array<string>,
    cwd: string,
    options?: { inherit?: boolean },
  ) => Promise<{ stdout: string }>
  deleteFile: (path: string) => Promise<void>

  exists: (path: string) => boolean
  isDirectory: (path: string) => boolean
  readFile: (path: string) => Promise<string>
  readdir: (path: string) => Promise<Array<string>>
  rimraf: (path: string) => Promise<void>
}

export type StatusEvent = {
  id: string
  type: StatusStepType
  message: string
}
export type StopEvent = {
  id: string
}

type UIEnvironment = {
  appName: string

  startStep: (info: {
    id: string
    type: StatusStepType
    message: string
  }) => void
  finishStep: (id: string, finalMessage: string) => void

  intro: (message: string) => void
  outro: (message: string) => void

  info: (title?: string, message?: string) => void
  error: (title?: string, message?: string) => void
  warn: (title?: string, message?: string) => void

  spinner: () => {
    start: (message: string) => void
    stop: (message: string) => void
  }
  confirm: (message: string) => Promise<boolean>
}

export type Environment = ProjectEnvironment & FileEnvironment & UIEnvironment

// Attribution tracking types for file provenance
export interface LineAttribution {
  line: number
  sourceId: string
  sourceName: string
  type: 'original' | 'injected'
}

export interface FileProvenance {
  source: 'framework' | 'add-on' | 'starter'
  sourceId: string
  sourceName: string
}

export interface AttributedFile {
  content: string
  provenance: FileProvenance
  lineAttributions: Array<LineAttribution>
}

export interface DependencyAttribution {
  name: string
  version: string
  type: 'dependency' | 'devDependency'
  sourceId: string
  sourceName: string
}

// Integration with source add-on tracking (used in templates and attribution)
export type IntegrationWithSource = Integration & {
  _sourceId: string
  _sourceName: string
}
