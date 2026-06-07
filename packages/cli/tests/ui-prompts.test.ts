import { describe, it, expect, vi } from 'vitest'

import * as clack from '@clack/prompts'

import {
  getProjectName,
  selectAddOns,
  selectGit,
  selectPackageManager,
  selectTemplate,
  selectToolchain,
} from '../src/ui-prompts'

import type { AddOn, Framework } from '@tanstack/create'

vi.mock('@clack/prompts')

vi.spyOn(process, 'exit').mockImplementation((number) => {
  throw new Error(`process.exit: ${number}`)
})

describe('getProjectName', () => {
  it('should return the project name', async () => {
    vi.spyOn(clack, 'text').mockImplementation(async () => 'my-app')
    vi.spyOn(clack, 'isCancel').mockImplementation(() => false)

    const projectName = await getProjectName()
    expect(projectName).toBe('my-app')
  })

  it('should allow blank and "." project names for current directory creation', async () => {
    const textSpy = vi.spyOn(clack, 'text').mockImplementation(async () => '')
    vi.spyOn(clack, 'isCancel').mockImplementation(() => false)

    const projectName = await getProjectName()
    const textOptions = textSpy.mock.calls[0]![0] as {
      message?: string
      placeholder?: string
      validate?: (value: string) => string | undefined
    }

    expect(projectName).toBe('')
    expect(textOptions.message).toBe(
      'Project name (leave empty to use current directory)',
    )
    expect(textOptions.placeholder).toBeUndefined()
    expect(textOptions.validate?.('')).toBeUndefined()
    expect(textOptions.validate?.('.')).toBeUndefined()
  })

  it('should exit on cancel', async () => {
    vi.spyOn(clack, 'text').mockImplementation(async () => 'Cancelled')
    vi.spyOn(clack, 'isCancel').mockImplementation(() => true)

    await expect(getProjectName()).rejects.toThrowError(/exit/)
  })
})

describe('selectPackageManager', () => {
  it('should select pnpm', async () => {
    vi.spyOn(clack, 'select').mockImplementation(async () => 'pnpm')
    vi.spyOn(clack, 'isCancel').mockImplementation(() => false)

    const packageManager = await selectPackageManager()
    expect(packageManager).toBe('pnpm')
  })

  it('should exit on cancel', async () => {
    vi.spyOn(clack, 'select').mockImplementation(async () =>
      Symbol.for('cancel'),
    )
    vi.spyOn(clack, 'isCancel').mockImplementation(() => true)

    await expect(selectPackageManager()).rejects.toThrowError(/exit/)
  })
})

describe('selectTemplate', () => {
  it('should select a template id', async () => {
    vi.spyOn(clack, 'select').mockImplementation(async () => 'blog')
    vi.spyOn(clack, 'isCancel').mockImplementation(() => false)

    const selectedTemplate = await selectTemplate([
      { id: 'blog', name: 'Blog', description: 'A blog template' },
    ])

    expect(selectedTemplate).toBe('blog')
  })

  it('should return undefined when no templates are available', async () => {
    const selectedTemplate = await selectTemplate([])
    expect(selectedTemplate).toBeUndefined()
  })

  it('should exit on cancel', async () => {
    vi.spyOn(clack, 'select').mockImplementation(async () => Symbol.for('cancel'))
    vi.spyOn(clack, 'isCancel').mockImplementation(() => true)

    await expect(
      selectTemplate([{ id: 'blog', name: 'Blog' }]),
    ).rejects.toThrowError(/exit/)
  })
})

