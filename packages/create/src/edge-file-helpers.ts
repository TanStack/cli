import { basenamePath, extnamePath } from './edge-path.js'
import { hasDrive, stripDrive } from './utils.js'

const BINARY_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico']

export function isBinaryFile(path: string): boolean {
  return BINARY_EXTENSIONS.includes(extnamePath(path))
}

export function isBase64(content: string): boolean {
  return content.startsWith('base64::')
}

export function toCleanPath(absolutePath: string, baseDir: string): string {
  const normalizedPath = absolutePath.replace(/\\/g, '/')
  const normalizedBase = baseDir.replace(/\\/g, '/')
  let cleanPath = normalizedPath
  if (normalizedPath.startsWith(normalizedBase)) {
    cleanPath = normalizedPath.slice(normalizedBase.length)
  } else if (hasDrive(normalizedPath) !== hasDrive(normalizedBase)) {
    const pathNoDrive = stripDrive(normalizedPath)
    const baseNoDrive = stripDrive(normalizedBase)
    if (pathNoDrive.startsWith(baseNoDrive)) {
      cleanPath = pathNoDrive.slice(baseNoDrive.length)
    }
  }
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.slice(1)
  }
  return cleanPath
}

export function relativePath(
  from: string,
  to: string,
  stripExtension: boolean = false,
) {
  const normalized = from.replace(/\\/g, '/')
  const cleanedFrom = normalized.startsWith('./')
    ? normalized.slice(2)
    : normalized
  const cleanedTo = to.startsWith('./') ? to.slice(2) : to

  const fromSegments = cleanedFrom.split('/')
  const toSegments = cleanedTo.split('/')

  fromSegments.pop()
  toSegments.pop()

  let commonIndex = 0
  while (
    commonIndex < fromSegments.length &&
    commonIndex < toSegments.length &&
    fromSegments[commonIndex] === toSegments[commonIndex]
  ) {
    commonIndex++
  }

  const upLevels = fromSegments.length - commonIndex
  const downLevels = toSegments.slice(commonIndex)
  const target = stripExtension ? to.replace(extnamePath(to), '') : to

  if (upLevels === 0 && downLevels.length === 0) {
    return `./${basenamePath(target)}`
  } else if (upLevels === 0 && downLevels.length > 0) {
    return `./${downLevels.join('/')}/${basenamePath(target)}`
  } else {
    const relative = [...Array(upLevels).fill('..'), ...downLevels].join('/')
    return `${relative}/${basenamePath(target)}`
  }
}

export function isDemoFilePath(path?: string): boolean {
  if (!path) return false
  const normalized = path.replace(/\\/g, '/')

  if (
    normalized.includes('/routes/demo/') ||
    normalized.includes('/routes/example/')
  ) {
    return true
  }

  const filename = normalized.split('/').pop() || ''
  return (
    filename.startsWith('demo.') ||
    filename.startsWith('demo-') ||
    filename.startsWith('example.') ||
    filename.startsWith('example-')
  )
}

export function cleanUpFiles(
  files: Record<string, string>,
  targetDir?: string,
) {
  return Object.keys(files).reduce<Record<string, string>>((acc, file) => {
    if (basenamePath(file) !== '.cta.json') {
      acc[targetDir ? toCleanPath(file, targetDir) : file] = files[file]
    }
    return acc
  }, {})
}

export function cleanUpFileArray(files: Array<string>, targetDir?: string) {
  return files.reduce<Array<string>>((acc, file) => {
    if (basenamePath(file) !== '.cta.json') {
      acc.push(targetDir ? toCleanPath(file, targetDir) : file)
    }
    return acc
  }, [])
}
