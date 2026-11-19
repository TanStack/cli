import { describe, expect, it } from 'vitest'

import { finalizeAddOns, getAllAddOns } from '../src/add-ons.js'

import type { AddOn, Framework } from '../src/types.js'

describe('getAllAddOns', () => {
  it('filter add-ons', () => {
    const addOns = getAllAddOns(
      {
        id: 'react',
        getAddOns: () => [
          {
            id: 'add-on-1',
            description: 'Add-on 1',
            modes: ['file-router'],
          } as AddOn,
          {
            id: 'add-on-2',
            description: 'Add-on 2',
            modes: ['code-router'],
          } as AddOn,
        ],
      } as Framework,
      'file-router',
    )

    expect(addOns.length).toEqual(1)
    expect(addOns[0].id).toEqual('add-on-1')
  })

  it('should sort add-ons by priority (higher priority first)', () => {
    const addOns = getAllAddOns(
      {
        id: 'react',
        getAddOns: () => [
          {
            id: 'low-priority',
            description: 'Low Priority',
            modes: ['file-router'],
            priority: 10,
          } as AddOn,
          {
            id: 'high-priority',
            description: 'High Priority',
            modes: ['file-router'],
            priority: 100,
          } as AddOn,
          {
            id: 'no-priority',
            description: 'No Priority (defaults to 0)',
            modes: ['file-router'],
          } as AddOn,
          {
            id: 'medium-priority',
            description: 'Medium Priority',
            modes: ['file-router'],
            priority: 50,
          } as AddOn,
        ],
      } as Framework,
      'file-router',
    )

    expect(addOns.length).toEqual(4)
    expect(addOns[0].id).toEqual('high-priority')
    expect(addOns[1].id).toEqual('medium-priority')
    expect(addOns[2].id).toEqual('low-priority')
    expect(addOns[3].id).toEqual('no-priority')
  })

  it('should filter by mode and then sort by priority', () => {
    const addOns = getAllAddOns(
      {
        id: 'react',
        getAddOns: () => [
          {
            id: 'file-router-low',
            description: 'File Router Low',
            modes: ['file-router'],
            priority: 20,
          } as AddOn,
          {
            id: 'code-router-high',
            description: 'Code Router High (should be filtered out)',
            modes: ['code-router'],
            priority: 200,
          } as AddOn,
          {
            id: 'file-router-high',
            description: 'File Router High',
            modes: ['file-router'],
            priority: 100,
          } as AddOn,
        ],
      } as Framework,
      'file-router',
    )

    expect(addOns.length).toEqual(2)
    expect(addOns[0].id).toEqual('file-router-high')
    expect(addOns[1].id).toEqual('file-router-low')
  })
})

describe('finalizeAddOns', () => {
  it('should finalize add-ons', async () => {
    const addOns = await finalizeAddOns(
      {
        id: 'react',
        getAddOns: () => [
          {
            id: 'add-on-1',
            description: 'Add-on 1',
            modes: ['file-router'],
            dependsOn: ['add-on-2'],
          } as AddOn,
          {
            id: 'add-on-2',
            description: 'Add-on 2',
            modes: ['file-router'],
          } as AddOn,
          {
            id: 'add-on-3',
            description: 'Add-on 3',
            modes: ['file-router'],
          } as AddOn,
        ],
      } as Framework,
      'file-router',
      ['add-on-1'],
    )

    expect(addOns.length).toEqual(2)
    const addOnIds = addOns.map((a) => a.id)
    expect(addOnIds.includes('add-on-1')).toEqual(true)
    expect(addOnIds.includes('add-on-2')).toEqual(true)
    expect(addOnIds.includes('add-on-3')).toEqual(false)
  })
})


describe('Router-only add-on compatibility', () => {
  const framework = {
    id: 'react',
    getAddOns: () => [
      { id: 'query', type: 'add-on', modes: ['file-router'], supportsRouterOnly: true },
      { id: 'auth', type: 'add-on', modes: ['file-router'] },
      { id: 'eslint', type: 'toolchain', modes: ['file-router'] },
      { id: 'host', type: 'deployment', modes: ['file-router'], supportsRouterOnly: true },
      { id: 'unsafe-chain', type: 'add-on', modes: ['file-router'], supportsRouterOnly: true, dependsOn: ['auth'] },
    ],
  } as unknown as Framework

  it('offers opted-in add-ons and toolchains without exposing Start integrations', () => {
    expect(getAllAddOns(framework, 'file-router', 'vite', true).map((a) => a.id)).toEqual(['query', 'eslint'])
  })

  it('preserves compatible explicit add-ons', async () => {
    expect((await finalizeAddOns(framework, 'file-router', ['query', 'eslint'], 'vite', true)).map((a) => a.id)).toEqual(['query', 'eslint'])
  })

  it.each(['auth', 'unsafe-chain', 'host'])('rejects Start dependencies for %s', async (id) => {
    await expect(finalizeAddOns(framework, 'file-router', [id], 'vite', true)).rejects.toThrow('does not support Router-only')
  })
})
