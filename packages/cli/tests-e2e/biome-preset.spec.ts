import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { attachRuntimeGuards, createAppFixture, optimizePageForFastE2E } from './helpers'

const execFileAsync = promisify(execFile)

for (const framework of ['react', 'solid'] as const) {
  for (const bundler of ['vite', 'rsbuild'] as const) {
    test(`@matrix builds, types and lints ${framework} ${bundler} with the Ultracite preset`, async ({ page }) => {
      const fixture = await createAppFixture({
        appName: `${framework}-${bundler}-ultracite`, framework, bundler,
        packageManager: bundler === 'vite' ? 'npm' : 'pnpm',
        toolchain: 'biome', addOnConfig: { biome: { preset: 'ultracite' } },
        runQualityGatesChecks: true,
        afterCreate: async (appDir) => {
          const pkg = JSON.parse(await readFile(join(appDir, 'package.json'), 'utf8'))
          expect(pkg.devDependencies.ultracite).toBe('8.3.1')
          expect(pkg.devDependencies['@biomejs/biome']).toBe('2.6.7')
          expect(pkg.devDependencies.oxlint).toBeUndefined()
          const config = JSON.parse(await readFile(join(appDir, 'biome.json'), 'utf8'))
          expect(config.extends).toEqual(['ultracite/biome/core', `ultracite/biome/${framework}`])
        },
      })
      const guards = attachRuntimeGuards(page, fixture.url)
      try {
        await execFileAsync('npm', ['run', 'lint'], { cwd: fixture.appDir })
        await optimizePageForFastE2E(page)
        await page.goto(fixture.url)
        await expect(page.getByRole('heading', { name: 'Start simple, ship quickly.' })).toBeVisible()
        await expect(page.getByText('Type-Safe Routing', { exact: true })).toBeVisible()
        guards.assertClean()
      } finally {
        guards.dispose()
        await fixture.stop()
        await fixture.cleanup()
      }
    })
  }
}
