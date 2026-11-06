import assert from 'node:assert/strict'
import { test } from 'node:test'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, delimiter } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findReleaseForCommit, latestReleaseFlag } from './release-identity.mjs'

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
    `#!/usr/bin/env node\nconst a=process.argv.slice(2);if(a[0]==='api'&&a.includes('--paginate'))console.log(JSON.stringify([[{tag_name:'release-existing',html_url:'https://example.test/existing',body:'x'.repeat(1100000)}]]));else process.exit(99)\n`,
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

test('an older retry cannot replace a newer stable release as latest', () => {
  const checked = []
  assert.equal(
    latestReleaseFlag({
      requested: 'true',
      releaseHead: 'older',
      latestHead: 'newer',
      isAncestor: (a, b) => {
        checked.push([a, b])
        return true
      },
    }),
    '--latest=false',
  )
  assert.deepEqual(checked, [['older', 'newer']])
  assert.equal(
    latestReleaseFlag({
      requested: 'true',
      releaseHead: 'newer',
      latestHead: 'older',
      isAncestor: () => false,
    }),
    '--latest',
  )
  assert.equal(
    latestReleaseFlag({
      requested: 'false',
      releaseHead: 'head',
      isAncestor: () => {
        throw new Error('unexpected lookup')
      },
    }),
    '--latest=false',
  )
  assert.equal(latestReleaseFlag({ releaseHead: 'head' }), '')
})

test('the release command passes an explicit false latest flag for older retries', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'release-latest-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const older = 'a'.repeat(40)
  const newer = 'b'.repeat(40)
  const recorded = join(directory, 'release-arguments.json')
  const tagWrite = join(directory, 'tag-write')
  await writeFile(
    join(directory, 'git'),
    `#!/usr/bin/env node
const a=process.argv.slice(2)
if(a[0]==='log')console.log(a.includes('--format=%H')?'${older}':'')
else if(a[0]==='rev-parse'&&a[1]==='HEAD')console.log('${older}')
else if(a[0]==='rev-parse'&&a[1]==='--verify')console.log('${newer}')
else if(a[0]==='rev-parse')process.exit(1)
else if(a[0]==='merge-base')process.exit(0)
else if(a[0]==='tag'||a[0]==='push')require('node:fs').writeFileSync(${JSON.stringify(tagWrite)},'written')
else process.exit(99)
`,
    { mode: 0o755 },
  )
  await writeFile(
    join(directory, 'gh'),
    `#!/usr/bin/env node
const a=process.argv.slice(2)
if(a[0]==='api'&&a.includes('--paginate'))console.log(JSON.stringify([[{tag_name:'release-newer',draft:false,prerelease:false}]]))
else if(a[0]==='api'&&a[1].endsWith('/releases/latest')){if(process.env.FAIL_LATEST)process.exit(1);console.log(JSON.stringify({tag_name:'release-newer'}))}
else if(a[0]==='release'&&a[1]==='create')require('node:fs').writeFileSync(${JSON.stringify(recorded)},JSON.stringify(a))
else process.exit(99)
`,
    { mode: 0o755 },
  )
  for (const requested of ['--latest', '--latest=false']) {
    const result = spawnSync(
      process.execPath,
      [
        fileURLToPath(new URL('./create-github-release.mjs', import.meta.url)),
        requested,
      ],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          GH_TOKEN: '',
          GITHUB_TOKEN: '',
          PATH: `${directory}${delimiter}${process.env.PATH}`,
        },
      },
    )
    assert.equal(result.status, 0, result.stderr)
    const args = JSON.parse(await readFile(recorded, 'utf8'))
    assert.ok(args.includes('--latest=false'))
    assert.ok(!args.includes('--latest'))
  }
  await rm(tagWrite)
  const failedLookup = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL('./create-github-release.mjs', import.meta.url)),
      '--latest',
    ],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        GH_TOKEN: '',
        GITHUB_TOKEN: '',
        FAIL_LATEST: '1',
        PATH: `${directory}${delimiter}${process.env.PATH}`,
      },
    },
  )
  assert.notEqual(failedLookup.status, 0)
  await assert.rejects(readFile(tagWrite), { code: 'ENOENT' })
})
