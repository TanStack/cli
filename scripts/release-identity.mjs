export async function findReleaseForCommit(releases, commit, resolveTag) {
  for (const release of releases) {
    if (!release.tag_name?.startsWith('release-')) continue
    if ((await resolveTag(release.tag_name)) === commit) return release
  }
  return null
}

export function latestReleaseFlag({
  requested,
  releaseHead,
  latestHead,
  isAncestor,
}) {
  if (requested === 'false') return '--latest=false'
  if (requested !== 'true') return ''
  if (
    latestHead &&
    latestHead !== releaseHead &&
    isAncestor(releaseHead, latestHead)
  ) {
    return '--latest=false'
  }
  return '--latest'
}
