import { expect, test } from '@playwright/test'

import { attachRuntimeGuards, createReactAppFixture, optimizePageForFastE2E } from './helpers'

test('@matrix renders and navigates the React Router-only starter with examples', async ({
  page,
}) => {
  const fixture = await createReactAppFixture({
    appName: 'react-router-only-smoke-app',
    routerOnly: true,
    examples: true,
    runQualityGatesChecks: true,
  })
  const guards = attachRuntimeGuards(page, fixture.url)

  try {
    await optimizePageForFastE2E(page)
    await page.goto(fixture.url)
    await expect(
      page.getByRole('heading', { name: 'Start simple, ship quickly.' }),
    ).toBeVisible()

    const header = page.getByRole('banner')
    const footer = page.getByRole('contentinfo')
    await expect(header).toBeVisible()
    await expect(footer).toBeVisible()

    const homeLinks = await page
      .locator('a[href^="/"]')
      .evaluateAll((anchors) =>
        Array.from(new Set(anchors.map((anchor) => anchor.getAttribute('href') || '')))
          .filter(Boolean)
          .sort(),
      )

    expect(homeLinks).toContain('/about')

    await header.getByRole('link', { name: 'About', exact: true }).click()
    await expect(page).toHaveURL(/\/about\/?$/)
    await expect(
      page.getByRole('heading', { name: 'A small starter with room to grow.' }),
    ).toBeVisible()

    await expect(header).toBeVisible()
    await expect(footer).toBeVisible()

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

test('@matrix keeps the default React Router-only scaffold lean', async ({ page }) => {
  const fixture = await createReactAppFixture({
    appName: 'react-router-only-lean-app',
    routerOnly: true,
    runQualityGatesChecks: true,
  })
  const guards = attachRuntimeGuards(page, fixture.url)

  try {
    await optimizePageForFastE2E(page)
    await page.goto(fixture.url)
    await expect(page.getByRole('heading', { name: 'Welcome to TanStack Start' })).toBeVisible()
    await expect(page.getByRole('banner')).toHaveCount(0)
    await expect(page.getByRole('contentinfo')).toHaveCount(0)
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
