import { execFile } from 'node:child_process'
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { promisify } from 'node:util'

import { expect, test } from '@playwright/test'

import {
  attachRuntimeGuards,
  createReactAppFixture,
  getRepoPath,
  optimizePageForFastE2E,
} from './helpers'

const execFileAsync = promisify(execFile)

const expectedDependencies = [
  '@tanstack/react-router',
  '@tanstack/react-start',
  'react',
  'react-dom',
]

const expectedDevDependencies = [
  '@cloudflare/vite-plugin',
  '@tanstack/router-cli',
  '@types/node',
  '@types/react',
  '@types/react-dom',
  '@vitejs/plugin-react',
  'typescript',
  'vite',
  'wrangler',
]

async function listFiles(
  root: string,
  directory = root,
): Promise<Array<string>> {
  const files: Array<string> = []

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await listFiles(root, path)))
    } else {
      files.push(relative(root, path).replaceAll('\\', '/'))
    }
  }

  return files.sort()
}

test('@blocking refuses a non-empty target in non-interactive mode', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'tanstack-blank-collision-'))
  const targetDir = join(rootDir, 'existing-app')
  const sentinelPath = join(targetDir, 'keep.txt')

  try {
    await mkdir(targetDir)
    await writeFile(sentinelPath, 'keep me')

    let failure: unknown
    try {
      await execFileAsync(
        process.execPath,
        [
          getRepoPath('packages/cli/dist/index.js'),
          'create',
          'existing-app',
          '--blank',
          '-y',
          '--no-install',
          '--no-git',
        ],
        { cwd: rootDir, encoding: 'utf8' },
      )
    } catch (error) {
      failure = error
    }

    const commandError = failure as
      | (Error & { code?: number; stdout?: string; stderr?: string })
      | undefined
    expect(commandError?.code).toBe(1)
    expect(
      `${commandError?.stdout ?? ''}\n${commandError?.stderr ?? ''}`,
    ).toContain('Pass --force to continue non-interactively')
    await expect(readFile(sentinelPath, 'utf8')).resolves.toBe('keep me')
  } finally {
    await rm(rootDir, { recursive: true, force: true })
  }
})

test('@blocking creates a production-valid blank React app', async ({
  page,
}) => {
  const fixture = await createReactAppFixture({
    appName: 'react-blank-smoke-app',
    blank: true,
    deployment: 'cloudflare',
    packageManager: 'npm',
    runQualityGatesChecks: true,
    afterCreate: async (appDir) => {
      await access(join(appDir, 'package-lock.json'))
      await access(join(appDir, 'node_modules'))
      await access(join(appDir, 'wrangler.jsonc'))

      await expect(
        readFile(join(appDir, 'README.md'), 'utf8'),
      ).resolves.toContain('Deploy to Cloudflare Workers')

      const routeTreePath = join(appDir, 'src/routeTree.gen.ts')
      await access(routeTreePath)
      await expect(readFile(routeTreePath, 'utf8')).resolves.toContain(
        "from './routes/index'",
      )

      expect(await listFiles(join(appDir, 'src'))).toEqual([
        'routeTree.gen.ts',
        'router.tsx',
        'routes/__root.tsx',
        'routes/index.tsx',
        'styles.css',
      ])

      const packageJSON = JSON.parse(
        await readFile(join(appDir, 'package.json'), 'utf8'),
      ) as {
        scripts?: Record<string, string>
        dependencies?: Record<string, string>
        devDependencies?: Record<string, string>
      }

      expect(Object.keys(packageJSON.dependencies ?? {}).sort()).toEqual(
        expectedDependencies,
      )
      expect(Object.keys(packageJSON.devDependencies ?? {}).sort()).toEqual(
        expectedDevDependencies,
      )
      expect(packageJSON.scripts).toEqual({
        dev: 'vite dev --port 3000',
        'generate-routes': 'tsr generate',
        build: 'vite build',
        preview: 'vite preview',
        deploy: 'npm run build && wrangler deploy',
      })

      for (const excludedPath of [
        'index.html',
        'public',
        'src/App.test.tsx',
        'src/components',
        'src/main.tsx',
        'src/routes/about.tsx',
      ]) {
        await expect(access(join(appDir, excludedPath))).rejects.toThrow()
      }
    },
  })
  const guards = attachRuntimeGuards(page, fixture.url)

  try {
    const response = await fetch(fixture.url)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')

    const html = await response.text()
    expect(html).toContain('Welcome to TanStack Start')
    expect(html).toContain('src/routes/index.tsx')

    await optimizePageForFastE2E(page)
    await page.goto(fixture.url)
    await expect(
      page.getByRole('heading', { name: 'Welcome to TanStack Start' }),
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
