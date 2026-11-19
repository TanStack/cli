import assert from 'node:assert/strict'
import { once } from 'node:events'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import { syncBuiltinESMExports } from 'node:module'
import { tmpdir } from 'node:os'
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
if (process.argv[3] === 'fail') {
  const allocated = []
  const receipt = path.join(root, 'failed-paths.json')
  const original = fsSync.mkdtempSync
  fsSync.mkdtempSync = (...args) => {
    const directory = original(...args)
    if (directory.startsWith(path.join(tmpdir(), 'tanstack-dev-watch-'))) {
      allocated.push(directory)
      fsSync.writeFileSync(receipt, JSON.stringify(allocated))
    }
    return directory
  }
  // Removing a selected add-on from a watched framework fails after allocation.
  cliOptions.chosenAddOns = [{ id: 'removed-addon' }]
  try {
    await manager.start()
    await once(manager.watcher, 'ready')
    for (const value of ['first failed build', 'second failed build']) {
      const expected = manager.buildCount + 1
      await fs.writeFile(source, value)
      const deadline = Date.now() + 8000
      while (
        (manager.buildCount < expected || manager.isBuilding) &&
        Date.now() < deadline
      ) {
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
      assert.equal(manager.buildCount, expected)
      assert.equal(manager.isBuilding, false)
    }
    assert.equal(allocated.length, 2)
    for (const directory of allocated) {
      await assert.rejects(fs.access(directory), { code: 'ENOENT' })
    }
    assert.deepEqual(await fs.readdir(targetDir), [])
    await new Promise((resolve, reject) => {
      process.stdout.write('WATCH_FAILED_BUILD_CLEANUP_VERIFIED\n', (error) => {
        if (error) reject(error)
        else resolve()
      })
    })
  } catch (error) {
    console.error(error)
  } finally {
    await manager.stop()
  }
} else if (process.argv[3] === 'cancel') {
  const receipt = path.join(root, 'created-path')
  const originalAsync = fs.mkdtemp
  fs.mkdtemp = async (...args) => {
    const directory = await originalAsync(...args)
    await fs.writeFile(receipt, directory)
    await manager.stop()
    return await new Promise(() => {})
  }
  let allocatedDirectory
  let writing = false
  let observed = false
  let releaseWrite
  const writeGate = new Promise((resolve) => {
    releaseWrite = resolve
  })
  const originalSync = fsSync.mkdtempSync
  fsSync.mkdtempSync = (...args) => {
    allocatedDirectory = originalSync(...args)
    fsSync.writeFileSync(receipt, allocatedDirectory)
    return allocatedDirectory
  }
  const originalMkdir = fs.mkdir
  fs.mkdir = async (directory, ...args) => {
    if (allocatedDirectory && directory.startsWith(allocatedDirectory) && !observed) {
      observed = true
      writing = true
      void manager.stop()
      await writeGate
      try {
        return await originalMkdir(directory, ...args)
      } finally {
        writing = false
      }
    }
    return originalMkdir(directory, ...args)
  }
  syncBuiltinESMExports()
  const originalExit = process.exit
  process.exit = (code) => {
    assert.equal(observed, true, 'shutdown must exercise an in-flight write')
    assert.equal(writing, false, 'shutdown must let the in-flight write finish')
    originalExit(code)
  }
  await manager.start()
  await once(manager.watcher, 'ready')
  const closeWatcher = manager.watcher.close.bind(manager.watcher)
  manager.watcher.close = async () => {
    await closeWatcher()
    setImmediate(releaseWrite)
  }
  await fs.writeFile(source, 'cancel during a temporary directory write')
} else {
  try {
    await manager.start()
    // Wait for the underlying watcher before changing the fixture.
    await once(manager.watcher, 'ready')
    const temporaryDirectories = new Set()
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
      while (manager.isBuilding && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
      assert.equal(manager.isBuilding, false)
      assert.ok(manager.tempDir)
      assert.equal(
        await fs.realpath(path.dirname(manager.tempDir)),
        await fs.realpath(tmpdir()),
      )
      temporaryDirectories.add(manager.tempDir)
      await assert.rejects(fs.access(manager.tempDir), { code: 'ENOENT' })
    }
    assert.equal(temporaryDirectories.size, 2)
    assert.equal(
      getFrameworks().filter((item) => item.id === 'watch-refresh-updated')
        .length,
      1,
    )
    await new Promise((resolve, reject) => {
      process.stdout.write('WATCH_REFRESH_VERIFIED\n', (error) => {
        if (error) reject(error)
        else resolve()
      })
    })
  } catch (error) {
    console.error(error)
  } finally {
    // DevWatch shutdown exits the child, so the parent checks the success marker.
    await manager.stop()
  }
}
