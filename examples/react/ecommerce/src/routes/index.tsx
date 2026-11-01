import { Link, createFileRoute } from "@tanstack/react-router";
import products from "@/data/products";

export const Route = createFileRoute("/")({
  component: ProductsIndex,
});

function ProductsIndex() {
  const [featured, ...catalog] = products;

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
        <p className="island-kicker mb-3">TanStack Ecommerce Template</p>
        <h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
          The TanStack Storefront.
        </h1>
        <p className="mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          A polished ecommerce landing page for teams shipping with Start,
          Router, Query, Form, and friends. Same laid-back vibe as the blog
          template, but tuned for product catalogs and conversion flows.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="#products"
            className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]"
          >
            Browse Catalog
          </a>
          <Link
            to="/products/$productId"
            params={{ productId: String(featured.id) }}
            className="rounded-full border border-[var(--soft-btn-border)] bg-[var(--soft-btn-bg)] px-5 py-2.5 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:-translate-y-0.5 hover:border-[var(--soft-btn-border-hover)]"
          >
            View Featured
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className="island-shell rise-in rounded-2xl p-5 sm:p-6 lg:col-span-2">
          <img
            src={featured.image}
            alt={featured.name}
            className="mb-4 h-44 w-full rounded-xl object-cover xl:h-60"
          />
          <h2 className="m-0 text-2xl font-semibold text-[var(--sea-ink)]">
            <Link
              to="/products/$productId"
              params={{ productId: String(featured.id) }}
              className="no-underline"
            >
              {featured.name}
            </Link>
          </h2>
          <p className="mb-2 mt-3 text-base text-[var(--sea-ink-soft)]">
            {featured.description}
          </p>
          <p className="m-0 text-sm font-semibold text-[var(--lagoon-deep)]">
            ${featured.price.toLocaleString()}
          </p>
        </article>

        {catalog.map((product, index) => (
          <article
            key={product.id}
            className="island-shell rise-in rounded-2xl p-5"
            style={{ animationDelay: `${index * 80 + 120}ms` }}
          >
            <img
              src={product.image}
              alt={product.name}
              className="mb-4 h-44 w-full rounded-xl object-cover"
            />
            <h2 className="m-0 text-2xl font-semibold text-[var(--sea-ink)]">
              <Link
                to="/products/$productId"
                params={{ productId: String(product.id) }}
                className="no-underline"
              >
                {product.name}
              </Link>
            </h2>
            <p className="mb-2 mt-2 text-sm text-[var(--sea-ink-soft)]">
              {product.shortDescription}
            </p>
            <p className="m-0 text-xs font-semibold tracking-[0.12em] text-[var(--kicker)] uppercase">
              {product.category}
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--lagoon-deep)]">
              ${product.price.toLocaleString()}
            </p>
          </article>
        ))}
      </section>

      <section id="products" className="island-shell mt-8 rounded-2xl p-6">
        <p className="island-kicker mb-2">Why This Template</p>
        <ul className="m-0 list-disc space-y-2 pl-5 text-sm text-[var(--sea-ink-soft)]">
          <li>Product-first landing page and detail flow with clean file routes.</li>
          <li>Optional AI assistant support preserved for demos and experimentation.</li>
          <li>Theme tokens match the same design language as the blog/base templates.</li>
        </ul>
      </section>
    </main>
  );
}
