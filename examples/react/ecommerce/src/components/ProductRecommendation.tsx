import { useNavigate } from "@tanstack/react-router";

import { showAIAssistant } from "@/store/assistant";

import products from "@/data/products";

export default function ProductRecommendation({ id }: { id: string }) {
  const navigate = useNavigate();
  const product = products.find((product) => product.id === +id);
  if (!product) {
    return null;
  }

  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_10px_30px_rgba(23,58,64,0.12)]">
      <div className="aspect-[4/3] relative overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="mb-2 text-lg font-semibold text-[var(--sea-ink)]">
          {product.name}
        </h3>
        <p className="mb-1 line-clamp-2 text-sm text-[var(--sea-ink-soft)]">
          {product.shortDescription}
        </p>
        <p className="mb-3 text-xs font-semibold tracking-[0.1em] text-[var(--kicker)] uppercase">
          {product.category}
        </p>
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-[var(--lagoon-deep)]">
            ${product.price.toLocaleString()}
          </div>
          <button
            onClick={() => {
              navigate({
                to: "/products/$productId",
                params: { productId: product.id.toString() },
              });
              showAIAssistant.setState(() => false);
            }}
            className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-4 py-1.5 text-sm font-semibold text-[var(--lagoon-deep)] transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
