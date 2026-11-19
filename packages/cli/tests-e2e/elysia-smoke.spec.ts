import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import {
  attachRuntimeGuards,
  createReactAppFixture,
  optimizePageForFastE2E,
} from './helpers'

for (const existing of [false, true]) {
  test(`@blocking uses Elysia and Eden in a ${existing ? 'existing blank' : 'standard'} React app`, async ({
    page,
  }) => {
    const fixture = await createReactAppFixture({
      appName: `elysia-${existing ? 'existing' : 'standard'}`,
      blank: existing,
      packageManager: existing ? 'pnpm' : 'npm',
      ...(existing ? { postCreateAddOns: ['elysia'] } : { addOns: ['elysia'] }),
      runQualityGatesChecks: true,
      afterCreate: existing
        ? undefined
        : async (appDir) => {
            await writeFile(
              join(appDir, 'src/elysia-contract.test-types.ts'),
              `import { treaty } from '@elysiajs/eden'
import type { App } from './lib/elysia.server'
export function verifyTypes() {
 const client = treaty<App>('http://unused.invalid')
 // @ts-expect-error The API requires a string name.
 void client.api.demo.elysia.greet.post({ name: 42 })
}
`,
            )
          },
    })
    const guards = attachRuntimeGuards(page, fixture.url)
    try {
      if (existing) {
        const response = await page.request.post(
          `${fixture.url}/api/demo/elysia/greet`,
          { data: { name: 'TanStack' } },
        )
        expect(response.status()).toBe(200)
        expect(await response.json()).toEqual({ message: 'Hello TanStack' })
        expect(
          (await page.request.get(`${fixture.url}/demo/elysia`)).status(),
        ).toBe(404)
      } else {
        await optimizePageForFastE2E(page)
        await page.emulateMedia({ colorScheme: 'dark' })
        await page.goto(`${fixture.url}/demo/elysia`)
        await expect(
          page.getByRole('heading', { name: 'Elysia greeting' }),
        ).toBeVisible()
        await page.getByLabel('Name', { exact: true }).fill('TanStack')
        await page
          .getByRole('button', { name: 'Greet', exact: true })
          .click({ timeout: 10_000 })
        await expect(page.getByRole('status')).toHaveText('Hello TanStack')
        await test.info().attach('elysia-demo', {
          body: await page.screenshot(),
          contentType: 'image/png',
        })
      }
      const invalid = await page.request.post(
        `${fixture.url}/api/demo/elysia/greet`,
        { data: { name: 42 } },
      )
      expect(invalid.status()).toBe(422)
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
