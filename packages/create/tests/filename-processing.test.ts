import { describe, expect, it } from 'vitest'

import { createMemoryEnvironment } from '../src/environment.js'
import { createTemplateFile } from '../src/template-file.js'

import type { Options } from '../src/types.js'

const simpleOptions = {
  projectName: 'test',
  targetDir: '/test',
  framework: {
    id: 'test',
    name: 'Test',
  },
  chosenAddOns: [],
  packageManager: 'pnpm',
  typescript: true,
  tailwind: true,
  mode: 'file-router',
  addOnOptions: {},
} as unknown as Options

describe('Filename Processing - Prefix Stripping', () => {
  it('should strip single prefix from filename', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
      addOnOptions: {
        testAddon: { database: 'postgres' }
      }
    })
    environment.startRun()
    await templateFile(
      '__postgres__testAddon.config.ts.ejs',
      '<% if (addOnOption.testAddon.database !== "postgres") { ignoreFile() } %>\n// PostgreSQL config\nexport default { driver: "postgres" }'
    )
    environment.finishRun()

    // File should be created with prefix stripped
    expect(output.files['/test/testAddon.config.ts']).toBeDefined()
    expect(output.files['/test/testAddon.config.ts'].trim()).toEqual('// PostgreSQL config\nexport default { driver: \'postgres\' }')
    
    // Original prefixed filename should not exist
    expect(output.files['/test/__postgres__testAddon.config.ts']).toBeUndefined()
  })

  it('should strip prefix from nested directory paths', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
      addOnOptions: {
        testAddon: { database: 'mysql' }
      }
    })
    environment.startRun()
    await templateFile(
      'src/db/__mysql__connection.ts.ejs',
      '<% if (addOnOption.testAddon.database !== "mysql") { ignoreFile() } %>\n// MySQL connection\nexport const connection = "mysql"'
    )
    environment.finishRun()

    // File should be created with prefix stripped, preserving directory structure
    expect(output.files['/test/src/db/connection.ts']).toBeDefined()
    expect(output.files['/test/src/db/connection.ts'].trim()).toEqual('// MySQL connection\nexport const connection = \'mysql\'')
    
    // Original prefixed path should not exist
    expect(output.files['/test/src/db/__mysql__connection.ts']).toBeUndefined()
  })

  it('should handle multiple prefixed files in same directory', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
      addOnOptions: {
        testAddon: { database: 'sqlite' }
      }
    })
    environment.startRun()
    await templateFile(
      '__postgres__testAddon.config.ts.ejs',
      '<% if (addOnOption.testAddon.database !== "postgres") { ignoreFile() } %>\n// PostgreSQL config'
    )
    await templateFile(
      '__mysql__testAddon.config.ts.ejs',
      '<% if (addOnOption.testAddon.database !== "mysql") { ignoreFile() } %>\n// MySQL config'
    )
    await templateFile(
      '__sqlite__testAddon.config.ts.ejs',
      '<% if (addOnOption.testAddon.database !== "sqlite") { ignoreFile() } %>\n// SQLite config'
    )
    environment.finishRun()

    // Only SQLite file should exist (others ignored via ignoreFile())
    expect(output.files['/test/testAddon.config.ts']).toBeDefined()
    expect(output.files['/test/testAddon.config.ts'].trim()).toEqual('// SQLite config')
    
    // Prefixed filenames should not exist
    expect(output.files['/test/__postgres__testAddon.config.ts']).toBeUndefined()
    expect(output.files['/test/__mysql__testAddon.config.ts']).toBeUndefined()
    expect(output.files['/test/__sqlite__testAddon.config.ts']).toBeUndefined()
  })

  it('should handle complex filename patterns', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
      addOnOptions: {
        auth: { provider: 'auth0' }
      }
    })
    environment.startRun()
    await templateFile(
      '__auth0__auth.config.js.ejs',
      '<% if (addOnOption.auth.provider !== "auth0") { ignoreFile() } %>\n// Auth0 configuration\nmodule.exports = { provider: "auth0" }'
    )
    environment.finishRun()

    // File should be created with prefix stripped
    expect(output.files['/test/auth.config.js']).toBeDefined()
    expect(output.files['/test/auth.config.js'].trim()).toEqual('// Auth0 configuration\nmodule.exports = { provider: "auth0" }')
  })

  it('should handle prefixed files with .append.ejs extension', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
      addOnOptions: {
        testAddon: { database: 'postgres' }
      }
    })
    environment.startRun()
    // Create base file first
    await templateFile(
      '.env.ejs',
      'BASE_VAR=value\n'
    )
    // Then append with prefixed filename
    await templateFile(
      '__postgres__.env.append.ejs',
      '<% if (addOnOption.testAddon.database !== "postgres") { ignoreFile() } %>\nDATABASE_URL=postgresql://localhost:5432/mydb\n'
    )
    environment.finishRun()

    // File should be created with prefix stripped and content appended
    expect(output.files['/test/.env']).toBeDefined()
    expect(output.files['/test/.env']).toEqual('BASE_VAR=value\n\nDATABASE_URL=postgresql://localhost:5432/mydb\n')
  })

  it('should handle files without prefixes normally', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, simpleOptions)
    environment.startRun()
    await templateFile(
      'regular-file.ts.ejs',
      'export const config = "normal"'
    )
    environment.finishRun()

    // File should be created with normal filename processing
    expect(output.files['/test/regular-file.ts']).toBeDefined()
    expect(output.files['/test/regular-file.ts']).toEqual('export const config = \'normal\'\n')
  })

  it('should handle malformed prefixes gracefully', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, simpleOptions)
    environment.startRun()
    await templateFile(
      '__malformed_prefix.ts.ejs',
      'export const config = "malformed"'
    )
    await templateFile(
      '__only_one_underscore.ts.ejs',
      'export const config = "malformed2"'
    )
    await templateFile(
      '____.ts.ejs',
      'export const config = "empty"'
    )
    environment.finishRun()

    // Files with malformed prefixes should be created as-is (minus .ejs extension)
    expect(output.files['/test/__malformed_prefix.ts']).toBeDefined()
    expect(output.files['/test/__only_one_underscore.ts']).toBeDefined()
    expect(output.files['/test/____.ts']).toBeDefined()
  })

  it('should handle deeply nested prefixed files', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
      addOnOptions: {
        styling: { framework: 'tailwind' }
      }
    })
    environment.startRun()
    await templateFile(
      'src/styles/components/__tailwind__button.css.ejs',
      '<% if (addOnOption.styling.framework !== "tailwind") { ignoreFile() } %>\n@tailwind base;\n@tailwind components;\n@tailwind utilities;'
    )
    environment.finishRun()

    // File should be created with prefix stripped, preserving deep directory structure
    expect(output.files['/test/src/styles/components/button.css']).toBeDefined()
    expect(output.files['/test/src/styles/components/button.css'].trim()).toEqual('@tailwind base;\n@tailwind components;\n@tailwind utilities;')
  })

  it('should handle prefix stripping with different option values', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
      addOnOptions: {
        ui: { library: 'chakra' }
      }
    })
    environment.startRun()
    await templateFile(
      '__chakra__theme.ts.ejs',
      '<% if (addOnOption.ui.library !== "chakra") { ignoreFile() } %>\n// Chakra UI theme\nexport const theme = { colors: {} }'
    )
    await templateFile(
      '__mui__theme.ts.ejs',
      '<% if (addOnOption.ui.library !== "mui") { ignoreFile() } %>\n// Material-UI theme\nexport const theme = { palette: {} }'
    )
    environment.finishRun()

    // Only Chakra file should exist (MUI ignored via ignoreFile())
    expect(output.files['/test/theme.ts']).toBeDefined()
    expect(output.files['/test/theme.ts'].trim()).toEqual('// Chakra UI theme\nexport const theme = { colors: {} }')
    
    // Prefixed filenames should not exist
    expect(output.files['/test/__chakra__theme.ts']).toBeUndefined()
    expect(output.files['/test/__mui__theme.ts']).toBeUndefined()
  })

  it('should handle complex prefix with special characters', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
      addOnOptions: {
        deployment: { platform: 'vercel-edge' }
      }
    })
    environment.startRun()
    await templateFile(
      '__vercel-edge__api.ts.ejs',
      '<% if (addOnOption.deployment.platform !== "vercel-edge") { ignoreFile() } %>\n// Vercel Edge API\nexport const runtime = "edge"'
    )
    environment.finishRun()

    // File should be created with prefix stripped
    expect(output.files['/test/api.ts']).toBeDefined()
    expect(output.files['/test/api.ts'].trim()).toEqual('// Vercel Edge API\nexport const runtime = \'edge\'')
  })

  it('should handle multiple prefixes in same filename (edge case)', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
      addOnOptions: {
        test: { value: 'postgres' }
      }
    })
    environment.startRun()
    await templateFile(
      '__postgres__file__with__underscores.ts.ejs',
      '<% if (addOnOption.test.value !== "postgres") { ignoreFile() } %>\n// File with underscores\nexport const value = "test"'
    )
    environment.finishRun()

    // Should only strip the first valid prefix pattern
    expect(output.files['/test/file__with__underscores.ts']).toBeDefined()
    expect(output.files['/test/file__with__underscores.ts'].trim()).toEqual('// File with underscores\nexport const value = \'test\'')
  })
})