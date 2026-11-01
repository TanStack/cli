import { expect, test } from '@playwright/test'

import { attachRuntimeGuards, createReactAppFixture, optimizePageForFastE2E } from './helpers'

test('@blocking creates a React app and navigates core starter routes', async ({ page }) => {
  const fixture = await createReactAppFixture({
    appName: 'react-smoke-app',
    runQualityGatesChecks: true,
  })
  const guards = attachRuntimeGuards(page, fixture.url)

  try {
    await optimizePageForFastE2E(page)
    await page.goto(fixture.url)
    await expect(
      page.getByRole('heading', {
        name: 'Start simple, ship quickly.',
      }),
    ).toBeVisible()

    await page.getByRole('link', { name: 'About', exact: true }).click()
    await expect(page).toHaveURL(/\/about\/?$/)
    await expect(
      page.getByRole('heading', { name: 'A small starter with room to grow.' }),
    ).toBeVisible()

    await page.getByRole('link', { name: 'Home' }).click()
    await expect(page).toHaveURL(/\/?$/)
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
