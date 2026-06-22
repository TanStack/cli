import { createApp as createEdgeApp } from './edge-create-app.js'
import {
  finalizeAddOns as finalizeBaseAddOns,
  getAllAddOns,
  loadRemoteAddOn,
  populateAddOnOptionsDefaults,
} from './edge-add-ons.js'
import { registerTemplateRenderer } from './edge-render.js'
import { createMemoryEnvironment } from './edge-environment.js'
import { CONFIG_FILE } from './constants.js'
import {
  DEFAULT_PACKAGE_MANAGER,
  SUPPORTED_PACKAGE_MANAGERS,
  getPackageManagerExecuteCommand,
  getPackageManagerInstallCommand,
  getPackageManagerScriptCommand,
  translateExecuteCommand,
} from './package-manager.js'

import type {
  ManifestAddOnChunk,
  ManifestAddOnMetadata,
  ManifestFrameworkChunk,
  ManifestFrameworkMetadata,
  ManifestTemplateModule,
  WorkerManifestLoader,
  WorkerManifestModuleLoader,
} from './manifest-types.js'
import type { TemplateRenderContext } from './edge-render.js'
import type {
  AddOn,
  Environment,
  Framework,
  Options,
} from './types.js'
import type { MemoryEnvironmentOutput } from './edge-environment.js'

export function createWorkerManifestLoader(
  moduleLoader: WorkerManifestModuleLoader,
): WorkerManifestLoader {
  return {
    async loadCatalog() {
      return moduleLoader.loadCatalog()
    },
    async loadFramework(frameworkId: string) {
      const module = await moduleLoader.loadFramework(frameworkId)
      return {
        ...module.framework,
        renderManifestTemplate: module.renderManifestTemplate,
        hasManifestTemplate: module.hasManifestTemplate,
      }
    },
    async loadAddOn(frameworkId: string, addOnId: string) {
      const module = await moduleLoader.loadAddOn(frameworkId, addOnId)
      return {
        ...module.addOn,
        renderManifestTemplate: module.renderManifestTemplate,
        hasManifestTemplate: module.hasManifestTemplate,
      }
    },
  }
}

function createChunkRenderer(chunks: () => Array<ManifestTemplateModule>) {
  return (template: string, context: TemplateRenderContext) => {
    for (const chunk of chunks()) {
      if (chunk.hasManifestTemplate && !chunk.hasManifestTemplate(template)) {
        continue
      }

      try {
        return chunk.renderManifestTemplate(template, context)
      } catch (error) {
        if (chunk.hasManifestTemplate) {
          throw error
        }
      }
    }

    throw new Error('Template was not loaded by the worker manifest provider')
  }
}

export type WorkerCreateAPI = {
  getFrameworks: () => Promise<Array<Framework>>
  getFrameworkById: (id: string) => Promise<Framework | undefined>
  getFrameworkByName: (name: string) => Promise<Framework | undefined>
  getAllAddOns: typeof getAllAddOns
  finalizeAddOns: (
    framework: Framework,
    mode: string,
    chosenAddOnIDs: Array<string>,
  ) => Promise<Array<AddOn>>
  populateAddOnOptionsDefaults: typeof populateAddOnOptionsDefaults
  createApp: (environment: Environment, options: Options) => Promise<void>
}

