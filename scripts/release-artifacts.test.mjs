import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { verifyReleaseArtifacts } from './verify-release-artifacts.mjs'

const pkg = { name: '@test/package', version: '1.0.0' }
const registryURL = 'https://registry.example'
const tarball = `${registryURL}/package.tgz`

async function archive(t, packed = pkg) {
  const dir = await mkdtemp(join(tmpdir(), 'release-test-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  await mkdir(join(dir, 'package'))
  await writeFile(join(dir, 'package/package.json'), JSON.stringify(packed))
  const path = join(dir, 'package.tgz')
  execFileSync('tar', ['-czf', path, '-C', dir, 'package/package.json'])
  const bytes = await readFile(path)
  return {
    bytes,
    integrity: `sha512-${createHash('sha512').update(bytes).digest('base64')}`,
  }
}

function options(fetchImpl) {
  let time = 0
  const sleeps = []
  return {
    registryURL,
    fetchImpl,
    timeoutMs: 100,
    pollMs: 10,
    log: () => {},
    now: () => time,
    sleep: async (ms) => {
      sleeps.push(ms)
      time += ms
    },
    sleeps,
  }
}

test('waits for metadata and the actual tarball, then verifies downloaded bytes', async (t) => {
  const fixture = await archive(t)
  let metadataReads = 0
  let tarballReads = 0
  const opts = options(async (url) => {
    if (String(url) === tarball) {
      tarballReads++
      return tarballReads === 1
        ? new Response('', { status: 404 })
        : new Response(fixture.bytes)
    }
    metadataReads++
    return metadataReads === 1
      ? new Response('', { status: 404 })
      : Response.json({
          ...pkg,
          dist: { tarball, integrity: fixture.integrity },
        })
  })
  const verified = await verifyReleaseArtifacts([pkg], opts)
  assert.equal(verified[0].integrity, fixture.integrity)
  assert.equal(verified[0].bytes, fixture.bytes.length)
  assert.equal(metadataReads, 3)
  assert.equal(tarballReads, 2)
  assert.deepEqual(opts.sleeps, [10, 10])
})

test('metadata alone cannot complete a release and timeout names the missing package', async (t) => {
  const fixture = await archive(t)
  const opts = options(async (url) =>
    String(url) === tarball
      ? new Response('', { status: 404 })
      : Response.json({
          ...pkg,
          dist: { tarball, integrity: fixture.integrity },
        }),
  )
  await assert.rejects(
    verifyReleaseArtifacts([pkg], opts),
    /Release is not ready: @test\/package@1.0.0/,
  )
})

test('rejects corrupt tarballs instead of retrying them as unavailable', async (t) => {
  const fixture = await archive(t)
  const opts = options(async (url) =>
    String(url) === tarball
      ? new Response('corrupt')
      : Response.json({
          ...pkg,
          dist: { tarball, integrity: fixture.integrity },
        }),
  )
  await assert.rejects(
    verifyReleaseArtifacts([pkg], opts),
    /integrity mismatch/,
  )
  assert.deepEqual(opts.sleeps, [])
})

test('rejects a validly hashed tarball containing the wrong package version', async (t) => {
  const fixture = await archive(t, { ...pkg, version: '0.9.0' })
  const opts = options(async (url) =>
    String(url) === tarball
      ? new Response(fixture.bytes)
      : Response.json({
          ...pkg,
          dist: { tarball, integrity: fixture.integrity },
        }),
  )
  await assert.rejects(
    verifyReleaseArtifacts([pkg], opts),
    /Packed identity mismatch/,
  )
})

test('honors rate limits without redownloading packages already verified', async (t) => {
  const fixture = await archive(t)
  const other = { name: '@test/other', version: '2.0.0' }
  const otherFixture = await archive(t, other)
  let firstDownloads = 0
  let otherReads = 0
  const opts = options(async (url) => {
    if (String(url) === tarball) {
      firstDownloads++
      return new Response(fixture.bytes)
    }
    if (String(url) === `${registryURL}/other.tgz`)
      return new Response(otherFixture.bytes)
    if (String(url).includes('other')) {
      otherReads++
      if (otherReads === 1)
        return new Response('', {
          status: 429,
          headers: { 'retry-after': '2' },
        })
      return Response.json({
        ...other,
        dist: {
          tarball: `${registryURL}/other.tgz`,
          integrity: otherFixture.integrity,
        },
      })
    }
    return Response.json({
      ...pkg,
      dist: { tarball, integrity: fixture.integrity },
    })
  })
  opts.timeoutMs = 5000
  assert.equal((await verifyReleaseArtifacts([pkg, other], opts)).length, 2)
  assert.equal(firstDownloads, 1)
  assert.equal(otherReads, 2)
  assert.deepEqual(opts.sleeps, [2000])
})

test('retries interrupted downloads but fails authentication errors immediately', async (t) => {
  const fixture = await archive(t)
  let downloads = 0
  const opts = options(async (url) => {
    if (String(url) === tarball) {
      downloads++
      if (downloads === 1)
        return new Response(
          new ReadableStream({
            start(controller) {
              controller.error(new TypeError('connection interrupted'))
            },
          }),
        )
      return new Response(fixture.bytes)
    }
    return Response.json({
      ...pkg,
      dist: { tarball, integrity: fixture.integrity },
    })
  })
  assert.equal((await verifyReleaseArtifacts([pkg], opts)).length, 1)
  assert.equal(downloads, 2)
  const denied = options(async () => new Response('', { status: 401 }))
  await assert.rejects(verifyReleaseArtifacts([pkg], denied), /HTTP 401/)
  assert.deepEqual(denied.sleeps, [])
})

test('rejects missing package output, unexpected registry identity and external tarball origins', async () => {
  await assert.rejects(
    verifyReleaseArtifacts(
      [],
      options(() => {}),
    ),
    /Expected published/,
  )
  await assert.rejects(
    verifyReleaseArtifacts(
      [pkg],
      options(async () => Response.json({ ...pkg, version: 'wrong' })),
    ),
    /Registry identity/,
  )
  await assert.rejects(
    verifyReleaseArtifacts(
      [pkg],
      options(async () =>
        Response.json({
          ...pkg,
          dist: {
            tarball: 'https://other.example/file.tgz',
            integrity: `sha512-${'A'.repeat(86)}==`,
          },
        }),
      ),
    ),
    /Unexpected tarball origin/,
  )
})
