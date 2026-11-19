import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import { createReactAppFixture, optimizePageForFastE2E } from './helpers'

for (const rejects of [true, false]) {
  test(`@matrix Neon ${rejects ? 'shows recovery after a rejected query' : 'renders successful query results'}`, async ({
    page,
  }) => {
    const app = await createReactAppFixture({
      appName: `neon-query-${rejects ? 'failure' : 'success'}`,
      addOns: ['neon'],
      runQualityGatesChecks: true,
      afterCreate: async (dir) => {
        fs.writeFileSync(
          path.join(dir, 'src/db.ts'),
          `
export async function getClient() {
  return { query: async (..._args: unknown[]) => {
    ${rejects ? "throw new Error('Local test: password authentication failed')" : "return [{ id: 1, title: 'Local query success' }]"}
  } }
}
`,
        )
      },
    })
    try {
      await optimizePageForFastE2E(page)
      await page.goto(app.url + '/demo/neon')
      if (rejects) {
        await expect(
          page.getByRole('heading', {
            name: 'Neon database not connected',
            exact: true,
          }),
        ).toBeVisible()
        await expect(
          page.getByText('a fresh connection string from the Neon Console', {
            exact: false,
          }),
        ).toBeVisible()
      } else {
        await expect(
          page.getByText('Local query success', { exact: true }),
        ).toBeVisible()
        await expect(
          page.getByRole('heading', {
            name: 'Neon database not connected',
            exact: true,
          }),
        ).toHaveCount(0)
      }
    } finally {
      await app.stop()
      await app.cleanup()
    }
  })
}
