import { createServer } from 'node:http'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { attachRuntimeGuards, createReactAppFixture } from './helpers'

test('@matrix builds and renders the PocketBase add-on with a local server fixture', async ({
  page,
}) => {
  const requests: Array<string> = []
  const server = createServer((request, response) => {
    requests.push(request.url ?? '')
    response.writeHead(request.method === 'OPTIONS' ? 204 : 200, {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'content-type': 'application/json',
    })
    response.end(
      request.method === 'OPTIONS'
        ? undefined
        : JSON.stringify({ code: 200, message: 'API is healthy.', data: {} }),
    )
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Missing PocketBase fixture port')
  }
  try {
    const fixture = await createReactAppFixture({
      appName: 'react-pocketbase-smoke',
      addOns: ['pocketbase'],
      runQualityGatesChecks: true,
      afterCreate: async (appDir) => {
        await writeFile(
          join(appDir, '.env.local'),
          `VITE_POCKETBASE_URL=http://127.0.0.1:${address.port}\n`,
        )
      },
    })
    const guards = attachRuntimeGuards(page, fixture.url)
    try {
      await page.goto(`${fixture.url}/demo/pocketbase`)
      await expect(
        page.getByRole('heading', { name: 'Sign in to see your todos' }),
      ).toBeVisible()
      await expect(page.getByLabel('Password')).toBeVisible()
      expect(requests.some((url) => url.startsWith('/api/health'))).toBe(true)
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
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  }
})
