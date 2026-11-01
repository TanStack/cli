import { cleanUpFileArray, cleanUpFiles } from './edge-file-helpers.js'
import {
  basenamePath,
  dirnamePath,
  joinPaths,
  normalizePath,
} from './edge-path.js'

import type { Environment } from './types.js'

export interface MemoryEnvironmentOutput {
  files: Record<string, string>
  deletedFiles: Array<string>
  commands: Array<{ command: string; args: Array<string> }>
}

function hasDirectory(files: Record<string, string>, path: string) {
  const directory = normalizePath(path)
  const prefix = directory.endsWith('/') ? directory : `${directory}/`
  return Object.keys(files).some((file) => file.startsWith(prefix))
}

function createMissingDirectoryError(path: string) {
  return new Error(`Directory not found: ${path}`)
}

export function createMemoryEnvironment(returnPathsRelativeTo: string = '') {
  const output: MemoryEnvironmentOutput = {
    files: {},
    commands: [],
    deletedFiles: [],
  }
  const files: Record<string, string> = {}
  let errors: Array<string> = []

  const environment: Environment = {
    startRun: () => {
      errors = []
      output.files = {}
      output.commands = []
      output.deletedFiles = []
    },
    finishRun: () => {
      output.files = Object.keys(files).reduce<Record<string, string>>(
        (acc, file) => {
          acc[file] = files[file]
          return acc
        },
        {},
      )

      if (returnPathsRelativeTo.length) {
        output.files = cleanUpFiles(output.files, returnPathsRelativeTo)
        output.deletedFiles = cleanUpFileArray(
          output.deletedFiles,
          returnPathsRelativeTo,
        )
      }
    },
    getErrors: () => errors,

    appendFile: (path: string, contents: string) => {
      const normalized = normalizePath(path)
      files[normalized] = `${files[normalized] ?? ''}${contents}`
      return Promise.resolve()
    },
    copyFile: (from: string, to: string) => {
      const normalizedFrom = normalizePath(from)
      const normalizedTo = normalizePath(to)
      if (!(normalizedFrom in files)) {
        throw new Error(`File not found: ${from}`)
      }
      files[normalizedTo] = files[normalizedFrom]
      return Promise.resolve()
    },
    writeFile: (path: string, contents: string) => {
      files[normalizePath(path)] = contents
      return Promise.resolve()
    },
    writeFileBase64: (path: string, base64Contents: string) => {
      files[normalizePath(path)] = base64Contents
      return Promise.resolve()
    },
    execute: (command: string, args: Array<string>) => {
      output.commands.push({
        command,
        args,
      })
      return Promise.resolve({ stdout: '' })
    },
    deleteFile: (path: string) => {
      const normalized = normalizePath(path)
      output.deletedFiles.push(normalized)
      delete files[normalized]
      return Promise.resolve()
    },

    exists: (path: string) => {
      const normalized = normalizePath(path)
      return normalized in files || hasDirectory(files, normalized)
    },
    isDirectory: (path: string) => hasDirectory(files, path),
    readFile: (path: string) => {
      const normalized = normalizePath(path)
      if (!(normalized in files)) {
        throw new Error(`File not found: ${path}`)
      }
      return Promise.resolve(files[normalized])
    },
    readdir: (path: string) => {
      const normalized = normalizePath(path)
      const directory = normalized === '.' ? '' : normalized
      const prefix = directory ? `${directory}/` : ''

      if (directory && !hasDirectory(files, directory)) {
        throw createMissingDirectoryError(path)
      }

      const entries = new Set<string>()
      for (const file of Object.keys(files)) {
        if (!file.startsWith(prefix)) {
          continue
        }

        const rest = file.slice(prefix.length)
        const entry = rest.split('/')[0]
        if (entry) {
          entries.add(entry)
        }
      }

      return Promise.resolve(Array.from(entries))
    },
    rimraf: (path: string) => {
      const normalized = normalizePath(path)
      const prefix = normalized.endsWith('/') ? normalized : `${normalized}/`
      for (const file of Object.keys(files)) {
        if (file === normalized || file.startsWith(prefix)) {
          delete files[file]
        }
      }
      return Promise.resolve()
    },

    appName: 'TanStack',

    startStep: () => {},
    finishStep: () => {},

    intro: () => {},
    outro: () => {},
    info: () => {},
    error: (_title?: string, message?: string) => {
      if (message) {
        errors.push(message)
      }
    },
    warn: () => {},
    confirm: () => Promise.resolve(true),
    spinner: () => ({
      start: () => {},
      stop: () => {},
    }),
  }

  return {
    environment,
    output,
    paths: {
      basename: basenamePath,
      dirname: dirnamePath,
      join: joinPaths,
    },
  }
}
