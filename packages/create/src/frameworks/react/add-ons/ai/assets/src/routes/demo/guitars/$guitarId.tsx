import { Link, createFileRoute } from '@tanstack/react-router'

import guitars from '#/data/demo-guitars'

export const Route = createFileRoute('/demo/guitars/$guitarId')({
  component: RouteComponent,
  loader: async ({ params }) => {
    const guitar = guitars.find((guitar) => guitar.id === +params.guitarId)
    if (!guitar) {
      throw new Error('Guitar not found')
    }
    return guitar
  },
})

function RouteComponent() {
  const guitar = Route.useLoaderData()

  return (
    <main className="demo-page">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] lg:items-center">
        <section className="demo-panel">
          <Link to="/demo/guitars/" className="mb-4 inline-block">
            &larr; Back to all guitars
          </Link>
          <h1 className="demo-title mb-4">{guitar.name}</h1>
          <p className="demo-muted mb-6">{guitar.description}</p>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-[var(--lagoon-deep)]">
              ${guitar.price}
            </div>
            <button className="demo-button">Add to Cart</button>
          </div>
        </section>

        <div className="demo-card overflow-hidden p-0">
          <img
            src={guitar.image}
            alt={guitar.name}
            className="guitar-image h-full w-full object-cover"
          />
        </div>
      </div>
    </main>
  )
}
