import { describe, expect, it } from 'vitest'

import { createSerializedOptions } from '../src/options.js'
import { AddOn, Framework, Options, Starter } from '../src/types.js'

describe('createSerializedOptions', () => {
  it('handle no add-ons', () => {
    const options = createSerializedOptions({
      framework: {
        id: 'react',
      } as Framework,
      chosenAddOns: [],
    } as unknown as Options)
    expect(options).toEqual({
      framework: 'react',
      chosenAddOns: [],
    })
  })

  it('handle add-ons and a starter', () => {
    const options = createSerializedOptions({
      framework: {
        id: 'react',
      } as Framework,
      chosenAddOns: [
        {
          id: 'add-on-1',
          description: 'Add-on 1',
          modes: ['file-router'],
        } as AddOn,
      ],
      starter: {
        id: 'starter-1',
      } as unknown as Starter,
    } as unknown as Options)
    expect(options).toEqual({
      framework: 'react',
      chosenAddOns: ['add-on-1'],
      starter: 'starter-1',
    })
  })
})
