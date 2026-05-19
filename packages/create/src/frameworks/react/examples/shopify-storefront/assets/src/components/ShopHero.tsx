import { Link } from '@tanstack/react-router'

type ShopHeroProps = {
  title: string
  tagline: string
}

export function ShopHero({ title, tagline }: ShopHeroProps) {
  return (
    <section className="relative isolate overflow-hidden border-b border-[var(--storefront-line)]">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--storefront-fg-muted)]">
          New season · 2026
        </p>
        <h1 className="max-w-3xl text-5xl font-medium tracking-tight sm:text-6xl lg:text-7xl">
          {title}
        </h1>
        <p className="max-w-xl text-lg text-[var(--storefront-fg-muted)]">
          {tagline}
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link
            to="/shop"
            className="rounded-full bg-[var(--storefront-accent)] px-6 py-3 text-sm font-medium text-[var(--storefront-accent-fg)] no-underline transition hover:opacity-90"
          >
            Shop all
          </Link>
          <Link
            to="/shop/search"
            search={{ q: '' }}
            className="rounded-full border border-[var(--storefront-fg)] px-6 py-3 text-sm font-medium no-underline text-[var(--storefront-fg)] transition hover:bg-[var(--storefront-fg)] hover:text-[var(--storefront-bg)]"
          >
            Search
          </Link>
        </div>
      </div>
    </section>
  )
}
