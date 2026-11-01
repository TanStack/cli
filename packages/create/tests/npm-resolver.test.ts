import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolvePackageJSONLatest } from '../src/npm-resolver.js'

afterEach(() => vi.unstubAllGlobals())

describe('npm version resolution', () => {
  it('resolves the latest endpoint using its supported response format', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
        new Headers(init?.headers).get('Accept') === 'application/json'
          ? Response.json({ version: '1.168.60' })
          : new Response(null, { status: 406 }),
      ),
    )

    const project = await resolvePackageJSONLatest({
      dependencies: { '@tanstack/react-start': 'latest' },
    })

    expect(project.dependencies['@tanstack/react-start']).toBe('1.168.60')
  })

  it('uses a newly published version for the next generated project', async () => {
    let version = '1.168.59'
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ version })),
    )
    const template = {
      dependencies: { '@tanstack/react-start': 'latest', react: '^19.2.0' },
    }

    const beforeRelease = await resolvePackageJSONLatest(template)
    version = '1.168.60'
    const afterRelease = await resolvePackageJSONLatest(template)

    expect(beforeRelease.dependencies['@tanstack/react-start']).toBe('1.168.59')
    expect(afterRelease.dependencies['@tanstack/react-start']).toBe('1.168.60')
    expect(afterRelease.dependencies.react).toBe('^19.2.0')
    expect(template.dependencies['@tanstack/react-start']).toBe('latest')
  })
})
