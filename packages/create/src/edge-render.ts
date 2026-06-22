import type { PackageManager } from './package-manager.js'
import type { AddOn, Integration, Options } from './types.js'

type TemplateRoute = NonNullable<AddOn['routes']>[number]

export type TemplateRenderContext = {
  [key: string]: unknown
  packageManager: PackageManager | undefined
  projectName: string | undefined
  typescript: boolean | undefined
  tailwind: boolean | undefined
  js: string | undefined
  jsx: string | undefined
  fileRouter: boolean | undefined
  codeRouter: boolean | undefined
  routerOnly: boolean | undefined
  includeExamples: boolean | undefined
  addOnEnabled: Record<string, boolean>
  addOnOption: Record<string, Record<string, unknown>>
  addOns: Array<AddOn>
  integrations: Array<Integration>
  routes: Array<TemplateRoute>
  getPackageManagerAddScript: (packageName: string, isDev?: boolean) => string
  getPackageManagerRunScript: (script: string) => string
  getPackageManagerExecuteScript: (pkg: string, args?: Array<string>) => string
  relativePath: (path: string, stripExtension?: boolean) => string
  integrationImportContent: (integration: Integration) => string
  integrationImportCode: (integration: Integration) => string | undefined
  renderTemplate: (content: string) => string
  ignoreFile: () => never
}

export type TemplateRenderer = (
  template: string,
  context: TemplateRenderContext,
) => string | undefined

const templateRenderers = new WeakMap<object, TemplateRenderer>()
let defaultTemplateRenderer: TemplateRenderer | undefined

export function setDefaultTemplateRenderer(renderer: TemplateRenderer) {
  defaultTemplateRenderer = renderer
}

export function registerTemplateRenderer(
  owner: object,
  renderer: TemplateRenderer,
) {
  templateRenderers.set(owner, renderer)
}

function getTemplateRenderer(owner?: object): TemplateRenderer {
  const renderer =
    (owner ? templateRenderers.get(owner) : undefined) ??
    defaultTemplateRenderer

  if (!renderer) {
    throw new Error(
      'No template renderer has been registered for this manifest. Use @tanstack/create/worker with a manifest loader, or @tanstack/create/edge for the bundled manifest.',
    )
  }

  return renderer
}

export function render(
  template: string,
  data?: Partial<TemplateRenderContext>,
) {
  return renderWithRenderer(getTemplateRenderer(), template, data)
}

export function renderForOptions(
  options: Options,
  template: string,
  data?: Partial<TemplateRenderContext>,
) {
  return renderWithRenderer(
    getTemplateRenderer(options.framework),
    template,
    data,
  )
}

function renderWithRenderer(
  renderer: TemplateRenderer,
  template: string,
  data?: Partial<TemplateRenderContext>,
) {
  return renderer(template, {
    packageManager: undefined,
    projectName: undefined,
    typescript: undefined,
    tailwind: undefined,
    js: undefined,
    jsx: undefined,
    fileRouter: undefined,
    codeRouter: undefined,
    routerOnly: undefined,
    includeExamples: undefined,
    addOnEnabled: {},
    addOnOption: {},
    addOns: [],
    integrations: [],
    routes: [],
    getPackageManagerAddScript: () => '',
    getPackageManagerRunScript: () => '',
    getPackageManagerExecuteScript: () => '',
    relativePath: () => '',
    integrationImportContent: () => '',
    integrationImportCode: () => '',
    renderTemplate: () => '',
    ignoreFile: () => {
      throw new Error('ignoreFile')
    },
    ...(data ?? {}),
  }) ?? ''
}
