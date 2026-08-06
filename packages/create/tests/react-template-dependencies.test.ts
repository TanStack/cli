import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const reactRoot = fileURLToPath(
  new URL('../src/frameworks/react', import.meta.url),
)

interface PackageManifest {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

function readJson<T>(path: string) {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function importsLucide(path: string): boolean {
  if (!existsSync(path)) return false

  return readdirSync(path).some((entry) => {
    const entryPath = join(path, entry)
    if (statSync(entryPath).isDirectory()) return importsLucide(entryPath)
    if (!/\.[cm]?[jt]sx?$/.test(entry)) return false

    return /from\s+['"]lucide-react['"]/.test(readFileSync(entryPath, 'utf8'))
  })
}

function lucideConsumers(group: 'add-ons' | 'examples') {
  const groupRoot = join(reactRoot, group)

  return readdirSync(groupRoot)
    .map((name) => join(groupRoot, name))
    .filter((path) => statSync(path).isDirectory())
    .filter((path) => importsLucide(join(path, 'assets')))
}

describe('React template dependency ownership', () => {
  it('does not install Lucide in the base or Tailwind profile', () => {
    const base = readJson<PackageManifest>(
      join(reactRoot, 'project/base/package.json'),
    )
    const profiles = readJson<{
      tailwindcss?: { dependencies?: Record<string, string> }
    }>(join(reactRoot, 'project/packages.json'))

    expect(base.dependencies?.['lucide-react']).toBeUndefined()
    expect(profiles.tailwindcss?.dependencies?.['lucide-react']).toBeUndefined()
  })

  it.each([...lucideConsumers('add-ons'), ...lucideConsumers('examples')])(
    '%s declares Lucide when its emitted source imports it',
    (consumerPath) => {
      const manifest = readJson<PackageManifest>(
        join(consumerPath, 'package.json'),
      )
      const dependencies = {
        ...manifest.dependencies,
        ...manifest.devDependencies,
      }

      expect(dependencies['lucide-react']).toBeDefined()
    },
  )
})
