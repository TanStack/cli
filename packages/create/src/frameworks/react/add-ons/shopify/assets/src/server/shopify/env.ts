import * as v from 'valibot'

/**
 * Defaults point to Shopify's public Hydrogen demo store so the storefront
 * works on first run with zero setup. Override by setting the matching env
 * vars in .env.local (or the deploy target's env config).
 *
 * Note: we don't rely on Vite's .env loading reaching `process.env` at runtime
 * — different runtimes handle that differently. Reading .env.local through
 * `process.env` works on most adapters; falling back to the demo values keeps
 * the first-run experience unbroken when it doesn't.
 */
const DEMO_STORE_DOMAIN = 'hydrogen-preview.myshopify.com'
const DEMO_API_VERSION = '2026-01'
const DEMO_PUBLIC_TOKEN = '3b580e70970c4528da70c98e097c2fa0'

const StorefrontEnvSchema = v.object({
  SHOPIFY_STORE_DOMAIN: v.pipe(v.string(), v.minLength(1)),
  SHOPIFY_STOREFRONT_API_VERSION: v.pipe(v.string(), v.minLength(1)),
  SHOPIFY_PUBLIC_STOREFRONT_TOKEN: v.optional(v.string()),
  SHOPIFY_PRIVATE_STOREFRONT_TOKEN: v.optional(v.string()),
})

const CustomerEnvSchema = v.object({
  SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID: v.pipe(
    v.string(),
    v.minLength(1, 'SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID is required for customer accounts'),
  ),
  SHOPIFY_CUSTOMER_ACCOUNT_SHOP_ID: v.pipe(
    v.string(),
    v.minLength(1, 'SHOPIFY_CUSTOMER_ACCOUNT_SHOP_ID is required for customer accounts'),
  ),
  SHOPIFY_CUSTOMER_ACCOUNT_REDIRECT_URI: v.pipe(
    v.string(),
    v.url('SHOPIFY_CUSTOMER_ACCOUNT_REDIRECT_URI must be a valid URL'),
  ),
  SHOPIFY_SESSION_SECRET: v.pipe(
    v.string(),
    v.minLength(32, 'SHOPIFY_SESSION_SECRET must be at least 32 characters'),
  ),
})

let cachedStorefront: v.InferOutput<typeof StorefrontEnvSchema> | null = null
let cachedCustomer: v.InferOutput<typeof CustomerEnvSchema> | null = null

function readEnv(name: string): string | undefined {
  // process.env on most server runtimes; falls back to undefined on edge
  // workers where process.env doesn't exist.
  if (typeof process !== 'undefined' && process.env) {
    const value = process.env[name]
    if (value && value.length > 0) return value
  }
  return undefined
}

export function getStorefrontEnv() {
  if (cachedStorefront) return cachedStorefront
  cachedStorefront = v.parse(StorefrontEnvSchema, {
    SHOPIFY_STORE_DOMAIN: readEnv('SHOPIFY_STORE_DOMAIN') ?? DEMO_STORE_DOMAIN,
    SHOPIFY_STOREFRONT_API_VERSION:
      readEnv('SHOPIFY_STOREFRONT_API_VERSION') ?? DEMO_API_VERSION,
    SHOPIFY_PUBLIC_STOREFRONT_TOKEN:
      readEnv('SHOPIFY_PUBLIC_STOREFRONT_TOKEN') ?? DEMO_PUBLIC_TOKEN,
    SHOPIFY_PRIVATE_STOREFRONT_TOKEN: readEnv('SHOPIFY_PRIVATE_STOREFRONT_TOKEN'),
  })
  return cachedStorefront
}

export function getCustomerEnv() {
  if (cachedCustomer) return cachedCustomer
  cachedCustomer = v.parse(CustomerEnvSchema, {
    SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID: readEnv('SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID'),
    SHOPIFY_CUSTOMER_ACCOUNT_SHOP_ID: readEnv('SHOPIFY_CUSTOMER_ACCOUNT_SHOP_ID'),
    SHOPIFY_CUSTOMER_ACCOUNT_REDIRECT_URI:
      readEnv('SHOPIFY_CUSTOMER_ACCOUNT_REDIRECT_URI') ??
      'http://localhost:3000/shop/account/callback',
    SHOPIFY_SESSION_SECRET: readEnv('SHOPIFY_SESSION_SECRET'),
  })
  return cachedCustomer
}

export function isCustomerAccountConfigured() {
  try {
    getCustomerEnv()
    return true
  } catch {
    return false
  }
}
