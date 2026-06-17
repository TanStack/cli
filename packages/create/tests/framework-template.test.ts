import { describe, expect, it } from 'vitest'

import { createFrameworkDefinition as createReactFrameworkDefinition } from '../src/frameworks/react/index.js'
import { createFrameworkDefinition as createSolidFrameworkDefinition } from '../src/frameworks/solid/index.js'

describe('framework templates', () => {
  it.each([
    ['React', createReactFrameworkDefinition],
    ['Solid', createSolidFrameworkDefinition],
  ])(
    '%s gitignore does not exclude the generated route tree',
    (_, createDefinition) => {
      const framework = createDefinition()

      expect(framework.base._dot_gitignore).not.toContain(
        'src/routeTree.gen.ts',
      )
    },
  )

  it.each([
    ['React', createReactFrameworkDefinition],
    ['Solid', createSolidFrameworkDefinition],
  ])('%s includes route generation tooling', (_, createDefinition) => {
    const framework = createDefinition()

    expect(framework.base['package.json']).toContain(
      '"generate-routes": "tsr generate"',
    )
    expect(
      framework.optionalPackages['file-router'].devDependencies,
    ).toHaveProperty('@tanstack/router-cli')
  })
})
