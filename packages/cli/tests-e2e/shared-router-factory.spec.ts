import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import {
  attachRuntimeGuards,
  createAppFixture,
  optimizePageForFastE2E,
} from './helpers'

for (const framework of ['react', 'solid'] as const) {
  test(`@matrix applies the ${framework} router-only factory configuration`, async ({
    page,
  }) => {
    const fixture = await createAppFixture({
      appName: `${framework}-shared-router`,
      framework,
      routerOnly: true,
      runQualityGatesChecks: true,
      afterCreate: async (appDir) => {
        const path = join(appDir, 'src/router.tsx')
        const content = await readFile(path, 'utf8')
        await writeFile(
          path,
          content.replace(
            'routeTree,',
            'routeTree,\n defaultNotFoundComponent: () => <h1>Factory configuration is active</h1>,',
          ),
        )
      },
    })
    const guards = attachRuntimeGuards(page, fixture.url)
    try {
      await optimizePageForFastE2E(page)
      await page.goto(`${fixture.url}/factory-check`)
      await expect(
        page.getByRole('heading', { name: 'Factory configuration is active' }),
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
  test(`@matrix adds Query to a ${framework} router-only app`, async ({
    page,
  }) => {
    const fixture = await createAppFixture({
      appName: `${framework}-router-query`,
      framework,
      routerOnly: true,
      postCreateAddOns: ['tanstack-query'],
      runQualityGatesChecks: true,
      afterCreate: async (appDir) => {
        const queryImport = framework === 'react' ? 'useQuery' : 'createQuery'
        const options = `{ queryKey: ['factory-check'], queryFn: () => Promise.resolve('Alice') }`
        const query = framework === 'react'
          ? `useQuery(${options})`
          : `createQuery(() => (${options}))`
        await writeFile(join(appDir, 'src/routes/query-check.tsx'), `
import { createFileRoute } from '@tanstack/${framework}-router'
import { ${queryImport} } from '@tanstack/${framework}-query'
export const Route = createFileRoute('/query-check')({ component: QueryCheck })
function QueryCheck() {
  const result = ${query}
  return <h1>{result.data}</h1>
}
`)
      },
    })
    const guards = attachRuntimeGuards(page, fixture.url)
    try {
      await optimizePageForFastE2E(page)
      await page.goto(`${fixture.url}/query-check`)
      await expect(page.getByText('Alice', { exact: true })).toBeVisible()
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
