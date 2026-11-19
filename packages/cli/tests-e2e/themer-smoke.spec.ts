import { expect, test } from '@playwright/test'

import { createReactAppFixture } from './helpers'

declare global {
  interface Window {
    __themerMutations: Array<{ at: number; className: string }>
  }
}

// Blocking client modules lets this check inspect the server-rendered document
// after its first contentful paint, before React can repair a wrong theme.
test('@blocking preserves Themer preferences before hydration and across tabs', async ({
  browser,
}) => {
  const app = await createReactAppFixture({
    appName: 'themer-smoke-app',
    addOns: ['themer'],
    packageManager: 'pnpm',
    runQualityGatesChecks: true,
  })

  try {
    for (const scenario of [
      { stored: 'light', system: 'dark', expected: 'light' },
      { stored: 'dark', system: 'light', expected: 'dark' },
      { stored: 'auto', system: 'dark', expected: 'dark' },
      { stored: 'auto', system: 'light', expected: 'light' },
      { stored: 'denied', system: 'dark', expected: 'dark' },
    ] as const) {
      const context = await browser.newContext({ colorScheme: scenario.system })
      try {
        const page = await context.newPage()
        await page.addInitScript(({ stored }) => {
          window.__themerMutations = []
          new MutationObserver(() => {
            if (document.documentElement)
              window.__themerMutations.push({
                at: performance.now(),
                className: document.documentElement.className,
              })
          }).observe(document, {
            subtree: true,
            attributes: true,
            attributeFilter: ['class'],
          })
          if (stored === 'denied') {
            Object.defineProperty(window, 'localStorage', {
              get() {
                throw new DOMException(
                  'Storage blocked for test',
                  'SecurityError',
                )
              },
            })
          } else {
            localStorage.setItem('theme', stored)
          }
        }, scenario)
        const blockModules = async (
          route: import('@playwright/test').Route,
        ) => {
          if (route.request().resourceType() === 'script') await route.abort()
          else await route.continue()
        }
        await page.route('**/*', blockModules)
        await page.goto(app.url, { waitUntil: 'domcontentloaded' })
        await expect(
          page.getByRole('button', { name: 'Switch theme', exact: true }),
        ).toHaveText('Theme')
        await page.waitForFunction(
          () =>
            performance.getEntriesByName('first-contentful-paint').length > 0,
        )
        {
          const atPaint = await page.evaluate(() => {
            const paint = performance.getEntriesByName(
              'first-contentful-paint',
            )[0].startTime
            return window.__themerMutations
              .filter((change) => change.at <= paint)
              .at(-1)
          })
          expect(atPaint?.className.split(/\s+/)).toContain(scenario.expected)
        }
        const before = await page.evaluate(
          () => getComputedStyle(document.body).color,
        )
        expect(before).toBe(
          scenario.expected === 'dark'
            ? 'rgb(215, 236, 232)'
            : 'rgb(23, 58, 64)',
        )

        const errors: Array<string> = []
        page.on('pageerror', (error) => errors.push(error.message))
        page.on('console', (message) => {
          if (
            message.type() === 'error' &&
            /hydrat|did not match/i.test(message.text())
          )
            errors.push(message.text())
        })
        await page.unroute('**/*', blockModules)
        await page.reload({ waitUntil: 'domcontentloaded' })
        await expect(
          page.getByRole('button', { name: /Theme mode:/ }),
        ).toBeVisible()
        expect(
          await page.evaluate(() => getComputedStyle(document.body).color),
        ).toBe(before)
        expect(errors).toEqual([])
        if (scenario.stored === 'denied') {
          await page.getByRole('button', { name: /Theme mode:/ }).click()
          await expect(
            page.getByRole('button', { name: /Theme mode: light/ }),
          ).toBeVisible()
          await page.evaluate(() =>
            window.dispatchEvent(
              new StorageEvent('storage', { key: 'theme', newValue: 'dark' }),
            ),
          )
          expect(errors).toEqual([])
        }
      } finally {
        await context.close()
      }
    }

    const context = await browser.newContext({ colorScheme: 'dark' })
    try {
      const first = await context.newPage()
      await first.goto(app.url, { waitUntil: 'domcontentloaded' })
      await first.getByRole('button', { name: /Theme mode: system/ }).click()
      await expect(
        first.getByRole('button', { name: /Theme mode: light/ }),
      ).toBeVisible()
      await expect
        .poll(() => first.evaluate(() => localStorage.getItem('theme')))
        .toBe('light')
      await first.reload({ waitUntil: 'domcontentloaded' })
      await expect(
        first.getByRole('button', { name: /Theme mode: light/ }),
      ).toBeVisible()
      const second = await context.newPage()
      await second.goto(app.url, { waitUntil: 'domcontentloaded' })
      await second.getByRole('button', { name: /Theme mode: light/ }).click()
      await expect(
        first.getByRole('button', { name: /Theme mode: dark/ }),
      ).toBeVisible()
      await first.getByRole('button', { name: /Theme mode: dark/ }).click()
      await expect
        .poll(() => first.evaluate(() => localStorage.getItem('theme')))
        .toBe('auto')
      await first.emulateMedia({ colorScheme: 'light' })
      await expect(first.locator('html')).toHaveClass(/light/)
    } finally {
      await context.close()
    }
  } finally {
    await app.stop()
    await app.cleanup()
  }
})

test('@blocking applies the system theme in a blank app with blocked storage', async ({
  browser,
}) => {
  const app = await createReactAppFixture({
    appName: 'themer-blank-storage-app',
    blank: true,
    addOns: ['themer'],
    packageManager: 'pnpm',
    runQualityGatesChecks: true,
  })
  try {
    for (const system of ['light', 'dark'] as const) {
      const context = await browser.newContext({ colorScheme: system })
      try {
        const page = await context.newPage()
        await page.addInitScript(() => {
          Object.defineProperty(window, 'localStorage', {
            get() {
              throw new DOMException(
                'Storage blocked for test',
                'SecurityError',
              )
            },
          })
        })
        await page.route('**/*', async (route) => {
          if (route.request().resourceType() === 'script') await route.abort()
          else await route.continue()
        })
        await page.goto(app.url, { waitUntil: 'domcontentloaded' })
        await page.waitForFunction(
          () =>
            performance.getEntriesByName('first-contentful-paint').length > 0,
        )
        await expect(page.locator('html')).toHaveClass(system)
        expect(
          await page.locator('html').evaluate((root) => root.style.colorScheme),
        ).toBe(system)
      } finally {
        await context.close()
      }
    }
  } finally {
    await app.stop()
    await app.cleanup()
  }
})
