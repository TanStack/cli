export { createApp } from './edge-create-app.js'
export {
  createMemoryEnvironment,
  type MemoryEnvironmentOutput,
} from './edge-environment.js'
export {
  getFrameworkById,
  getFrameworkByName,
  getFrameworks,
} from './edge-frameworks.js'
export {
  finalizeAddOns,
  getAllAddOns,
  loadRemoteAddOn,
  populateAddOnOptionsDefaults,
} from './edge-add-ons.js'
export { createSerializedOptions } from './options.js'
export { CONFIG_FILE } from './constants.js'
export {
  DEFAULT_PACKAGE_MANAGER,
  SUPPORTED_PACKAGE_MANAGERS,
  getPackageManagerExecuteCommand,
  getPackageManagerInstallCommand,
  getPackageManagerScriptCommand,
  translateExecuteCommand,
} from './package-manager.js'

export type {
  AddOn,
  AddOnOption,
  AddOnOptions,
  AddOnSelectOption,
  AddOnSelection,
  Environment,
  FileBundleHandler,
  Framework,
  FrameworkDefinition,
  Options,
  SerializedOptions,
  Starter,
  StarterCompiled,
} from './types.js'
export type { PackageManager } from './package-manager.js'
