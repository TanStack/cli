import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  finalizeAddOns,
  populateAddOnOptionsDefaults,
} from '../src/add-ons.js'
import { createApp } from '../src/create-app.js'
import { createMemoryEnvironment } from '../src/environment.js'
import { createFrameworkDefinition } from '../src/frameworks/react/index.js'

import type { Framework, FrameworkDefinition, Options } from '../src/types.js'

function frameworkFromDefinition(definition: FrameworkDefinition): Framework {
  const { addOns, base, ...framework } = definition

  return {
    ...framework,
    getFiles: () => Promise.resolve(Object.keys(base)),
    getFileContents: (path: string) => Promise.resolve(base[path]),
    getDeletedFiles: () => Promise.resolve([]),
    getAddOns: () => addOns,
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Paraglide add-on', () => {
  it('configures localized routing and request-scoped SSR', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ version: '1.0.0' }), { status: 200 }),
      ),
    )

    const framework = frameworkFromDefinition(createFrameworkDefinition())
    const chosenAddOns = await finalizeAddOns(framework, 'file-router', [
      'paraglide',
    ])
    const options = {
      projectName: 'paraglide-app',
      targetDir: '/paraglide-app',
      framework,
      mode: 'file-router',
      typescript: true,
      tailwind: true,
      packageManager: 'pnpm',
      git: false,
      install: false,
      intent: false,
      includeExamples: true,
      chosenAddOns,
      addOnOptions: populateAddOnOptionsDefaults(chosenAddOns),
    } as Options
    const { environment, output } = createMemoryEnvironment()

    await createApp(environment, options)

    const router = output.files['/paraglide-app/src/router.tsx']
    expect(router).toContain(
      "import { deLocalizeUrl, localizeUrl } from './paraglide/runtime'",
    )
    expect(router).toContain('input: ({ url }) => deLocalizeUrl(url)')
    expect(router).toContain('output: ({ url }) => localizeUrl(url)')

    const server = output.files['/paraglide-app/src/server.ts']
    expect(server).toContain(
      "import { paraglideMiddleware } from './paraglide/server.js'",
    )
    expect(server).toContain(
      "import handler from '@tanstack/react-start/server-entry'",
    )
    expect(server).toContain(
      'return paraglideMiddleware(req, () => handler.fetch(req))',
    )
  })
})
