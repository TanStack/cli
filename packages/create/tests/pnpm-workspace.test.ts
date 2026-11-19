import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import {
  mergePnpmWorkspace,
  writePnpmWorkspace,
  standalonePnpmNpmrc,
} from '../src/pnpm-workspace.js'
import { createMemoryEnvironment } from '../src/environment.js'
import { writeFiles } from '../src/add-to-app.js'

describe('pnpm build approvals', () => {
  it('keeps pnpm 9 dependency additions working in a new standalone app', async () => {
    const { environment, output } = createMemoryEnvironment('/app')
    environment.startRun()
    await writePnpmWorkspace(environment, '/app/pnpm-workspace.yaml', 'pnpm', {
      pnpm: { onlyBuiltDependencies: ['esbuild'] },
    })
    environment.finishRun()
    expect(output.files['.npmrc']).toBe('ignore-workspace-root-check=true\n')
    expect(parse(output.files['pnpm-workspace.yaml']).allowBuilds.esbuild).toBe(
      true,
    )
  })
  it('handles workspace config emitted by framework templates during creation', async () => {
    const { environment, output } = createMemoryEnvironment('/app')
    environment.startRun()
    await environment.writeFile('/app/pnpm-workspace.yaml', 'allowBuilds:\n  esbuild: true\n')
    await writePnpmWorkspace(environment, '/app/pnpm-workspace.yaml', 'pnpm', {
      pnpm: { onlyBuiltDependencies: ['esbuild'] },
    }, { workspaceWasPresent: false })
    environment.finishRun()
    expect(output.files['.npmrc']).toBe('ignore-workspace-root-check=true\n')
  })
  it('preserves project registry settings, comments and explicit root-check choices', async () => {
    const workspace = await mergePnpmWorkspace(undefined, ['esbuild'])
    const original =
      '\uFEFF# project registry\nregistry=https://registry.example.test/\n'
    expect(await standalonePnpmNpmrc(undefined, workspace, original)).toBe(
      '\uFEFFignore-workspace-root-check=true\n# project registry\nregistry=https://registry.example.test/\n',
    )
    const explicit =
      'ignore-workspace-root-check=false\nregistry=https://registry.example.test/\n'
    expect(await standalonePnpmNpmrc(undefined, workspace, explicit)).toBe(
      explicit,
    )
    expect(
      await standalonePnpmNpmrc(
        undefined,
        workspace,
        '[other]\nignore-workspace-root-check=false\n',
      ),
    ).toBe(
      'ignore-workspace-root-check=true\n[other]\nignore-workspace-root-check=false\n',
    )
  })
  it('does not change existing or custom monorepo root checks', async () => {
    const standalone = await mergePnpmWorkspace(undefined, ['esbuild'])
    const monorepo = 'packages:\n  - apps/*\nallowBuilds:\n  esbuild: true\n'
    expect(
      await standalonePnpmNpmrc(monorepo, standalone, undefined),
    ).toBeUndefined()
    expect(
      await standalonePnpmNpmrc(undefined, monorepo, undefined),
    ).toBeUndefined()
  })
  it('defers standalone configuration until an existing app is merged', async () => {
    const { environment, output } = createMemoryEnvironment('/app')
    environment.startRun()
    await writePnpmWorkspace(
      environment,
      '/app/pnpm-workspace.yaml',
      'pnpm',
      { pnpm: { onlyBuiltDependencies: ['esbuild'] } },
      { existingProject: true },
    )
    environment.finishRun()
    expect(output.files['.npmrc']).toBeUndefined()
    expect(output.files['pnpm-workspace.yaml']).toBeDefined()
  })
  it('preserves existing npmrc content when adding pnpm config to an older app', async () => {
    const { environment, output } = createMemoryEnvironment('/app')
    environment.startRun()
    await environment.writeFile(
      '/app/package.json',
      JSON.stringify({ pnpm: { onlyBuiltDependencies: ['esbuild'] } }),
    )
    await environment.writeFile(
      '/app/.npmrc',
      '# keep\nregistry=https://registry.example.test/\n',
    )
    await writeFiles(
      environment,
      '/app',
      {
        files: {
          '/app/package.json': JSON.stringify({
            pnpm: { onlyBuiltDependencies: ['esbuild'] },
          }),
          '/app/pnpm-workspace.yaml': await mergePnpmWorkspace(undefined, [
            'esbuild',
          ]),
        },
        deletedFiles: [],
      },
      true,
    )
    environment.finishRun()
    expect(output.files['.npmrc']).toBe(
      'ignore-workspace-root-check=true\n# keep\nregistry=https://registry.example.test/\n',
    )
  })
  it('creates a workspace compatible with pnpm 9 and current build approvals', async () => {
    expect(
      parse(
        await mergePnpmWorkspace(undefined, ['esbuild', 'workerd', 'esbuild']),
      ),
    ).toEqual({
      packages: ['.'],
      allowBuilds: { esbuild: true, workerd: true },
    })
  })
  it('preserves comments, workspace membership, settings and existing approvals', async () => {
    const input =
      '# user workspace\npackages:\n  - apps/*\nminimumReleaseAge: 1440\nonlyBuiltDependencies:\n  - custom-native\nallowBuilds:\n  esbuild: true\n'
    const result = await mergePnpmWorkspace(input, ['esbuild', 'workerd'])
    expect(result).toContain('# user workspace')
    expect(parse(result)).toEqual({
      packages: ['apps/*'],
      minimumReleaseAge: 1440,
      onlyBuiltDependencies: ['custom-native'],
      allowBuilds: { esbuild: true, workerd: true, 'custom-native': true },
    })
  })
  it('retains explicit denials and does not broaden a custom policy', async () => {
    expect(
      parse(
        await mergePnpmWorkspace('allowBuilds:\n  optional-native: false\n', [
          'esbuild',
        ]),
      ).allowBuilds,
    ).toEqual({ 'optional-native': false, esbuild: true })
    expect(
      parse(
        await mergePnpmWorkspace('allowBuilds:\n  esbuild: false\n', [
          'esbuild',
        ]),
      ).allowBuilds.esbuild,
    ).toBe(false)
    await expect(
      mergePnpmWorkspace('allowBuilds:\n  "*": false\n', ['esbuild']),
    ).rejects.toThrow('existing pnpm allowBuilds policy')
    await expect(
      mergePnpmWorkspace('allowBuilds:\n  esbuild@0.25: true\n', ['esbuild']),
    ).rejects.toThrow('existing pnpm allowBuilds policy')
  })
  it('does not block unrelated add-ons or broaden an existing custom policy', async () => {
    const result = await mergePnpmWorkspace(
      'allowBuilds:\n  "*": false\n',
      ['esbuild'],
      ['esbuild'],
    )
    expect(parse(result).allowBuilds).toEqual({ '*': false })
    await expect(
      mergePnpmWorkspace(result, ['esbuild', 'workerd'], ['esbuild']),
    ).rejects.toThrow('workerd')
  })
  it.each(['allowBuilds: [broken]', 'allowBuilds: {', '- invalid-root'])(
    'rejects invalid configuration without replacing it: %s',
    async (input) => {
      await expect(mergePnpmWorkspace(input, ['esbuild'])).rejects.toThrow()
    },
  )
  it('does not create pnpm settings for other package managers', async () => {
    const { environment, output } = createMemoryEnvironment()
    await writePnpmWorkspace(environment, '/app/pnpm-workspace.yaml', 'npm', {
      pnpm: { onlyBuiltDependencies: ['esbuild'] },
    })
    environment.finishRun()
    expect(output.files).toEqual({})
  })
  it('merges existing app settings and manual native approvals before installing an add-on', async () => {
    const { environment, output } = createMemoryEnvironment('/app')
    environment.startRun()
    await environment.writeFile(
      '/app/package.json',
      JSON.stringify({ pnpm: { onlyBuiltDependencies: ['manual-native'] } }),
    )
    await environment.writeFile(
      '/app/pnpm-workspace.yaml',
      '# keep\npackages:\n  - apps/*\nallowBuilds:\n  esbuild: true\n',
    )
    await writeFiles(
      environment,
      '/app',
      {
        files: {
          '/app/package.json': JSON.stringify({
            pnpm: { onlyBuiltDependencies: ['esbuild', 'workerd'] },
          }),
          '/app/pnpm-workspace.yaml': await mergePnpmWorkspace(undefined, [
            'esbuild',
            'workerd',
          ]),
        },
        deletedFiles: [],
      },
      true,
    )
    environment.finishRun()
    const yaml = output.files['pnpm-workspace.yaml']
    expect(yaml).toContain('# keep')
    expect(parse(yaml)).toEqual({
      packages: ['apps/*'],
      allowBuilds: { esbuild: true, workerd: true, 'manual-native': true },
    })
    expect(
      JSON.parse(output.files['package.json']).pnpm.onlyBuiltDependencies,
    ).toEqual(['manual-native', 'esbuild', 'workerd'])
  })
})
