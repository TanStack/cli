import { describe, expect, it } from 'vitest'

import {
  getPackageManagerExecuteCommand,
  getPackageManagerInstallCommand,
  getPackageManagerScriptCommand,
  getPackageManagerUninstallCommand,
  translateExecuteCommand,
} from '../src/package-manager.js'
import { formatCommand } from '../src/utils.js'

describe('getPackageManagerScriptCommand', () => {
  it('yarn', () => {
    expect(formatCommand(getPackageManagerScriptCommand('yarn', ['dev']))).toBe(
      'yarn run dev',
    )
  })
  it('pnpm', () => {
    expect(formatCommand(getPackageManagerScriptCommand('pnpm', ['dev']))).toBe(
      'pnpm dev',
    )
  })
  it('bun', () => {
    expect(formatCommand(getPackageManagerScriptCommand('bun', ['dev']))).toBe(
      'bun --bun run dev',
    )
  })
  it('deno', () => {
    expect(formatCommand(getPackageManagerScriptCommand('deno', ['dev']))).toBe(
      'deno task dev',
    )
  })
  it('npm', () => {
    expect(formatCommand(getPackageManagerScriptCommand('npm', ['dev']))).toBe(
      'npm run dev',
    )
  })
})

describe('getPackageManagerExecuteCommand', () => {
  it('yarn', () => {
    expect(
      formatCommand(
        getPackageManagerExecuteCommand('yarn', 'shadcn', ['add', 'button']),
      ),
    ).toBe('yarn dlx shadcn add button')
  })
  it('pnpm', () => {
    expect(
      formatCommand(
        getPackageManagerExecuteCommand('pnpm', 'shadcn', ['add', 'button']),
      ),
    ).toBe('pnpm dlx shadcn add button')
  })
  it('bun', () => {
    expect(
      formatCommand(
        getPackageManagerExecuteCommand('bun', 'shadcn', ['add', 'button']),
      ),
    ).toBe('bunx --bun shadcn add button')
  })
  it('deno', () => {
    expect(
      formatCommand(
        getPackageManagerExecuteCommand('deno', 'shadcn', ['add', 'button']),
      ),
    ).toBe('deno run npm:shadcn add button')
  })
  it('npm', () => {
    expect(
      formatCommand(
        getPackageManagerExecuteCommand('npm', 'shadcn', ['add', 'button']),
      ),
    ).toBe('npx -y shadcn add button')
  })
})

describe('getPackageManagerInstallCommand', () => {
  it('yarn install', () => {
    expect(formatCommand(getPackageManagerInstallCommand('yarn'))).toBe(
      'yarn install',
    )
  })
  it('pnpm install', () => {
    expect(formatCommand(getPackageManagerInstallCommand('pnpm'))).toBe(
      'pnpm install',
    )
  })
  it('bun install', () => {
    expect(formatCommand(getPackageManagerInstallCommand('bun'))).toBe(
      'bun install',
    )
  })
  it('deno install', () => {
    expect(formatCommand(getPackageManagerInstallCommand('deno'))).toBe(
      'deno install',
    )
  })
  it('npm install', () => {
    expect(formatCommand(getPackageManagerInstallCommand('npm'))).toBe(
      'npm install',
    )
  })

  it('yarn install radix-ui', () => {
    expect(
      formatCommand(getPackageManagerInstallCommand('yarn', 'radix-ui')),
    ).toBe('yarn add radix-ui')
  })
  it('pnpm install radix-ui', () => {
    expect(
      formatCommand(getPackageManagerInstallCommand('pnpm', 'radix-ui')),
    ).toBe('pnpm add radix-ui')
  })
  it('bun install radix-ui', () => {
    expect(
      formatCommand(getPackageManagerInstallCommand('bun', 'radix-ui')),
    ).toBe('bun install radix-ui')
  })
  it('deno install radix-ui', () => {
    expect(
      formatCommand(getPackageManagerInstallCommand('deno', 'radix-ui')),
    ).toBe('deno install radix-ui')
  })
  it('npm install radix-ui', () => {
    expect(
      formatCommand(getPackageManagerInstallCommand('npm', 'radix-ui')),
    ).toBe('npm install radix-ui')
  })

  it('yarn install vitest in dev mode', () => {
    expect(
      formatCommand(getPackageManagerInstallCommand('yarn', 'vitest', true)),
    ).toBe('yarn add vitest --dev')
  })
  it('pnpm install vitest in dev mode', () => {
    expect(
      formatCommand(getPackageManagerInstallCommand('pnpm', 'vitest', true)),
    ).toBe('pnpm add vitest --dev')
  })
  it('bun install vitest in dev mode', () => {
    expect(
      formatCommand(getPackageManagerInstallCommand('bun', 'vitest', true)),
    ).toBe('bun install vitest -D')
  })
  it('deno install vitest in dev mode', () => {
    expect(
      formatCommand(getPackageManagerInstallCommand('deno', 'vitest', true)),
    ).toBe('deno install vitest -D')
  })
  it('npm install vitest in dev mode', () => {
    expect(
      formatCommand(getPackageManagerInstallCommand('npm', 'vitest', true)),
    ).toBe('npm install vitest -D')
  })
})

