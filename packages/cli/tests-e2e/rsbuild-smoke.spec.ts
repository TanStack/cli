import { execFile } from 'node:child_process'
import { access, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

import { expect, test } from '@playwright/test'

import {
  attachRuntimeGuards,
  createAppFixture,
  getRepoPath,
  optimizePageForFastE2E,
} from './helpers'

const execFileAsync = promisify(execFile)

const scenarios = [
  { framework: 'react', routerOnly: false, blank: false },
  { framework: 'solid', routerOnly: false, blank: false },
  { framework: 'react', routerOnly: true, blank: true },
  { framework: 'solid', routerOnly: true, blank: true },
] as const

test('@matrix lists only toolchains for Rsbuild', async () => {
  const { stdout } = await execFileAsync(
    process.execPath,
    [
      getRepoPath('packages/cli/dist/index.js'),
      'create',
      '--framework',
      'React',
      '--build-tool',
      'rsbuild',
      '--list-add-ons',
      '--json',
    ],
    { encoding: 'utf8' },
  )
  const addOns = JSON.parse(stdout) as Array<{ type: string }>

  expect(addOns.length).toBeGreaterThan(0)
  expect(addOns.every((addOn) => addOn.type === 'toolchain')).toBe(true)
})

test('@matrix rejects an Rsbuild deployment before creating a directory', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'tanstack-rsbuild-conflict-'))
  const appName = 'invalid-rsbuild-app'

  try {
    let failure: unknown
    try {
      await execFileAsync(
        process.execPath,
        [
          getRepoPath('packages/cli/dist/index.js'),
          'create',
          appName,
          '--build-tool',
          'rsbuild',
          '--deployment',
          'cloudflare',
          '--yes',
          '--no-install',
          '--no-git',
        ],
        { cwd: rootDir, encoding: 'utf8' },
      )
    } catch (error) {
      failure = error
    }

    const commandError = failure as
      | (Error & { stdout?: string; stderr?: string })
      | undefined
    expect(
      `${commandError?.stdout ?? ''}\n${commandError?.stderr ?? ''}`,
    ).toContain('Rsbuild does not currently support --deployment')
    await expect(access(join(rootDir, appName))).rejects.toThrow()
  } finally {
    await rm(rootDir, { recursive: true, force: true })
  }
})

test.describe('@matrix Rsbuild smoke matrix', () => {
  for (const scenario of scenarios) {
    test(`@matrix ${scenario.framework} routerOnly=${scenario.routerOnly} blank=${scenario.blank}`, async ({
      page,
    }) => {
      const fixture = await createAppFixture({
        appName: `${scenario.framework}-rsbuild-${scenario.routerOnly ? 'router' : 'start'}-smoke`,
        framework: scenario.framework,
        bundler: 'rsbuild',
        routerOnly: scenario.routerOnly,
        blank: scenario.blank,
        packageManager: 'pnpm',
        runQualityGatesChecks: true,
      })
      const guards = attachRuntimeGuards(page, fixture.url)

      try {
        await optimizePageForFastE2E(page)
        await page.goto(fixture.url)
        await expect(page.locator('body')).toBeVisible()
        await expect(
          page.getByRole('heading', {
            name: scenario.blank
              ? 'Welcome to TanStack Start'
              : scenario.framework === 'react'
                ? 'Start simple, ship quickly.'
                : /TANSTACK/i,
          }),
        ).toBeVisible()
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
