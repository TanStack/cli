import { expect, test } from '@playwright/test'

import { attachRuntimeGuards, createReactAppFixture, optimizePageForFastE2E } from './helpers'

test('@matrix creates a React router-only app and navigates every internal link', async ({
  page,
}) => {
  const fixture = await createReactAppFixture({
    appName: 'react-router-only-smoke-app',
    routerOnly: true,
  })
  const guards = attachRuntimeGuards(page, fixture.url)

  try {
    await optimizePageForFastE2E(page)
    await page.goto(fixture.url)
    await expect(
      page.getByRole('heading', { name: 'Start simple, ship quickly.' }),
    ).toBeVisible()

    const homeLinks = await page
      .locator('a[href^="/"]')
      .evaluateAll((anchors) =>
        Array.from(new Set(anchors.map((anchor) => anchor.getAttribute('href') || '')))
          .filter(Boolean)
          .sort(),
      )

    expect(homeLinks).toContain('/about')

    await page.locator('a[href="/about"]').first().click()
    await expect(page).toHaveURL(/\/about\/?$/)
    await expect(
      page.getByRole('heading', { name: 'A small starter with room to grow.' }),
    ).toBeVisible()

    await page.goto(`${fixture.url}/about`)
    await expect(
      page.getByRole('heading', { name: 'A small starter with room to grow.' }),
    ).toBeVisible()

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
