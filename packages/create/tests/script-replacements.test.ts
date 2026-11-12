import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createDefaultEnvironment } from '../src/environment.js'
import { writeFiles } from '../src/add-to-app.js'

let directory: string | undefined

async function fixture() {
  directory = await mkdtemp(join(tmpdir(), 'tanstack-script-replacement-'))
  const manifest = {
    name: 'fixture',
    scripts: {
      check: 'tsc --noEmit && vitest run',
      format: 'prettier --write .',
      build: 'vite build',
    },
  }
  const original = JSON.stringify(manifest, null, 2)
  await writeFile(join(directory, 'package.json'), original)
  const environment = createDefaultEnvironment()
  environment.warn = vi.fn()
  environment.confirm = vi.fn(async () => false)
  const output = {
    files: {
      [join(directory, 'package.json')]: JSON.stringify({
        scripts: { check: 'oxfmt --check', format: 'oxfmt' },
      }),
    },
    deletedFiles: [],
  }
  return { cwd: directory, environment, output, original }
}

afterEach(async () => {
  if (directory) await rm(directory, { recursive: true, force: true })
  directory = undefined
})

describe('existing package script replacements', () => {
  it('shows each old and new command before confirmation and preserves the file on cancellation', async () => {
    const { cwd, environment, output, original } = await fixture()
    environment.confirm = vi.fn(async () => {
      expect(environment.warn).toHaveBeenCalledWith(
        'The following package scripts will be replaced',
        'package.json scripts["check"]: "tsc --noEmit && vitest run" -> "oxfmt --check"\npackage.json scripts["format"]: "prettier --write ." -> "oxfmt"',
      )
      expect(await readFile(join(cwd, 'package.json'), 'utf8')).toBe(original)
      return false
    })
    await expect(writeFiles(environment, cwd, output, false)).rejects.toThrow(
      'User cancelled',
    )
    expect(await readFile(join(cwd, 'package.json'), 'utf8')).toBe(original)
  })

  it('replaces approved commands and retains unrelated scripts', async () => {
    const { cwd, environment, output } = await fixture()
    environment.confirm = vi.fn(async () => true)
    await writeFiles(environment, cwd, output, false)
    expect(
      JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8')).scripts,
    ).toEqual({
      check: 'oxfmt --check',
      format: 'oxfmt',
      build: 'vite build',
    })
  })

  it('does not call an identical command or a new script a replacement', async () => {
    const { cwd, environment, output } = await fixture()
    output.files[join(cwd, 'package.json')] = JSON.stringify({
      scripts: { check: 'tsc --noEmit && vitest run', test: 'vitest run' },
    })
    environment.confirm = vi.fn(async () => true)
    await writeFiles(environment, cwd, output, false)
    expect(
      vi.mocked(environment.warn).mock.calls.map(([message]) => message),
    ).not.toContain('The following package scripts will be replaced')
    expect(
      JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8')).scripts,
    ).toEqual({
      check: 'tsc --noEmit && vitest run',
      format: 'prettier --write .',
      build: 'vite build',
      test: 'vitest run',
    })
  })

  it('still reports replacements when force skips confirmation', async () => {
    const { cwd, environment, output } = await fixture()
    await writeFiles(environment, cwd, output, true)
    expect(environment.confirm).not.toHaveBeenCalled()
    expect(environment.warn).toHaveBeenCalledWith(
      'The following package scripts will be replaced',
      expect.stringContaining('tsc --noEmit && vitest run'),
    )
    expect(
      JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8')).scripts
        .build,
    ).toBe('vite build')
  })
})
