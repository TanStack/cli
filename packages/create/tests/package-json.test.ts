import { describe, expect, it } from 'vitest'

import { createPackageJSON as createEdgePackageJSON } from '../src/edge-package-json.js'
import { createPackageJSON } from '../src/package-json.js'

import type { Options, Framework } from '../src/types.js'

describe('createPackageJSON', () => {
  it.each([
    ['react', '@tanstack/react-start'],
    ['solid', '@tanstack/solid-start'],
  ])(
    'keeps the router plugin scoped to %s router-only projects',
    (frameworkId, startPackage) => {
      const framework = {
        id: frameworkId,
        basePackageJSON: {
          dependencies: {
            [startPackage]: 'latest',
          },
        },
        optionalPackages: {
          typescript: {},
          devtools: {},
          examples: {},
          tailwindcss: {},
          'file-router': {
            devDependencies: {
              '@tanstack/router-cli': 'latest',
            },
          },
        },
      } as unknown as Framework
      const options = {
        chosenAddOns: [],
        addOnOptions: {},
        mode: 'file-router',
        typescript: true,
        tailwind: false,
        projectName: 'test',
        packageManager: 'pnpm',
        framework,
      } as unknown as Options

      const startPackageJSON = createPackageJSON(options)
      expect(startPackageJSON.dependencies).toHaveProperty(startPackage, 'latest')
      expect(startPackageJSON.devDependencies).not.toHaveProperty(
        '@tanstack/router-plugin',
      )

      const routerOnlyOptions = {
        ...options,
        routerOnly: true,
      }
      const routerOnlyPackageJSON = createPackageJSON(routerOnlyOptions)

      expect(routerOnlyPackageJSON.dependencies).not.toHaveProperty(startPackage)
      expect(routerOnlyPackageJSON.devDependencies).toHaveProperty(
        '@tanstack/router-plugin',
        'latest',
      )
      expect(createEdgePackageJSON(routerOnlyOptions)).toEqual(
        routerOnlyPackageJSON,
      )
    },
  )

  it('should create a package.json', () => {
    const packageJSON = createPackageJSON({
      chosenAddOns: [
        {
          packageAdditions: {
            scripts: {
              dev: 'file-router dev',
            },
          },
        },
      ],
      mode: 'file-router',
      typescript: true,
      tailwind: true,
      projectName: 'test',
      framework: {
        basePackageJSON: {},
        optionalPackages: {
          typescript: {
            devDependencies: {
              typescript: '^5.0.0',
            },
          },
          tailwindcss: {
            dependencies: {
              tailwindcss: '^3.0.0',
            },
          },
          'file-router': {
            dependencies: {
              'file-router': '^1.0.0',
            },
          },
        },
      } as unknown as Framework,
    } as unknown as Options)

    const expected = {
      name: 'test',
      devDependencies: {
        typescript: '^5.0.0',
      },
      dependencies: {
        'file-router': '^1.0.0',
        tailwindcss: '^3.0.0',
      },
      scripts: {
        dev: 'file-router dev',
      },
    }

    // Use JSON.stringify to test sorting order of dependencies
    expect(JSON.stringify(packageJSON)).toEqual(JSON.stringify(expected))
  })

  it('should include sqlite build approval for pnpm templates', () => {
    const packageJSON = createPackageJSON({
      chosenAddOns: [
        {
          packageTemplate:
            '{"pnpm": {<% if (addOnOption.prisma.database === "sqlite") { %>"onlyBuiltDependencies": ["better-sqlite3"]<% } %>}}',
        },
      ],
      addOnOptions: {
        prisma: {
          database: 'sqlite',
        },
      },
      mode: 'file-router',
      typescript: true,
      tailwind: true,
      projectName: 'test',
      framework: {
        basePackageJSON: {},
        optionalPackages: {
          typescript: {},
          tailwindcss: {},
          'file-router': {},
        },
      } as unknown as Framework,
    } as unknown as Options)

    expect(packageJSON.pnpm).toEqual({
      onlyBuiltDependencies: ['better-sqlite3'],
    })
  })

  it('should merge pnpm onlyBuiltDependencies from base and add-ons', () => {
    const packageJSON = createPackageJSON({
      chosenAddOns: [
        {
          packageTemplate:
            '{"pnpm": {"onlyBuiltDependencies": ["better-sqlite3"]}}',
        },
      ],
      addOnOptions: {},
      mode: 'file-router',
      typescript: true,
      tailwind: true,
      projectName: 'test',
      framework: {
        basePackageJSON: {
          pnpm: {
            onlyBuiltDependencies: ['esbuild', 'lightningcss'],
          },
        },
        optionalPackages: {
          typescript: {},
          tailwindcss: {},
          'file-router': {},
        },
      } as unknown as Framework,
    } as unknown as Options)

    expect(packageJSON.pnpm).toEqual({
      onlyBuiltDependencies: ['esbuild', 'lightningcss', 'better-sqlite3'],
    })
  })

  it('should provide execute command helper in package templates', () => {
    const packageJSON = createPackageJSON({
      chosenAddOns: [
        {
          packageTemplate:
            '{"scripts":{"post-cta-init":"<%- getPackageManagerExecuteScript(\'create-db@latest\', [\'--user-agent\', \'tanstack/tsrouter\']) %>"}}',
        },
      ],
      packageManager: 'npm',
      addOnOptions: {},
      mode: 'file-router',
      typescript: true,
      tailwind: true,
      projectName: 'test',
      framework: {
        basePackageJSON: {},
        optionalPackages: {
          typescript: {},
          tailwindcss: {},
          'file-router': {},
        },
      } as unknown as Framework,
    } as unknown as Options)

    expect(packageJSON.scripts['post-cta-init']).toBe(
      'npx -y create-db@latest --user-agent tanstack/tsrouter',
    )
  })
})
