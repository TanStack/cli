import { Link } from '@tanstack/react-router'

import { ShopImage } from '#/components/shop/shop-image'
import type { CollectionListItem } from '#/lib/shopify/queries'

type FeaturedCollectionsProps = {
  collections: ReadonlyArray<CollectionListItem>
}

export function FeaturedCollections({ collections }: FeaturedCollectionsProps) {
  if (collections.length === 0) return null
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {collections.map((collection) => (
        <Link
          key={collection.id}
          to="/shop/collections/$handle"
          params={{ handle: collection.handle }}
          className="group relative block overflow-hidden rounded-2xl bg-[var(--storefront-line)] no-underline"
          style={{ aspectRatio: '4 / 5' }}
        >
          {collection.image && (
            <ShopImage
              src={collection.image.url}
              alt={collection.image.altText ?? collection.title}
              width={800}
              height={1000}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white">
            <h3 className="text-2xl font-medium tracking-tight">
              {collection.title}
            </h3>
            <p className="mt-1 text-sm text-white/80">Shop the collection →</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
