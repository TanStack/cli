import { expect, test } from '@playwright/test'

import { attachRuntimeGuards, createReactAppFixture, optimizePageForFastE2E } from './helpers'

test('@blocking creates app with multiple add-ons and renders demo routes', async ({ page }) => {
  const fixture = await createReactAppFixture({
    appName: 'addons-create-smoke-app',
    addOns: ['shadcn', 'form', 'tanstack-query', 'store', 'table'],
    runQualityGatesChecks: true,
  })
  const guards = attachRuntimeGuards(page, fixture.url)

  try {
    await optimizePageForFastE2E(page)
    await page.goto(`${fixture.url}/demo/form/simple`)
    const title = page.getByRole('textbox', { name: 'Title', exact: true })
    await expect(title).toBeVisible()
    await page.getByText('Title', { exact: true }).click()
    await expect(title).toBeFocused()
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible()

    await page.goto(`${fixture.url}/demo/tanstack-query`)
    await expect(page.getByRole('heading', { name: /TanStack Query/ })).toBeVisible()

    await page.goto(`${fixture.url}/demo/table`)
    const table = page.getByRole('table')
    const rows = table.locator('tbody tr')
    await expect(rows).toHaveCount(10)
    const firstRow = await rows.first().innerText()
    await page.getByRole('button', { name: '>', exact: true }).click()
    await expect(page.getByText(/^2 of /)).toBeVisible()
    await expect(rows.first()).not.toHaveText(firstRow, { useInnerText: true })
    await table.getByText('Last Name', { exact: true }).click()
    await expect(table.getByText('🔼', { exact: false })).toBeVisible()
    const lastNameCells = rows.locator('td:nth-child(3)')
    const lastNames = (await lastNameCells.allTextContents()).map((name) =>
      name.trim().toLowerCase(),
    )
    expect(lastNames).toEqual([...lastNames].sort())
    const matchingName = (await lastNameCells.first().innerText()).trim()
    const search = page.getByPlaceholder('Search all columns...')
    await search.fill('no-starter-table-row-matches-123456')
    await expect(rows).toHaveCount(0)
    await search.fill(matchingName)
    await expect(lastNameCells.first()).toHaveText(matchingName)

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
