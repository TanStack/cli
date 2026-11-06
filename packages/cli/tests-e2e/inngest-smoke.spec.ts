import { createHmac } from 'node:crypto'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { expect, test } from '@playwright/test'
import { createReactAppFixture, optimizePageForFastE2E } from './helpers'

const SIGNING_KEY = `signkey-test-${'ab'.repeat(32)}`

// Stands in for the Inngest API so no test can send a real event.
async function startMockInngest() {
  const requests: Array<{ method?: string; url?: string; body: string }> = []
  const server = createServer((req, res) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      requests.push({ method: req.method, url: req.url, body })
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ ids: ['01MOCKEVENTID'], status: 200 }))
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}

const EVENT_KEY = 'test-event-key'

// Pin every outbound Inngest URL, the dev/cloud mode, and the keys the SDK
// uses so nothing inherited from the shell can route the app to a real
// Inngest endpoint.
function inngestEnv(mockUrl: string, dev: boolean) {
  return {
    INNGEST_DEV: dev ? '1' : '0',
    INNGEST_EVENT_KEY: EVENT_KEY,
    INNGEST_SIGNING_KEY: SIGNING_KEY,
    INNGEST_SIGNING_KEY_FALLBACK: '',
    INNGEST_ENV: 'e2e',
    INNGEST_BASE_URL: mockUrl,
    INNGEST_EVENT_API_BASE_URL: mockUrl,
    INNGEST_API_BASE_URL: mockUrl,
  }
}

// Vars a developer's shell could plausibly set that point the SDK elsewhere.
// Intentionally independent of inngestEnv so the negative check still catches
// a variable someone forgets to pin there.
const INHERITABLE_INNGEST_VARS = [
  'INNGEST_EVENT_API_BASE_URL',
  'INNGEST_API_BASE_URL',
  'INNGEST_BASE_URL',
  'INNGEST_DEV',
]

function signRequest(body: string) {
  const ts = Math.floor(Date.now() / 1000).toString()
  const key = SIGNING_KEY.replace(/^signkey-\w+-/, '')
  const sig = createHmac('sha256', key)
    .update(body + ts)
    .digest('hex')
  return `t=${ts}&s=${sig}`
}

test('@blocking production Inngest app rejects the demo sender and serves the signed callback', async ({
  page,
}) => {
  const inngestApi = await startMockInngest()
  try {
    const fixture = await createReactAppFixture({
      appName: 'react-inngest-prod-app',
      addOns: ['inngest'],
      runQualityGatesChecks: true,
      serverScript: 'preview',
      serverEnv: inngestEnv(inngestApi.url, false),
    })
    try {
      const unsigned = await page.request.get(`${fixture.url}/api/inngest`)
      expect(unsigned.status()).toBe(401)

      const signed = await page.request.get(`${fixture.url}/api/inngest`, {
        headers: { 'x-inngest-signature': signRequest('') },
      })
      expect(signed.status()).toBe(200)
      expect(await signed.json()).toMatchObject({
        authentication_succeeded: true,
        mode: 'cloud',
        function_count: 1,
      })

      await optimizePageForFastE2E(page)
      await page.goto(`${fixture.url}/demo/inngest`)
      await page.getByRole('button', { name: 'Send demo/hello.world' }).click()
      await expect(page.getByRole('alert')).toHaveText(
        'The Inngest demo sender is disabled in production.',
      )
      expect(inngestApi.requests).toEqual([])
    } finally {
      await fixture.stop()
      await fixture.cleanup()
    }
  } finally {
    await inngestApi.close()
  }
})

test('@blocking development Inngest app sends the demo event to the local Inngest server and ignores inherited Inngest URLs', async ({
  page,
}) => {
  const [inngestApi, sentinel] = await Promise.all([
    startMockInngest(),
    startMockInngest(),
  ])
  // Each Playwright worker is its own process running one test at a time, and
  // every child it spawns in this test (scaffold, install, app server)
  // inherits these values.
  const saved = Object.fromEntries(
    INHERITABLE_INNGEST_VARS.map((key) => [key, process.env[key]]),
  )
  try {
    for (const key of INHERITABLE_INNGEST_VARS) process.env[key] = sentinel.url
    const fixture = await createReactAppFixture({
      appName: 'react-inngest-dev-app',
      addOns: ['inngest'],
      serverEnv: inngestEnv(inngestApi.url, true),
    })
    try {
      await optimizePageForFastE2E(page)
      await page.goto(`${fixture.url}/demo/inngest`)
      await page.getByRole('button', { name: 'Send demo/hello.world' }).click()
      // Wait for the send to land on either server so a misroute is reported as
      // a sentinel hit rather than a missing UI result.
      await expect
        .poll(() => inngestApi.requests.length + sentinel.requests.length)
        .toBe(1)
      expect(sentinel.requests).toEqual([])
      await expect(page.getByText('01MOCKEVENTID')).toBeVisible()
      expect(inngestApi.requests).toHaveLength(1)
      const [sent] = inngestApi.requests
      expect(sent.method).toBe('POST')
      expect(sent.url).toBe(`/e/${EVENT_KEY}`)
      expect(JSON.parse(sent.body)).toMatchObject([
        { name: 'demo/hello.world', data: { name: 'world' } },
      ])
    } finally {
      await fixture.stop()
      await fixture.cleanup()
    }
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    await Promise.all([inngestApi.close(), sentinel.close()])
  }
})
