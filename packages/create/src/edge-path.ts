export function normalizePath(path: string): string {
  const normalized = path.replace(/\\/g, '/')
  const isAbsolute = normalized.startsWith('/')
  const parts: Array<string> = []

  for (const part of normalized.split('/')) {
    if (!part || part === '.') {
      continue
    }
    if (part === '..') {
      if (parts.length && parts[parts.length - 1] !== '..') {
        parts.pop()
      } else if (!isAbsolute) {
        parts.push(part)
      }
      continue
    }
    parts.push(part)
  }

  const joined = parts.join('/')
  if (isAbsolute) {
    return joined ? `/${joined}` : '/'
  }

  return joined || '.'
}

export function joinPaths(...paths: Array<string | undefined>): string {
  const filtered = paths.filter(
    (path): path is string => typeof path === 'string' && path.length > 0,
  )
  if (!filtered.length) {
    return '.'
  }

  return normalizePath(filtered.join('/'))
}

export function basenamePath(path: string): string {
  const normalized = normalizePath(path)
  if (normalized === '/') {
    return ''
  }

  return normalized.split('/').pop() ?? ''
}

export function dirnamePath(path: string): string {
  const normalized = normalizePath(path)
  if (normalized === '/') {
    return '/'
  }

  const parts = normalized.split('/')
  parts.pop()

  if (!parts.length) {
    return '.'
  }

  if (parts.length === 1 && parts[0] === '') {
    return '/'
  }

  return parts.join('/') || '.'
}

export function extnamePath(path: string): string {
  const basename = basenamePath(path)
  const index = basename.lastIndexOf('.')
  if (index <= 0) {
    return ''
  }

  return basename.slice(index)
}
