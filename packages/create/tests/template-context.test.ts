import { describe, expect, it } from 'vitest'

import { createMemoryEnvironment } from '../src/environment.js'
import { createTemplateFile } from '../src/template-file.js'

import type { AddOn, Options } from '../src/types.js'

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

describe('Template Context - Add-on Options', () => {
  it('should provide addOnOption context variable', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
      addOnOptions: {
        testAddon: {
          database: 'postgres'
        }
      }
    })
    environment.startRun()
    await templateFile('test.txt.ejs', 'Database: <%= addOnOption.testAddon.database %>')
    environment.finishRun()

    expect(output.files['/test/test.txt']).toEqual('Database: postgres')
  })

  it('should handle multiple add-on options', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
      addOnOptions: {
        testAddon: {
          database: 'mysql'
        },
        shadcn: {
          theme: 'slate'
        }
      }
    })
    environment.startRun()
    await templateFile(
      'test.txt.ejs',
      'Drizzle: <%= addOnOption.testAddon.database %>, shadcn: <%= addOnOption.shadcn.theme %>'
    )
    environment.finishRun()

    expect(output.files['/test/test.txt']).toEqual('Drizzle: mysql, shadcn: slate')
  })

  it('should handle multiple options per add-on', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
      addOnOptions: {
        'complex-addon': {
          database: 'postgres',
          theme: 'dark',
          port: 5432
        }
      }
    })
    environment.startRun()
    await templateFile(
      'test.txt.ejs',
      'DB: <%= addOnOption["complex-addon"].database %>, Theme: <%= addOnOption["complex-addon"].theme %>, Port: <%= addOnOption["complex-addon"].port %>'
    )
    environment.finishRun()

    expect(output.files['/test/test.txt']).toEqual('DB: postgres, Theme: dark, Port: 5432')
  })

  it('should handle conditional logic with addOnOption', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
      addOnOptions: {
        testAddon: {
          database: 'postgres'
        }
      }
    })
    environment.startRun()
    await templateFile(
      'test.txt.ejs',
      `<% if (addOnOption.testAddon.database === 'postgres') { %>
PostgreSQL configuration
<% } else if (addOnOption.testAddon.database === 'mysql') { %>
MySQL configuration
<% } else { %>
SQLite configuration
<% } %>`
    )
    environment.finishRun()

    expect(output.files['/test/test.txt'].trim()).toEqual('PostgreSQL configuration')
  })

  it('should handle ignoreFile() with option conditions', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
      addOnOptions: {
        testAddon: {
          database: 'postgres'
        }
      }
    })
    environment.startRun()
    await templateFile(
      'postgres-config.ts.ejs',
      '<% if (addOnOption.testAddon.database !== "postgres") { ignoreFile() } %>\n// PostgreSQL configuration\nexport const config = "postgres"'
    )
    await templateFile(
      'mysql-config.ts.ejs',
      '<% if (addOnOption.testAddon.database !== "mysql") { ignoreFile() } %>\n// MySQL configuration\nexport const config = "mysql"'
    )
    environment.finishRun()

    expect(output.files['/test/postgres-config.ts']).toBeDefined()
    expect(output.files['/test/postgres-config.ts'].trim()).toEqual('// PostgreSQL configuration\nexport const config = \'postgres\'')
    expect(output.files['/test/mysql-config.ts']).toBeUndefined()
  })

  it('should handle empty addOnOptions', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
      addOnOptions: {}
    })
    environment.startRun()
    await templateFile(
      'test.txt.ejs',
      'Options: <%= JSON.stringify(addOnOption) %>'
    )
    environment.finishRun()

    expect(output.files['/test/test.txt']).toEqual('Options: {}')
  })

  it('should handle undefined option values', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
      addOnOptions: {
        testAddon: {
          database: undefined
        }
      }
    })
    environment.startRun()
    await templateFile(
      'test.txt.ejs',
      'Database: <%= addOnOption.testAddon.database || "not set" %>'
    )
    environment.finishRun()

    expect(output.files['/test/test.txt']).toEqual('Database: not set')
  })

  it('should work alongside existing template variables', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
      projectName: 'my-app',
      chosenAddOns: [
        {
          id: 'testAddon',
          name: 'Drizzle ORM',
        } as AddOn
      ],
      addOnOptions: {
        testAddon: {
          database: 'postgres'
        }
      }
    })
    environment.startRun()
    await templateFile(
      'test.txt.ejs',
      'Project: <%= projectName %>, Add-ons: <%= Object.keys(addOnEnabled).join(", ") %>, Database: <%= addOnOption.testAddon.database %>'
    )
    environment.finishRun()

    expect(output.files['/test/test.txt']).toEqual('Project: my-app, Add-ons: testAddon, Database: postgres')
  })

  it('should handle nested object access safely', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
      addOnOptions: {
        testAddon: {
          database: 'postgres'
        }
      }
    })
    environment.startRun()
    await templateFile(
      'test.txt.ejs',
      'Exists: <%= addOnOption.testAddon ? "yes" : "no" %>, Non-existent: <%= addOnOption.nonexistent ? "yes" : "no" %>'
    )
    environment.finishRun()

    expect(output.files['/test/test.txt']).toEqual('Exists: yes, Non-existent: no')
  })

  it('should handle option-based conditional imports', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
      addOnOptions: {
        testAddon: {
          database: 'postgres'
        }
      }
    })
    environment.startRun()
    await templateFile(
      'db-config.ts.ejs',
      `<% if (addOnOption.testAddon.database === 'postgres') { %>
import { testAddon } from 'testAddon-orm/postgres-js'
import postgres from 'postgres'
<% } else if (addOnOption.testAddon.database === 'mysql') { %>
import { testAddon } from 'testAddon-orm/mysql2'
import mysql from 'mysql2/promise'
<% } else if (addOnOption.testAddon.database === 'sqlite') { %>
import { testAddon } from 'testAddon-orm/better-sqlite3'
import Database from 'better-sqlite3'
<% } %>

export const db = testAddon(/* connection */)`
    )
    environment.finishRun()

    expect(output.files['/test/db-config.ts']).toContain("import { testAddon } from 'testAddon-orm/postgres-js'")
    expect(output.files['/test/db-config.ts']).toContain("import postgres from 'postgres'")
    expect(output.files['/test/db-config.ts']).not.toContain("import mysql from 'mysql2/promise'")
    expect(output.files['/test/db-config.ts']).not.toContain("import Database from 'better-sqlite3'")
  })

  it('should handle filename prefix stripping', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
      addOnOptions: {
        testAddon: {
          database: 'postgres'
        }
      }
    })
    environment.startRun()
    await templateFile(
      '__postgres__testAddon.config.ts.ejs',
      '<% if (addOnOption.testAddon.database !== "postgres") { ignoreFile() } %>\n// PostgreSQL Drizzle config\nexport default { driver: "postgres" }'
    )
    await templateFile(
      '__mysql__testAddon.config.ts.ejs',
      '<% if (addOnOption.testAddon.database !== "mysql") { ignoreFile() } %>\n// MySQL Drizzle config\nexport default { driver: "mysql" }'
    )
    environment.finishRun()

    // File should be created with prefix stripped
    expect(output.files['/test/testAddon.config.ts']).toBeDefined()
    expect(output.files['/test/testAddon.config.ts'].trim()).toEqual('// PostgreSQL Drizzle config\nexport default { driver: \'postgres\' }')
    
    // Prefixed filename should not exist
    expect(output.files['/test/__postgres__testAddon.config.ts']).toBeUndefined()
    expect(output.files['/test/__mysql__testAddon.config.ts']).toBeUndefined()
  })

  it('should handle nested directory with prefixed files', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
      addOnOptions: {
        testAddon: {
          database: 'sqlite'
        }
      }
    })
    environment.startRun()
    await templateFile(
      'src/db/__sqlite__index.ts.ejs',
      '<% if (addOnOption.testAddon.database !== "sqlite") { ignoreFile() } %>\n// SQLite database connection\nexport const db = "sqlite"'
    )
    await templateFile(
      'src/db/__postgres__index.ts.ejs',
      '<% if (addOnOption.testAddon.database !== "postgres") { ignoreFile() } %>\n// PostgreSQL database connection\nexport const db = "postgres"'
    )
    environment.finishRun()

    // SQLite file should be created with prefix stripped
    expect(output.files['/test/src/db/index.ts']).toBeDefined()
    expect(output.files['/test/src/db/index.ts'].trim()).toEqual('// SQLite database connection\nexport const db = \'sqlite\'')
    
    // Prefixed filenames should not exist
    expect(output.files['/test/src/db/__sqlite__index.ts']).toBeUndefined()
    expect(output.files['/test/src/db/__postgres__index.ts']).toBeUndefined()
  })
})

