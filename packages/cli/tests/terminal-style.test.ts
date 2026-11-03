import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const fixture = fileURLToPath(
  new URL('./fixtures/terminal-style.mjs', import.meta.url),
)

function render(extra: Record<string, string> = {}, flags: Array<string> = []) {
  const env = { ...process.env }
  delete env.CI
  delete env.FORCE_COLOR
  delete env.NO_COLOR
  delete env.NODE_DISABLE_COLORS
  delete env.TF_BUILD
  delete env.AGENT_NAME
  env.TERM = 'xterm-256color'
  Object.assign(env, extra)
  return execFileSync(
    process.execPath,
    ['--import', 'tsx', fixture, ...flags],
    {
      cwd: fileURLToPath(new URL('../', import.meta.url)),
      env,
      encoding: 'utf8',
      timeout: 10_000,
    },
  )
}

describe('terminal style policy', () => {
  it('does not add escape sequences to piped output', () => {
    expect(render()).toBe('value')
  })

  it('allows forced color in a pipe', () => {
    expect(render({ FORCE_COLOR: '1' })).toBe(
      '\u001b[1m\u001b[32mvalue\u001b[39m\u001b[22m',
    )
  })

  it('honors explicit color flags in a pipe', () => {
    expect(render({}, ['--color'])).toContain('\u001b[')
    expect(render({}, ['--no-color'])).toBe('value')
  })

  it('lets the environment override conflicting color flags like the old formatter', () => {
    expect(render({ FORCE_COLOR: '0' }, ['--color'])).toBe('value')
    expect(render({ FORCE_COLOR: '1' }, ['--no-color'])).toContain('\u001b[')
  })
})
