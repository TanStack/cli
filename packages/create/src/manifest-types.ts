import type { AddOnCompiled, FrameworkDefinition } from './types.js'

export type ManifestFrameworkDefinition = Omit<
  FrameworkDefinition,
  'addOns'
> & {
  addOns: Array<AddOnCompiled>
}

export type ManifestAddOnMetadata = Omit<
  AddOnCompiled,
  'files' | 'deletedFiles' | 'packageTemplate' | 'readme' | 'readmeIsEjs'
>

export type ManifestFrameworkMetadata = Omit<
  ManifestFrameworkDefinition,
  'base' | 'addOns'
> & {
  addOns: Array<ManifestAddOnMetadata>
}

export type ManifestCatalog = {
  frameworks: Array<ManifestFrameworkMetadata>
}

export type ManifestTemplateContext = Record<string, any>

export type ManifestTemplateRenderer = (
  template: string,
  context: ManifestTemplateContext,
) => string | undefined

export type ManifestTemplateModule = {
  renderManifestTemplate: ManifestTemplateRenderer
  hasManifestTemplate?: (template: string) => boolean
}

export type ManifestFrameworkChunk = ManifestTemplateModule & {
  id: string
  base: Record<string, string>
}

export type ManifestAddOnChunk = ManifestTemplateModule & AddOnCompiled

export type WorkerManifestLoader = {
  loadCatalog: () => Promise<ManifestCatalog>
  loadFramework: (frameworkId: string) => Promise<ManifestFrameworkChunk>
  loadAddOn: (
    frameworkId: string,
    addOnId: string,
  ) => Promise<ManifestAddOnChunk>
}

export type WorkerFrameworkManifestModule = ManifestTemplateModule & {
  framework: {
    id: string
    base: Record<string, string>
  }
}

export type WorkerAddOnManifestModule = ManifestTemplateModule & {
  addOn: AddOnCompiled
}

export type WorkerManifestModuleLoader = {
  loadCatalog: () => Promise<ManifestCatalog>
  loadFramework: (
    frameworkId: string,
  ) => Promise<WorkerFrameworkManifestModule>
  loadAddOn: (
    frameworkId: string,
    addOnId: string,
  ) => Promise<WorkerAddOnManifestModule>
}
