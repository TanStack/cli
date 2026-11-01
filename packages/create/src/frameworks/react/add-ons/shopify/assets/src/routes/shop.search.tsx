import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import * as v from 'valibot'

import { ProductGrid } from '#/components/shop/product-grid'
import { searchProducts } from '#/server/shopify/catalog.functions'

const SearchSchema = v.object({
  q: v.optional(v.string(), ''),
})

export const Route = createFileRoute('/shop/search')({
  validateSearch: (search) => v.parse(SearchSchema, search),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: async ({ deps }) => {
    if (!deps.q.trim()) {
      return {
        q: '',
        products: [] as Awaited<
          ReturnType<typeof searchProducts>
        >['products'],
        totalCount: 0,
      }
    }
    const result = await searchProducts({
      data: { query: deps.q.trim(), first: 24 },
    })
    return { q: deps.q, products: result.products, totalCount: result.totalCount }
  },
  component: SearchRoute,
})

function SearchRoute() {
  const { q, products, totalCount } = Route.useLoaderData()
  const navigate = useNavigate({ from: Route.fullPath })
  const [draft, setDraft] = useState(q)

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-medium tracking-tight">Search</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          navigate({ search: { q: draft } })
        }}
        className="flex gap-2"
      >
        <input
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Search products"
          autoFocus
          className="flex-1 rounded-full border border-[var(--storefront-line)] bg-transparent px-5 py-3 text-base focus:border-[var(--storefront-accent)] focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-full bg-[var(--storefront-accent)] px-6 py-3 text-sm font-medium text-[var(--storefront-accent-fg)]"
        >
          Search
        </button>
      </form>

      {q && (
        <p className="text-sm text-[var(--storefront-fg-muted)]">
          {totalCount} result{totalCount === 1 ? '' : 's'} for{' '}
          <span className="font-medium text-[var(--storefront-fg)]">"{q}"</span>
        </p>
      )}

      {q && <ProductGrid products={products} />}
    </div>
  )
}
