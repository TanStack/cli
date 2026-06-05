// @ts-nocheck
import { execFileSync, execSync } from 'node:child_process'
import fs, { globSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const rootDir = path.join(import.meta.dirname, '..')
const ghToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN
const workspaceDirs = ['packages', 'cli-aliases']

const usernameCache = {}
async function resolveUsername(email) {
  if (!ghToken || !email) return null
  if (usernameCache[email] !== undefined) return usernameCache[email]

  try {
    const res = await fetch(`https://api.github.com/search/users?q=${email}`, {
      headers: { Authorization: `token ${ghToken}` },
    })
    const data = await res.json()
    const login = data?.items?.[0]?.login || null
    usernameCache[email] = login
    return login
  } catch {
    usernameCache[email] = null
    return null
  }
}

const prAuthorCache = {}
async function resolveAuthorForPR(prNumber) {
  if (prAuthorCache[prNumber] !== undefined) return prAuthorCache[prNumber]

  if (!ghToken) {
    prAuthorCache[prNumber] = null
    return null
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/TanStack/cli/pulls/${prNumber}`,
      { headers: { Authorization: `token ${ghToken}` } },
    )
    const data = await res.json()
    const login = data?.user?.login || null
    prAuthorCache[prNumber] = login
    return login
  } catch {
    prAuthorCache[prNumber] = null
    return null
  }
}

// This runs after the "ci: Version Packages" PR is merged, so HEAD is the
// release commit.
const releaseLogs = execSync(
  'git log --oneline --grep="^ci: Version Packages" --grep="^ci: changeset release" --format=%H',
)
  .toString()
  .trim()
  .split('\n')
  .filter(Boolean)

const currentRelease = releaseLogs[0] || 'HEAD'
const previousRelease = releaseLogs[1]

const bumpedPackages = []
for (const workspaceDir of workspaceDirs) {
  const absWorkspaceDir = path.join(rootDir, workspaceDir)
  const pkgJsonPaths = globSync('*/package.json', { cwd: absWorkspaceDir })

  for (const relPath of pkgJsonPaths) {
    const fullPath = path.join(absWorkspaceDir, relPath)
    const currentPkg = JSON.parse(fs.readFileSync(fullPath, 'utf-8'))
    if (currentPkg.private) continue

    const repoRelPath = `${workspaceDir}/${relPath}`
    if (previousRelease) {
      try {
        const prevContent = execFileSync(
          'git',
          ['show', `${previousRelease}:${repoRelPath}`],
          { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] },
        )
        const prevPkg = JSON.parse(prevContent)
        if (prevPkg.version !== currentPkg.version) {
          bumpedPackages.push({
            name: currentPkg.name,
            version: currentPkg.version,
            prevVersion: prevPkg.version,
            dir: path.dirname(repoRelPath),
          })
        }
      } catch {
        bumpedPackages.push({
          name: currentPkg.name,
          version: currentPkg.version,
          prevVersion: null,
          dir: path.dirname(repoRelPath),
        })
      }
    } else {
      bumpedPackages.push({
        name: currentPkg.name,
        version: currentPkg.version,
        prevVersion: null,
        dir: path.dirname(repoRelPath),
      })
    }
  }
}

bumpedPackages.sort((a, b) => a.name.localeCompare(b.name))

const rangeFrom = previousRelease || `${currentRelease}~1`
const rawLog = execSync(
  `git log ${rangeFrom}..${currentRelease} --pretty=format:"%h %ae %s" --no-merges`,
  { encoding: 'utf-8' },
).trim()

const typeOrder = [
  'breaking',
  'feat',
  'fix',
  'perf',
  'refactor',
  'docs',
  'chore',
  'test',
  'ci',
]
const typeLabels = {
  breaking: 'Breaking Changes',
  feat: 'Features',
  fix: 'Fix',
  perf: 'Performance',
  refactor: 'Refactor',
  docs: 'Documentation',
  chore: 'Chore',
  test: 'Tests',
  ci: 'CI',
}
const typeIndex = (type) => {
  const index = typeOrder.indexOf(type)
  return index === -1 ? 99 : index
}

const groups = {}
const commits = rawLog ? rawLog.split('\n') : []

for (const line of commits) {
  const match = line.match(/^(\w+)\s+(\S+)\s+(.*)$/)
  if (!match) continue
  const [, hash, email, subject] = match

  if (
    subject.startsWith('ci: Version Packages') ||
    subject.startsWith('ci: changeset release')
  ) {
    continue
  }

  const conventionalMatch = subject.match(/^(\w+)(?:\(([^)]*)\))?(!)?:\s*(.*)$/)
  const type = conventionalMatch ? conventionalMatch[1] : 'other'
  const isBreaking = conventionalMatch ? Boolean(conventionalMatch[3]) : false
  const scope = conventionalMatch ? conventionalMatch[2] || '' : ''
  const message = conventionalMatch ? conventionalMatch[4] : subject

  if (!['chore', 'feat', 'fix', 'perf', 'refactor', 'build'].includes(type)) {
    continue
  }

  const prMatch = message.match(/\(#(\d+)\)/)
  const prNumber = prMatch ? prMatch[1] : null

  const bucket = isBreaking ? 'breaking' : type
  if (!groups[bucket]) groups[bucket] = []
  groups[bucket].push({ hash, email, scope, message, prNumber })
}

const sortedTypes = Object.keys(groups).sort(
  (a, b) => typeIndex(a) - typeIndex(b),
)

let changelogMd = ''
for (const type of sortedTypes) {
  const label = typeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1)
  changelogMd += `### ${label}\n\n`

  for (const commit of groups[type]) {
    const scopePrefix = commit.scope ? `${commit.scope}: ` : ''
    const cleanMessage = commit.message.replace(/\s*\(#\d+\)/, '')
    const prRef = commit.prNumber ? ` (#${commit.prNumber})` : ''
    const username = commit.prNumber
      ? await resolveAuthorForPR(commit.prNumber)
      : await resolveUsername(commit.email)
    const authorSuffix = username ? ` by @${username}` : ''

    changelogMd += `- ${scopePrefix}${cleanMessage}${prRef} (${commit.hash})${authorSuffix}\n`
  }
  changelogMd += '\n'
}

if (!changelogMd.trim()) {
  changelogMd = '- No changelog entries\n\n'
}

const now = new Date()
const date = now.toISOString().slice(0, 10)
const time = now.toISOString().slice(11, 16).replace(':', '')
const tagName = `release-${date}-${time}`
const titleDate = `${date} ${now.toISOString().slice(11, 16)}`

const isPrerelease = process.argv.includes('--prerelease')
const isLatest = process.argv.includes('--latest')

const body = `Release ${titleDate}

## Changes

${changelogMd}
## Packages

${bumpedPackages.map((pkg) => `- ${pkg.name}@${pkg.version}`).join('\n')}
`

let tagExists = false
try {
  execSync(`git rev-parse ${tagName}`, { stdio: 'ignore' })
  tagExists = true
} catch {
  // Tag does not exist yet.
}

if (!tagExists) {
  execSync(`git tag -a -m "${tagName}" ${tagName}`)
  execSync('git push --tags')
}

const prereleaseFlag = isPrerelease ? '--prerelease' : ''
const latestFlag = isLatest ? ' --latest' : ''
const tmpFile = path.join(tmpdir(), `release-notes-${tagName}.md`)
fs.writeFileSync(tmpFile, body)

try {
  execSync(
    `gh release create ${tagName} ${prereleaseFlag} --title "Release ${titleDate}" --notes-file ${tmpFile}${latestFlag}`,
    { stdio: 'inherit' },
  )
  console.info(`GitHub release ${tagName} created.`)
} catch (error) {
  if (!tagExists) {
    console.info(`Release creation failed, cleaning up tag ${tagName}...`)
    try {
      execSync(`git push --delete origin ${tagName}`, { stdio: 'ignore' })
      execSync(`git tag -d ${tagName}`, { stdio: 'ignore' })
    } catch {
      // Best effort cleanup.
    }
  }
  throw error
} finally {
  fs.unlinkSync(tmpFile)
}
