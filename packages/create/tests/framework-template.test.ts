import { describe, expect, it } from 'vitest'

import { createFrameworkDefinition as createReactFrameworkDefinition } from '../src/frameworks/react/index.js'
import { createFrameworkDefinition as createSolidFrameworkDefinition } from '../src/frameworks/solid/index.js'

describe('framework templates', () => {
  it.each([
    ['React', createReactFrameworkDefinition],
    ['Solid', createSolidFrameworkDefinition],
  ])('%s gitignore excludes the generated route tree', (_, createDefinition) => {
    const framework = createDefinition()

    expect(framework.base._dot_gitignore).toContain('src/routeTree.gen.ts')
  })
})
