import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  chmod,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises'
import { delimiter, dirname, join } from 'node:path'
import { tmpdir } from 'node:os'

import { createDefaultEnvironment } from '../src/environment.js'

let directory: string | undefined
let pidFile: string | undefined
let probePending = false

async function installShim(body: string) {
  directory = await mkdtemp(join(tmpdir(), 'tanstack-version-probe-'))
  pidFile = join(directory, 'probe.pid')
  const script = join(directory, 'pnpm')
  const contents = [
    '#!/usr/bin/env node',
    "import { writeFileSync } from 'node:fs'",
    'writeFileSync(' + JSON.stringify(pidFile) + ', String(process.pid))',
    'writeFileSync(' +
      JSON.stringify(join(directory, 'cwd')) +
      ', process.cwd())',
    body,
  ].join('\n')
  await writeFile(join(directory, 'package.json'), '{"type":"module"}')
  await writeFile(script, contents)
  await chmod(script, 0o755)
  if (process.platform === 'win32') {
    await writeFile(
      join(directory, 'pnpm.cmd'),
      '@"' + process.execPath + '" "' + script + '" %*\r\n',
    )
  }
  vi.stubEnv(
    'PATH',
    [directory, dirname(process.execPath), process.env.PATH ?? ''].join(
      delimiter,
    ),
  )
  return directory
}

afterEach(async () => {
  vi.unstubAllEnvs()
  if (pidFile && probePending) {
    try {
      const pid = Number(await readFile(pidFile, 'utf8'))
      // Clean up only the child created by this fixture if an assertion failed.
      try {
        process.kill(pid, 'SIGKILL')
      } catch {}
    } catch {}
  }
  if (directory) await rm(directory, { recursive: true, force: true })
  directory = undefined
  pidFile = undefined
})

async function probe(
  environment: ReturnType<typeof createDefaultEnvironment>,
  cwd: string,
) {
  probePending = true
  try {
    return await environment.getPackageManagerVersion?.('pnpm', cwd)
  } finally {
    probePending = false
  }
}

describe('package-manager version subprocess', () => {
  it('reads and trims the version in the target project', async () => {
    const cwd = await installShim(
      "process.stdout.write(' 10.2.0 ' + String.fromCharCode(10))",
    )
    const environment = createDefaultEnvironment()
    await expect(probe(environment, cwd)).resolves.toBe('10.2.0')
    expect(await readFile(join(cwd, 'cwd'), 'utf8')).toBe(await realpath(cwd))
    expect(environment.getErrors()).toEqual([])
  })

  it('stops a stalled optional probe and keeps the unknown-version fallback', async () => {
    const cwd = await installShim('setInterval(() => {}, 1000)')
    const environment = createDefaultEnvironment()
    await expect(probe(environment, cwd)).resolves.toBeUndefined()
    const pid = Number(await readFile(join(cwd, 'probe.pid'), 'utf8'))
    expect(() => process.kill(pid, 0)).toThrow()
    expect(environment.getErrors()).toEqual([])
  }, 30_000)
})
