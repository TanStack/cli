import { describe, expect, it } from 'vitest'

import { finalizeAddOns } from '../src/add-ons.js'
import { createApp } from '../src/create-app.js'
import { createMemoryEnvironment } from '../src/environment.js'
import { createFrameworkDefinition } from '../src/frameworks/react/index.js'
import type { Framework } from '../src/types.js'

describe('Neon scaffold', () => {
  it('requires explicit database setup instead of provisioning through Vite', async () => {
    const { base, addOns, ...definition } = createFrameworkDefinition()
    const framework: Framework = {
      ...definition,
      getFiles: () => Promise.resolve(Object.keys(base)),
      getFileContents: (path) => Promise.resolve(base[path]),
      getDeletedFiles: () => Promise.resolve([]),
      getAddOns: () => addOns,
    }
    const { environment, output } = createMemoryEnvironment()
    await createApp(environment, {
      projectName: 'neon-app',
      targetDir: '/neon-app',
      framework,
      mode: 'file-router',
      typescript: true,
      tailwind: true,
      packageManager: 'npm',
      git: false,
      install: false,
      intent: false,
      chosenAddOns: await finalizeAddOns(framework, 'file-router', ['neon']),
      addOnOptions: {},
    })

    const manifest = JSON.parse(output.files['/neon-app/package.json'])
    expect(manifest.dependencies['@neondatabase/serverless']).toBeDefined()
    expect(manifest.dependencies['vite-plugin-neon-new']).toBeUndefined()
    expect(output.files['/neon-app/neon-vite-plugin.ts']).toBeUndefined()
    expect(output.files['/neon-app/vite.config.ts']).not.toContain('neon')
    expect(output.files['/neon-app/db/init.sql']).toContain('CREATE TABLE')
    expect(output.files['/neon-app/README.md']).toContain(
      'claim create --env-pull --file .env',
    )
    expect(output.files['/neon-app/README.md']).toContain(
      'psql --role-name neondb_owner -- -f db/init.sql',
    )
    expect(output.files['/neon-app/README.md']).toContain(
      'replace `DATABASE_URL` in `.env`, and restart the dev server',
    )
    expect(output.commands).toEqual([])
  })
})
