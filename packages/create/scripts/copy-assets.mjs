import { cpSync, existsSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const frameworks = ['react', 'solid']
const assetDirectories = [
  'add-ons',
  'toolchains',
  'hosts',
  'examples',
  'project',
]

for (const framework of frameworks) {
  for (const directory of assetDirectories) {
    const source = resolve(
      packageRoot,
      'src/frameworks',
      framework,
      directory,
    )
    const destination = resolve(
      packageRoot,
      'dist/frameworks',
      framework,
      directory,
    )

    rmSync(destination, { recursive: true, force: true })
    if (existsSync(source)) {
      cpSync(source, destination, { recursive: true })
    }
  }
}