describe('selectAddOns', () => {
  it('should show keyboard shortcuts help and select add-ons', async () => {
    const noteSpy = vi.spyOn(clack, 'note').mockImplementation(() => {})
    const multiselectSpy = vi
      .spyOn(clack, 'multiselect')
      .mockImplementation(async () => ['add-on-1'])
    vi.spyOn(clack, 'isCancel').mockImplementation(() => false)

    const packageManager = await selectAddOns(
      {
        getAddOns: () =>
          [
            {
              id: 'add-on-1',
              name: 'Add-on 1',
              description: 'Add-on 1 description',
              type: 'add-on',
              modes: ['file-router'],
            },
          ] as Array<AddOn>,
      } as Framework,
      'file-router',
      'add-on',
      'Select add-ons',
    )

    expect(packageManager).toEqual(['add-on-1'])
    expect(noteSpy).toHaveBeenCalledWith(
      'Use ↑/↓ to navigate • Space to select/deselect • Enter to confirm',
      'Keyboard Shortcuts',
    )
    expect(multiselectSpy).toHaveBeenCalledWith(
      expect.objectContaining({ maxItems: 1 }),
    )
  })

  it('should exit on cancel', async () => {
    vi.spyOn(clack, 'select').mockImplementation(async () =>
      Symbol.for('cancel'),
    )
    vi.spyOn(clack, 'isCancel').mockImplementation(() => true)

    await expect(
      selectAddOns(
        {
          getAddOns: () =>
            [
              {
                id: 'add-on-1',
                name: 'Add-on 1',
                description: 'Add-on 1 description',
                type: 'add-on',
                modes: ['file-router'],
              },
            ] as Array<AddOn>,
        } as Framework,
        'file-router',
        'add-on',
        'Select add-ons',
      ),
    ).rejects.toThrowError(/exit/)
  })
})

describe('selectGit', () => {
  it('should select git', async () => {
    vi.spyOn(clack, 'confirm').mockImplementation(async () => true)
    vi.spyOn(clack, 'isCancel').mockImplementation(() => false)

    const git = await selectGit()
    expect(git).toBe(true)
  })

  it('should exit on cancel', async () => {
    vi.spyOn(clack, 'confirm').mockImplementation(async () =>
      Symbol.for('cancel'),
    )
    vi.spyOn(clack, 'isCancel').mockImplementation(() => true)

    await expect(selectGit()).rejects.toThrowError(/exit/)
  })
})

describe('selectToolchain', () => {
  it('should select a toolchain', async () => {
    vi.spyOn(clack, 'select').mockImplementation(async () => 'biome')
    vi.spyOn(clack, 'isCancel').mockImplementation(() => false)

    const packageManager = await selectToolchain({
      getAddOns: () =>
        [
          {
            id: 'biome',
            name: 'Biome',
            description: 'Biome description',
            type: 'toolchain',
            modes: ['file-router'],
          },
        ] as Array<AddOn>,
    } as Framework)
    expect(packageManager).toEqual('biome')
  })
  it('should select a toolchain', async () => {
    const selectSpy = vi
      .spyOn(clack, 'select')
      .mockImplementation(async () => 'biome')
    vi.spyOn(clack, 'isCancel').mockImplementation(() => false)

    const packageManager = await selectToolchain(
      {
        getAddOns: () =>
          [
            {
              id: 'biome',
              name: 'Biome',
              description: 'Biome description',
              type: 'toolchain',
              modes: ['file-router'],
            },
          ] as Array<AddOn>,
      } as Framework,
      'biome',
    )
    expect(packageManager).toEqual('biome')
    expect(selectSpy).not.toHaveBeenCalled()
  })

  it('should exit on cancel', async () => {
    vi.spyOn(clack, 'select').mockImplementation(async () =>
      Symbol.for('cancel'),
    )
    vi.spyOn(clack, 'isCancel').mockImplementation(() => true)

    await expect(
      selectToolchain({
        getAddOns: () =>
          [
            {
              id: 'biome',
              name: 'Biome',
              description: 'Biome description',
              type: 'toolchain',
              modes: ['file-router'],
            },
          ] as Array<AddOn>,
      } as Framework),
    ).rejects.toThrowError(/exit/)
  })
})
