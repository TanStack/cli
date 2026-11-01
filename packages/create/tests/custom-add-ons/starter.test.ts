import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fs, vol } from 'memfs'

import {
  loadStarter,
  readOrGenerateStarterInfo,
} from '../../src/custom-add-ons/starter.js'

vi.mock('node:fs', () => fs)
vi.mock('node:fs/promises', () => fs.promises)

beforeEach(() => {
  vol.reset()
})

describe('readOrGenerateStarterInfo', () => {
  it('should read the starter info', async () => {
    const starterInfo = await readOrGenerateStarterInfo({
      framework: 'test',
      version: 1,
      starter: undefined,
      projectName: 'test',
      mode: 'code-router',
      typescript: true,
      tailwind: true,
      git: true,
      chosenAddOns: [],
    })
    expect(starterInfo.id).toEqual('test-template')
  })

  it('should read the starter info', async () => {
    fs.mkdirSync(process.cwd(), { recursive: true })
    fs.writeFileSync(
      'starter-info.json',
      JSON.stringify({
        framework: 'test',
        version: 1,
        chosenAddOns: [],
        starter: undefined,
        name: 'test-starter',
        mode: 'code-router',
        typescript: true,
        tailwind: true,
        git: true,
      }),
    )
    const starterInfo = await readOrGenerateStarterInfo({
      framework: 'test',
      version: 1,
      chosenAddOns: [],
      starter: undefined,
      projectName: 'test',
      mode: 'code-router',
      typescript: true,
      tailwind: true,
      git: true,
    })
    expect(starterInfo.name).toEqual('test-starter')
  })

  it('should backfill version when missing', async () => {
    fs.mkdirSync(process.cwd(), { recursive: true })
    fs.writeFileSync(
      'starter-info.json',
      JSON.stringify({
        framework: 'test',
        chosenAddOns: [],
        starter: undefined,
        name: 'test-starter',
        mode: 'code-router',
        typescript: true,
        tailwind: true,
        git: true,
      }),
    )
    const starterInfo = await readOrGenerateStarterInfo({
      framework: 'test',
      version: 1,
      chosenAddOns: [],
      starter: undefined,
      projectName: 'test',
      mode: 'code-router',
      typescript: true,
      tailwind: true,
      git: true,
    })
    expect(starterInfo.version).toEqual('0.0.1')
  })

  it('should load a local template/starter file path', async () => {
    fs.mkdirSync(process.cwd(), { recursive: true })
    fs.writeFileSync(
      './template.json',
      JSON.stringify({
        id: 'template-id',
        name: 'Template Name',
        version: '0.0.1',
        description: 'template description',
        author: 'Test Author',
        license: 'MIT',
        link: 'https://example.com/template',
        type: 'starter',
        framework: 'react',
        mode: 'file-router',
        typescript: true,
        files: {
          './package.json': '{}',
        },
        deletedFiles: [],
      }),
    )

    const starter = await loadStarter('./template.json')

    expect(starter.id).toEqual('./template.json')
    await expect(starter.getFiles()).resolves.toEqual(['./package.json'])
  })
})
