import { pathToFileURL } from 'node:url'
import {
  createReactFrameworkDefinition,
  createSolidFrameworkDefinition,
} from '@tanstack/create'

import { cli } from './cli.js'

export { cli }

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  cli({
    name: 'tanstack',
    appName: 'TanStack',
    frameworkDefinitionInitializers: [
      createReactFrameworkDefinition,
      createSolidFrameworkDefinition,
    ],
  })
}
