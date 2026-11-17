import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import ejs from 'ejs'
import { describe, expect, it } from 'vitest'

const template = readFileSync(
  fileURLToPath(
    new URL(
      '../src/frameworks/react/toolchains/eslint/assets/eslint.config.js.ejs',
      import.meta.url,
    ),
  ),
  'utf8',
)
const render = (addOnEnabled: Record<string, boolean>) =>
  ejs.render(template, { addOnEnabled })

// PocketBase runs pb_migrations/*.js itself and writes their globals to
// pb_data/types.d.ts. Neither belongs to the app's type-aware lint.
describe('React ESLint toolchain config', () => {
  it('ignores the PocketBase server files when the add-on is enabled', () => {
    expect(render({ eslint: true, pocketbase: true })).toContain(
      "ignores: ['pb_data/**', 'pb_migrations/**']",
    )
  })

  it('leaves other apps unchanged', () => {
    const config = render({ eslint: true })
    expect(config).not.toContain('pb_')
    expect(config).toContain(
      "ignores: ['eslint.config.js', 'prettier.config.js'],\n  },\n]",
    )
  })
})
