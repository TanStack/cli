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
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'

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
  if (directory) {
    try {
      const pid = Number(
        await readFile(join(directory, 'descendant.pid'), 'utf8'),
      )
      try {
        process.kill(pid, 'SIGKILL')
      } catch {}
    } catch {}
    await rm(directory, { recursive: true, force: true })
  }
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
  it('terminates descendants holding the probe pipes open', async () => {
    const cwd = await installShim(
      "const { spawn } = await import('node:child_process');" +
        "const child = spawn(process.execPath, ['-e', " +
        JSON.stringify(
          "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)",
        ) +
        "], { stdio: ['ignore', 'inherit', 'inherit'] });" +
        "writeFileSync('descendant.pid', String(child.pid)); setInterval(() => {}, 1000)",
    )
    const environment = createDefaultEnvironment()
    const started = Date.now()
    await expect(probe(environment, cwd)).resolves.toBeUndefined()
    expect(Date.now() - started).toBeLessThan(23_000)
    const pid = Number(await readFile(join(cwd, 'descendant.pid'), 'utf8'))
    await expect
      .poll(
        () => {
          try {
            process.kill(pid, 0)
            return false
          } catch {
            return true
          }
        },
        { timeout: 2_000 },
      )
      .toBe(true)
    // Remove the receipt so cleanup cannot target a later reused PID.
    await rm(join(cwd, 'descendant.pid'))
    expect(environment.getErrors()).toEqual([])
  }, 30_000)

  it('cancels the owned probe tree before returning the fallback', async () => {
    const cwd = await installShim(
      "const { spawn } = await import('node:child_process');" +
        "const child = spawn(process.execPath, ['-e', " +
        JSON.stringify(
          "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)",
        ) +
        "], { stdio: ['ignore', 'inherit', 'inherit'] });" +
        "writeFileSync('descendant.pid', String(child.pid)); setInterval(() => {}, 1000)",
    )
    const controller = new AbortController()
    const environment = createDefaultEnvironment(controller.signal)
    const pending = probe(environment, cwd)
    await expect
      .poll(
        async () => {
          try {
            await readFile(join(cwd, 'descendant.pid'), 'utf8')
            return true
          } catch {
            return false
          }
        },
        { timeout: 5_000 },
      )
      .toBe(true)
    const descendant = Number(
      await readFile(join(cwd, 'descendant.pid'), 'utf8'),
    )
    const started = Date.now()
    controller.abort()
    await expect(pending).resolves.toBeUndefined()
    expect(Date.now() - started).toBeLessThan(7_000)
    await expect
      .poll(
        () => {
          try {
            process.kill(descendant, 0)
            return false
          } catch {
            return true
          }
        },
        { timeout: 2_000 },
      )
      .toBe(true)
    await rm(join(cwd, 'descendant.pid'))
    expect(environment.getErrors()).toEqual([])
  }, 25_000)

  it.skipIf(process.platform === 'win32')(
    'cleans up the group when the calling process exits',
    async () => {
      const cwd = await installShim(
        "const { spawn } = await import('node:child_process');" +
          "const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: ['ignore', 'inherit', 'inherit'] });" +
          "writeFileSync('descendant.pid', String(child.pid)); setInterval(() => {}, 1000)",
      )
      const entry = new URL('../src/environment.ts', import.meta.url).href
      const receipt = join(cwd, 'descendant.pid')
      probePending = true
      const caller = spawn(
        process.execPath,
        [
          '--import',
          import.meta.resolve('tsx'),
          '--input-type=module',
          '-e',
          `
      import { existsSync } from 'node:fs'
      const { createDefaultEnvironment } = await import(${JSON.stringify(entry)})
      void createDefaultEnvironment().getPackageManagerVersion('pnpm', ${JSON.stringify(cwd)})
      setInterval(() => { if (existsSync(${JSON.stringify(receipt)})) process.exit(0) }, 20)
    `,
        ],
        { cwd, stdio: 'ignore' },
      )
      try {
        await new Promise<void>((resolveExit, reject) => {
          const timer = setTimeout(() => {
            caller.kill('SIGKILL')
            reject(new Error('Caller did not finish its fixture'))
          }, 5_000)
          caller.once('error', (error) => {
            clearTimeout(timer)
            reject(error)
          })
          caller.once('exit', (code) => {
            clearTimeout(timer)
            if (code === 0) resolveExit()
            else reject(new Error(`Caller exit ${code}`))
          })
        })
        const pids = [
          Number(await readFile(join(cwd, 'probe.pid'), 'utf8')),
          Number(await readFile(receipt, 'utf8')),
        ]
        for (const pid of pids) {
          await expect
            .poll(
              () => {
                try {
                  process.kill(pid, 0)
                  return false
                } catch {
                  return true
                }
              },
              { timeout: 2_000 },
            )
            .toBe(true)
        }
        await rm(receipt)
        probePending = false
      } finally {
        caller.kill('SIGKILL')
      }
    },
    15_000,
  )

  it.skipIf(process.platform === 'win32')(
    'stops descendants after the shim has exited without signalling an old group ID',
    async () => {
      const cwd = await installShim(
        "const { spawn } = await import('node:child_process');" +
          "const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: ['ignore', 'inherit', 'inherit'] });" +
          "writeFileSync('descendant.pid', String(child.pid)); process.exit(0)",
      )
      const controller = new AbortController()
      const pending = probe(createDefaultEnvironment(controller.signal), cwd)
      await expect
        .poll(
          async () => {
            try {
              const pid = Number(await readFile(join(cwd, 'probe.pid'), 'utf8'))
              process.kill(pid, 0)
              return false
            } catch {
              return existsSync(join(cwd, 'descendant.pid'))
            }
          },
          { timeout: 5_000 },
        )
        .toBe(true)
      const kill = vi.spyOn(process, 'kill')
      try {
        controller.abort()
        await expect(pending).resolves.toBeUndefined()
        expect(kill.mock.calls.some(([pid]) => pid < 0)).toBe(false)
      } finally {
        kill.mockRestore()
      }
      const descendant = Number(
        await readFile(join(cwd, 'descendant.pid'), 'utf8'),
      )
      await expect
        .poll(
          () => {
            try {
              process.kill(descendant, 0)
              return false
            } catch {
              return true
            }
          },
          { timeout: 2_000 },
        )
        .toBe(true)
      await rm(join(cwd, 'descendant.pid'))
    },
    15_000,
  )

  it.skipIf(process.platform === 'win32')(
    'resumes a stopped supervisor so cancellation can clean up its group',
    async () => {
      const cwd = await installShim(
        "const { spawn } = await import('node:child_process');" +
          "const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: ['ignore', 'inherit', 'inherit'] });" +
          "writeFileSync('descendant.pid', String(child.pid));" +
          "process.kill(process.ppid, 'SIGSTOP');" +
          "writeFileSync('supervisor.pid', String(process.ppid)); setInterval(() => {}, 1000)",
      )
      const controller = new AbortController()
      const pending = probe(createDefaultEnvironment(controller.signal), cwd)
      await expect
        .poll(() => existsSync(join(cwd, 'supervisor.pid')), { timeout: 5_000 })
        .toBe(true)
      const supervisor = Number(
        await readFile(join(cwd, 'supervisor.pid'), 'utf8'),
      )
      let timer: ReturnType<typeof setTimeout> | undefined
      try {
        controller.abort()
        await expect(
          Promise.race([
            pending,
            new Promise((_, reject) => {
              timer = setTimeout(
                () =>
                  reject(new Error('Stopped supervisor blocked cancellation')),
                2_000,
              )
            }),
          ]),
        ).resolves.toBeUndefined()
      } finally {
        clearTimeout(timer)
        // Recover only this fixture if the regression leaves its owner stopped.
        try {
          process.kill(supervisor, 'SIGCONT')
        } catch {}
        await pending
      }
      const descendant = Number(
        await readFile(join(cwd, 'descendant.pid'), 'utf8'),
      )
      await expect
        .poll(
          () => {
            try {
              process.kill(descendant, 0)
              return false
            } catch {
              return true
            }
          },
          { timeout: 2_000 },
        )
        .toBe(true)
      await rm(join(cwd, 'descendant.pid'))
    },
    15_000,
  )

  it('does not launch a probe after cancellation', async () => {
    const cwd = await installShim('setInterval(() => {}, 1000)')
    const controller = new AbortController()
    controller.abort()
    await expect(
      probe(createDefaultEnvironment(controller.signal), cwd),
    ).resolves.toBeUndefined()
    await expect(readFile(join(cwd, 'probe.pid'), 'utf8')).rejects.toThrow()
  })

  it('reads and trims the version in the target project', async () => {
    const cwd = await installShim(
      "process.stdout.write(' 10.2.0 ' + String.fromCharCode(10))",
    )
    const environment = createDefaultEnvironment()
    await expect(probe(environment, cwd)).resolves.toBe('10.2.0')
    expect(await realpath(await readFile(join(cwd, 'cwd'), 'utf8'))).toBe(
      await realpath(cwd),
    )
    expect(environment.getErrors()).toEqual([])
  })

  it('stops a stalled optional probe and keeps the unknown-version fallback', async () => {
    const cwd = await installShim('setInterval(() => {}, 1000)')
    const environment = createDefaultEnvironment()
    await expect(probe(environment, cwd)).resolves.toBeUndefined()
    const pid = Number(await readFile(join(cwd, 'probe.pid'), 'utf8'))
    await expect
      .poll(
        () => {
          try {
            process.kill(pid, 0)
            return false
          } catch {
            return true
          }
        },
        { timeout: 2_000 },
      )
      .toBe(true)
    expect(environment.getErrors()).toEqual([])
  }, 30_000)
})
