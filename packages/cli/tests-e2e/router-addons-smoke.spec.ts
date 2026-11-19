import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { attachRuntimeGuards, createAppFixture, optimizePageForFastE2E } from './helpers'

const scenarios = [
  { framework: 'react', addOns: ['tanstack-query'], tag: '@blocking' },
  { framework: 'solid', addOns: ['tanstack-query'], tag: '@blocking' },
  { framework: 'react', addOns: ['shadcn', 't3env', 'tanstack-query', 'paraglide', 'compiler'], tag: '@matrix' },
] as const

for (const { framework, addOns, tag } of scenarios) {
  test(`${tag} creates a ${framework} Router-only app with ${addOns.length} add-ons and a working Query provider`, async ({ page }) => {
    const fixture = await createAppFixture({
      appName: `${framework}-router-query-${addOns.length}`,
      framework,
      routerOnly: true,
      addOns: [...addOns],
      runQualityGatesChecks: true,
      afterCreate: async (appDir) => {
        const config = JSON.parse(await readFile(join(appDir, '.cta.json'), 'utf8'))
        expect(config.routerOnly).toBe(true)
        expect(config.chosenAddOns).toEqual(expect.arrayContaining([...addOns]))
        const pkg = JSON.parse(await readFile(join(appDir, 'package.json'), 'utf8'))
        expect(pkg.dependencies[`@tanstack/${framework}-query`]).toBeTruthy()
        expect(pkg.dependencies[`@tanstack/${framework}-start`]).toBeUndefined()
        await writeFile(join(appDir, 'src/routes/index.tsx'), `
import { createFileRoute } from '@tanstack/${framework}-router'
import { useQueryClient } from '@tanstack/${framework}-query'
export const Route = createFileRoute('/')({ component: Probe })
function Probe() {
  const client = useQueryClient()
  return <h1>{client ? 'Query provider ready' : 'Missing provider'}</h1>
}
`)
      },
    })
    const guards = attachRuntimeGuards(page, fixture.url)
    try {
      await optimizePageForFastE2E(page)
      await page.goto(fixture.url)
      await expect(page.getByRole('heading', { name: 'Query provider ready' })).toBeVisible()
      guards.assertClean()
    } finally {
      guards.dispose()
      await fixture.stop()
      await fixture.cleanup()
    }
  })
}
