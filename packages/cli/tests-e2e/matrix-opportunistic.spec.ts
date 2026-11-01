import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

import {
  attachRuntimeGuards,
  createAppFixture,
  getRepoPath,
  optimizePageForFastE2E,
  type E2EApp,
} from './helpers'

type MatrixScenario = {
  id: string
  framework: 'react' | 'solid'
  packageManager: 'pnpm' | 'npm'
  template?: string
  addOns?: Array<string>
  postCreateAddOns?: Array<string>
  visits?: Array<string>
  assert: (fixture: E2EApp, page: Page) => Promise<void>
}

const reactStarterHeading = /Island hours, but for product teams\.|Start simple, ship quickly\./

const scenarios: Array<MatrixScenario> = [
  {
    id: 'react-base-pnpm',
    framework: 'react',
    packageManager: 'pnpm',
    visits: ['/'],
    assert: async (_, page) => {
      await expect(page.getByRole('heading', { name: reactStarterHeading })).toBeVisible()
    },
  },
  {
    id: 'react-base-npm',
    framework: 'react',
    packageManager: 'npm',
    visits: ['/'],
    assert: async (_, page) => {
      await expect(page.getByRole('heading', { name: reactStarterHeading })).toBeVisible()
    },
  },
  {
    id: 'solid-base-npm',
    framework: 'solid',
    packageManager: 'npm',
    visits: ['/'],
    assert: async (_, page) => {
      await expect(page.getByRole('heading', { name: /TANSTACK/i })).toBeVisible()
    },
  },
  {
    id: 'react-template-resume',
    framework: 'react',
    packageManager: 'pnpm',
    template: getRepoPath('examples/react/resume/template.json'),
    visits: ['/'],
    assert: async (_, page) => {
      await expect(page.getByRole('heading', { name: /Hi, I'm Jane Smith\./ })).toBeVisible()
    },
  },
  {
    id: 'react-template-ecommerce',
    framework: 'react',
    packageManager: 'pnpm',
    template: getRepoPath('examples/react/ecommerce/template.json'),
    visits: ['/', '/#products'],
    assert: async (_, page) => {
      await expect(page.getByRole('heading', { name: 'The TanStack Storefront.' })).toBeVisible()
    },
  },
  {
    id: 'react-addons-core-pnpm',
    framework: 'react',
    packageManager: 'pnpm',
    addOns: ['shadcn', 'form', 'tanstack-query', 'store'],
    visits: ['/demo/form/simple', '/demo/tanstack-query', '/demo/store'],
    assert: async (_, page) => {
      await expect(page.getByRole('heading', { name: 'Store Example' })).toBeVisible()
    },
  },
  {
    id: 'solid-addons-core-pnpm',
    framework: 'solid',
    packageManager: 'pnpm',
    visits: ['/'],
    assert: async (_, page) => {
      await expect(page.getByRole('heading', { name: /TANSTACK/i })).toBeVisible()
    },
  },
  {
    id: 'react-toolchain-deploy',
    framework: 'react',
    packageManager: 'pnpm',
    addOns: ['biome', 'netlify'],
    visits: ['/'],
    assert: async (_, page) => {
      await expect(page.getByRole('heading', { name: reactStarterHeading })).toBeVisible()
    },
  },
]

const selectedScenarioId = process.env.E2E_MATRIX_SCENARIO
const selectedScenarios = selectedScenarioId
  ? scenarios.filter((scenario) => scenario.id === selectedScenarioId)
  : scenarios

test.describe('@matrix opportunistic matrix', () => {
  for (const scenario of selectedScenarios) {
    test(`@matrix ${scenario.id}`, async ({ page }) => {
      const fixture = await createAppFixture({
        appName: `${scenario.id}-smoke`,
        framework: scenario.framework,
        packageManager: scenario.packageManager,
        template: scenario.template,
        addOns: scenario.addOns,
        postCreateAddOns: scenario.postCreateAddOns,
      })
      const guards = attachRuntimeGuards(page, fixture.url)

      try {
        await optimizePageForFastE2E(page)
        for (const visit of scenario.visits || ['/']) {
          await page.goto(`${fixture.url}${visit}`)
          await expect(page.locator('body')).toBeVisible()
        }
        await scenario.assert(fixture, page)
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
})
