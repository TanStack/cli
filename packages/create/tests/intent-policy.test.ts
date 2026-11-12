import { describe, expect, it } from 'vitest'
import { createMemoryEnvironment } from '../src/environment.js'
import { createMemoryEnvironment as createEdgeMemoryEnvironment } from '../src/edge-environment.js'
import { configureIntentPolicy } from '../src/intent-policy.js'
import { getIntentExecuteCommand } from '../src/package-manager.js'

describe('Intent policy', () => {
  const manifest = () => ({
    dependencies: { '@tanstack/react-router': 'latest' },
    devDependencies: { '@tanstack/intent': 'latest' },
  })
  it('seeds exact direct dependencies and preserves exclusions', async () => {
    const { environment } = createMemoryEnvironment()
    const pkg = {
      ...manifest(),
      intent: { exclude: ['@tanstack/react-router#hidden'] },
    }
    await configureIntentPolicy(environment, '/app', pkg)
    expect(pkg.intent).toEqual({
      skills: ['@tanstack/react-router'],
      exclude: ['@tanstack/react-router#hidden'],
    })
  })
  it.each([
    { skills: [] },
    { skills: ['allowed#specific'] },
    { skills: '*' },
    { skills: [12] },
  ])('preserves an existing policy %j', async ({ skills }) => {
    const { environment } = createMemoryEnvironment()
    environment.startRun()
    const intent = { skills, exclude: ['denied'] }
    await environment.writeFile('/app/package.json', JSON.stringify({ intent }))
    const pkg: Record<string, any> = manifest()
    await configureIntentPolicy(environment, '/app', pkg)
    expect(pkg.intent).toEqual(intent)
    environment.finishRun()
  })
  describe.each([createMemoryEnvironment, createEdgeMemoryEnvironment])(
    'ancestor policy with environment %#',
    (createEnvironment) => {
      it.each([
        { parentSkills: [], localSkills: null },
        { parentSkills: [], localSkills: undefined },
        { parentSkills: ['allowed#specific'], localSkills: null },
        { parentSkills: ['allowed#specific'], localSkills: undefined },
        { parentSkills: 'malformed', localSkills: null },
        { parentSkills: [12], localSkills: undefined },
      ])(
        'inherits the parent policy unchanged: %j',
        async ({ parentSkills, localSkills }) => {
          const { environment } = createEnvironment()
          environment.startRun()
          const parent = JSON.stringify({
            workspaces: ['apps/*'],
            intent: { skills: parentSkills, exclude: ['private'] },
          })
          await environment.writeFile('/workspace/package.json', parent)
          const pkg = {
            ...manifest(),
            intent: { skills: localSkills, exclude: ['local-private'] },
          }
          await configureIntentPolicy(environment, '/workspace/apps/app', pkg)
          expect(pkg.intent).toEqual({
            skills: localSkills,
            exclude: ['local-private'],
          })
          expect(await environment.readFile('/workspace/package.json')).toBe(
            parent,
          )
          environment.finishRun()
        },
      )
    },
  )
  it('seeds an explicit empty policy when no candidate dependency exists', async () => {
    const { environment } = createMemoryEnvironment()
    const pkg: Record<string, any> = {
      devDependencies: { '@tanstack/intent': '0.5.6' },
    }
    await configureIntentPolicy(environment, '/app', pkg)
    expect(pkg.intent).toEqual({ skills: [] })
  })
  it('does not seed a policy into an existing-project overlay', async () => {
    const { environment } = createMemoryEnvironment()
    const pkg = manifest()
    await configureIntentPolicy(environment, '/app', pkg, {
      existingProject: true,
    })
    expect(pkg).not.toHaveProperty('intent')
  })
})

describe('local Intent commands', () => {
  it.each([
    [
      'bun',
      'bunx',
      ['--no-install', '--package', '@tanstack/intent', 'intent', 'list'],
    ],
    ['npm', 'npm', ['exec', '--no', '--', 'intent', 'list']],
    ['deno', 'npm', ['exec', '--no', '--', 'intent', 'list']],
    ['pnpm', 'pnpm', ['exec', 'intent', 'list']],
    ['yarn', 'yarn', ['exec', 'intent', 'list']],
  ] as const)('%s uses the local binary', (manager, command, args) => {
    expect(getIntentExecuteCommand(manager, ['list'])).toEqual({
      command,
      args,
    })
  })
})
