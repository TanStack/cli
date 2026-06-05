import { basename, resolve } from 'node:path'
import validatePackageName from 'validate-npm-package-name'

const FALLBACK_PACKAGE_NAME = 'tanstack-app'

export function sanitizePackageName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/_/g, '-') // Replace underscores with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove invalid characters
    .replace(/^[^a-z]+/, '') // Ensure it starts with a letter
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/-$/, '') // Remove trailing hyphen
}

export function getCurrentDirectoryName(): string {
  return basename(process.cwd())
}

export function getDirectoryPackageName(directory: string): string {
  return sanitizePackageName(basename(resolve(directory))) || FALLBACK_PACKAGE_NAME
}

export function getCurrentDirectoryPackageName(): string {
  return getDirectoryPackageName(process.cwd())
}

export function isCurrentDirectoryProjectNameInput(name: string): boolean {
  const normalized = name.trim()
  return normalized === '' || normalized === '.'
}

export function resolveProjectLocation({
  projectName,
  targetDir,
  emptyProjectNameIsCurrentDirectory = false,
}: {
  projectName?: string
  targetDir?: string
  emptyProjectNameIsCurrentDirectory?: boolean
}): { projectName: string; targetDir: string } | undefined {
  const normalizedProjectName = projectName?.trim() ?? ''

  if (normalizedProjectName === '.') {
    return {
      projectName: getCurrentDirectoryPackageName(),
      targetDir: resolve(process.cwd()),
    }
  }

  if (normalizedProjectName) {
    return {
      projectName: normalizedProjectName,
      targetDir: targetDir
        ? resolve(targetDir)
        : resolve(process.cwd(), normalizedProjectName),
    }
  }

  if (targetDir) {
    const resolvedTargetDir = resolve(targetDir)
    return {
      projectName: getDirectoryPackageName(resolvedTargetDir),
      targetDir: resolvedTargetDir,
    }
  }

  if (emptyProjectNameIsCurrentDirectory) {
    return {
      projectName: getCurrentDirectoryPackageName(),
      targetDir: resolve(process.cwd()),
    }
  }

  return undefined
}

export function validateProjectName(name: string) {
  const { validForNewPackages, validForOldPackages, errors, warnings } =
    validatePackageName(name)
  const error = errors?.[0] || warnings?.[0]

  return {
    valid: validForNewPackages && validForOldPackages,
    error:
      error?.replace(/name/g, 'Project name') ||
      'Project name does not meet npm package naming requirements',
  }
}
