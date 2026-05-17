import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

import '#/components/shop/shop.css'
import { getCollections } from '#/server/shopify/catalog.functions'

export const Route = createFileRoute('/shop')({
  loader: () => getCollections(),
  component: ShopLayout,
})

function ShopLayout() {
  const collections = Route.useLoaderData()

  return (
    <div className="shop-root min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center gap-4 border-b border-[var(--storefront-line)] pb-6">
          <Link
            to="/shop"
            className="text-2xl font-medium tracking-tight no-underline text-[var(--storefront-fg)]"
          >
            Shop
          </Link>
          <div className="ml-auto flex items-center gap-4 text-sm">
            <Link
              to="/shop/search"
              search={{ q: '' }}
              className="hover:underline underline-offset-4"
            >
              Search
            </Link>
            <Link to="/shop/cart" className="hover:underline underline-offset-4">
              Cart
            </Link>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
          <aside className="hidden lg:block">
            <nav className="sticky top-8 flex flex-col gap-1 text-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--storefront-fg-muted)]">
                Collections
              </p>
              <Link
                to="/shop"
                className="rounded-md px-2 py-1.5 text-[var(--storefront-fg-muted)] hover:bg-[var(--storefront-line)]/40 hover:text-[var(--storefront-fg)]"
                activeOptions={{ exact: true }}
                activeProps={{
                  className:
                    'rounded-md px-2 py-1.5 bg-[var(--storefront-line)]/60 text-[var(--storefront-fg)] font-medium',
                }}
              >
                All products
              </Link>
              {collections.map((collection) => (
                <Link
                  key={collection.id}
                  to="/shop/collections/$handle"
                  params={{ handle: collection.handle }}
                  className="rounded-md px-2 py-1.5 text-[var(--storefront-fg-muted)] hover:bg-[var(--storefront-line)]/40 hover:text-[var(--storefront-fg)]"
                  activeProps={{
                    className:
                      'rounded-md px-2 py-1.5 bg-[var(--storefront-line)]/60 text-[var(--storefront-fg)] font-medium',
                  }}
                >
                  {collection.title}
                </Link>
              ))}
            </nav>
          </aside>
          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
