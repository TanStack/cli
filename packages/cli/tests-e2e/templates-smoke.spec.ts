import { expect, test } from '@playwright/test'

import {
  attachRuntimeGuards,
  createReactAppFixture,
  getRepoPath,
  optimizePageForFastE2E,
} from './helpers'

test('@matrix creates and renders the resume template', async ({ page }) => {
  const fixture = await createReactAppFixture({
    appName: 'resume-template-smoke-app',
    template: getRepoPath('examples/react/resume/template.json'),
  })
  const guards = attachRuntimeGuards(page, fixture.url)

  try {
    await optimizePageForFastE2E(page)
    await page.goto(fixture.url)
    await expect(page.getByRole('heading', { name: /Hi, I'm Jane Smith\./ })).toBeVisible()
    await expect(page.getByText('Product-minded frontend engineer')).toBeVisible()

    await page.getByRole('link', { name: 'Resume' }).click()
    await expect(page).toHaveURL(/\/$/)
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

test('@matrix creates and renders the ecommerce template', async ({ page }) => {
  const fixture = await createReactAppFixture({
    appName: 'ecommerce-template-smoke-app',
    template: getRepoPath('examples/react/ecommerce/template.json'),
  })
  const guards = attachRuntimeGuards(page, fixture.url)

  try {
    await optimizePageForFastE2E(page)
    await page.goto(fixture.url)
    await expect(page.getByRole('heading', { name: 'The TanStack Storefront.' })).toBeVisible()

    await page.getByRole('link', { name: 'Browse Catalog' }).click()
    await expect(page).toHaveURL(/\/#products$/)
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
