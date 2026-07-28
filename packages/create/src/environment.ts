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
import { dirname } from 'node:path'
import { execa } from 'execa'
import { memfs } from 'memfs'
import { rimraf } from 'rimraf'

import {
  cleanUpFileArray,
  cleanUpFiles,
  getBinaryFile,
} from './file-helpers.js'

import type { Environment } from './types.js'

export interface MemoryEnvironmentOutput {
  files: Record<string, string>
  deletedFiles: Array<string>
  commands: Array<{ command: string; args: Array<string> }>
}

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
      if (existsSync(path)) {
        const existing = await readFile(path, 'utf-8')
        if (existing.length > 0) {
          await appendFile(path, existing.endsWith('\n') ? '\n' : '\n\n')
        }
      }
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
  const environment = createDefaultEnvironment()

  const output: MemoryEnvironmentOutput = {
    files: {},
    commands: [],
    deletedFiles: [],
  }

  const { fs, vol } = memfs({})

  environment.appendFile = async (path: string, contents: string) => {
    fs.mkdirSync(dirname(path), { recursive: true })
    if (fs.existsSync(path)) {
      const existing = fs.readFileSync(path, 'utf-8') as string
      if (existing.length > 0) {
        fs.appendFileSync(path, existing.endsWith('\n') ? '\n' : '\n\n')
      }
    }
    fs.appendFileSync(path, contents)
  }
  environment.copyFile = async (from: string, to: string) => {
    fs.mkdirSync(dirname(to), { recursive: true })
    fs.copyFileSync(from, to)
    return Promise.resolve()
  }
  environment.execute = async (command: string, args: Array<string>) => {
    output.commands.push({
      command,
      args,
    })
    return Promise.resolve({ stdout: '' })
  }
  environment.readFile = async (path: string) => {
    return Promise.resolve(fs.readFileSync(path, 'utf-8').toString())
  }
  environment.writeFile = async (path: string, contents: string) => {
    fs.mkdirSync(dirname(path), { recursive: true })
    await fs.writeFileSync(path, contents)
  }
  environment.writeFileBase64 = async (path: string, contents: string) => {
    // For the in-memory file system, we are not converting the base64 to binary
    // because it's not needed.
    fs.mkdirSync(dirname(path), { recursive: true })
    await fs.writeFileSync(path, contents)
  }
  environment.deleteFile = async (path: string) => {
    output.deletedFiles.push(path)
    if (fs.existsSync(path)) {
      await fs.unlinkSync(path)
    }
  }
  environment.finishRun = () => {
    output.files = vol.toJSON() as Record<string, string>
    for (const file of Object.keys(output.files)) {
      if (fs.statSync(file).isDirectory()) {
        delete output.files[file]
      }
    }
    if (returnPathsRelativeTo.length) {
      output.files = cleanUpFiles(output.files, returnPathsRelativeTo)
      output.deletedFiles = cleanUpFileArray(
        output.deletedFiles,
        returnPathsRelativeTo,
      )
    }
  }
  environment.exists = (path: string) => {
    return fs.existsSync(path)
  }
  environment.isDirectory = (path: string) => {
    return fs.statSync(path).isDirectory()
  }
  environment.readdir = async (path: string) => {
    return Promise.resolve(fs.readdirSync(path).map((d) => d.toString()))
  }
  environment.rimraf = async () => {}

  return {
    environment,
    output,
  }
}
