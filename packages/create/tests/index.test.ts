import { readFile } from 'node:fs/promises'
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.doUnmock('memfs')
  vi.resetModules()
})

describe('index', () => {
  it('exports createApp', async () => {
    const { createApp } = await import('../src/index.js')

    expect(createApp).toBeDefined()
  })

  it('does not import the test-only memory filesystem', async () => {
    vi.resetModules()
    vi.doMock('memfs', () => {
      throw new Error('memfs is unavailable')
    })

    const { createApp } = await import('../src/index.js')

    expect(createApp).toBeDefined()
  })

  it('does not publish the test-only memory filesystem', async () => {
    const packageJSON = JSON.parse(
      await readFile(new URL('../package.json', import.meta.url), 'utf8'),
    )

    expect(packageJSON.dependencies).not.toHaveProperty('memfs')
    expect(packageJSON.devDependencies).toHaveProperty('memfs')
  })
})
