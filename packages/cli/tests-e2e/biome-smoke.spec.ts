import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { test } from '@playwright/test'
import { createReactAppFixture } from './helpers'

const execFileAsync = promisify(execFile)

for (const framework of ['react', 'solid'] as const) {
  for (const blank of [false, true]) {
    test(`@blocking lints a ${blank ? 'blank' : 'standard'} ${framework} Biome app`, async () => {
      const fixture = await createReactAppFixture({
        appName: `${framework}-biome-${blank ? 'blank' : 'standard'}`,
        framework,
        blank,
        toolchain: 'biome',
        packageManager: 'pnpm',
        skipDevServer: true,
        runQualityGatesChecks: true,
      })
      try {
        await execFileAsync('pnpm', ['run', 'lint'], {
          cwd: fixture.appDir,
          timeout: 60_000,
        })
      } finally {
        await fixture.stop()
        await fixture.cleanup()
      }
    })
  }
}
