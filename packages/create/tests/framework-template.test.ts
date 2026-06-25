import { describe, expect, it } from 'vitest'

import { createMemoryEnvironment } from '../src/environment.js'
import { createFrameworkDefinition as createReactFrameworkDefinition } from '../src/frameworks/react/index.js'
import { createFrameworkDefinition as createSolidFrameworkDefinition } from '../src/frameworks/solid/index.js'
import { createTemplateFile } from '../src/template-file.js'

import type { FrameworkDefinition, Options } from '../src/types.js'

const routerOnlyTemplateOptions = {
  projectName: 'test',
  targetDir: '/test',
  framework: {
    id: 'test',
    name: 'Test',
  },
  chosenAddOns: [],
  addOnOptions: {},
  packageManager: 'pnpm',
  typescript: true,
  tailwind: true,
  mode: 'file-router',
  routerOnly: true,
} as unknown as Options

async function renderRouterOnlyEntries(framework: FrameworkDefinition) {
  const { environment, output } = createMemoryEnvironment()
  const templateFile = createTemplateFile(
    environment,
    routerOnlyTemplateOptions,
  )

  environment.startRun()
  await templateFile('src/main.tsx.ejs', framework.base['src/main.tsx.ejs'])
  await templateFile('src/router.tsx.ejs', framework.base['src/router.tsx.ejs'])
  environment.finishRun()

  return {
    main: output.files['/test/src/main.tsx'],
    router: output.files['/test/src/router.tsx'],
  }
}

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

  it.each([
    [
      'React',
      createReactFrameworkDefinition,
      '@tanstack/react-router',
      "import { getRouter } from './router'",
    ],
    [
      'Solid',
      createSolidFrameworkDefinition,
      '@tanstack/solid-router',
      "import { getRouter } from './router'",
    ],
  ])(
    '%s router-only main uses the shared router factory',
    async (_, createDefinition, routerPackage, getRouterImport) => {
      const { main, router } = await renderRouterOnlyEntries(createDefinition())

      expect(main).toContain(getRouterImport)
      expect(main).toContain('const router = getRouter()')
      expect(main).toContain(`<RouterProvider router={router} />`)
      expect(main).not.toContain('createRouter')
      expect(main).not.toContain(`declare module '${routerPackage}'`)
      expect(router).toContain('export function getRouter()')
      expect(router).toContain(`declare module '${routerPackage}'`)
      expect(router).toContain('router: ReturnType<typeof getRouter>')
    },
  )
})
