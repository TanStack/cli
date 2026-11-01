import assert from 'node:assert/strict'
import { test } from 'node:test'
import { spawnSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, delimiter } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findReleaseForCommit } from './release-identity.mjs'

test('finds an existing combined release by its peeled source commit', async () => {
  const releases = [
    { tag_name: '@tanstack/cli@1.0.0' },
    { tag_name: 'release-newer', html_url: 'newer' },
    { tag_name: 'release-original', html_url: 'existing' },
  ]
  const checked = []
  const found = await findReleaseForCommit(releases, 'target', (tag) => {
    checked.push(tag)
    return tag === 'release-original' ? 'target' : 'other'
  })
  assert.equal(found.html_url, 'existing')
  assert.deepEqual(checked, ['release-newer', 'release-original'])
})

test('does not mistake a different source commit for the requested release', async () => {
  assert.equal(
    await findReleaseForCommit(
      [{ tag_name: 'release-old' }],
      'new',
      () => 'old',
    ),
    null,
  )
})

test('retains matching drafts so the caller can preserve their publication hold', async () => {
  const draft = { tag_name: 'release-draft', draft: true }
  assert.equal(
    await findReleaseForCommit([draft], 'target', () => 'target'),
    draft,
  )
})

test('does not silently create another release when tag resolution fails', async () => {
  await assert.rejects(
    findReleaseForCommit([{ tag_name: 'release-old' }], 'target', () => {
      throw new Error('tag lookup failed')
    }),
    /tag lookup failed/,
  )
})

test('the release command stops before any write when its source already has a release', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'release-command-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const commit = 'a'.repeat(40)
  const git = join(directory, 'git')
  const gh = join(directory, 'gh')
  await writeFile(
    git,
    `#!/usr/bin/env node\nconst a=process.argv.slice(2);if(a[0]==='log'||a[0]==='rev-parse')console.log('${commit}');else process.exit(99)\n`,
    { mode: 0o755 },
  )
  await writeFile(
    gh,
    `#!/usr/bin/env node\nconst a=process.argv.slice(2);if(a[0]==='api'&&a.includes('--paginate'))console.log(JSON.stringify([[{tag_name:'release-existing',html_url:'https://example.test/existing'}]]));else process.exit(99)\n`,
    { mode: 0o755 },
  )
  const result = spawnSync(
    process.execPath,
    [fileURLToPath(new URL('./create-github-release.mjs', import.meta.url))],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${directory}${delimiter}${process.env.PATH}`,
      },
    },
  )
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /Release already exists/)
  assert.match(result.stdout, /https:\/\/example.test\/existing/)
})