describe('Template Context - includeExamples', () => {
  it('should default includeExamples to true when undefined', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, simpleOptions)
    environment.startRun()
    await templateFile(
      'test.txt.ejs',
      '<%= includeExamples ? "with-examples" : "no-examples" %>',
    )
    environment.finishRun()

    expect(output.files['/test/test.txt']).toEqual('with-examples')
  })

  it('should set includeExamples to false when options.includeExamples is false', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
      includeExamples: false,
    })
    environment.startRun()
    await templateFile(
      'test.txt.ejs',
      '<%= includeExamples ? "with-examples" : "no-examples" %>',
    )
    environment.finishRun()

    expect(output.files['/test/test.txt']).toEqual('no-examples')
  })

  it('should ignore files when includeExamples is false', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
      includeExamples: false,
    })
    environment.startRun()
    await templateFile(
      'about.ts.ejs',
      '<% if (!includeExamples) { ignoreFile(); return; } %>\nexport const about = true',
    )
    environment.finishRun()

    expect(output.files['/test/about.ts']).toBeUndefined()
  })

  it('should include files when includeExamples is true', async () => {
    const { environment, output } = createMemoryEnvironment()
    const templateFile = createTemplateFile(environment, {
      ...simpleOptions,
      includeExamples: true,
    })
    environment.startRun()
    await templateFile(
      'about.ts.ejs',
      '<% if (!includeExamples) { ignoreFile(); return; } %>\nexport const about = true',
    )
    environment.finishRun()

    expect(output.files['/test/about.ts']).toBeDefined()
  })
})