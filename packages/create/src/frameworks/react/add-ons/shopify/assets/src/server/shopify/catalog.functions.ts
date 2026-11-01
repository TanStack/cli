import { createServerFn } from '@tanstack/react-start'
import { setResponseHeaders } from '@tanstack/react-start/server'
import * as v from 'valibot'

import { shopifyServerFetch } from '#/server/shopify/storefront-client'
import {
  COLLECTION_QUERY,
  COLLECTIONS_QUERY,
  PAGE_QUERY,
  PRODUCT_QUERY,
  PRODUCTS_QUERY,
  SEARCH_QUERY,
  SHOP_POLICIES_QUERY,
  SHOP_QUERY,
  flattenPolicies,
  type CollectionDetail,
  type CollectionListItem,
  type CollectionQueryResult,
  type CollectionsQueryResult,
  type PageDetail,
  type PageQueryResult,
  type PolicySummary,
  type ProductDetail,
  type ProductListPage,
  type ProductQueryResult,
  type ProductsQueryResult,
  type ProductsQueryVariables,
  type SearchQueryResult,
  type ShopPoliciesQueryResult,
  type ShopPolicy,
  type ShopQueryResult,
} from '#/lib/shopify/queries'

/**
 * Edge-cache catalog responses for a few minutes. Catalog data doesn't change
 * often. CDN-Cache-Control is the runtime-portable header (Cloudflare, Vercel,
 * Netlify all read it); we also set a conservative public Cache-Control so
 * intermediaries don't cache aggressively without explicit opt-in.
 */
function setBrowseCacheHeaders() {
  setResponseHeaders(
    new Headers({
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'CDN-Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
    }),
  )
}

const productSortKeys = [
  'BEST_SELLING',
  'CREATED_AT',
  'ID',
  'PRICE',
  'PRODUCT_TYPE',
  'RELEVANCE',
  'TITLE',
  'UPDATED_AT',
  'VENDOR',
] as const

const collectionSortKeys = [
  'BEST_SELLING',
  'COLLECTION_DEFAULT',
  'CREATED',
  'ID',
  'MANUAL',
  'PRICE',
  'RELEVANCE',
  'TITLE',
] as const

export const getShop = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ShopQueryResult['shop']> => {
    setBrowseCacheHeaders()
    const data = await shopifyServerFetch<ShopQueryResult>({ query: SHOP_QUERY })
    return data.shop
  },
)

export const getProducts = createServerFn({ method: 'POST' })
  .inputValidator(
    v.object({
      first: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1)), 24),
      after: v.optional(v.nullable(v.string())),
      sortKey: v.optional(v.picklist(productSortKeys)),
      reverse: v.optional(v.boolean()),
    }),
  )
  .handler(async ({ data }): Promise<ProductListPage> => {
    setBrowseCacheHeaders()
    const result = await shopifyServerFetch<
      ProductsQueryResult,
      ProductsQueryVariables
    >({
      query: PRODUCTS_QUERY,
      variables: {
        first: data.first,
        after: data.after ?? null,
        sortKey: data.sortKey ?? null,
        reverse: data.reverse ?? null,
      },
    })
    return result.products
  })

export const getCollections = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<CollectionListItem>> => {
    setBrowseCacheHeaders()
    const result = await shopifyServerFetch<
      CollectionsQueryResult,
      { first: number }
    >({
      query: COLLECTIONS_QUERY,
      variables: { first: 50 },
    })
    return result.collections.nodes
  },
)

export const getProduct = createServerFn({ method: 'POST' })
  .inputValidator(v.object({ handle: v.string() }))
  .handler(async ({ data }): Promise<ProductDetail | null> => {
    setBrowseCacheHeaders()
    const result = await shopifyServerFetch<
      ProductQueryResult,
      { handle: string }
    >({
      query: PRODUCT_QUERY,
      variables: { handle: data.handle },
    })
    return result.product
  })

export const getCollection = createServerFn({ method: 'POST' })
  .inputValidator(
    v.object({
      handle: v.string(),
      first: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1)), 24),
      after: v.optional(v.nullable(v.string())),
      sortKey: v.optional(v.picklist(collectionSortKeys)),
      reverse: v.optional(v.boolean()),
    }),
  )
  .handler(async ({ data }): Promise<CollectionDetail | null> => {
    setBrowseCacheHeaders()
    const result = await shopifyServerFetch<
      CollectionQueryResult,
      {
        handle: string
        first: number
        after: string | null
        sortKey: (typeof collectionSortKeys)[number] | null
        reverse: boolean | null
      }
    >({
      query: COLLECTION_QUERY,
      variables: {
        handle: data.handle,
        first: data.first,
        after: data.after ?? null,
        sortKey: data.sortKey ?? null,
        reverse: data.reverse ?? null,
      },
    })
    return result.collection
  })

export const getPage = createServerFn({ method: 'POST' })
  .inputValidator(v.object({ handle: v.string() }))
  .handler(async ({ data }): Promise<PageDetail | null> => {
    setBrowseCacheHeaders()
    const result = await shopifyServerFetch<
      PageQueryResult,
      { handle: string }
    >({
      query: PAGE_QUERY,
      variables: { handle: data.handle },
    })
    return result.page
  })

export const getShopPolicies = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<PolicySummary>> => {
    setBrowseCacheHeaders()
    const result = await shopifyServerFetch<ShopPoliciesQueryResult>({
      query: SHOP_POLICIES_QUERY,
    })
    return flattenPolicies(result.shop)
  },
)

export const getShopPolicy = createServerFn({ method: 'POST' })
  .inputValidator(v.object({ handle: v.string() }))
  .handler(
    async ({ data }): Promise<{ title: string; body: string; handle: string } | null> => {
      setBrowseCacheHeaders()
      const result = await shopifyServerFetch<ShopPoliciesQueryResult>({
        query: SHOP_POLICIES_QUERY,
      })
      const all = [
        result.shop.privacyPolicy,
        result.shop.refundPolicy,
        result.shop.termsOfService,
        result.shop.shippingPolicy,
      ].filter((p): p is NonNullable<ShopPolicy> => p !== null)
      return all.find((p) => p.handle === data.handle) ?? null
    },
  )

export const searchProducts = createServerFn({ method: 'POST' })
  .inputValidator(
    v.object({
      query: v.pipe(v.string(), v.minLength(1)),
      first: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1)), 24),
      after: v.optional(v.nullable(v.string())),
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<{
      totalCount: number
      pageInfo: { hasNextPage: boolean; endCursor: string | null }
      products: ProductListPage['nodes']
    }> => {
      setBrowseCacheHeaders()
      const result = await shopifyServerFetch<
        SearchQueryResult,
        { query: string; first: number; after: string | null }
      >({
        query: SEARCH_QUERY,
        variables: {
          query: data.query,
          first: data.first,
          after: data.after ?? null,
        },
      })
      return {
        totalCount: result.search.totalCount,
        pageInfo: result.search.pageInfo,
        products: result.search.nodes,
      }
    },
  )
