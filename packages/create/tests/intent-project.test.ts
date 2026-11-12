import { describe, expect, it } from 'vitest'
import { createMemoryEnvironment } from '../src/environment.js'
import { createMemoryEnvironment as createEdgeMemoryEnvironment } from '../src/edge-environment.js'
import { readIntentConfigManifests } from '../src/intent-project.js'
import { configureIntentPolicy } from '../src/intent-policy.js'
import { intentProjectCases } from './fixtures/intent-project.js'

describe.each([createMemoryEnvironment, createEdgeMemoryEnvironment])(
  'Intent 0.5.6 project boundaries with environment %#',
  (createEnvironment) => {
    it.each(intentProjectCases)('$name', async ({ files, expected }) => {
      const { environment } = createEnvironment()
      await environment.writeFile('/repo/.git', 'gitdir: isolated-fixture')
      for (const [path, content] of Object.entries(files))
        await environment.writeFile(path, content)
      const target = Object.keys(files)
        .find((path) => path.endsWith('/app/package.json'))!
        .slice(0, -'/package.json'.length)
      const pkg = JSON.parse(files[`${target}/package.json`]!)
      const original = JSON.stringify(pkg)
      if (expected === 'reject') {
        await expect(
          readIntentConfigManifests(environment, target, pkg),
        ).rejects.toThrow()
        await expect(
          configureIntentPolicy(environment, target, pkg),
        ).rejects.toThrow()
        expect(JSON.stringify(pkg)).toBe(original)
      } else {
        const configs = await readIntentConfigManifests(
          environment,
          target,
          pkg,
        )
        expect(configs.map((config) => config.name ?? '')).toEqual(expected)
        const inheritedPolicy = configs.some(
          (config) => config.intent?.skills != null,
        )
        await configureIntentPolicy(environment, target, pkg)
        expect(pkg.intent?.skills).toEqual(
          inheritedPolicy ? undefined : ['@tanstack/react-router'],
        )
      }
      for (const [path, content] of Object.entries(files))
        expect(await environment.readFile(path)).toBe(content)
    })
    it('does not treat an unreadable discovery manifest as absent', async () => {
      const { environment } = createEnvironment()
      await environment.writeFile('/repo/package.json', '{}')
      const read = environment.readFile
      environment.readFile = (path) =>
        path === '/repo/package.json'
          ? Promise.reject(new Error('EACCES'))
          : read(path)
      const pkg = { name: 'app' }
      await expect(
        configureIntentPolicy(environment, '/repo/app', pkg),
      ).rejects.toThrow('EACCES')
      expect(pkg).not.toHaveProperty('intent')
    })
  },
)
