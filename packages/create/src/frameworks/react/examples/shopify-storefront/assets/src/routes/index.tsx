import { Link, createFileRoute } from '@tanstack/react-router'

import '#/components/shop/shop.css'
import { ProductGrid } from '#/components/shop/product-grid'
import { FeaturedCollections } from '#/components/FeaturedCollections'
import { ShopHero } from '#/components/ShopHero'
import {
  getCollections,
  getProducts,
  getShop,
} from '#/server/shopify/catalog.functions'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [shop, collections, products] = await Promise.all([
      getShop(),
      getCollections(),
      getProducts({ data: { first: 8, sortKey: 'BEST_SELLING' } }),
    ])
    return { shop, collections, featured: products.nodes }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: loaderData.shop.name },
          { name: 'description', content: loaderData.shop.description ?? '' },
        ]
      : [],
  }),
  component: HomePage,
})

function HomePage() {
  const { shop, collections, featured } = Route.useLoaderData()

  return (
    <div className="shop-root min-h-screen">
      <ShopHero
        title={shop.name}
        tagline={shop.description ?? 'A TanStack Start + Shopify storefront.'}
      />

      {collections.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <FeaturedCollections collections={collections.slice(0, 3)} />
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="text-2xl font-medium tracking-tight sm:text-3xl">
            Best sellers
          </h2>
          <Link
            to="/shop"
            className="text-sm underline underline-offset-4 hover:opacity-80"
          >
            Shop all →
          </Link>
        </div>
        <ProductGrid products={featured} />
      </section>
    </div>
  )
}
