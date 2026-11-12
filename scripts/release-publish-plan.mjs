import { execFileSync } from 'node:child_process'
import { appendFileSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const packageDirectories = [
  'packages/create',
  'packages/cli',
  'cli-aliases/create-start-app',
  'cli-aliases/create-tanstack',
  'cli-aliases/create-tanstack-app',
  'cli-aliases/create-tsrouter-app',
  'cli-aliases/ts-create-start',
]

export function planStableRelease(manifests, previous, changedPaths) {
  const changed = manifests.filter((pkg) => previous.get(pkg.dir)?.version !== pkg.version)
  if (!changed.length) return []

  const allowed = new Set(changed.flatMap(({ dir }) => [
    `${dir}/package.json`,
    `${dir}/CHANGELOG.md`,
  ]))
  for (const file of changedPaths) {
    if (!allowed.has(file) && !/^\.changeset\/[\w-]+\.md$/.test(file)) {
      throw new Error(`Stable version commit includes an unexpected file: ${file}`)
    }
  }
  for (const pkg of changed) {
    const { version: oldVersion, ...oldFields } = previous.get(pkg.dir) ?? {}
    const { version, dir, ...fields } = pkg
    if (!oldVersion || JSON.stringify(oldFields) !== JSON.stringify(fields)) {
      throw new Error(`Expected a version-only manifest change in ${dir}`)
    }
  }

  const byName = new Map(manifests.map((pkg, index) => [pkg.name, { pkg, index }]))
  if (byName.size !== manifests.length) throw new Error('Duplicate release package names')
  return manifests.map((pkg, index) => {
    const { name, version, dir } = pkg
    if (!/^(?:@[a-z0-9-]+\/)?[a-z0-9-]+$/.test(name) || !/^\d+\.\d+\.\d+$/.test(version)) {
      throw new Error(`Invalid stable package identity in ${dir}`)
    }
    const dependencies = {}
    for (const [dependency, range] of Object.entries(pkg.dependencies ?? {})) {
      const target = byName.get(dependency)
      if (!target) {
        if (range.startsWith('workspace:')) throw new Error(`Unknown release dependency: ${dependency}`)
        continue
      }
      if (target.index >= index || range !== 'workspace:*') {
        throw new Error(`Unexpected release dependency ${name} -> ${dependency}`)
      }
      dependencies[dependency] = target.pkg.version
    }
    return { name, version, dir, dependencies, changed: changed.includes(pkg) }
  })
}

export function shouldPublish(pkg, { attempted, registryStatus }) {
  if (registryStatus !== 200 && registryStatus !== 404) {
    throw new Error(`Cannot establish publication state for ${pkg.name}: HTTP ${registryStatus}`)
  }
  return pkg.changed && registryStatus === 404 && !attempted
}

export function priorPhaseWasReached(jobs, directory) {
  const release = jobs.find((job) => job.name === 'Release')
  if (!release) return false
  if (release.status !== 'completed') throw new Error('Prior release job state is unavailable')
  const name = `Publish and verify ${directory.split('/').at(-1)}`
  return release.steps.some((step) => step.name === name && step.conclusion !== 'skipped' && step.started_at !== null)
}

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()
const readManifest = (dir) => JSON.parse(readFileSync(`${dir}/package.json`, 'utf8'))
const output = (name, value) => appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`)

function assertCurrentVersionPlan(plan) {
  git('fetch', 'origin', 'refs/heads/main')
  for (const { name, version, dir } of plan) {
    const live = JSON.parse(git('show', `FETCH_HEAD:${dir}/package.json`))
    if (live.name !== name || live.version !== version) {
      throw new Error(`Stable release superseded for ${name}@${version}`)
    }
  }
}

async function run(command) {
  const { GITHUB_REPOSITORY: repo, GITHUB_REF: ref, GITHUB_SHA: sha, GITHUB_RUN_ID: runId } = process.env
  if (repo !== 'TanStack/cli' || ref !== 'refs/heads/main' || sha !== git('rev-parse', 'HEAD') || !/^\d+$/.test(runId ?? '')) {
    throw new Error('Stable publishing requires the checked-out TanStack/cli main workflow')
  }
  if (command === 'plan') {
    const publicDirectories = ['packages', 'cli-aliases'].flatMap((parent) =>
      readdirSync(parent, { withFileTypes: true }).filter((entry) => entry.isDirectory()).flatMap((entry) => {
        const dir = `${parent}/${entry.name}`
        try { return readManifest(dir).private ? [] : [dir] }
        catch (error) { if (error.code === 'ENOENT') return []; throw error }
      }),
    )
    if (publicDirectories.sort().join('\n') !== [...packageDirectories].sort().join('\n')) {
      throw new Error('Update the stable release phase list for the current public workspaces')
    }
    const manifests = packageDirectories.map((dir) => ({ ...readManifest(dir), dir }))
    const previous = new Map(packageDirectories.map((dir) => [dir, JSON.parse(git('show', `HEAD^:${dir}/package.json`))]))
    const paths = git('diff', '--name-only', 'HEAD^', 'HEAD').split('\n')
    const plan = planStableRelease(manifests, previous, paths)
    if (plan.length) assertCurrentVersionPlan(plan)
    output('active', String(plan.length > 0))
    output('packages', JSON.stringify(plan))
    return
  }

  const plan = JSON.parse(process.env.STABLE_RELEASE_PLAN)
  if (command === 'inspect') {
    const pkg = plan.find(({ dir }) => dir === process.env.RELEASE_PACKAGE_DIR)
    if (!pkg) throw new Error('Package is missing from the stable release plan')
    const manifest = readManifest(pkg.dir)
    if (manifest.name !== pkg.name || manifest.version !== pkg.version) throw new Error('Manifest identity changed')
    const marker = `npm-upload-${pkg.dir.replaceAll('/', '-')}-${pkg.version}-${sha}`
    const artifacts = JSON.parse(execFileSync('gh', ['api', `repos/${repo}/actions/runs/${runId}/artifacts?name=${marker}`], { encoding: 'utf8' }))
    const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg.name)}/${pkg.version}`, {
      headers: { 'cache-control': 'no-cache' },
      signal: AbortSignal.timeout(30_000),
    })
    if (response.ok) {
      const identity = await response.json()
      if (identity.name !== pkg.name || identity.version !== pkg.version) throw new Error('Registry identity mismatch')
    }
    if (!Number.isSafeInteger(artifacts.total_count) || artifacts.total_count < 0) {
      throw new Error('Upload attempt evidence is unavailable')
    }
    let attempted = artifacts.total_count > 0
    if (!attempted && response.status === 404 && pkg.changed) {
      const runAttempt = Number(process.env.GITHUB_RUN_ATTEMPT)
      if (!Number.isSafeInteger(runAttempt) || runAttempt < 1) throw new Error('Unknown workflow attempt')
      for (let attempt = 1; attempt < runAttempt && !attempted; attempt++) {
        const pages = JSON.parse(execFileSync('gh', [
          'api', '--paginate', '--slurp',
          `repos/${repo}/actions/runs/${runId}/attempts/${attempt}/jobs?per_page=100`,
        ], { encoding: 'utf8' }))
        attempted = priorPhaseWasReached(pages.flatMap((page) => page.jobs), pkg.dir)
      }
    }
    const publish = shouldPublish(pkg, { attempted, registryStatus: response.status })
    if (publish) assertCurrentVersionPlan(plan)
    const receipt = resolve(process.env.RUNNER_TEMP, `${marker}.json`)
    writeFileSync(receipt, JSON.stringify({ name: pkg.name, version: pkg.version, sha, runId }))
    output('publish', String(publish))
    output('marker', marker)
    output('receipt', receipt)
    output('package', JSON.stringify([pkg]))
    return
  }
  if (command === 'tags') {
    assertCurrentVersionPlan(plan)
    const refs = []
    for (const { name, version, changed } of plan) {
      if (!changed) continue
      const tag = `${name}@${version}`
      const ref = `refs/tags/${tag}`
      const existing = git('tag', '--list', tag)
      if (existing && git('rev-parse', `${ref}^{commit}`) !== sha) throw new Error(`Tag already points elsewhere: ${tag}`)
      if (!existing) git('tag', tag, sha)
      refs.push(`${ref}:${ref}`)
    }
    if (refs.length) execFileSync('git', ['push', '--atomic', 'origin', ...refs], { stdio: 'inherit' })
    output('published', String(refs.length > 0))
    return
  }
  throw new Error(`Unknown stable release command: ${command}`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await run(process.argv[2])
}
