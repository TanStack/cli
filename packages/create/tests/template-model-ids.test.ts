import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const frameworksDir = fileURLToPath(
  new URL('../src/frameworks', import.meta.url),
)

// Claude 3 model IDs have been retired by Anthropic, so a template that still
// hard-codes one generates a project whose AI chat fails at the first request.
const RETIRED_CLAUDE_MODEL = /claude-3(?:-5|-7)?-(?:opus|sonnet|haiku)/

// Google shut down gemini-2.0-flash (and its -exp variants) on 2026-06-01.
const RETIRED_GEMINI_MODEL = /gemini-2\.0-flash/

function listFiles(dir: string): Array<string> {
  return readdirSync(dir).flatMap((entry) => {
    if (entry === 'node_modules') return []
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? listFiles(full) : [full]
  })
}

function findRetiredModelFiles(
  root: string,
  pattern: RegExp = RETIRED_CLAUDE_MODEL,
): Array<string> {
  return listFiles(root)
    .filter((file) => /\.(ts|tsx|js|jsx|json|md|ejs)$/.test(file))
    .filter((file) => pattern.test(readFileSync(file, 'utf8')))
    .map((file) => relative(root, file))
}

describe('framework templates', () => {
  it('do not reference retired Claude model IDs', () => {
    expect(findRetiredModelFiles(frameworksDir)).toEqual([])
  })

  it('do not reference retired Gemini model IDs', () => {
    expect(findRetiredModelFiles(frameworksDir, RETIRED_GEMINI_MODEL)).toEqual(
      [],
    )
  })

  it('ignores installed dependencies while checking authored templates', () => {
    const root = mkdtempSync(join(tmpdir(), 'tanstack-model-scan-'))
    try {
      const vendor = join(root, 'node_modules', 'sdk')
      const authored = join(root, 'src', 'model.ts')
      mkdirSync(vendor, { recursive: true })
      mkdirSync(join(root, 'src'))
      const retired = "export type Model = 'claude-3-opus-20240229'"
      writeFileSync(join(vendor, 'index.d.ts'), retired)
      writeFileSync(authored, retired)
      expect(findRetiredModelFiles(root)).toEqual([join('src', 'model.ts')])
      writeFileSync(authored, "export const model = 'claude-haiku-4-5'")
      expect(findRetiredModelFiles(root)).toEqual([])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
