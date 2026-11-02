import { createFileRoute, notFound } from '@tanstack/react-router'

import { ProductGrid } from '#/components/shop/product-grid'
import { ShopImage } from '#/components/shop/shop-image'
import { getCollection } from '#/server/shopify/catalog.functions'

export const Route = createFileRoute('/shop/collections/$handle')({
  loader: async ({ params }) => {
    const collection = await getCollection({
      data: { handle: params.handle, first: 24 },
    })
    if (!collection) throw notFound()
    return { collection }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          {
            title: loaderData.collection.seo.title ?? loaderData.collection.title,
          },
          {
            name: 'description',
            content:
              loaderData.collection.seo.description ??
              loaderData.collection.description ??
              '',
          },
        ]
      : [],
  }),
  component: CollectionRoute,
})

function CollectionRoute() {
  const { collection } = Route.useLoaderData()

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        {collection.image && (
          <ShopImage
            src={collection.image.url}
            alt={collection.image.altText ?? collection.title}
            width={1400}
            height={500}
            loading="eager"
            sizes="100vw"
            className="aspect-[14/5] w-full rounded-lg object-cover"
          />
        )}
        <div className="space-y-2">
          <h1 className="text-3xl font-medium tracking-tight">
            {collection.title}
          </h1>
          {collection.description && (
            <p className="max-w-2xl text-[var(--storefront-fg-muted)]">
              {collection.description}
            </p>
          )}
        </div>
      </header>

      <ProductGrid products={collection.products.nodes} />
    </div>
  )
}
