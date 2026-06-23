import { describe, expect, it, vi } from 'vitest'

import {
  createApp,
  createMemoryEnvironment,
  finalizeAddOns,
  getAllAddOns,
  getFrameworkById,
  populateAddOnOptionsDefaults,
} from '../src/edge.js'
import { getAllAddOns as getAllNodeAddOns } from '../src/add-ons.js'
import { createFrameworkDefinition as createReactFrameworkDefinition } from '../src/frameworks/react/index.js'
import { createFrameworkDefinition as createSolidFrameworkDefinition } from '../src/frameworks/solid/index.js'

import type {
  AddOn,
  Framework,
  FrameworkDefinition,
  Options,
} from '../src/types.js'

function frameworkFromDefinition(definition: FrameworkDefinition): Framework {
  const { addOns, base, ...rest } = definition

  return {
    ...rest,
    getFiles: () => Promise.resolve(Object.keys(base)),
    getFileContents: (path: string) => Promise.resolve(base[path]),
    getDeletedFiles: () => Promise.resolve([]),
    getAddOns: () => addOns,
  }
}

async function materializeFiles(bundle: {
  getFiles: () => Promise<Array<string>>
  getFileContents: (path: string) => Promise<string>
}) {
  const files: Record<string, string> = {}
  for (const file of (await bundle.getFiles()).sort()) {
    files[file] = await bundle.getFileContents(file)
  }
  return files
}

async function materializeAddOn(addOn: AddOn) {
  const {
    getFiles: _getFiles,
    getFileContents: _getFileContents,
    getDeletedFiles: _getDeletedFiles,
    files: _files,
    deletedFiles: _deletedFiles,
    ...metadata
  } = addOn

  return JSON.parse(
    JSON.stringify({
      ...metadata,
      files: await materializeFiles(addOn),
      deletedFiles: (await addOn.getDeletedFiles()).sort(),
    }),
  )
}

async function materializeAddOns(addOns: Array<AddOn>) {
  const materialized = await Promise.all(addOns.map(materializeAddOn))
  return materialized.sort((a, b) => a.id.localeCompare(b.id))
}

describe('@tanstack/create/edge manifest', () => {
  it.each([
    ['react', createReactFrameworkDefinition],
    ['solid', createSolidFrameworkDefinition],
  ])('matches the Node-scanned %s framework catalog', async (frameworkId, scan) => {
    const nodeDefinition = scan()
    const nodeFramework = frameworkFromDefinition(nodeDefinition)
    const edgeFramework = getFrameworkById(frameworkId)

    expect(edgeFramework).toBeDefined()
    expect(edgeFramework?.id).toBe(nodeDefinition.id)
    expect(edgeFramework?.name).toBe(nodeDefinition.name)
    expect(edgeFramework?.description).toBe(nodeDefinition.description)
    expect(edgeFramework?.version).toBe(nodeDefinition.version)
    expect(edgeFramework?.supportedModes).toEqual(nodeDefinition.supportedModes)
    expect(edgeFramework?.basePackageJSON).toEqual(
      nodeDefinition.basePackageJSON,
    )
    expect(edgeFramework?.optionalPackages).toEqual(
      nodeDefinition.optionalPackages,
    )
    expect(await materializeFiles(edgeFramework!)).toEqual(nodeDefinition.base)
    expect(await materializeAddOns(edgeFramework!.getAddOns())).toEqual(
      await materializeAddOns(nodeFramework.getAddOns()),
    )
  })

  it('returns the same React add-ons as the Node filesystem-backed path', () => {
    const nodeFramework = frameworkFromDefinition(createReactFrameworkDefinition())
    const edgeFramework = getFrameworkById('react')

    expect(edgeFramework).toBeDefined()
    expect(getAllAddOns(edgeFramework!, 'file-router').map((addOn) => addOn.id))
      .toEqual(
        getAllNodeAddOns(nodeFramework, 'file-router').map((addOn) => addOn.id),
      )
  })

  it('generates a React app from the manifest-backed catalog', async () => {
    try {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => {
          return new Response(JSON.stringify({ version: '1.0.0' }), {
            status: 200,
          })
        }),
      )

      const framework = getFrameworkById('react')
      expect(framework).toBeDefined()

      const featureIds = getAllAddOns(framework!, 'file-router').map(
        (addOn) => addOn.id,
      )
      expect(featureIds).toContain('tanstack-query')
      expect(featureIds).toContain('clerk')
      expect(featureIds).toContain('cloudflare')

      const chosenAddOns = await finalizeAddOns(framework!, 'file-router', [
        'tanstack-query',
        'clerk',
        'cloudflare',
        'biome',
      ])
      const addOnOptions = populateAddOnOptionsDefaults(chosenAddOns)
      const { environment, output } = createMemoryEnvironment('/worker-app')

      await createApp(environment, {
        projectName: 'worker-app',
        targetDir: '/worker-app',
        framework: framework!,
        mode: 'file-router',
        typescript: true,
        tailwind: true,
        packageManager: 'pnpm',
        git: false,
        install: false,
        intent: false,
        chosenAddOns,
        addOnOptions,
        includeExamples: false,
      } satisfies Options)

      const packageJSON = JSON.parse(output.files['package.json'])

      expect(packageJSON.scripts.dev).toBe('vite dev --port 3000')
      expect(packageJSON.scripts.deploy).toBe(
        'pnpm run build && wrangler deploy',
      )
      expect(packageJSON.dependencies).toHaveProperty('@tanstack/react-start')
      expect(packageJSON.dependencies).toHaveProperty('@tanstack/react-query')
      expect(packageJSON.dependencies).toHaveProperty('@clerk/clerk-react')
      expect(packageJSON.devDependencies).toHaveProperty('wrangler')
      expect(output.files['wrangler.jsonc']).toContain('tanstack-start-app')
      expect(output.files['.env.example']).toContain(
        'VITE_CLERK_PUBLISHABLE_KEY=',
      )
      expect(output.files['src/routes/index.tsx']).toContain('createFileRoute')
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
