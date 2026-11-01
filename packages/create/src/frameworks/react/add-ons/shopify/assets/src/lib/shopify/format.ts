/**
 * Browser-safe formatting helpers for Shopify Storefront API responses.
 * Framework-free — no React, no provider context required.
 */

export function formatMoney(amount: string | number, currencyCode: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(typeof amount === 'string' ? Number(amount) : amount)
}

type ShopifyImageOptions = {
  width?: number
  height?: number
  format?: 'webp' | 'jpg' | 'png'
  crop?: 'center' | 'top' | 'bottom' | 'left' | 'right'
}

/**
 * Append Shopify CDN transform parameters to a product image URL.
 * Shopify's CDN serves resized/reformatted versions automatically.
 */
export function shopifyImageUrl(url: string, opts: ShopifyImageOptions = {}) {
  const u = new URL(url)
  if (opts.width) u.searchParams.set('width', String(opts.width))
  if (opts.height) u.searchParams.set('height', String(opts.height))
  if (opts.format) u.searchParams.set('format', opts.format)
  if (opts.crop) u.searchParams.set('crop', opts.crop)
  return u.toString()
}
