#!/usr/bin/env node
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  registerFramework,
  scanAddOnDirectories,
  scanProjectDirectory,
} from '@tanstack/create'
import { cli } from '@tanstack/cli'

const projectDirectory = join(
  dirname(dirname(fileURLToPath(import.meta.url))),
  'project',
)

const addOns = scanAddOnDirectories([
  join(dirname(dirname(fileURLToPath(import.meta.url))), 'add-ons'),
])

const { files, basePackageJSON, optionalPackages } = scanProjectDirectory(
  projectDirectory,
  join(dirname(dirname(fileURLToPath(import.meta.url))), 'project', 'base'),
)

registerFramework({
  id: 'rwsdk',
  name: 'Redwood SDK',
  description: 'Templates for Redwood SDK',
  version: '0.1.0',
  base: files,
  addOns,
  basePackageJSON,
  optionalPackages,
  supportedModes: {
    default: {
      displayName: 'Default',
      description: 'Default Redwood SDK template',
      forceTypescript: true,
    },
  },
})

cli({
  name: 'create-rwsdk-app',
  appName: 'Redwood SDK',
  defaultFramework: 'Redwood SDK',
})
