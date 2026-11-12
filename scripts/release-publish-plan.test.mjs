import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { packageDirectories, planStableRelease, priorPhaseWasReached, shouldPublish } from './release-publish-plan.mjs'

const manifests = packageDirectories.map((dir) => ({ ...JSON.parse(readFileSync(`${dir}/package.json`, 'utf8')), dir }))
const previous = new Map(manifests.map(({ dir, ...pkg }) => [dir, { ...pkg, version: '0.0.0' }]))
const changed = packageDirectories.map((dir) => `${dir}/package.json`)

test('plans the real stable workspace graph in dependency order', () => {
  const plan = planStableRelease(manifests, previous, changed)
  const [core, cli, ...aliases] = plan
  assert.equal(core.name, '@tanstack/create')
  assert.deepEqual(core.dependencies, {})
  assert.deepEqual(cli.dependencies, { [core.name]: core.version })
  assert.equal(aliases.length, 5)
  for (const alias of aliases) assert.deepEqual(alias.dependencies, { [cli.name]: cli.version, [core.name]: core.version })
  const workflow = readFileSync('.github/workflows/release.yml', 'utf8')
  const directories = [...workflow.matchAll(/^          directory: (.+)$/gm)].map((match) => match[1])
  assert.deepEqual(directories, plan.map((pkg) => pkg.dir))
})

test('ordinary main changes cannot start publication', () => {
  const sameVersions = new Map(manifests.map(({ dir, ...pkg }) => [dir, pkg]))
  assert.deepEqual(planStableRelease(manifests, sameVersions, ['packages/cli/src/cli.ts']), [])
  assert.throws(() => planStableRelease(manifests, previous, [...changed, 'packages/cli/src/cli.ts']), /unexpected file/)
  const changedDependencies = new Map(previous)
  changedDependencies.set('packages/cli', { ...previous.get('packages/cli'), dependencies: {} })
  assert.throws(() => planStableRelease(manifests, changedDependencies, changed), /version-only/)
})

test('only an unattempted missing changed version may publish', () => {
  const [pkg] = planStableRelease(manifests, previous, changed)
  assert.equal(shouldPublish(pkg, { attempted: false, registryStatus: 404 }), true)
  assert.equal(shouldPublish(pkg, { attempted: true, registryStatus: 404 }), false)
  assert.equal(shouldPublish(pkg, { attempted: false, registryStatus: 200 }), false)
  assert.equal(shouldPublish({ ...pkg, changed: false }, { attempted: false, registryStatus: 404 }), false)
  assert.throws(() => shouldPublish(pkg, { attempted: false, registryStatus: 503 }), /publication state/)
})

test('reruns preserve the upload boundary when a prior artifact is missing', () => {
  const jobs = [{ name: 'Release', status: 'completed', steps: [
    { name: 'Publish and verify create', conclusion: 'failure' },
    { name: 'Publish and verify cli', conclusion: 'skipped' },
  ] }]
  assert.equal(priorPhaseWasReached(jobs, 'packages/create'), true)
  assert.equal(priorPhaseWasReached(jobs, 'packages/cli'), false)
  assert.equal(priorPhaseWasReached([], 'packages/create'), false)
  assert.throws(() => priorPhaseWasReached([{ name: 'Release', status: 'queued' }], 'packages/create'), /unavailable/)
})
