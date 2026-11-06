import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { test } from '@playwright/test'
import type { BrowserContext } from '@playwright/test'
import { createReactAppFixture } from './helpers'

// The real provider UI is served locally, with its published archive pinned by
// integrity. Every provider request is intercepted; this test never signs in.
const UI_INTEGRITY =
  'sha512-FNfuyNYsiR4ScLpm2/5Ob49wX8MLuhrp9XtpKLBdGBNHl0suK88FWLqq9b6Ud0PtacNMeKZP2NRJwbMjgjVCmg=='

test('@blocking handles Descope initialization failure, retry, and session events', async ({
  browser,
}) => {
  let app: Awaited<ReturnType<typeof createReactAppFixture>> | undefined
  let context: BrowserContext | undefined
  let assets = ''
  try {
    app = await createReactAppFixture({
      appName: 'descope-lifecycle',
      addOns: ['descope'],
      packageManager: 'pnpm',
      runQualityGatesChecks: true,
      afterCreate: async (dir) => {
        fs.writeFileSync(
          dir + '/.env.local',
          'VITE_DESCOPE_PROJECT_ID=P3testlocalfixture\n',
        )
        assets = path.resolve(dir, '..', 'descope-ui-fixture')
        fs.mkdirSync(assets)
        const response = await fetch(
          'https://registry.npmjs.org/@descope/web-components-ui/-/web-components-ui-3.27.2.tgz',
        )
        assert.ok(response.ok)
        const archive = Buffer.from(await response.arrayBuffer())
        assert.equal(
          'sha512-' + createHash('sha512').update(archive).digest('base64'),
          UI_INTEGRITY,
        )
        const archivePath = path.join(assets, 'ui.tgz')
        fs.writeFileSync(archivePath, archive)
        const entries = execFileSync('tar', ['-tzf', archivePath], {
          encoding: 'utf8',
        })
          .trim()
          .split('\n')
        assert.ok(
          entries.every(
            (entry) =>
              entry.startsWith('package/') && !entry.split('/').includes('..'),
          ),
        )
        execFileSync('tar', ['-xzf', archivePath, '-C', assets])
        assets = path.join(assets, 'package/dist/umd')
      },
    })
    context = await browser.newContext()
    const page = await context.newPage()
    const errors: Array<string> = []
    page.on('pageerror', (e) => errors.push(e.message))
    let healthy = false,
      configRequests = 0,
      logoutRequests = 0
    const unexpected: Array<string> = []
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url())
      if (['localhost', '127.0.0.1'].includes(url.hostname))
        return route.continue()
      if (
        url.hostname.endsWith('descope.com') ||
        url.hostname === 'descopecdn.com' ||
        url.hostname === 'cdn.jsdelivr.net'
      ) {
        if (url.pathname.endsWith('/config.json')) {
          configRequests++
          return healthy
            ? route.fulfill({
                json: {
                  flows: { 'sign-up-or-in': { version: 1 } },
                  componentsVersion: '3.27.2',
                },
              })
            : route.abort()
        }
        if (url.pathname.endsWith('/theme.json'))
          return route.fulfill({
            json: {
              light: { globals: '', components: {} },
              dark: { globals: '', components: {} },
            },
          })
        if (
          url.pathname.includes('/@descope/web-components-ui@') &&
          url.pathname.includes('/dist/umd/')
        ) {
          const file = path.resolve(assets, url.pathname.split('/dist/umd/')[1])
          assert.ok(file.startsWith(assets + '/'))
          if (fs.existsSync(file))
            return route.fulfill({ path: file, contentType: 'text/javascript' })
        }
        if (url.pathname.endsWith('.html'))
          return route.fulfill({
            body: '<div>Local sign-in fixture</div>',
            contentType: 'text/html',
          })
        if (url.pathname.endsWith('/start'))
          return route.fulfill({
            json: {
              executionId: 'local-execution',
              stepId: '4',
              status: 'waiting',
              action: '',
              screen: {
                id: 'local-screen',
                state: { project: { name: 'Local test' } },
              },
              stepName: 'Sign In',
            },
          })
        if (url.pathname.endsWith('/logout')) {
          logoutRequests++
          return route.fulfill({ json: {} })
        }
        unexpected.push(url.origin + url.pathname)
        return route.abort()
      }
      return route.abort()
    })
    await page.goto(app.url + '/demo/descope', {
      waitUntil: 'domcontentloaded',
    })
    await page
      .getByRole('button', { name: 'Try again' })
      .waitFor({ timeout: 15000 })
    assert.ok(configRequests > 0)
    const failedRequests = configRequests
    healthy = true
    await page.getByRole('button', { name: 'Try again' }).click()
    await page
      .getByText('Local sign-in fixture', { exact: true })
      .waitFor({ timeout: 20000 })
    assert.ok(configRequests > failedRequests)
    assert.equal(
      await page
        .getByRole('status')
        .filter({ hasText: 'Loading sign-in' })
        .count(),
      0,
    )
    const now = Math.floor(Date.now() / 1000)
    const jwt = [
      { alg: 'HS256', typ: 'JWT' },
      {
        sub: 'local-user',
        iss: 'P3testlocalfixture',
        iat: now,
        exp: now + 3600,
      },
      'local-only-signature',
    ]
      .map((x) =>
        Buffer.from(typeof x === 'string' ? x : JSON.stringify(x)).toString(
          'base64url',
        ),
      )
      .join('.')
    await page
      .locator('descope-wc')
      .evaluate(
        (element, jwt) =>
          element.dispatchEvent(
            new CustomEvent('success', {
              detail: {
                sessionJwt: jwt,
                refreshJwt: jwt,
                user: {
                  userId: 'local-user',
                  name: 'Local User',
                  email: 'local@example.test',
                  loginIds: ['local@example.test'],
                },
              },
            }),
          ),
        jwt,
      )
    await page
      .getByRole('button', { name: 'Sign out', exact: true })
      .waitFor({ timeout: 10000 })
    await page.getByText('Signed in', { exact: true }).waitFor()
    await page.getByRole('button', { name: 'Sign out', exact: true }).click()
    await page.getByRole('heading', { name: 'Sign in with Descope' }).waitFor()
    assert.equal(
      await page.getByRole('button', { name: 'Sign out', exact: true }).count(),
      0,
    )
    assert.equal(logoutRequests, 1)
    assert.deepEqual(unexpected, [])
    assert.deepEqual(errors, [])
  } finally {
    if (context) await context.close()
    if (app) {
      await app.stop()
      await app.cleanup()
    }
  }
})
