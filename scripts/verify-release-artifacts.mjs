import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

class NotAvailable extends Error {
  constructor(message, retryAfterMs = 0) {
    super(message)
    this.retryAfterMs = retryAfterMs
  }
}

async function fetchAvailable(url, fetchImpl, requestTimeoutMs) {
  let response
  try {
    response = await fetchImpl(url, {
      signal: AbortSignal.timeout(requestTimeoutMs),
    })
  } catch (error) {
    throw new NotAvailable(`${url}: ${error.message}`)
  }
  if (
    response.status === 404 ||
    response.status === 429 ||
    response.status >= 500
  ) {
    const retryAfter = response.headers.get('retry-after')
    const retryAfterMs =
      retryAfter && /^\d+$/.test(retryAfter)
        ? Number(retryAfter) * 1000
        : retryAfter
          ? Math.max(0, Date.parse(retryAfter) - Date.now())
          : 0
    await response.body?.cancel()
    throw new NotAvailable(`${url}: HTTP ${response.status}`, retryAfterMs)
  }
  if (!response.ok) {
    await response.body?.cancel()
    throw new Error(`${url}: HTTP ${response.status}`)
  }
  return response
}

async function verifyPackage(pkg, { registry, fetchImpl, requestTimeoutMs }) {
  const metadataURL = `${registry.origin}/${encodeURIComponent(pkg.name)}/${encodeURIComponent(pkg.version)}`
  const metadataResponse = await fetchAvailable(
    metadataURL,
    fetchImpl,
    requestTimeoutMs,
  )
  let metadata
  try {
    metadata = await metadataResponse.json()
  } catch (error) {
    throw new NotAvailable(`${metadataURL}: ${error.message}`)
  }
  if (metadata.name !== pkg.name || metadata.version !== pkg.version) {
    throw new Error(`Registry identity mismatch for ${pkg.name}@${pkg.version}`)
  }
  const integrity = metadata.dist?.integrity
    ?.split(/\s+/)
    .find((value) => /^sha512-[A-Za-z0-9+/]+={0,2}$/.test(value))
  if (!integrity)
    throw new Error(`Missing SHA512 integrity for ${pkg.name}@${pkg.version}`)
  const tarballURL = new URL(metadata.dist.tarball)
  if (tarballURL.origin !== registry.origin) {
    throw new Error(`Unexpected tarball origin for ${pkg.name}@${pkg.version}`)
  }
  const response = await fetchAvailable(tarballURL, fetchImpl, requestTimeoutMs)
  if (!response.body)
    throw new Error(`Empty tarball for ${pkg.name}@${pkg.version}`)
  const directory = await mkdtemp(join(tmpdir(), 'tanstack-release-'))
  const archive = join(directory, 'package.tgz')
  const hash = createHash('sha512')
  let bytes = 0
  try {
    try {
      await pipeline(
        Readable.fromWeb(response.body),
        new Transform({
          transform(chunk, _encoding, callback) {
            hash.update(chunk)
            bytes += chunk.length
            callback(null, chunk)
          },
        }),
        createWriteStream(archive),
      )
    } catch (error) {
      if (
        error instanceof TypeError ||
        ['AbortError', 'TimeoutError'].includes(error.name)
      ) {
        throw new NotAvailable(
          `Tarball download interrupted for ${pkg.name}@${pkg.version}: ${error.message}`,
        )
      }
      throw error
    }
    if (`sha512-${hash.digest('base64')}` !== integrity) {
      throw new Error(
        `Tarball integrity mismatch for ${pkg.name}@${pkg.version}`,
      )
    }
    const packed = JSON.parse(
      execFileSync('tar', ['-xOzf', archive, 'package/package.json'], {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024,
      }),
    )
    if (packed.name !== pkg.name || packed.version !== pkg.version) {
      throw new Error(`Packed identity mismatch for ${pkg.name}@${pkg.version}`)
    }
    return { ...pkg, integrity, bytes }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

export async function verifyReleaseArtifacts(
  packages,
  {
    registryURL = 'https://registry.npmjs.org',
    fetchImpl = fetch,
    now = Date.now,
    sleep = (ms) => new Promise((done) => setTimeout(done, ms)),
    timeoutMs = 20 * 60 * 1000,
    pollMs = 15 * 1000,
    log = console.log,
  } = {},
) {
  if (
    !Array.isArray(packages) ||
    !packages.length ||
    packages.some(
      (pkg) =>
        !pkg ||
        typeof pkg.name !== 'string' ||
        !pkg.name ||
        typeof pkg.version !== 'string' ||
        !pkg.version,
    )
  ) {
    throw new Error('Expected published package names and versions')
  }
  if (
    !Number.isFinite(timeoutMs) ||
    timeoutMs <= 0 ||
    !Number.isFinite(pollMs) ||
    pollMs <= 0
  ) {
    throw new Error('Verification timeout and poll interval must be positive')
  }
  const registry = new URL(registryURL)
  if (registry.protocol !== 'https:')
    throw new Error('The registry must use HTTPS')
  const deadline = now() + timeoutMs
  const pending = new Map(
    packages.map((pkg) => [`${pkg.name}@${pkg.version}`, pkg]),
  )
  const verified = []
  let lastReasons = []
  while (pending.size) {
    let retryAfterMs = pollMs
    lastReasons = []
    for (const [id, pkg] of pending) {
      if (now() >= deadline) break
      try {
        const receipt = await verifyPackage(pkg, {
          registry,
          fetchImpl,
          requestTimeoutMs: Math.max(1, Math.min(30_000, deadline - now())),
        })
        verified.push(receipt)
        pending.delete(id)
        log(
          `Verified ${id}: SHA512 and packed identity (${receipt.bytes} bytes)`,
        )
      } catch (error) {
        if (!(error instanceof NotAvailable)) throw error
        retryAfterMs = Math.max(retryAfterMs, error.retryAfterMs || 0)
        lastReasons.push(`${id}: ${error.message}`)
      }
    }
    if (!pending.size) return verified
    const remaining = deadline - now()
    if (remaining <= 0 || retryAfterMs > remaining) break
    log(`Waiting for npm availability: ${lastReasons.join('; ')}`)
    await sleep(retryAfterMs)
  }
  throw new Error(
    `Release is not ready: ${[...pending.keys()].join(', ')}. ${lastReasons.join('; ')}. The version may still be scanned or staged. Rerun this verification job after availability changes, without rerunning the publisher.`,
  )
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    await verifyReleaseArtifacts(
      JSON.parse(process.env.PUBLISHED_PACKAGES || 'null'),
    )
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
