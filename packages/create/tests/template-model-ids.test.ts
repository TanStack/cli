import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const frameworksDir = fileURLToPath(new URL('../src/frameworks', import.meta.url))

// Claude 3 model IDs have been retired by Anthropic, so a template that still
// hard-codes one generates a project whose AI chat fails at the first request.
const RETIRED_CLAUDE_MODEL = /claude-3(?:-5|-7)?-(?:opus|sonnet|haiku)/

function listFiles(dir: string): Array<string> {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? listFiles(full) : [full]
  })
}

describe('framework templates', () => {
  it('do not reference retired Claude model IDs', () => {
    const offenders = listFiles(frameworksDir)
      .filter((file) => /\.(ts|tsx|js|jsx|json|md|ejs)$/.test(file))
      .filter((file) => RETIRED_CLAUDE_MODEL.test(readFileSync(file, 'utf8')))
      .map((file) => relative(frameworksDir, file))

    expect(offenders).toEqual([])
  })
})