export function createWorkerCreate(
  manifestLoader: WorkerManifestLoader,
): WorkerCreateAPI {
  let frameworksPromise: Promise<Array<Framework>> | undefined
  const frameworkChunks = new Map<string, Promise<ManifestFrameworkChunk>>()
  const addOnChunks = new Map<string, Promise<ManifestAddOnChunk>>()
  const loadedRendererChunks = new Map<string, Array<ManifestTemplateModule>>()
  const addOnFrameworkIds = new WeakMap<AddOn, string>()

  function getRendererChunks(frameworkId: string) {
    const chunks = loadedRendererChunks.get(frameworkId)
    if (chunks) {
      return chunks
    }

    const nextChunks: Array<ManifestTemplateModule> = []
    loadedRendererChunks.set(frameworkId, nextChunks)
    return nextChunks
  }

  function registerRendererChunk(
    frameworkId: string,
    chunk: ManifestTemplateModule,
  ) {
    const chunks = getRendererChunks(frameworkId)
    if (!chunks.includes(chunk)) {
      chunks.push(chunk)
    }
  }

  function getRenderer(frameworkId: string) {
    return createChunkRenderer(() => getRendererChunks(frameworkId))
  }

  async function loadFrameworkChunk(frameworkId: string) {
    let promise = frameworkChunks.get(frameworkId)
    if (!promise) {
      promise = manifestLoader
        .loadFramework(frameworkId)
        .then((chunk) => {
          registerRendererChunk(frameworkId, chunk)
          return chunk
        })
        .catch((error: unknown) => {
          frameworkChunks.delete(frameworkId)
          throw error
        })
      frameworkChunks.set(frameworkId, promise)
    }

    return promise
  }

  async function loadAddOnChunk(frameworkId: string, addOnId: string) {
    const key = `${frameworkId}:${addOnId}`
    let promise = addOnChunks.get(key)
    if (!promise) {
      promise = manifestLoader
        .loadAddOn(frameworkId, addOnId)
        .then((chunk) => {
          registerRendererChunk(frameworkId, chunk)
          return chunk
        })
        .catch((error: unknown) => {
          addOnChunks.delete(key)
          throw error
        })
      addOnChunks.set(key, promise)
    }

    return promise
  }

  function createAddOnFromChunk(
    frameworkId: string,
    chunk: ManifestAddOnChunk,
  ): AddOn {
    const {
      renderManifestTemplate: _renderManifestTemplate,
      hasManifestTemplate: _hasManifestTemplate,
      ...compiled
    } = chunk

    const addOn: AddOn = {
      ...compiled,
      getFiles: () => Promise.resolve(Object.keys(compiled.files)),
      getFileContents: (path: string) => Promise.resolve(compiled.files[path]),
      getDeletedFiles: () => Promise.resolve(compiled.deletedFiles),
    }
    addOnFrameworkIds.set(addOn, frameworkId)
    return addOn
  }

  async function materializeAddOn(addOn: AddOn): Promise<AddOn> {
    const frameworkId = addOnFrameworkIds.get(addOn)
    if (!frameworkId) {
      return addOn
    }

    const chunk = await loadAddOnChunk(frameworkId, addOn.id)
    return createAddOnFromChunk(frameworkId, chunk)
  }

  function createLazyAddOn(
    frameworkId: string,
    metadata: ManifestAddOnMetadata,
  ): AddOn {
    const addOn: AddOn = {
      ...metadata,
      files: {},
      deletedFiles: [],
      getFiles: async () => {
        const chunk = await loadAddOnChunk(frameworkId, metadata.id)
        return Object.keys(chunk.files)
      },
      getFileContents: async (path: string) => {
        const chunk = await loadAddOnChunk(frameworkId, metadata.id)
        return chunk.files[path]
      },
      getDeletedFiles: async () => {
        const chunk = await loadAddOnChunk(frameworkId, metadata.id)
        return chunk.deletedFiles
      },
    }

    addOnFrameworkIds.set(addOn, frameworkId)
    return addOn
  }

  function createFrameworkFromMetadata(
    metadata: ManifestFrameworkMetadata,
  ): Framework {
    const addOns = metadata.addOns.map((addOn) =>
      createLazyAddOn(metadata.id, addOn),
    )
    const { addOns: _addOns, ...frameworkMetadata } = metadata

    const framework: Framework = {
      ...frameworkMetadata,
      getFiles: async () => {
        const chunk = await loadFrameworkChunk(metadata.id)
        return Object.keys(chunk.base)
      },
      getFileContents: async (path: string) => {
        const chunk = await loadFrameworkChunk(metadata.id)
        return chunk.base[path]
      },
      getDeletedFiles: () => Promise.resolve([]),
      getAddOns: () => addOns,
    }

    registerTemplateRenderer(framework, getRenderer(metadata.id))
    return framework
  }

  async function getFrameworks() {
    frameworksPromise ??= manifestLoader
      .loadCatalog()
      .then((catalog) => catalog.frameworks.map(createFrameworkFromMetadata))

    return frameworksPromise
  }

  async function getFrameworkById(id: string) {
    const frameworks = await getFrameworks()
    const frameworkId = id === 'react-cra' ? 'react' : id
    return frameworks.find((framework) => framework.id === frameworkId)
  }

  async function getFrameworkByName(name: string) {
    const frameworks = await getFrameworks()
    return frameworks.find(
      (framework) => framework.name.toLowerCase() === name.toLowerCase(),
    )
  }

  async function finalizeAddOns(
    framework: Framework,
    mode: string,
    chosenAddOnIDs: Array<string>,
  ) {
    const finalized = await finalizeBaseAddOns(framework, mode, chosenAddOnIDs)
    return Promise.all(finalized.map(materializeAddOn))
  }

  async function createApp(environment: Environment, options: Options) {
    await loadFrameworkChunk(options.framework.id)
    registerTemplateRenderer(
      options.framework,
      getRenderer(options.framework.id),
    )

    const chosenAddOns = await Promise.all(
      options.chosenAddOns.map(materializeAddOn),
    )

    await createEdgeApp(environment, {
      ...options,
      chosenAddOns,
    })
  }

  return {
    getFrameworks,
    getFrameworkById,
    getFrameworkByName,
    getAllAddOns,
    finalizeAddOns,
    populateAddOnOptionsDefaults,
    createApp,
  }
}

export {
  CONFIG_FILE,
  DEFAULT_PACKAGE_MANAGER,
  SUPPORTED_PACKAGE_MANAGERS,
  createMemoryEnvironment,
  getPackageManagerExecuteCommand,
  getPackageManagerInstallCommand,
  getPackageManagerScriptCommand,
  loadRemoteAddOn,
  populateAddOnOptionsDefaults,
  translateExecuteCommand,
  type MemoryEnvironmentOutput,
}

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
export type {
  ManifestAddOnChunk,
  ManifestAddOnMetadata,
  ManifestCatalog,
  ManifestFrameworkChunk,
  ManifestFrameworkMetadata,
  ManifestTemplateModule,
  WorkerAddOnManifestModule,
  WorkerFrameworkManifestModule,
  WorkerManifestModuleLoader,
  WorkerManifestLoader,
} from './manifest-types.js'
