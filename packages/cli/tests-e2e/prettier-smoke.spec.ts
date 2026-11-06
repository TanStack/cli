import { execFile } from 'node:child_process'
import { appendFile, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { expect, test } from '@playwright/test'
import { createReactAppFixture } from './helpers'

const execFileAsync = promisify(execFile)

for (const framework of ['react', 'solid'] as const) {
  for (const mode of ['standard', 'blank', 'existing'] as const) {
    test(`@blocking formats a ${mode} ${framework} app with standalone Prettier`, async () => {
      const packageManager = mode === 'blank' ? 'npm' : 'pnpm'
      const fixture = await createReactAppFixture({
        appName: `${framework}-prettier-${mode}`,
        framework,
        bundler: mode === 'blank' ? 'rsbuild' : 'vite',
        blank: mode !== 'standard',
        ...(mode === 'existing'
          ? { postCreateAddOns: ['prettier'] }
          : { toolchain: 'prettier' }),
        packageManager,
        skipDevServer: true,
        runQualityGatesChecks: true,
      })
      const run = (script: string) =>
        execFileAsync(packageManager, ['run', script], {
          cwd: fixture.appDir,
          timeout: 60_000,
        })
      try {
        const manifest = JSON.parse(
          await readFile(join(fixture.appDir, 'package.json'), 'utf8'),
        )
        expect(manifest.devDependencies.prettier).toBe('^3.8.1')
        expect(manifest.devDependencies.eslint).toBeUndefined()
        expect(manifest.devDependencies['@biomejs/biome']).toBeUndefined()
        expect(manifest.scripts.lint).toBeUndefined()
        await run('format')
        await run('check')
        await appendFile(join(fixture.appDir, 'src/routes/index.tsx'), '\n\n\n')
        await expect(run('check')).rejects.toMatchObject({ code: 1 })
        await run('format')
        await run('check')
      } finally {
        await fixture.stop()
        await fixture.cleanup()
      }
    })
  }
}
