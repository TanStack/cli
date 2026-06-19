import { afterEach, describe, expect, it, vi } from 'vitest'

const blockedModules = [
  'node:fs',
  'node:fs/promises',
  'node:path',
  'node:url',
  'execa',
]

describe('@tanstack/create/edge import', () => {
  afterEach(() => {
    for (const moduleName of blockedModules) {
      vi.doUnmock(moduleName)
    }
    vi.resetModules()
  })

  it('does not import Node-only modules', async () => {
    vi.resetModules()
    for (const moduleName of blockedModules) {
      vi.doMock(moduleName, () => {
        throw new Error(`${moduleName} is unavailable`)
      })
    }

    const edge = await import('../src/edge.js')

    expect(edge.getFrameworkById('react')?.id).toBe('react')
  })
})