describe('getPackageManagerUninstallCommand', () => {
  it('yarn uninstall radix-ui', () => {
    expect(
      formatCommand(getPackageManagerUninstallCommand('yarn', 'radix-ui')),
    ).toBe('yarn remove radix-ui')
  })
  it('pnpm uninstall radix-ui', () => {
    expect(
      formatCommand(getPackageManagerUninstallCommand('pnpm', 'radix-ui')),
    ).toBe('pnpm remove radix-ui')
  })
  it('bun uninstall radix-ui', () => {
    expect(
      formatCommand(getPackageManagerUninstallCommand('bun', 'radix-ui')),
    ).toBe('bun remove radix-ui')
  })
  it('deno uninstall radix-ui', () => {
    expect(
      formatCommand(getPackageManagerUninstallCommand('deno', 'radix-ui')),
    ).toBe('deno uninstall radix-ui')
  })
  it('npm uninstall radix-ui', () => {
    expect(
      formatCommand(getPackageManagerUninstallCommand('npm', 'radix-ui')),
    ).toBe('npm uninstall radix-ui')
  })
})

describe('translateExecuteCommand', () => {
  it('should translate npx to bunx for bun', () => {
    expect(
      formatCommand(
        translateExecuteCommand('bun', {
          command: 'npx',
          args: ['shadcn', 'add', 'button'],
        }),
      ),
    ).toBe('bunx --bun shadcn add button')
  })
  it('should translate npx to pnpm dlx for pnpm', () => {
    expect(
      formatCommand(
        translateExecuteCommand('pnpm', {
          command: 'npx',
          args: ['shadcn', 'add', 'button'],
        }),
      ),
    ).toBe('pnpm dlx shadcn add button')
  })
  it('should translate npx to yarn dlx for yarn', () => {
    expect(
      formatCommand(
        translateExecuteCommand('yarn', {
          command: 'npx',
          args: ['shadcn', 'add', 'button'],
        }),
      ),
    ).toBe('yarn dlx shadcn add button')
  })
  it('should translate npx to deno run for deno', () => {
    expect(
      formatCommand(
        translateExecuteCommand('deno', {
          command: 'npx',
          args: ['shadcn', 'add', 'button'],
        }),
      ),
    ).toBe('deno run npm:shadcn add button')
  })
  it('should keep npx -y for npm', () => {
    expect(
      formatCommand(
        translateExecuteCommand('npm', {
          command: 'npx',
          args: ['shadcn', 'add', 'button'],
        }),
      ),
    ).toBe('npx -y shadcn add button')
  })
  it('should pass through non-npx commands unchanged', () => {
    expect(
      formatCommand(
        translateExecuteCommand('bun', {
          command: 'node',
          args: ['script.js'],
        }),
      ),
    ).toBe('node script.js')
  })
  it('should handle missing args gracefully', () => {
    expect(
      formatCommand(translateExecuteCommand('bun', { command: 'npx' })),
    ).toBe('npx')
  })
  it('should strip -y flag from npx input', () => {
    expect(
      formatCommand(
        translateExecuteCommand('pnpm', {
          command: 'npx',
          args: ['-y', 'shadcn', 'add', 'button'],
        }),
      ),
    ).toBe('pnpm dlx shadcn add button')
  })
  it('should translate bunx to target package manager', () => {
    expect(
      formatCommand(
        translateExecuteCommand('pnpm', {
          command: 'bunx',
          args: ['shadcn', 'add', 'button'],
        }),
      ),
    ).toBe('pnpm dlx shadcn add button')
  })
  it('should strip --bun flag from bunx input', () => {
    expect(
      formatCommand(
        translateExecuteCommand('pnpm', {
          command: 'bunx',
          args: ['--bun', 'shadcn', 'add', 'button'],
        }),
      ),
    ).toBe('pnpm dlx shadcn add button')
  })
  it('should translate pnpx to target package manager', () => {
    expect(
      formatCommand(
        translateExecuteCommand('yarn', {
          command: 'pnpx',
          args: ['shadcn', 'add', 'button'],
        }),
      ),
    ).toBe('yarn dlx shadcn add button')
  })
  it('should translate pnpm dlx to target package manager', () => {
    expect(
      formatCommand(
        translateExecuteCommand('bun', {
          command: 'pnpm',
          args: ['dlx', 'shadcn', 'add', 'button'],
        }),
      ),
    ).toBe('bunx --bun shadcn add button')
  })
  it('should translate yarn dlx to target package manager', () => {
    expect(
      formatCommand(
        translateExecuteCommand('npm', {
          command: 'yarn',
          args: ['dlx', 'shadcn', 'add', 'button'],
        }),
      ),
    ).toBe('npx -y shadcn add button')
  })
  it('should translate deno run npm: to target package manager', () => {
    expect(
      formatCommand(
        translateExecuteCommand('pnpm', {
          command: 'deno',
          args: ['run', 'npm:shadcn', 'add', 'button'],
        }),
      ),
    ).toBe('pnpm dlx shadcn add button')
  })
  it('should pass through non-execute pnpm commands unchanged', () => {
    expect(
      formatCommand(
        translateExecuteCommand('bun', {
          command: 'pnpm',
          args: ['install'],
        }),
      ),
    ).toBe('pnpm install')
  })
  it('should pass through non-execute deno commands unchanged', () => {
    expect(
      formatCommand(
        translateExecuteCommand('npm', {
          command: 'deno',
          args: ['task', 'dev'],
        }),
      ),
    ).toBe('deno task dev')
  })
})
