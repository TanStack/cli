import { Link, createFileRoute } from '@tanstack/react-router'

import guitars from '#/data/demo-guitars'

export const Route = createFileRoute('/demo/guitars/')({
  component: GuitarsIndex,
})

function GuitarsIndex() {
  return (
    <main className="demo-page demo-page-wide">
      <h1 className="demo-title mb-8 text-center">Featured Guitars</h1>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {guitars.map((guitar) => (
          <div key={guitar.id}>
            <Link
              to="/demo/guitars/$guitarId"
              params={{
                guitarId: guitar.id.toString(),
              }}
              className="block no-underline"
            >
              <article className="demo-card h-full overflow-hidden p-0 transition hover:-translate-y-0.5">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={guitar.image}
                    alt={guitar.name}
                    className="guitar-image h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <h2 className="mb-2 text-xl font-bold text-[var(--sea-ink)]">
                    {guitar.name}
                  </h2>
                  <p className="demo-muted mb-3 line-clamp-2">
                    {guitar.shortDescription}
                  </p>
                  <div className="text-xl font-bold text-[var(--lagoon-deep)]">
                    ${guitar.price}
                  </div>
                </div>
              </article>
            </Link>
          </div>
        ))}
      </div>
    </main>
  )
}
