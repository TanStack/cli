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
    const threadIds: Array<unknown> = []
    await page.route('**/demo/api/ai/chat', async (route) => {
      const { threadId } = route.request().postDataJSON()
      threadIds.push(threadId)
      const floating = threadIds.length === 2
      const reply = floating ? 'Floating assistant reply' : 'Local mock reply'
      const messageId = `mock-message-${threadIds.length}`
      const toolCallId = 'mock-guitar'
      const events = [
        { type: 'RUN_STARTED', threadId, runId: 'mock-run' },
        {
          type: 'TEXT_MESSAGE_START',
          messageId,
          role: 'assistant',
        },
        {
          type: 'TEXT_MESSAGE_CONTENT',
          messageId,
          delta: reply,
        },
        { type: 'TEXT_MESSAGE_END', messageId },
        ...(floating
          ? [
              {
                type: 'TOOL_CALL_START',
                toolCallId,
                toolCallName: 'recommendGuitar',
                parentMessageId: messageId,
              },
              { type: 'TOOL_CALL_ARGS', toolCallId, delta: '{"id":2}' },
              { type: 'TOOL_CALL_END', toolCallId },
              {
                type: 'TOOL_CALL_RESULT',
                messageId: 'mock-guitar-result',
                toolCallId,
                content: '{"id":2}',
              },
            ]
          : []),
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
    await page.getByRole('link', { name: 'Home', exact: true }).click()
    await expect(page).toHaveURL(new URL('/', fixture.url).href)
    await page
      .getByRole('button', { name: 'AI Assistant', exact: true })
      .click({ timeout: 7_000 })
    const assistantInput = page.getByPlaceholder('Type your message...')
    await assistantInput.fill('Hello from the floating assistant', {
      timeout: 7_000,
    })
    await assistantInput.press('Enter', { timeout: 7_000 })
    await expect(
      page.getByText('Floating assistant reply', { exact: true }),
    ).toBeVisible()
    expect(threadIds).toEqual([
      'guitar-recommendations',
      'guitar-recommendations',
    ])
    await expect(
      page.getByRole('heading', { name: 'Video Game Guitar', exact: true }),
    ).toBeVisible()
  } finally {
    await fixture.stop()
    await fixture.cleanup()
  }
})
