import { createFileRoute } from '@tanstack/react-router'

import { ProductGrid } from '#/components/shop/product-grid'
import {
  getProducts,
  getShop,
} from '#/server/shopify/catalog.functions'

export const Route = createFileRoute('/shop/')({
  loader: async () => {
    const [shop, page] = await Promise.all([
      getShop(),
      getProducts({ data: { first: 24, sortKey: 'BEST_SELLING' } }),
    ])
    return { shop, products: page.nodes }
  },
  component: ShopIndex,
})

function ShopIndex() {
  const { shop, products } = Route.useLoaderData()

  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <h1 className="text-4xl font-medium tracking-tight">{shop.name}</h1>
        {shop.description && (
          <p className="max-w-2xl text-lg text-[var(--storefront-fg-muted)]">
            {shop.description}
          </p>
        )}
      </header>
      <ProductGrid products={products} />
    </div>
  )
}
