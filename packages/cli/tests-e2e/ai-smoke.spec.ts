import { expect, test } from '@playwright/test'
import { createAppFixture, optimizePageForFastE2E } from './helpers'

test('@blocking builds the AI scaffold and streams a mocked chat without provider calls', async ({
  page,
}) => {
  const fixture = await createAppFixture({
    appName: 'react-ai-smoke-app',
    framework: 'react',
    packageManager: 'npm',
    addOns: ['ai'],
    runQualityGatesChecks: true,
  })
  try {
    const invalid = await page.request.post(`${fixture.url}/demo/api/ai/chat`, {
      data: { messages: [] },
    })
    expect(invalid.status()).toBe(400)
    await optimizePageForFastE2E(page)
    let threadId: unknown
    await page.route('**/demo/api/ai/chat', async (route) => {
      threadId = route.request().postDataJSON().threadId
      const events = [
        { type: 'RUN_STARTED', threadId, runId: 'mock-run' },
        {
          type: 'TEXT_MESSAGE_START',
          messageId: 'mock-message',
          role: 'assistant',
        },
        {
          type: 'TEXT_MESSAGE_CONTENT',
          messageId: 'mock-message',
          delta: 'Local mock reply',
        },
        { type: 'TEXT_MESSAGE_END', messageId: 'mock-message' },
        { type: 'RUN_FINISHED', threadId, runId: 'mock-run' },
      ]
      await route.fulfill({
        contentType: 'text/event-stream',
        body: events
          .map((event) => `data: ${JSON.stringify(event)}\n\n`)
          .join(''),
      })
    })
    await page.addInitScript(() => localStorage.setItem('theme', 'light'))
    await page.goto(`${fixture.url}/demo/ai-chat`)
    await expect(
      page.getByRole('button', {
        name: 'Theme mode: light. Click to switch mode.',
        exact: true,
      }),
    ).toBeVisible()
    const input = page.getByPlaceholder('Type something clever...')
    await input.fill('Hello')
    await expect(page.locator('form button[type=submit]')).toBeEnabled()
    await input.press('Enter')
    await expect(
      page.getByText('Local mock reply', { exact: true }),
    ).toBeVisible()
    expect(threadId).toBe('guitar-recommendations')
  } finally {
    await fixture.stop()
    await fixture.cleanup()
  }
})
