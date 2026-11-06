import { createServer } from 'node:http'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { attachRuntimeGuards, createReactAppFixture } from './helpers'

function createPocketBaseFixture() {
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

  return {
    requests,
    start: (port: number) =>
      new Promise<number>((resolve, reject) => {
        server.once('error', reject)
        server.listen(port, '127.0.0.1', () => {
          const address = server.address()
          if (!address || typeof address === 'string') {
            reject(new Error('Missing PocketBase fixture port'))
            return
          }
          resolve(address.port)
        })
      }),
    stop: () =>
      new Promise<void>((resolve, reject) => {
        if (!server.listening) {
          resolve()
          return
        }
        server.close((error) => (error ? reject(error) : resolve()))
      }),
  }
}

test('@matrix builds and renders the PocketBase add-on with a local server fixture', async ({
  page,
}) => {
  const server = createPocketBaseFixture()
  const port = await server.start(0)
  try {
    const fixture = await createReactAppFixture({
      appName: 'react-pocketbase-smoke',
      addOns: ['pocketbase'],
      runQualityGatesChecks: true,
      afterCreate: async (appDir) => {
        await writeFile(
          join(appDir, '.env.local'),
          `VITE_POCKETBASE_URL=http://127.0.0.1:${port}\n`,
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
      expect(server.requests.some((url) => url.startsWith('/api/health'))).toBe(
        true,
      )
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
    await server.stop()
  }
})

test('@matrix recovers the PocketBase demo after the server starts', async ({
  page,
}) => {
  const server = createPocketBaseFixture()
  // Reserve a free port, then stop so the app starts with no server running.
  const port = await server.start(0)
  await server.stop()
  try {
    const fixture = await createReactAppFixture({
      appName: 'react-pocketbase-recovery',
      addOns: ['pocketbase'],
      afterCreate: async (appDir) => {
        await writeFile(
          join(appDir, '.env.local'),
          `VITE_POCKETBASE_URL=http://127.0.0.1:${port}\n`,
        )
      },
    })
    try {
      await page.goto(`${fixture.url}/demo/pocketbase`)
      await expect(
        page.getByRole('heading', { name: 'PocketBase is not ready' }),
      ).toBeVisible()

      const retry = page.getByRole('button', { name: 'Try again' })
      await retry.click()
      await expect(retry).toBeEnabled()
      await expect(
        page.getByRole('heading', { name: 'PocketBase is not ready' }),
      ).toBeVisible()

      await server.start(port)
      // The stopped server's connection errors are expected, so only guard
      // what happens from recovery onward.
      const guards = attachRuntimeGuards(page, fixture.url)
      try {
        await retry.click()
        await expect(
          page.getByRole('heading', { name: 'Sign in to see your todos' }),
        ).toBeVisible()
        await expect(
          page.getByRole('heading', { name: 'PocketBase is not ready' }),
        ).toBeHidden()
        guards.assertClean()
      } finally {
        guards.dispose()
      }
    } finally {
      await fixture.stop()
      await fixture.cleanup()
    }
  } finally {
    await server.stop()
  }
})
