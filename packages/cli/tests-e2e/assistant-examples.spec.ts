import { expect, test } from '@playwright/test'
import { attachRuntimeGuards, createAppFixture, optimizePageForFastE2E } from './helpers'

for (const scenario of [
  {
    id: 'events',
    packageManager: 'npm',
    button: 'Open Remy Assistant',
    placeholder: 'Ask about speakers, sessions, techniques...',
    endpoint: '/api/remy-chat',
    threadId: 'conference-assistant',
  },
  {
    id: 'resume',
    packageManager: 'pnpm',
    button: 'Open Resume Assistant',
    placeholder: 'Ask about skills, experience, or qualifications...',
    endpoint: '/api/resume-chat',
    threadId: 'resume-assistant',
  },
] as const) {
  test(`@matrix ${scenario.id} assistant streams and survives navigation`, async ({ page }) => {
    const fixture = await createAppFixture({
      appName: `${scenario.id}-assistant-lifecycle`,
      framework: 'react',
      packageManager: scenario.packageManager,
      addOns: [scenario.id],
      runQualityGatesChecks: true,
    })
    const guards = attachRuntimeGuards(page, fixture.url)
    try {
      const invalid = await page.request.post(`${fixture.url}${scenario.endpoint}`, {
        data: { messages: [] },
      })
      expect(invalid.status()).toBe(400)
      await optimizePageForFastE2E(page)
      await page.route(`**${scenario.endpoint}`, async (route) => {
        const { threadId } = route.request().postDataJSON()
        expect(threadId).toBe(scenario.threadId)
        const events = [
          { type: 'RUN_STARTED', threadId, runId: 'example-run' },
          { type: 'TEXT_MESSAGE_START', messageId: 'example-reply', role: 'assistant' },
          { type: 'TEXT_MESSAGE_CONTENT', messageId: 'example-reply', delta: 'Local example reply' },
          { type: 'TEXT_MESSAGE_END', messageId: 'example-reply' },
          { type: 'RUN_FINISHED', threadId, runId: 'example-run' },
        ]
        await route.fulfill({
          contentType: 'text/event-stream',
          body: events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(''),
        })
      })
      await page.addInitScript(() => localStorage.setItem('theme', 'light'))
      await page.goto(fixture.url)
      await expect(
        page.getByRole('button', {
          name: 'Theme mode: light. Click to switch mode.',
          exact: true,
        }),
      ).toBeVisible()
      await page.getByRole('button', { name: scenario.button, exact: true }).click()
      const input = page.getByPlaceholder(scenario.placeholder)
      await input.fill('Hello')
      await input.press('Enter')
      await expect(page.getByText('Local example reply', { exact: true })).toBeVisible()
      await page.getByRole('link', { name: 'About', exact: true }).click()
      await expect(page).toHaveURL(/\/about$/)
      await expect(page.getByText('Something went wrong!', { exact: true })).toHaveCount(0)
      await page.goBack()
      await page.getByRole('button', { name: scenario.button, exact: true }).click()
      await expect(page.getByPlaceholder(scenario.placeholder)).toBeVisible()
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
}
