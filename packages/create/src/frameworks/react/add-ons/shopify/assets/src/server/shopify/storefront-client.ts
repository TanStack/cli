import { getStorefrontEnv } from './env'

type ShopifyFetchInput<TVariables> = {
  query: string
  variables?: TVariables
  /**
   * Optional buyer IP, forwarded to Shopify's bot-protection headers.
   * Only meaningful with the private token.
   */
  buyerIp?: string
}

type ShopifyResponse<TData> = {
  data?: TData
  errors?: Array<{ message: string; locations?: unknown; path?: unknown }>
}

export class ShopifyError extends Error {
  constructor(
    message: string,
    public readonly errors?: ShopifyResponse<unknown>['errors'],
  ) {
    super(message)
    this.name = 'ShopifyError'
  }
}

/**
 * Read the buyer's IP from a Request's headers in a runtime-portable way.
 * Cloudflare uses `cf-connecting-ip`; Vercel/Netlify/Node behind a proxy use
 * `x-forwarded-for`. Returns undefined if neither header is present.
 */
export function getBuyerIp(headers: Headers): string | undefined {
  const cf = headers.get('cf-connecting-ip')
  if (cf) return cf
  const fwd = headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]?.trim()
  return undefined
}

/**
 * Server-side Storefront API client. Prefers the private access token (higher
 * rate limits + buyer-IP forwarding); falls back to the public token so the
 * default demo store works with zero setup.
 *
 * Use in route loaders and server functions only — never in browser code.
 */
export async function shopifyServerFetch<
  TData,
  TVariables = Record<string, unknown>,
>(input: ShopifyFetchInput<TVariables>): Promise<TData> {
  const env = getStorefrontEnv()
  const usingPrivate = Boolean(env.SHOPIFY_PRIVATE_STOREFRONT_TOKEN)
  const token =
    env.SHOPIFY_PRIVATE_STOREFRONT_TOKEN ?? env.SHOPIFY_PUBLIC_STOREFRONT_TOKEN

  if (!token) {
    throw new ShopifyError(
      'Shopify Storefront token missing. Set SHOPIFY_PUBLIC_STOREFRONT_TOKEN in .env.local.',
    )
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (usingPrivate) {
    headers['Shopify-Storefront-Private-Token'] = token
    if (input.buyerIp) headers['Shopify-Storefront-Buyer-IP'] = input.buyerIp
  } else {
    headers['X-Shopify-Storefront-Access-Token'] = token
  }

  const url = `https://${env.SHOPIFY_STORE_DOMAIN}/api/${env.SHOPIFY_STOREFRONT_API_VERSION}/graphql.json`
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: input.query, variables: input.variables }),
  })

  if (!response.ok) {
    throw new ShopifyError(
      `Shopify API error: ${response.status} ${response.statusText}`,
    )
  }

  const json = (await response.json()) as ShopifyResponse<TData>

  if (json.errors?.length) {
    throw new ShopifyError(
      json.errors.map((e) => e.message).join('\n'),
      json.errors,
    )
  }

  if (!json.data) {
    throw new ShopifyError('Shopify API returned no data and no errors.')
  }

  return json.data
}
