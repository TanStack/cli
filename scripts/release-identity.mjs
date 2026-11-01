export async function findReleaseForCommit(releases, commit, resolveTag) {
  for (const release of releases) {
    if (!release.tag_name?.startsWith('release-')) continue
    if ((await resolveTag(release.tag_name)) === commit) return release
  }
  return null
}
