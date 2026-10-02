import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  registerFramework,
  scanAddOnDirectories,
  scanProjectDirectory,
} from '../../frameworks.js'

import type { FrameworkDefinition } from '../../types.js'

export function createFrameworkDefinition(): FrameworkDefinition {
  const baseDirectory = dirname(fileURLToPath(import.meta.url))

  const addOns = scanAddOnDirectories([
    join(baseDirectory, 'add-ons'),
    join(baseDirectory, 'toolchains'),
    join(baseDirectory, 'examples'),
    join(baseDirectory, 'hosts'),
  ])

  const { files, basePackageJSON, optionalPackages } = scanProjectDirectory(
    join(baseDirectory, 'project'),
    join(baseDirectory, 'project/base'),
  )

  return {
    id: 'solid',
    name: 'Solid',
    description: 'Solid templates for Tanstack Router Applications',
    version: '0.1.0',
    base: files,
    addOns,
    basePackageJSON,
    optionalPackages,
    bundlers: [
      {
        id: 'vite',
        name: 'Vite',
        description: 'Build with Vite',
      },
      {
        id: 'rsbuild',
        name: 'Rsbuild',
        description: 'Build with Rsbuild',
      },
    ],
    defaultBundler: 'vite',
    supportedModes: {
      'file-router': {
        displayName: 'File Router',
        description: 'TanStack Start with file-based routing',
        forceTypescript: true,
      },
    },
  }
}

export function register() {
  registerFramework(createFrameworkDefinition())
}
