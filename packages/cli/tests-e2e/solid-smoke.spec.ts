import { expect, test } from '@playwright/test'

import { attachRuntimeGuards, createAppFixture, optimizePageForFastE2E } from './helpers'

test('@blocking creates a Solid app and renders the home route', async ({ page }) => {
  const fixture = await createAppFixture({
    appName: 'solid-smoke-app',
    framework: 'solid',
  })
  const guards = attachRuntimeGuards(page, fixture.url)

  try {
    await optimizePageForFastE2E(page)
    await page.goto(fixture.url)
    await expect(
      page.getByRole('heading', { name: 'Start simple, ship quickly.' }),
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
