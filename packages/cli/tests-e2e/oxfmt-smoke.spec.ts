import { execFile } from 'node:child_process'
import { appendFile, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { expect, test } from '@playwright/test'
import { createAppFixture } from './helpers'

const runFile = promisify(execFile)
for (const framework of ['react', 'solid'] as const) {
  for (const mode of ['standard', 'blank', 'existing'] as const) {
    test(`@blocking formats a ${mode} ${framework} app with standalone Oxfmt`, async () => {
      const packageManager =
        mode === 'blank'
          ? 'npm'
          : mode === 'existing' && framework === 'react'
            ? 'bun'
            : 'pnpm'
      const fixture = await createAppFixture({
        appName: `${framework}-oxfmt-${mode}`,
        framework,
        bundler: mode === 'blank' ? 'rsbuild' : 'vite',
        blank: mode !== 'standard',
        ...(mode === 'existing'
          ? { postCreateAddOns: ['oxfmt'] }
          : { toolchain: 'oxfmt' }),
        packageManager,
        skipDevServer: true,
        runQualityGatesChecks: true,
      })
      const run = (script: string) =>
        runFile(packageManager, ['run', script], {
          cwd: fixture.appDir,
          timeout: 60_000,
        })
      try {
        const manifest = JSON.parse(
          await readFile(join(fixture.appDir, 'package.json'), 'utf8'),
        )
        expect(manifest.devDependencies.oxfmt).toBe('^0.77.0')
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
