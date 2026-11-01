import { describe, expect, it } from 'vitest'

import {
  formatCommand,
  handleSpecialURL,
  jsSafeName,
  sortObject,
} from '../src/utils.js'

describe('formatCommand', () => {
  it('should format a command', () => {
    expect(formatCommand({ command: 'echo', args: ['test'] })).toEqual(
      'echo test',
    )
  })
})

describe('jsSafeName', () => {
  it('should convert a string to a safe JS name', () => {
    expect(jsSafeName('test.foo')).toEqual('TestFoo')
  })
})

describe('sortObject', () => {
  it('should sort an object', () => {
    expect(sortObject({ b: 'b', a: 'a' })).toEqual({ a: 'a', b: 'b' })
  })
})

describe('handleSpecialURL', () => {
  it('should handle special URLs', () => {
    expect(
      handleSpecialURL(
        'https://github.com/TanStack/create-tsrouter-app/blob/main/examples/react/registry.json',
      ),
    ).toEqual(
      'https://raw.githubusercontent.com/TanStack/create-tsrouter-app/refs/heads/main/examples/react/registry.json',
    )

    expect(
      handleSpecialURL(
        'https://github.com/TanStack/create-tsrouter-app/tree/alpha/packages/cta-cli/tsconfig.json',
      ),
    ).toEqual(
      'https://raw.githubusercontent.com/TanStack/create-tsrouter-app/refs/heads/alpha/packages/cta-cli/tsconfig.json',
    )
  })
})
