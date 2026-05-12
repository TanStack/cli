import { ProductCard } from '#/components/shop/product-card'
import type { ProductListItem } from '#/lib/shopify/queries'

type ProductGridProps = {
  products: ReadonlyArray<ProductListItem>
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-[var(--storefront-fg-muted)]">
        No products yet.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
