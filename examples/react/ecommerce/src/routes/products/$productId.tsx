import { Link, createFileRoute } from "@tanstack/react-router";
import products from "@/data/products";

export const Route = createFileRoute("/products/$productId")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const product = products.find((entry) => entry.id === +params.productId);
    if (!product) {
      throw new Error("Product not found");
    }
    return product;
  },
});

function RouteComponent() {
  const product = Route.useLoaderData();

  return (
    <main className="page-wrap px-4 pb-8 pt-10">
      <section className="island-shell rise-in relative grid gap-5 overflow-hidden rounded-[2rem] p-6 sm:p-10 lg:grid-cols-[1.05fr_1fr]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.2),transparent_66%)]" />

        <div className="lg:order-2 lg:pt-2">
          <Link
            to="/"
            className="mb-5 inline-flex w-fit items-center rounded-full border border-[var(--line)] bg-white/40 px-4 py-2 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:-translate-y-0.5"
          >
            Back to all products
          </Link>
          <p className="island-kicker mb-2">Product Detail</p>
          <h1 className="display-title mb-2 text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
            {product.name}
          </h1>
          <p className="mb-4 text-xs font-semibold tracking-[0.14em] text-[var(--kicker)] uppercase">
            {product.category}
          </p>
          <p className="mb-6 max-w-2xl text-[var(--sea-ink-soft)]">{product.description}</p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-2xl font-bold text-[var(--lagoon-deep)]">
              ${product.price.toLocaleString()}
            </div>
            <button className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-5 py-2 text-sm font-semibold text-[var(--lagoon-deep)] transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]">
              Add to Cart
            </button>
          </div>
        </div>

        <article className="feature-card overflow-hidden rounded-2xl border border-[var(--line)] p-3 lg:order-1 lg:self-start">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full rounded-xl object-cover"
          />
        </article>
      </section>
    </main>
  );
}
