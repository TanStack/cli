import { createFileRoute } from '@tanstack/react-router'

import { CartLineItem } from '#/components/shop/cart-line-item'
import { CartSummary } from '#/components/shop/cart-summary'
import { EmptyState } from '#/components/shop/empty-state'
import { CART_QUERY_KEY, useCart } from '#/hooks/use-cart'
import { getCart } from '#/server/shopify/cart.functions'

export const Route = createFileRoute('/shop/cart')({
  // QueryClient is always in context — the shopify add-on dependsOn tanstack-query.
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: CART_QUERY_KEY,
      queryFn: () => getCart(),
    }),
  component: CartRoute,
})

function CartRoute() {
  const { cart } = useCart()

  if (!cart || cart.lines.nodes.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Looks like you haven't added anything yet. Browse the shop to find something."
        cta={{ label: 'Browse the shop', to: '/shop' }}
      />
    )
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
      <section>
        <h1 className="mb-6 text-3xl font-medium tracking-tight">Cart</h1>
        <ul className="border-t border-[var(--storefront-line)]">
          {cart.lines.nodes.map((line) => (
            <CartLineItem key={line.id} line={line} />
          ))}
        </ul>
      </section>
      <CartSummary cart={cart} />
    </div>
  )
}
