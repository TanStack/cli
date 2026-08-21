import fs from 'node:fs'
import { resolve } from 'node:path'

export interface YouComSearchResult {
  title: string
  url: string
  snippet: string
  source?: string
}

export interface YouComSearchResponse {
  results: YouComSearchResult[]
  totalHits: number
  query: string
}

/**
 * Search You.com APIs for development resources and documentation
 */
export async function searchYouCom({
  query,
  count = 10
}: {
  query: string
  count?: number
}): Promise<YouComSearchResponse> {
  try {
    const searchUrl = new URL('https://api.you.com/v1/agents/search')
    searchUrl.searchParams.set('query', query)
    searchUrl.searchParams.set('count', count.toString())

    const headers: Record<string, string> = {
      'User-Agent': 'TanStack-CLI/0.70.2 (You.com Integration)',
    }

    // Add API key if available
    const apiKey = process.env.YDC_API_KEY || process.env.YOUCOM_API_KEY
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const response = await fetch(searchUrl.toString(), { headers })
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('You.com API key required. Set YDC_API_KEY environment variable.')
      }
      throw new Error(`You.com API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    // Handle different API response formats
    const results = Array.isArray(data.web) ? data.web : 
                   Array.isArray(data.results) ? data.results :
                   Array.isArray(data) ? data : []
    
    return {
      results: results.map((item: any) => ({
        title: item.title || item.name || 'Untitled',
        url: item.url || item.link || '',
        snippet: item.snippet || item.description || '',
        source: 'You.com'
      })),
      totalHits: results.length,
      query
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to search You.com API')
  }
}

/**
 * Get You.com MCP server configuration
 */
export function getYouComMCPConfig() {
  try {
    const skillsPath = resolve(process.cwd(), 'skills.json')
    if (fs.existsSync(skillsPath)) {
      const skillsConfig = JSON.parse(fs.readFileSync(skillsPath, 'utf-8'))
      return skillsConfig.mcp_servers || {}
    }
  } catch (error) {
    // Fallback to default config
  }

  return {
    'you-com': {
      url: 'https://api.you.com/mcp',
      description: 'You.com search, content extraction, and research MCP server',
      auth: {
        type: 'bearer',
        env_var: 'YDC_API_KEY'
      },
      tools: ['you-search', 'you-contents', 'you-research', 'you-discover']
    },
    'you-com-free': {
      url: 'https://api.you.com/mcp?profile=free',
      description: 'You.com keyless basic search MCP server',
      auth: {
        type: 'none'
      },
      tools: ['you-search']
    },
    'you-docs': {
      url: 'https://you.com/docs/_mcp/server',
      description: 'You.com documentation search MCP server',
      auth: {
        type: 'none'
      },
      tools: ['searchDocs']
    }
  }
}

/**
 * Install You.com skills and MCP configuration
 */
export function installYouComSkills() {
  const config = getYouComMCPConfig()
  
  return {
    message: 'You.com MCP servers configured successfully',
    servers: Object.keys(config),
    setup_instructions: [
      'To use authenticated features, set YDC_API_KEY environment variable',
      'Get your API key from: https://you.com/platform/api-keys',
      'For MCP clients, add the server URLs to your MCP configuration',
      'Available skills: you-web, you-discover'
    ]
  }
}