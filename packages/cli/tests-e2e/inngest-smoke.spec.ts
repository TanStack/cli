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

function signRequest(body: string) {
  const ts = Math.floor(Date.now() / 1000).toString()
  const key = SIGNING_KEY.replace(/^signkey-\w+-/, '')
  const sig = createHmac('sha256', key).update(body + ts).digest('hex')
  return `t=${ts}&s=${sig}`
}

test('@blocking production Inngest app rejects the demo sender and serves the signed callback', async ({
  page,
}) => {
  const inngestApi = await startMockInngest()
  const fixture = await createReactAppFixture({
    appName: 'react-inngest-prod-app',
    addOns: ['inngest'],
    runQualityGatesChecks: true,
    serverScript: 'preview',
    serverEnv: {
      INNGEST_DEV: '',
      INNGEST_SIGNING_KEY: SIGNING_KEY,
      INNGEST_EVENT_KEY: 'test-event-key',
      INNGEST_BASE_URL: inngestApi.url,
    },
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
    await inngestApi.close()
  }
})

test('@blocking development Inngest app sends the demo event to the local Inngest server', async ({
  page,
}) => {
  const inngestApi = await startMockInngest()
  const fixture = await createReactAppFixture({
    appName: 'react-inngest-dev-app',
    addOns: ['inngest'],
    serverEnv: {
      INNGEST_DEV: '1',
      INNGEST_BASE_URL: inngestApi.url,
    },
  })
  try {
    await optimizePageForFastE2E(page)
    await page.goto(`${fixture.url}/demo/inngest`)
    await page.getByRole('button', { name: 'Send demo/hello.world' }).click()
    await expect(page.getByText('01MOCKEVENTID')).toBeVisible()
    expect(inngestApi.requests).toHaveLength(1)
    const [sent] = inngestApi.requests
    expect(sent.method).toBe('POST')
    expect(sent.url).toMatch(/^\/e\//)
    expect(JSON.parse(sent.body)).toMatchObject([
      { name: 'demo/hello.world', data: { name: 'world' } },
    ])
  } finally {
    await fixture.stop()
    await fixture.cleanup()
    await inngestApi.close()
  }
})
