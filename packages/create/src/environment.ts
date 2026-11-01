import {
  appendFile,
  copyFile,
  mkdir,
  readFile,
  readdir,
  unlink,
  writeFile,
} from 'node:fs/promises'
import { existsSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { execa } from 'execa'
import { rimraf } from 'rimraf'

import { createMemoryEnvironment as createEdgeMemoryEnvironment } from './edge-environment.js'
import { getBinaryFile } from './file-helpers.js'

import type { Environment } from './types.js'

export type { MemoryEnvironmentOutput } from './edge-environment.js'

export function createDefaultEnvironment(): Environment {
  let errors: Array<string> = []
  return {
    startRun: () => {
      errors = []
    },
    finishRun: () => {},
    getErrors: () => errors,

    appendFile: async (path: string, contents: string) => {
      await mkdir(dirname(path), { recursive: true })
      return appendFile(path, contents)
    },
    copyFile: async (from: string, to: string) => {
      await mkdir(dirname(to), { recursive: true })
      return copyFile(from, to)
    },
    writeFile: async (path: string, contents: string) => {
      await mkdir(dirname(path), { recursive: true })
      return writeFile(path, contents)
    },
    writeFileBase64: async (path: string, base64Contents: string) => {
      await mkdir(dirname(path), { recursive: true })
      return writeFile(path, getBinaryFile(base64Contents) as string)
    },
    execute: async (
      command: string,
      args: Array<string>,
      cwd: string,
      options?: { inherit?: boolean },
    ) => {
      try {
        if (options?.inherit) {
          // For commands that should show output directly to the user
          await execa(command, args, {
            cwd,
            stdio: 'inherit',
          })
          return { stdout: '' }
        } else {
          // For commands where we need to capture output
          const result = await execa(command, args, {
            cwd,
          })
          return { stdout: result.stdout }
        }
      } catch {
        errors.push(
          `Command "${command} ${args.join(' ')}" did not run successfully. Please run this manually in your project.`,
        )
        return { stdout: '' }
      }
    },
    deleteFile: async (path: string) => {
      if (existsSync(path)) {
        await unlink(path)
      }
    },

    readFile: async (path: string) => {
      return (await readFile(path)).toString()
    },
    exists: (path: string) => existsSync(path),
    isDirectory: (path: string) => statSync(path).isDirectory(),
    readdir: async (path: string) => readdir(path),
    rimraf: async (path: string) => {
      await rimraf(path)
    },

    appName: 'TanStack',

    startStep: () => {},
    finishStep: () => {},

    intro: () => {},
    outro: () => {},
    info: () => {},
    error: () => {},
    warn: () => {},
    confirm: () => Promise.resolve(true),
    spinner: () => ({
      start: () => {},
      stop: () => {},
    }),
  }
}

export function createMemoryEnvironment(returnPathsRelativeTo: string = '') {
  const { environment, output } =
    createEdgeMemoryEnvironment(returnPathsRelativeTo)
  const resolvePath = (path: string) => resolve(process.cwd(), path)

  const appendFile = environment.appendFile
  environment.appendFile = (path, contents) =>
    appendFile(resolvePath(path), contents)

  const copyFile = environment.copyFile
  environment.copyFile = (from, to) =>
    copyFile(resolvePath(from), resolvePath(to))

  const writeFile = environment.writeFile
  environment.writeFile = (path, contents) =>
    writeFile(resolvePath(path), contents)

  const writeFileBase64 = environment.writeFileBase64
  environment.writeFileBase64 = (path, contents) =>
    writeFileBase64(resolvePath(path), contents)

  const deleteFile = environment.deleteFile
  environment.deleteFile = (path) => deleteFile(resolvePath(path))

  const readFile = environment.readFile
  environment.readFile = (path) => readFile(resolvePath(path))

  const exists = environment.exists
  environment.exists = (path) => exists(resolvePath(path))

  const isDirectory = environment.isDirectory
  environment.isDirectory = (path) => isDirectory(resolvePath(path))

  const readdir = environment.readdir
  environment.readdir = (path) => readdir(resolvePath(path))

  const rimraf = environment.rimraf
  environment.rimraf = (path) => rimraf(resolvePath(path))

  return { environment, output }
}
