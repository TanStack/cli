import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const RELEASE_COMMIT_PREFIX = 'ci: Version Packages'
const WORKSPACE_DIRS = ['packages', 'cli-aliases']
const PATCH_TYPES = new Set(['fix', 'perf', 'refactor', 'docs', 'chore', 'build', 'ci', 'test', 'style'])

function runGit(args) {
  return execSync(`git ${args}`, { encoding: 'utf8' }).trim()
}

async function getPendingChangesetFiles() {
  const changesetDir = path.resolve('.changeset')
  if (!existsSync(changesetDir)) return []

  const entries = await readdir(changesetDir, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .filter((name) => name !== 'README.md')
}

async function getPublishablePackages() {
  const packages = []

  for (const workspaceDir of WORKSPACE_DIRS) {
    const absWorkspaceDir = path.resolve(workspaceDir)
    if (!existsSync(absWorkspaceDir)) continue

    const dirEntries = await readdir(absWorkspaceDir, { withFileTypes: true })
    for (const dirEntry of dirEntries) {
      if (!dirEntry.isDirectory()) continue

      const relDir = path.join(workspaceDir, dirEntry.name)
      const packageJsonPath = path.resolve(relDir, 'package.json')
      if (!existsSync(packageJsonPath)) continue

      const raw = await readFile(packageJsonPath, 'utf8')
      const pkg = JSON.parse(raw)
      if (pkg.private || typeof pkg.name !== 'string') continue

      packages.push({
        name: pkg.name,
        dir: relDir.replace(/\\/g, '/'),
      })
    }
  }

  return packages
}

function getBaseSha() {
  const lastReleaseSha = runGit(`log --format=%H --grep="^${RELEASE_COMMIT_PREFIX}" -n 1 HEAD`)
  if (lastReleaseSha) return lastReleaseSha

  const roots = runGit('rev-list --max-parents=0 HEAD')
  return roots.split('\n').map((line) => line.trim()).filter(Boolean).at(-1)
}

function parseCommitRecords(baseSha) {
  const raw = runGit(`log --format=%H%x1f%s%x1f%b%x1e ${baseSha}..HEAD`)
  if (!raw) return []

  return raw
    .split('\x1e')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [sha, subject, body = ''] = entry.split('\x1f')
      return {
        sha,
        subject: subject ?? '',
        body,
      }
    })
}

function getCommitBump(commit) {
  const headerMatch = commit.subject.match(/^([a-z]+)(\([^)]*\))?(!)?:\s+/i)
  const type = headerMatch?.[1]?.toLowerCase()
  const breaking = Boolean(headerMatch?.[3]) || /BREAKING CHANGE:/i.test(commit.body)

  if (breaking) return 'major'
  if (type === 'feat') return 'minor'
  if (type && PATCH_TYPES.has(type)) return 'patch'
  return null
}

function mergeBump(current, incoming) {
  const rank = { patch: 1, minor: 2, major: 3 }
  if (!current) return incoming
  if (!incoming) return current
  return rank[incoming] > rank[current] ? incoming : current
}

function getChangedFiles(baseSha) {
  const raw = runGit(`diff --name-only ${baseSha}..HEAD`)
  if (!raw) return []
  return raw.split('\n').map((line) => line.trim()).filter(Boolean)
}

function getTargetPackageNames(changedFiles, packages) {
  const affected = new Set()
  let globalImpact = false

  for (const file of changedFiles) {
    const normalized = file.replace(/\\/g, '/')

    if (
      normalized.startsWith('.changeset/') ||
      normalized === 'pnpm-lock.yaml' ||
      normalized === 'package.json'
    ) {
      globalImpact = true
      continue
    }

    let matched = false
    for (const pkg of packages) {
      if (normalized === pkg.dir || normalized.startsWith(`${pkg.dir}/`)) {
        affected.add(pkg.name)
        matched = true
      }
    }

    if (!matched) {
      globalImpact = true
    }
  }

  if (globalImpact) {
    return packages.map((pkg) => pkg.name)
  }

  return [...affected]
}

async function writeChangesetFile(packageNames, bump, commits) {
  const changesetDir = path.resolve('.changeset')
  if (!existsSync(changesetDir)) {
    await mkdir(changesetDir, { recursive: true })
  }

  const branchName = process.env.GITHUB_REF_NAME || runGit('branch --show-current') || 'branch'
  const shortSha = runGit('rev-parse --short HEAD')
  const fileName = `auto-semantic-${branchName}-${shortSha}.md`.replace(/[^a-zA-Z0-9._-]/g, '-')
  const filePath = path.join(changesetDir, fileName)

  const frontmatter = packageNames
    .sort((a, b) => a.localeCompare(b))
    .map((pkgName) => `'${pkgName}': ${bump}`)
    .join('\n')

  const bullets = commits
    .slice(0, 6)
    .map((commit) => `- ${commit.subject} (${commit.sha.slice(0, 7)})`)
    .join('\n')

  const content = `---\n${frontmatter}\n---\n\nAuto-generated changeset from semantic commits on ${branchName}.\n\n${bullets}\n`

  await writeFile(filePath, content, 'utf8')
  return fileName
}

async function main() {
  const pendingChangesets = await getPendingChangesetFiles()
  if (pendingChangesets.length > 0) {
    console.log(`Found ${pendingChangesets.length} authored changeset(s); skipping semantic fallback.`)
    return
  }

  const baseSha = getBaseSha()
  const commits = parseCommitRecords(baseSha)
  const releaseCommits = commits
    .filter((commit) => !commit.subject.startsWith(RELEASE_COMMIT_PREFIX))
    .map((commit) => ({ ...commit, bump: getCommitBump(commit) }))
    .filter((commit) => Boolean(commit.bump))

  if (releaseCommits.length === 0) {
    console.log('No semantic commits eligible for release; skipping generated changeset.')
    return
  }

  const packages = await getPublishablePackages()
  if (packages.length === 0) {
    console.log('No publishable workspace packages found; skipping generated changeset.')
    return
  }

  const changedFiles = getChangedFiles(baseSha)
  const targetPackages = getTargetPackageNames(changedFiles, packages)
  if (targetPackages.length === 0) {
    console.log('No affected publishable packages detected; skipping generated changeset.')
    return
  }

  let bump = null
  for (const commit of releaseCommits) {
    bump = mergeBump(bump, commit.bump)
  }

  if (!bump) {
    console.log('Unable to determine bump level; skipping generated changeset.')
    return
  }

  const fileName = await writeChangesetFile(targetPackages, bump, releaseCommits)

  console.log(
    `Generated ${fileName} (${bump}) for ${targetPackages.length} package(s) based on semantic commits.`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
