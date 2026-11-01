import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  findFilesRecursively,
  isDirectory,
  readFileHelper,
  toCleanPath,
} from './file-helpers.js'

import type { AddOn, Framework, FrameworkDefinition } from './types.js'

const frameworks: Array<Framework> = []

export function scanProjectDirectory(
  projectDirectory: string,
  baseDirectory: string,
) {
  const absolutePaths: Record<string, string> = {}
  findFilesRecursively(baseDirectory, absolutePaths)

  const files = Object.keys(absolutePaths).reduce(
    (acc, path) => {
      acc[toCleanPath(path, baseDirectory)] = absolutePaths[path]
      return acc
    },
    {} as Record<string, string>,
  )

  const basePackageJSON = existsSync(resolve(baseDirectory, 'package.json'))
    ? JSON.parse(readFileSync(resolve(baseDirectory, 'package.json'), 'utf8'))
    : {}

  const optionalPackages = existsSync(
    resolve(projectDirectory, 'packages.json'),
  )
    ? JSON.parse(
        readFileSync(resolve(projectDirectory, 'packages.json'), 'utf8'),
      )
    : {}

  return {
    files,
    basePackageJSON,
    optionalPackages,
  }
}

export function scanAddOnDirectories(addOnsDirectories: Array<string>) {
  const addOns: Array<AddOn> = []

  for (const addOnsBase of addOnsDirectories) {
    for (const dir of readdirSync(addOnsBase).filter((file) =>
      isDirectory(resolve(addOnsBase, file)),
    )) {
      const filePath = resolve(addOnsBase, dir, 'info.json')
      const fileContent = readFileSync(filePath, 'utf-8')
      const info = JSON.parse(fileContent)

      let packageAdditions: Record<string, any> = {}
      let packageTemplate: string | undefined = undefined

      if (existsSync(resolve(addOnsBase, dir, 'package.json'))) {
        packageAdditions = JSON.parse(
          readFileSync(resolve(addOnsBase, dir, 'package.json'), 'utf-8'),
        )
      } else if (existsSync(resolve(addOnsBase, dir, 'package.json.ejs'))) {
        packageTemplate = readFileSync(
          resolve(addOnsBase, dir, 'package.json.ejs'),
          'utf-8',
        )
      }

      let readme: string | undefined
      let readmeIsEjs = false
      if (existsSync(resolve(addOnsBase, dir, 'README.md'))) {
        readme = readFileSync(resolve(addOnsBase, dir, 'README.md'), 'utf-8')
      } else if (existsSync(resolve(addOnsBase, dir, 'README.md.ejs'))) {
        readme = readFileSync(
          resolve(addOnsBase, dir, 'README.md.ejs'),
          'utf-8',
        )
        readmeIsEjs = true
      }

      let smallLogo: string | undefined
      if (existsSync(resolve(addOnsBase, dir, 'small-logo.svg'))) {
        smallLogo = readFileSync(
          resolve(addOnsBase, dir, 'small-logo.svg'),
          'utf-8',
        )
      }

      const absoluteFiles: Record<string, string> = {}
      const assetsDir = resolve(addOnsBase, dir, 'assets')
      if (existsSync(assetsDir)) {
        findFilesRecursively(assetsDir, absoluteFiles)
      }
      const files: Record<string, string> = {}
      for (const file of Object.keys(absoluteFiles)) {
        files[toCleanPath(file, assetsDir)] = readFileHelper(file)
      }

      const getFiles = () => {
        return Promise.resolve(Object.keys(files))
      }
      const getFileContents = (path: string) => {
        return Promise.resolve(files[path])
      }

      addOns.push({
        ...info,
        id: dir,
        version: info.version ?? '0.0.0',
        packageAdditions,
        packageTemplate,
        readme,
        readmeIsEjs,
        files,
        smallLogo,
        getFiles,
        getFileContents,
        getDeletedFiles: () => Promise.resolve(info.deletedFiles ?? []),
      })
    }
  }

  return addOns
}

export function __testRegisterFramework(framework: Framework) {
  frameworks.push(framework)
}

export function __testClearFrameworks() {
  frameworks.length = 0
}

export function registerFramework(framework: FrameworkDefinition) {
  const { addOns, base, ...rest } = framework

  const frameworkWithBundler: Framework = {
    ...rest,
    getFiles: () => Promise.resolve(Object.keys(base)),
    getFileContents: (path: string) => {
      return Promise.resolve(base[path])
    },
    getDeletedFiles: () => {
      return Promise.resolve([])
    },
    getAddOns: () => addOns,
  }

  frameworks.push(frameworkWithBundler)
}

export function getFrameworkById(id: string) {
  if (id === 'react-cra') {
    return frameworks.find((framework) => framework.id === 'react')
  }

  return frameworks.find((framework) => framework.id === id)
}

export function getFrameworkByName(name: string) {
  return frameworks.find(
    (framework) => framework.name.toLowerCase() === name.toLowerCase(),
  )
}

export function getFrameworks() {
  return frameworks
}
