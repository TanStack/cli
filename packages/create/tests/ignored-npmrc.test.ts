import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, readFile, rm, writeFile, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createDefaultEnvironment } from '../src/environment.js'
import { writeFiles } from '../src/add-to-app.js'
import { mergePnpmWorkspace } from '../src/pnpm-workspace.js'

let directory: string | undefined

async function fixture(npmrc: string) {
  directory = await mkdtemp(join(tmpdir(), 'tanstack-ignored-config-'))
  const pkg = JSON.stringify({
    name: 'fixture',
    pnpm: { onlyBuiltDependencies: ['esbuild'] },
  })
  await writeFile(join(directory, 'package.json'), pkg)
  await writeFile(join(directory, '.gitignore'), '.npmrc\nnotes.txt\n')
  await writeFile(join(directory, '.npmrc'), npmrc)
  const environment = createDefaultEnvironment()
  const confirm = vi.fn(async () => false)
  environment.confirm = confirm
  const output = {
    files: {
      [join(directory, 'package.json')]: pkg,
      [join(directory, 'pnpm-workspace.yaml')]: await mergePnpmWorkspace(
        undefined,
        ['esbuild'],
      ),
    },
    deletedFiles: [],
  }
  return { cwd: directory, environment, confirm, output }
}

afterEach(async () => {
  if (directory) await rm(directory, { recursive: true, force: true })
  directory = undefined
})

describe('ignored existing add-on targets', () => {
  const original =
    '# fixture only\nregistry=https://registry.example.invalid/\n//registry.example.invalid/:_authToken=fake-test-value\n'

  it('preserves ignored registry settings when adding standalone pnpm settings', async () => {
    const { cwd, environment, output } = await fixture(original)
    await writeFiles(environment, cwd, output, true)
    expect(await readFile(join(cwd, '.npmrc'), 'utf8')).toBe(
      'ignore-workspace-root-check=true\n' + original,
    )
  })

  it('asks before changing an ignored npmrc and leaves all files alone on cancellation', async () => {
    const { cwd, environment, output, confirm } = await fixture(original)
    await expect(writeFiles(environment, cwd, output, false)).rejects.toThrow(
      'User cancelled',
    )
    expect(confirm).toHaveBeenCalledOnce()
    expect(await readFile(join(cwd, '.npmrc'), 'utf8')).toBe(original)
    await expect(access(join(cwd, 'pnpm-workspace.yaml'))).rejects.toThrow()
  })

  it('retains an ignored explicit root-check choice without an unnecessary prompt', async () => {
    const explicit = 'ignore-workspace-root-check=false\n' + original
    const { cwd, environment, output, confirm } = await fixture(explicit)
    await writeFiles(environment, cwd, output, false)
    expect(await readFile(join(cwd, '.npmrc'), 'utf8')).toBe(explicit)
    expect(confirm).not.toHaveBeenCalled()
  })

  it('recognizes an existing empty ignored npmrc as an overwrite', async () => {
    const { cwd, environment, output, confirm } = await fixture('')
    await expect(writeFiles(environment, cwd, output, false)).rejects.toThrow(
      'User cancelled',
    )
    expect(confirm).toHaveBeenCalledOnce()
    expect(await readFile(join(cwd, '.npmrc'), 'utf8')).toBe('')
  })

  it('also protects other ignored output targets from silent overwrites', async () => {
    const { cwd, environment, confirm } = await fixture(original)
    await writeFile(join(cwd, 'notes.txt'), 'keep this private fixture text')
    await expect(
      writeFiles(
        environment,
        cwd,
        {
          files: { [join(cwd, 'notes.txt')]: 'replacement' },
          deletedFiles: [],
        },
        false,
      ),
    ).rejects.toThrow('User cancelled')
    expect(confirm).toHaveBeenCalledOnce()
    expect(await readFile(join(cwd, 'notes.txt'), 'utf8')).toBe(
      'keep this private fixture text',
    )
  })
})
