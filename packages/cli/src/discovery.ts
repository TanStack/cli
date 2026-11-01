import { z } from 'zod'

const TANSTACK_API_BASE = 'https://tanstack.com/api/data'

const LibrarySchema = z.object({
  id: z.string(),
  name: z.string(),
  tagline: z.string(),
  description: z.string().optional(),
  frameworks: z.array(z.string()),
  latestVersion: z.string(),
  latestBranch: z.string().optional(),
  availableVersions: z.array(z.string()),
  repo: z.string(),
  docsRoot: z.string().optional(),
  defaultDocs: z.string().optional(),
  docsUrl: z.string().optional(),
  githubUrl: z.string().optional(),
})

const LibrariesResponseSchema = z.object({
  libraries: z.array(LibrarySchema),
  groups: z.record(z.array(z.string())),
  groupNames: z.record(z.string()),
})

const PartnerSchema = z.object({
  id: z.string(),
  name: z.string(),
  tagline: z.string().optional(),
  description: z.string(),
  category: z.string(),
  categoryLabel: z.string(),
  libraries: z.array(z.string()),
  url: z.string(),
})

const PartnersResponseSchema = z.object({
  partners: z.array(PartnerSchema),
  categories: z.array(z.string()),
  categoryLabels: z.record(z.string()),
})

export const LIBRARY_GROUPS = ['state', 'headlessUI', 'performance', 'tooling'] as const

// Algolia config (public read-only keys)
const ALGOLIA_APP_ID = 'FQ0DQ6MA3C'
const ALGOLIA_API_KEY = '10c34d6a5c89f6048cf644d601e65172'
const ALGOLIA_INDEX = 'tanstack-test'

export type LibrariesResponse = z.infer<typeof LibrariesResponseSchema>
export type PartnersResponse = z.infer<typeof PartnersResponseSchema>

export async function fetchLibraries(): Promise<LibrariesResponse> {
  const response = await fetch(`${TANSTACK_API_BASE}/libraries`)
  if (!response.ok) {
    throw new Error(`Failed to fetch libraries: ${response.statusText}`)
  }
  const data = await response.json()
  return LibrariesResponseSchema.parse(data)
}

export async function fetchPartners(): Promise<PartnersResponse> {
  const response = await fetch(`${TANSTACK_API_BASE}/partners`)
  if (!response.ok) {
    throw new Error(`Failed to fetch partners: ${response.statusText}`)
  }
  const data = await response.json()
  return PartnersResponseSchema.parse(data)
}

export async function fetchDocContent(
  repo: string,
  branch: string,
  filePath: string,
): Promise<string | null> {
  const url = `https://raw.githubusercontent.com/${repo}/${branch}/${filePath}`
  const response = await fetch(url, {
    headers: { 'User-Agent': 'tanstack-cli' },
  })

  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    throw new Error(`Failed to fetch doc: ${response.statusText}`)
  }

  return response.text()
}

export async function searchTanStackDocs({
  query,
  library,
  framework,
  limit = 10,
}: {
  query: string
  library?: string
  framework?: string
  limit?: number
}): Promise<{
  query: string
  totalHits: number
  results: Array<{
    title: string
    url: string
    snippet: string
    library: string
    breadcrumb: Array<string>
  }>
}> {
  const ALL_LIBRARIES = [
    'config',
    'form',
    'optimistic',
    'pacer',
    'query',
    'ranger',
    'react-charts',
    'router',
    'start',
    'store',
    'table',
    'virtual',
    'db',
    'devtools',
  ]
  const ALL_FRAMEWORKS = ['react', 'vue', 'solid', 'svelte', 'angular']

  const filterParts: Array<string> = ['version:latest']

  if (library) {
    const otherLibraries = ALL_LIBRARIES.filter((l) => l !== library)
    const exclusions = otherLibraries.map((l) => `NOT library:${l}`).join(' AND ')
    if (exclusions) filterParts.push(`(${exclusions})`)
  }

  if (framework) {
    const otherFrameworks = ALL_FRAMEWORKS.filter((f) => f !== framework)
    const exclusions = otherFrameworks.map((f) => `NOT framework:${f}`).join(' AND ')
    if (exclusions) filterParts.push(`(${exclusions})`)
  }

  const searchParams = {
    requests: [
      {
        indexName: ALGOLIA_INDEX,
        query,
        hitsPerPage: Math.min(limit, 50),
        filters: filterParts.join(' AND '),
        attributesToRetrieve: ['hierarchy', 'url', 'content', 'library'],
        attributesToSnippet: ['content:80'],
      },
    ],
  }

  const response = await fetch(
    `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/*/queries`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Algolia-Application-Id': ALGOLIA_APP_ID,
        'X-Algolia-API-Key': ALGOLIA_API_KEY,
      },
      body: JSON.stringify(searchParams),
    },
  )

  if (!response.ok) {
    throw new Error(`Algolia search failed: ${response.statusText}`)
  }

  const searchResponse = (await response.json()) as {
    results: Array<{
      hits: Array<{
        objectID: string
        url: string
        library?: string
        hierarchy: Record<string, string | undefined>
        content?: string
        _snippetResult?: { content?: { value?: string } }
      }>
      nbHits?: number
    }>
  }

  const searchResult = searchResponse.results[0]

  const results = searchResult.hits.map((hit) => {
    const breadcrumb = Object.values(hit.hierarchy).filter(
      (v): v is string => Boolean(v),
    )
    return {
      title: hit.hierarchy.lvl1 || hit.hierarchy.lvl0 || 'Untitled',
      url: hit.url,
      snippet: hit._snippetResult?.content?.value || hit.content || '',
      library: hit.library || 'unknown',
      breadcrumb,
    }
  })

  return {
    query,
    totalHits: searchResult.nbHits || results.length,
    results,
  }
}
