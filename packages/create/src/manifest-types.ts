import type { AddOnCompiled, FrameworkDefinition } from './types.js'

export type ManifestFrameworkDefinition = Omit<
  FrameworkDefinition,
  'addOns'
> & {
  addOns: Array<AddOnCompiled>
}
