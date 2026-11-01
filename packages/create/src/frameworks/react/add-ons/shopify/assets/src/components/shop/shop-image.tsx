import { shopifyImageUrl } from '#/lib/shopify/format'

type ShopImageProps = {
  src: string | null | undefined
  alt: string | null | undefined
  width: number
  height?: number
  className?: string
  sizes?: string
  loading?: 'eager' | 'lazy'
}

export function ShopImage({
  src,
  alt,
  width,
  height,
  className,
  sizes,
  loading = 'lazy',
}: ShopImageProps) {
  if (!src) {
    return (
      <div
        aria-hidden
        className={className}
        style={{
          background: 'var(--storefront-line)',
          aspectRatio: height ? `${width} / ${height}` : '1',
        }}
      />
    )
  }

  const transformed = shopifyImageUrl(src, { width, height, format: 'webp' })
  const srcSet = [1, 2]
    .map((dpr) => {
      const w = width * dpr
      const h = height ? height * dpr : undefined
      return `${shopifyImageUrl(src, { width: w, height: h, format: 'webp' })} ${dpr}x`
    })
    .join(', ')

  return (
    <img
      src={transformed}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt ?? ''}
      width={width}
      height={height}
      loading={loading}
      decoding="async"
      className={className}
    />
  )
}
