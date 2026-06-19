import { renderManifestTemplate } from './generated/create-manifest.js'

export function render(template: string, data?: Record<string, any>) {
  return renderManifestTemplate(template, {
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
  })
}
