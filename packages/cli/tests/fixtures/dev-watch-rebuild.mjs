import assert from 'node:assert/strict'
import { once } from 'node:events'
import fs from 'node:fs/promises'
import path from 'node:path'
import {
  createMemoryEnvironment,
  getFrameworkById,
  getFrameworks,
  registerFramework,
} from '@tanstack/create'
import { DevWatchManager } from '../../src/dev-watch.ts'

const root = process.argv[2]
assert.ok(root)
const watchPath = path.join(root, 'framework')
const targetDir = path.join(root, 'target')
await fs.mkdir(path.join(watchPath, 'project', 'base'), { recursive: true })
await fs.mkdir(targetDir)
const source = path.join(watchPath, 'project', 'base', 'marker.txt')
await fs.writeFile(
  path.join(watchPath, 'project', 'base', 'package.json'),
  '{}',
)
await fs.writeFile(source, 'initial')
registerFramework({
  id: 'watch-refresh',
  name: 'Watch refresh',
  description: 'Repeated edit fixture',
  version: '1.0.0',
  base: {},
  addOns: [],
  basePackageJSON: {},
  optionalPackages: {},
  supportedModes: {
    'file-router': {
      displayName: 'File router',
      description: '',
      forceTypescript: true,
    },
  },
})
const framework = getFrameworkById('watch-refresh')
const { environment } = createMemoryEnvironment()
const cliOptions = {
  projectName: 'watch-refresh',
  targetDir,
  framework,
  mode: 'file-router',
  typescript: true,
  tailwind: false,
  packageManager: 'npm',
  git: false,
  install: true,
  intent: false,
  chosenAddOns: [],
  addOnOptions: {},
}
const manager = new DevWatchManager({
  watchPath,
  targetDir,
  framework,
  cliOptions,
  packageManager: 'npm',
  environment,
})
try {
  await manager.start()
  // Wait for the underlying watcher before changing the fixture.
  await once(manager.watcher, 'ready')
  for (const value of ['first edit', 'second edit']) {
    await fs.writeFile(source, value)
    const deadline = Date.now() + 8000
    let content
    do {
      content = await fs
        .readFile(path.join(targetDir, 'marker.txt'), 'utf8')
        .catch(() => undefined)
      if (content === value) break
      await new Promise((resolve) => setTimeout(resolve, 50))
    } while (Date.now() < deadline)
    assert.equal(content, value)
  }
  assert.equal(
    getFrameworks().filter((item) => item.id === 'watch-refresh-updated')
      .length,
    1,
  )
  console.log('WATCH_REFRESH_VERIFIED')
} catch (error) {
  console.error(error)
} finally {
  // DevWatch shutdown exits the child, so the parent checks the success marker.
  await manager.stop()
}
