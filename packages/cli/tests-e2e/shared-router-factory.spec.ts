import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import {
  attachRuntimeGuards,
  createAppFixture,
  optimizePageForFastE2E,
} from './helpers'

for (const framework of ['react', 'solid'] as const) {
  test(`@matrix applies the ${framework} router-only factory configuration`, async ({
    page,
  }) => {
    const fixture = await createAppFixture({
      appName: `${framework}-shared-router`,
      framework,
      routerOnly: true,
      runQualityGatesChecks: true,
      afterCreate: async (appDir) => {
        const path = join(appDir, 'src/router.tsx')
        const content = await readFile(path, 'utf8')
        await writeFile(
          path,
          content.replace(
            'routeTree,',
            'routeTree,\n defaultNotFoundComponent: () => <h1>Factory configuration is active</h1>,',
          ),
        )
      },
    })
    const guards = attachRuntimeGuards(page, fixture.url)
    try {
      await optimizePageForFastE2E(page)
      await page.goto(`${fixture.url}/factory-check`)
      await expect(
        page.getByRole('heading', { name: 'Factory configuration is active' }),
      ).toBeVisible()
    } finally {
      try {
        guards.assertClean()
      } finally {
        guards.dispose()
        await fixture.stop()
        await fixture.cleanup()
      }
    }
  })
}
