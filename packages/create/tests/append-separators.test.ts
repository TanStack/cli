import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { createDefaultEnvironment, createMemoryEnvironment } from '../src/environment.js'
import { createMemoryEnvironment as createEdgeMemoryEnvironment } from '../src/edge-environment.js'
import { createTemplateFile } from '../src/template-file.js'
import { createTemplateFile as createEdgeTemplateFile } from '../src/edge-template-file.js'
import type { Options } from '../src/types.js'

const cases = [
  { name: 'missing target', before: undefined, incoming: 'next\n', expected: 'next\n' },
  { name: 'empty target', before: '', incoming: 'next\n', expected: 'next\n' },
  { name: 'missing separator', before: '*.local', incoming: 'mcp-todos.json\n', expected: '*.local\nmcp-todos.json\n' },
  { name: 'existing trailing newline', before: 'first\n', incoming: 'next', expected: 'first\nnext' },
  { name: 'incoming leading newline', before: 'first', incoming: '\nnext', expected: 'first\nnext' },
  { name: 'intentional blank line', before: 'first\n', incoming: '\nnext', expected: 'first\n\nnext' },
  { name: 'empty append', before: 'first', incoming: '', expected: 'first' },
  { name: 'existing CRLF', before: 'first\r\n', incoming: 'next', expected: 'first\r\nnext' },
  { name: 'incoming CRLF', before: 'first', incoming: '\r\nnext', expected: 'first\r\nnext' },
]

for (const kind of ['disk', 'node-memory', 'edge-memory'] as const) {
  describe(`${kind} append templates`, () => {
    it.each(cases)('$name', async ({ before, incoming, expected }) => {
      const targetDir = await mkdtemp(join(tmpdir(), 'tanstack-append-'))
      const environment = kind === 'disk'
        ? createDefaultEnvironment()
        : kind === 'node-memory'
          ? createMemoryEnvironment().environment
          : createEdgeMemoryEnvironment().environment
      const options: Options = {
        projectName: 'test', targetDir,
        framework: {
          id: 'test', name: 'Test', description: '', version: '1',
          basePackageJSON: {}, optionalPackages: {}, supportedModes: {},
          getFiles: async () => [], getFileContents: async () => '',
          getDeletedFiles: async () => [], getAddOns: () => [],
        },
        chosenAddOns: [], addOnOptions: {}, packageManager: 'npm',
        typescript: true, tailwind: false, mode: 'file-router',
        git: false, intent: false,
      }
      const templateFile = kind === 'edge-memory'
        ? createEdgeTemplateFile(environment, options)
        : createTemplateFile(environment, options)
      try {
        environment.startRun()
        if (before !== undefined) await templateFile('_dot_gitignore', before)
        await templateFile('_dot_gitignore.append', incoming)
        expect(await environment.readFile(join(targetDir, '.gitignore'))).toBe(expected)
      } finally {
        environment.finishRun()
        await rm(targetDir, { recursive: true, force: true })
      }
    })
  })
}
