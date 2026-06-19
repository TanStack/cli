import { createManifestFrameworks } from './generated/create-manifest.js'

import type {
  AddOn,
  AddOnCompiled,
  Framework,
  FrameworkDefinition,
} from './types.js'

function createAddOn(addOn: AddOnCompiled): AddOn {
  return {
    ...addOn,
    getFiles: () => Promise.resolve(Object.keys(addOn.files)),
    getFileContents: (path: string) => Promise.resolve(addOn.files[path]),
    getDeletedFiles: () => Promise.resolve(addOn.deletedFiles),
  }
}

export function createFrameworkFromManifest(
  framework: Omit<FrameworkDefinition, 'addOns'> & {
    addOns: Array<AddOnCompiled>
  },
): Framework {
  const addOns = framework.addOns.map(createAddOn)
  const { addOns: _addOns, base, ...rest } = framework

  return {
    ...rest,
    getFiles: () => Promise.resolve(Object.keys(base)),
    getFileContents: (path: string) => Promise.resolve(base[path]),
    getDeletedFiles: () => Promise.resolve([]),
    getAddOns: () => addOns,
  }
}

const frameworks = createManifestFrameworks().map(createFrameworkFromManifest)

export function getFrameworkById(id: string) {
  if (id === 'react-cra') {
    return frameworks.find((framework) => framework.id === 'react')
  }

  return frameworks.find((framework) => framework.id === id)
}

export function getFrameworkByName(name: string) {
  return frameworks.find(
    (framework) => framework.name.toLowerCase() === name.toLowerCase(),
  )
}

export function getFrameworks() {
  return frameworks
}
