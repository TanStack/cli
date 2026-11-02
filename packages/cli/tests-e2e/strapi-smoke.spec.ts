import { createServer } from 'node:http'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { attachRuntimeGuards, createReactAppFixture } from './helpers'

test('@matrix builds and renders the Strapi add-on with a local CMS fixture', async ({ page }) => {
  const requests: string[] = []
  const cms = createServer((request, response) => {
    requests.push(request.url ?? '')
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(JSON.stringify({
      data: [],
      meta: { pagination: { page: 2, pageSize: 3, pageCount: 0, total: 0 } },
    }))
  })
  await new Promise<void>((resolve) => cms.listen(0, '127.0.0.1', resolve))
  const address = cms.address()
  if (!address || typeof address === 'string') throw new Error('Missing CMS port')
  try {
    const fixture = await createReactAppFixture({
      appName: 'react-strapi-smoke',
      addOns: ['strapi'],
      runQualityGatesChecks: true,
      afterCreate: async (appDir) => {
        await writeFile(join(appDir, '.env.local'), `VITE_STRAPI_URL=http://127.0.0.1:${address.port}\n`)
      },
    })
    const guards = attachRuntimeGuards(page, fixture.url)
    try {
      await page.goto(`${fixture.url}/demo/strapi?page=2&query=factory-check`)
      await expect(page.getByRole('heading', { name: 'Strapi Articles' })).toBeVisible()
      await expect(page.getByText('No articles match your search for', { exact: false })).toBeVisible()
      expect(requests.some((url) => url.startsWith('/api/articles?') && url.includes('factory-check'))).toBe(true)
    } finally {
      try {
        guards.assertClean()
      } finally {
        guards.dispose()
        await fixture.stop()
        await fixture.cleanup()
      }
    }
  } finally {
    await new Promise<void>((resolve, reject) => cms.close((error) => error ? reject(error) : resolve()))
  }
})
