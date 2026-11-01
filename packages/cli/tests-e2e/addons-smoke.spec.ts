import { expect, test } from '@playwright/test'

import { attachRuntimeGuards, createReactAppFixture, optimizePageForFastE2E } from './helpers'

test('@blocking creates app with multiple add-ons and renders demo routes', async ({ page }) => {
  const fixture = await createReactAppFixture({
    appName: 'addons-create-smoke-app',
    addOns: ['shadcn', 'form', 'tanstack-query', 'store'],
  })
  const guards = attachRuntimeGuards(page, fixture.url)

  try {
    await optimizePageForFastE2E(page)
    await page.goto(`${fixture.url}/demo/form/simple`)
    await expect(page.getByText('Title', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible()

    await page.goto(`${fixture.url}/demo/tanstack-query`)
    await expect(page.getByRole('heading', { name: /TanStack Query/ })).toBeVisible()

    await page.goto(`${fixture.url}/demo/store`)
    await expect(page.getByRole('heading', { name: 'Store Example' })).toBeVisible()
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
